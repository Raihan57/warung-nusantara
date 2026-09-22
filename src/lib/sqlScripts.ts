export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- SKRIP SETUP LENGKAP SUPABASE POSTGRESQL UNTUK SISTEM KASIR (POS) WARUNG MAKAN
-- Termasuk: DDL, RLS Policies (Admin & Kasir), Stored Procedure RPC Atomic
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABEL: PROFILES (RBAC Admin & Kasir)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'kasir')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABEL: CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. TABEL: MENUS (Master Menu / Lauk & Porsi Harian)
CREATE TABLE IF NOT EXISTS public.menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    daily_stock INT NOT NULL DEFAULT 0 CHECK (daily_stock >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    image_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. TABEL: TRANSACTIONS (Header Transaksi Penjualan)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('dine_in', 'takeaway')),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'qris', 'transfer')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. TABEL: TRANSACTION_ITEMS (Detail Lauk & Catatan Khusus)
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_sale NUMERIC(12, 2) NOT NULL CHECK (price_at_sale >= 0),
    notes TEXT,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- ============================================================================
-- 7. INDEXES UNTUK PERFORMA QUERY KASIR & LAPORAN
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_menus_category ON public.menus(category_id);
CREATE INDEX IF NOT EXISTS idx_menus_available ON public.menus(is_available, daily_stock);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_type ON public.transactions(order_type);
CREATE INDEX IF NOT EXISTS idx_transaction_items_tx ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_menu ON public.transaction_items(menu_id);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- Helper Function: Mengecek apakah user yang login memiliki role 'admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies: PROFILES
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
CREATE POLICY "Profiles read policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admin full profiles" ON public.profiles;
CREATE POLICY "Admin full profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (public.is_admin());

-- Policies: CATEGORIES
DROP POLICY IF EXISTS "Categories read policy" ON public.categories;
CREATE POLICY "Categories read policy" ON public.categories
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
CREATE POLICY "Admin manage categories" ON public.categories
    FOR ALL TO authenticated
    USING (public.is_admin());

-- Policies: MENUS
-- Kasir & Admin bisa SELECT daftar menu
DROP POLICY IF EXISTS "Menus read policy" ON public.menus;
CREATE POLICY "Menus read policy" ON public.menus
    FOR SELECT TO authenticated
    USING (true);

-- Hanya Admin yang bisa INSERT, UPDATE, DELETE menu
DROP POLICY IF EXISTS "Admin manage menus" ON public.menus;
CREATE POLICY "Admin manage menus" ON public.menus
    FOR ALL TO authenticated
    USING (public.is_admin());

