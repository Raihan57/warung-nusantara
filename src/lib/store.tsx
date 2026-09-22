import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Category,
  Menu,
  Profile,
  Transaction,
  CartItem,
  OrderType,
  PaymentMethod,
  UserRole,
} from '../types/database';
import {
  INITIAL_CATEGORIES,
  INITIAL_MENUS,
  INITIAL_PROFILES,
  INITIAL_TRANSACTIONS,
} from './mockData';
import { getSupabaseClient } from './supabase';

const LS_MENUS_KEY = 'warung_menus_v1';
const LS_CATEGORIES_KEY = 'warung_categories_v1';
const LS_TX_KEY = 'warung_transactions_v1';
const LS_ROLE_KEY = 'warung_current_role_v1';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface WarungContextType {
  // Profiles & RBAC
  profiles: Profile[];
  currentProfile: Profile;
  switchRole: (role: UserRole) => void;

  // Master Data
  categories: Category[];
  menus: Menu[];
  transactions: Transaction[];
  loading: boolean;
  isLiveSupabase: boolean;

  // POS State
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  cart: CartItem[];
  addToCart: (menu: Menu, notes?: string, customItemData?: Partial<CartItem>) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartItemCount: number;

  // Checkout (Simulating RPC create_transaction_atomic)
  processCheckout: (params: {
    paymentMethod: PaymentMethod;
    discount: number;
    cashTendered?: number;
  }) => Promise<Transaction>;

  // Admin Actions
  updateMenuItem: (updated: Partial<Menu> & { id: string }) => Promise<void>;
  createMenuItem: (newMenu: Omit<Menu, 'id'>) => Promise<void>;
  deleteMenuItem: (menuId: string) => Promise<void>;
  updateMenuStock: (menuId: string, newStock: number) => Promise<void>;
  resetDailyStock: (defaultQty?: number) => Promise<void>;
  refreshData: () => Promise<void>;
}

const WarungContext = createContext<WarungContextType | null>(null);

