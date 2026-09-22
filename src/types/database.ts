export type UserRole = 'admin' | 'kasir';
export type OrderType = 'dine_in' | 'takeaway';
export type PaymentMethod = 'cash' | 'qris' | 'transfer';

export interface Profile {
  id: string; // UUID, FK auth.users
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string; // UUID or string
  name: string;
}

export interface Menu {
  id: string; // UUID
  sku_code: string; // Text, Unique
  name: string;
  category_id: string; // FK categories
  price: number;
  daily_stock: number;
  is_available: boolean;
  image_url?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string; // UUID
  invoice_number: string; // Text, Unique
  user_id: string; // FK profiles
  order_type: OrderType;
  total_amount: number;
  discount: number;
  payment_method: PaymentMethod;
  created_at: string;
  cash_tendered?: number;
  change_amount?: number;
  // Joined or populated for UI
  cashier_name?: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string; // UUID
  transaction_id: string; // FK transactions
  menu_id: string; // FK menus
  quantity: number;
  price_at_sale: number;
  notes?: string; // e.g. 'kuah dipisah', 'tanpa pedas'
  subtotal: number;
  // Joined for display
  menu_name?: string;
  menu_sku?: string;
}

export interface CartItem {
  id: string; // unique item line id
  menu: Menu;
  quantity: number;
  price: number;
  notes: string;
  is_ramesan?: boolean;
  ramesan_details?: {
    rice_type: string;
    main_dish: string;
    vegetable: string;
    condiment: string;
  };
}

export interface CheckoutPayload {
  order_type: OrderType;
  payment_method: PaymentMethod;
  discount: number;
  cash_tendered?: number;
  items: {
    menu_id: string;
    quantity: number;
    price_at_sale: number;
    notes?: string;
    subtotal: number;
  }[];
}