-- Policies: TRANSACTIONS
-- Admin memiliki akses penuh (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admin full transactions" ON public.transactions;
CREATE POLICY "Admin full transactions" ON public.transactions
    FOR ALL TO authenticated
    USING (public.is_admin());

-- Kasir bisa INSERT transaksi baru dan membaca transaksi (SELECT)
DROP POLICY IF EXISTS "Kasir insert transactions" ON public.transactions;
CREATE POLICY "Kasir insert transactions" ON public.transactions
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Kasir select transactions" ON public.transactions;
CREATE POLICY "Kasir select transactions" ON public.transactions
    FOR SELECT TO authenticated
    USING (true);

-- Policies: TRANSACTION_ITEMS
DROP POLICY IF EXISTS "Admin full transaction_items" ON public.transaction_items;
CREATE POLICY "Admin full transaction_items" ON public.transaction_items
    FOR ALL TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Kasir insert transaction_items" ON public.transaction_items;
CREATE POLICY "Kasir insert transaction_items" ON public.transaction_items
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Kasir select transaction_items" ON public.transaction_items;
CREATE POLICY "Kasir select transaction_items" ON public.transaction_items
    FOR SELECT TO authenticated
    USING (true);

-- ============================================================================
-- 9. STORED PROCEDURE RPC: CHECKOUT ATOMIK (create_transaction_atomic)
-- Menjaga konsistensi stok porsi lauk agar tidak terjadi over-selling (Atomic)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_transaction_atomic(
    p_user_id UUID,
    p_order_type TEXT,
    p_payment_method TEXT,
    p_discount NUMERIC,
    p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_tx_id UUID;
    v_invoice_num TEXT;
    v_today_code TEXT;
    v_seq_count INT;
    v_item JSONB;
    v_menu_id UUID;
    v_qty INT;
    v_price NUMERIC;
    v_subtotal NUMERIC;
    v_notes TEXT;
    v_current_stock INT;
    v_menu_name TEXT;
    v_calculated_total NUMERIC := 0;
BEGIN
    -- 1. Validasi Tipe Pesanan & Pembayaran
    IF p_order_type NOT IN ('dine_in', 'takeaway') THEN
        RAISE EXCEPTION 'Order type tidak valid. Harus dine_in atau takeaway.';
    END IF;

    IF p_payment_method NOT IN ('cash', 'qris', 'transfer') THEN
        RAISE EXCEPTION 'Metode pembayaran tidak valid. Harus cash, qris, atau transfer.';
    END IF;

    -- 2. Generate Nomor Invoice Unik (Format: INV-YYYYMMDD-XXXX)
    v_today_code := TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD');
    SELECT COUNT(*) + 1 INTO v_seq_count
    FROM public.transactions
    WHERE invoice_number LIKE 'INV-' || v_today_code || '-%';

    v_invoice_num := 'INV-' || v_today_code || '-' || LPAD(v_seq_count::TEXT, 4, '0');

    -- 3. Verifikasi Ketersediaan Stok Lauk Secara Atomik (dengan Row Locking FOR UPDATE)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_menu_id := (v_item->>'menu_id')::UUID;
        v_qty := (v_item->>'quantity')::INT;
        v_price := (v_item->>'price_at_sale')::NUMERIC;
        v_subtotal := v_qty * v_price;
        v_calculated_total := v_calculated_total + v_subtotal;

        -- Kunci row menu untuk mencegah race condition (Concurrency Safe)
        SELECT daily_stock, name INTO v_current_stock, v_menu_name
        FROM public.menus
        WHERE id = v_menu_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Menu dengan ID % tidak ditemukan.', v_menu_id;
        END IF;

        IF v_current_stock < v_qty THEN
            RAISE EXCEPTION 'Porsi % tidak mencukupi! Sisa stok saat ini: %, diminta: %', v_menu_name, v_current_stock, v_qty;
        END IF;
    END LOOP;

    -- Terapkan Diskon jika ada
    v_calculated_total := GREATEST(0, v_calculated_total - COALESCE(p_discount, 0));

    -- 4. Simpan Header Transaksi
    INSERT INTO public.transactions (
        invoice_number,
        user_id,
        order_type,
        total_amount,
        discount,
        payment_method,
        created_at
    ) VALUES (
        v_invoice_num,
        p_user_id,
        p_order_type,
        v_calculated_total,
        COALESCE(p_discount, 0),
        p_payment_method,
        NOW()
    ) RETURNING id INTO v_tx_id;

    -- 5. Simpan Items & Kurangi Stok Harian
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_menu_id := (v_item->>'menu_id')::UUID;
        v_qty := (v_item->>'quantity')::INT;
        v_price := (v_item->>'price_at_sale')::NUMERIC;
        v_notes := v_item->>'notes';
        v_subtotal := v_qty * v_price;

        -- Insert Transaction Item
        INSERT INTO public.transaction_items (
            transaction_id,
            menu_id,
            quantity,
            price_at_sale,
            notes,
            subtotal
        ) VALUES (
            v_tx_id,
            v_menu_id,
            v_qty,
            v_price,
            v_notes,
            v_subtotal
        );

        -- Kurangi Stok Porsi Harian Secara Otomatis
        UPDATE public.menus
        SET daily_stock = daily_stock - v_qty,
            is_available = CASE WHEN (daily_stock - v_qty) <= 0 THEN FALSE ELSE is_available END,
            updated_at = NOW()
        WHERE id = v_menu_id;
    END LOOP;

    -- Kembalikan Hasil Transaksi sebagai JSON
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_tx_id,
        'invoice_number', v_invoice_num,
        'total_amount', v_calculated_total,
        'order_type', p_order_type,
        'payment_method', p_payment_method
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. STORED PROCEDURE: RESET PORSI HARIAN (reset_daily_stock)
-- Digunakan oleh Admin setiap pagi saat membuka warung
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reset_daily_stock(p_default_qty INT DEFAULT 30)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Hanya Admin yang dapat mereset stok porsi harian.';
    END IF;

    UPDATE public.menus
    SET daily_stock = p_default_qty,
        is_available = TRUE,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;