export const WarungProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [currentProfile, setCurrentProfile] = useState<Profile>(INITIAL_PROFILES[1]); // Default to Kasir

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(LS_CATEGORIES_KEY);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [menus, setMenus] = useState<Menu[]>(() => {
    try {
      const saved = localStorage.getItem(LS_MENUS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_MENUS;
    } catch {
      return INITIAL_MENUS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(LS_TX_KEY);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLiveSupabase, setIsLiveSupabase] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LS_MENUS_KEY, JSON.stringify(menus));
    } catch (e) {
      console.warn(e);
    }
  }, [menus]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_TX_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.warn(e);
    }
  }, [transactions]);

  // Check Supabase connection on load
  const refreshData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsLiveSupabase(false);
      return;
    }

    try {
      setLoading(true);
      const [catRes, menuRes, txRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('menus').select('*').order('name'),
        supabase.from('transactions').select('*, items:transaction_items(*, menu:menus(name, sku_code))').order('created_at', { ascending: false }),
      ]);

      if (!catRes.error && catRes.data && catRes.data.length > 0) {
        setCategories(catRes.data);
      }
      if (!menuRes.error && menuRes.data && menuRes.data.length > 0) {
        setMenus(menuRes.data);
      }
      if (!txRes.error && txRes.data) {
        setTransactions(txRes.data as any);
      }
      setIsLiveSupabase(true);
    } catch (err) {
      console.error('Error fetching live supabase data:', err);
      setIsLiveSupabase(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Switch role handler
  const switchRole = useCallback((role: UserRole) => {
    const target = profiles.find((p) => p.role === role) || profiles[0];
    setCurrentProfile(target);
    try {
      localStorage.setItem(LS_ROLE_KEY, role);
    } catch (e) {
      console.warn(e);
    }
  }, [profiles]);

  // Cart operations
  const addToCart = useCallback((menu: Menu, notes: string = '', customItemData?: Partial<CartItem>) => {
    setCart((prev) => {
      // If menu is out of stock, do not add
      if (menu.daily_stock <= 0 || !menu.is_available) {
        return prev;
      }

      // Check if item already exists in cart with same notes
      const existingIndex = prev.findIndex(
        (item) => item.menu.id === menu.id && item.notes === notes && !item.is_ramesan
      );

      if (existingIndex > -1 && !customItemData?.is_ramesan) {
        const existing = prev[existingIndex];
        const newQty = Math.min(existing.quantity + 1, menu.daily_stock);
        const updated = [...prev];
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
        };
        return updated;
      }

      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        menu,
        quantity: 1,
        price: customItemData?.price !== undefined ? customItemData.price : menu.price,
        notes,
        is_ramesan: customItemData?.is_ramesan || false,
        ramesan_details: customItemData?.ramesan_details,
      };
      return [...prev, newItem];
    });
  }, []);

  const updateCartQuantity = useCallback((itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === itemId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            // Cap at menu daily_stock
            const maxAllowed = item.menu.daily_stock;
            return {
              ...item,
              quantity: Math.min(nextQty, maxAllowed),
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const updateCartNotes = useCallback((itemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, notes } : item))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Checkout function (Simulates RPC create_transaction_atomic)
  const processCheckout = useCallback(
    async (params: {
      paymentMethod: PaymentMethod;
      discount: number;
      cashTendered?: number;
    }): Promise<Transaction> => {
      if (cart.length === 0) {
        throw new Error('Keranjang pesanan masih kosong.');
      }

      const totalBeforeDiscount = cart.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      const totalAmount = Math.max(0, totalBeforeDiscount - params.discount);

      if (params.paymentMethod === 'cash' && params.cashTendered !== undefined) {
        if (params.cashTendered < totalAmount) {
          throw new Error('Jumlah uang tunai kurang dari total tagihan.');
        }
      }

      const supabase = getSupabaseClient();

      if (supabase && isLiveSupabase) {
        // Prepare RPC call
        const rpcPayload = {
          p_user_id: currentProfile.id,
          p_order_type: orderType,
          p_payment_method: params.paymentMethod,
          p_discount: params.discount,
          p_items: cart.map((item) => ({
            menu_id: item.menu.id,
            quantity: item.quantity,
            price_at_sale: item.price,
            notes: item.notes || null,
          })),
        };

        const { data, error } = await supabase.rpc(
          'create_transaction_atomic',
          rpcPayload
        );

        if (error) {
          throw new Error(`Gagal memproses transaksi Supabase RPC: ${error.message}`);
        }

        // Fetch refreshed data
        await refreshData();

        const createdTx: Transaction = {
          id: data.transaction_id,
          invoice_number: data.invoice_number,
          user_id: currentProfile.id,
          cashier_name: currentProfile.full_name,
          order_type: orderType,
          total_amount: data.total_amount,
          discount: params.discount,
          payment_method: params.paymentMethod,
          cash_tendered: params.cashTendered,
          change_amount: params.cashTendered ? params.cashTendered - data.total_amount : 0,
          created_at: new Date().toISOString(),
          items: cart.map((c) => ({
            id: `ti-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            transaction_id: data.transaction_id,
            menu_id: c.menu.id,
            menu_name: c.menu.name,
            menu_sku: c.menu.sku_code,
            quantity: c.quantity,
            price_at_sale: c.price,
            notes: c.notes,
            subtotal: c.price * c.quantity,
          })),
        };

        clearCart();
        return createdTx;
      }

      // Local Fallback Simulation (Guarantees atomic stock check & decrement)
      // 1. Stock Check
      for (const item of cart) {
        const currentMenu = menus.find((m) => m.id === item.menu.id);
        if (!currentMenu) {
          throw new Error(`Menu "${item.menu.name}" tidak ditemukan.`);
        }
        if (currentMenu.daily_stock < item.quantity) {
          throw new Error(
            `Stok porsi "${currentMenu.name}" tidak mencukupi! Sisa: ${currentMenu.daily_stock}, Diminta: ${item.quantity}`
          );
        }
      }

      // 2. Decrement Stocks
      setMenus((prevMenus) =>
        prevMenus.map((m) => {
          const matchedItem = cart.find((item) => item.menu.id === m.id);
          if (matchedItem) {
            const nextStock = Math.max(0, m.daily_stock - matchedItem.quantity);
            return {
              ...m,
              daily_stock: nextStock,
              is_available: nextStock > 0,
              updated_at: new Date().toISOString(),
            };
          }
          return m;
        })
      );

      // 3. Generate Unique Invoice
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const seq = String(transactions.length + 1).padStart(4, '0');
      const invoiceNumber = `INV-${yyyy}${mm}${dd}-${seq}`;
      const txId = `tx-${Date.now()}`;

      const changeAmount =
        params.paymentMethod === 'cash' && params.cashTendered !== undefined
          ? Math.max(0, params.cashTendered - totalAmount)
          : 0;

      const createdTx: Transaction = {
        id: txId,
        invoice_number: invoiceNumber,
        user_id: currentProfile.id,
        cashier_name: currentProfile.full_name,
        order_type: orderType,
        total_amount: totalAmount,
        discount: params.discount,
        payment_method: params.paymentMethod,
        cash_tendered: params.cashTendered,
        change_amount: changeAmount,
        created_at: now.toISOString(),
        items: cart.map((c) => ({
          id: `ti-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          transaction_id: txId,
          menu_id: c.menu.id,
          menu_name: c.menu.name,
          menu_sku: c.menu.sku_code,
          quantity: c.quantity,
          price_at_sale: c.price,
          notes: c.notes,
          subtotal: c.price * c.quantity,
        })),
      };

      setTransactions((prev) => [createdTx, ...prev]);
      clearCart();
      return createdTx;
    },
    [cart, orderType, currentProfile, menus, transactions, isLiveSupabase, clearCart, refreshData]
  );

  // Admin: Update Menu
  const updateMenuItem = useCallback(
    async (updated: Partial<Menu> & { id: string }) => {
      const supabase = getSupabaseClient();
      if (supabase && isLiveSupabase) {
        const { error } = await supabase
          .from('menus')
          .update({
            ...updated,
            updated_at: new Date().toISOString(),
          })
          .eq('id', updated.id);

        if (error) throw new Error(error.message);
        await refreshData();
        return;
      }

      setMenus((prev) =>
        prev.map((item) =>
          item.id === updated.id
            ? { ...item, ...updated, updated_at: new Date().toISOString() }
            : item
        )
      );
    },
    [isLiveSupabase, refreshData]
  );

  // Admin: Create Menu
  const createMenuItem = useCallback(
    async (newMenu: Omit<Menu, 'id'>) => {
      const supabase = getSupabaseClient();
      if (supabase && isLiveSupabase) {
        const { error } = await supabase.from('menus').insert({
          ...newMenu,
          updated_at: new Date().toISOString(),
        });
        if (error) throw new Error(error.message);
        await refreshData();
        return;
      }

      const created: Menu = {
        ...newMenu,
        id: `m-${Date.now()}`,
        updated_at: new Date().toISOString(),
      };
      setMenus((prev) => [created, ...prev]);
    },
    [isLiveSupabase, refreshData]
  );

  // Admin: Delete Menu
  const deleteMenuItem = useCallback(
    async (menuId: string) => {
      const supabase = getSupabaseClient();
      if (supabase && isLiveSupabase) {
        const { error } = await supabase.from('menus').delete().eq('id', menuId);
        if (error) throw new Error(error.message);
        await refreshData();
        return;
      }

      setMenus((prev) => prev.filter((m) => m.id !== menuId));
    },
    [isLiveSupabase, refreshData]
  );

  // Admin: Quick update stock
  const updateMenuStock = useCallback(
    async (menuId: string, newStock: number) => {
      const validStock = Math.max(0, newStock);
      await updateMenuItem({
        id: menuId,
        daily_stock: validStock,
        is_available: validStock > 0,
      });
    },
    [updateMenuItem]
  );

  // Admin: Reset Daily Stock
  const resetDailyStock = useCallback(
    async (defaultQty: number = 30) => {
      const supabase = getSupabaseClient();
      if (supabase && isLiveSupabase) {
        const { error } = await supabase.rpc('reset_daily_stock', {
          p_default_qty: defaultQty,
        });
        if (error) throw new Error(error.message);
        await refreshData();
        return;
      }

      setMenus((prev) =>
        prev.map((m) => ({
          ...m,
          daily_stock: defaultQty,
          is_available: true,
          updated_at: new Date().toISOString(),
        }))
      );
    },
    [isLiveSupabase, refreshData]
  );

  return (
    <WarungContext.Provider
      value={{
        profiles,
        currentProfile,
        switchRole,
        categories,
        menus,
        transactions,
        loading,
        isLiveSupabase,
        orderType,
        setOrderType,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        updateCartNotes,
        clearCart,
        cartSubtotal,
        cartItemCount,
        processCheckout,
        updateMenuItem,
        createMenuItem,
        deleteMenuItem,
        updateMenuStock,
        resetDailyStock,
        refreshData,
      }}
    >
      {children}
    </WarungContext.Provider>
  );
};

export const useWarung = () => {
  const context = useContext(WarungContext);
  if (!context) {
    throw new Error('useWarung must be used within a WarungProvider');
  }
  return context;
};
