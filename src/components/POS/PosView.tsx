import React, { useState, useMemo } from 'react';
import { useWarung, formatRupiah } from '../../lib/store';
import { Menu, Transaction } from '../../types/database';
import {
  Search,
  Sparkles,
  ShoppingBag,
  Store,
  Trash2,
  Plus,
  Minus,
  MessageSquare,
  ArrowRight,
  AlertTriangle,
  Flame,
  CheckCircle2,
  PackageX,
  Layers,
} from 'lucide-react';
import { RamesanModal } from './RamesanModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';

export const PosView: React.FC = () => {
  const {
    menus,
    categories,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    updateCartNotes,
    clearCart,
    cartSubtotal,
    cartItemCount,
    orderType,
    setOrderType,
  } = useWarung();

  // Search and Category Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Active Modals
  const [isRamesanOpen, setIsRamesanOpen] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [activeReceiptTx, setActiveReceiptTx] = useState<Transaction | null>(null);

  // Note editing state for a cart item
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');

  // Filtered menu items
  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      const matchSearch =
        menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        menu.sku_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === 'all' || menu.category_id === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [menus, searchQuery, selectedCategory]);

  const handleOpenNoteEdit = (cartId: string, currentNotes: string) => {
    setEditingNoteId(cartId);
    setTempNoteText(currentNotes || '');
  };

  const handleSaveNote = (cartId: string) => {
    updateCartNotes(cartId, tempNoteText);
    setEditingNoteId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Menu Catalog & Categories (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Top Bar: Search + Quick Ramesan Button */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                id="pos-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari lauk, sayur, minuman, atau kode SKU..."
                className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Racik Ramesan Button (Warung makan special feature) */}
            <button
              id="pos-btn-racik-ramesan"
              type="button"
              onClick={() => setIsRamesanOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-98 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-stone-950" />
              <span>Racik Nasi Ramesan</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              id="pos-cat-all"
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
              }`}
            >
              Semua Menu ({menus.length})
            </button>
            {categories.map((cat) => {
              const count = menus.filter((m) => m.category_id === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`pos-cat-${cat.id}`}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Menus Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3">
            {filteredMenus.map((menu) => {
              const isOutOfStock = menu.daily_stock <= 0 || !menu.is_available;
              const isLowStock = menu.daily_stock > 0 && menu.daily_stock <= 8;

              // Find quantity already in cart
              const cartItem = cart.find(
                (item) => item.menu.id === menu.id && !item.is_ramesan
              );
              const inCartQty = cartItem ? cartItem.quantity : 0;

              return (
                <div
                  key={menu.id}
                  id={`menu-card-${menu.id}`}
                  onClick={() => !isOutOfStock && addToCart(menu)}
                  className={`relative bg-white rounded-xl border p-3 flex flex-col justify-between transition-all select-none ${
                    isOutOfStock
                      ? 'border-stone-200 opacity-60 cursor-not-allowed bg-stone-50'
                      : 'border-stone-200 hover:border-amber-400 hover:shadow-md cursor-pointer active:scale-99'
                  }`}
                >
                  {/* Top Line: SKU & Category Badge */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                      {menu.sku_code}
                    </span>

                    {/* Stock Status Badge */}
                    {isOutOfStock ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                        <PackageX className="w-3 h-3" />
                        <span>Habis</span>
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-600" />
                        <span>Sisa {menu.daily_stock}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500 font-mono">
                        Stok {menu.daily_stock}
                      </span>
                    )}
                  </div>

                  {/* Menu Icon & Name */}
                  <div className="mb-2">
                    <div className="text-2xl mb-1">{menu.image_url || '🍲'}</div>
                    <h3 className="text-xs font-bold text-stone-900 line-clamp-2 leading-tight">
                      {menu.name}
                    </h3>
                  </div>

                  {/* Bottom Line: Price & Add Button */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-black text-amber-800 font-mono">
                      {formatRupiah(menu.price)}
                    </span>

                    {inCartQty > 0 ? (
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center shadow-xs">
                        {inCartQty}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 flex items-center justify-center transition-colors disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMenus.length === 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-500">
              <PackageX className="w-10 h-10 mx-auto text-stone-400 mb-2" />
              <p className="text-sm font-semibold text-stone-700">Tidak ada menu yang cocok</p>
              <p className="text-xs text-stone-400 mt-1">
                Coba ubah kata kunci pencarian atau ganti filter kategori lauk.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: POS Cart & Checkout Drawer (4 cols on lg) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-300 shadow-lg sticky top-24 overflow-hidden">
          {/* Cart Header: Order Type Toggle */}
          <div className="p-3.5 bg-stone-900 text-stone-100 border-b border-stone-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Pesanan Kasir
              </span>
              <span className="text-xs font-mono text-stone-300">
                {cartItemCount} item
              </span>
            </div>

            {/* Quick Order Type Selector */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-800 rounded-xl border border-stone-700">
              <button
                id="cart-order-type-dinein"
                type="button"
                onClick={() => setOrderType('dine_in')}
                className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  orderType === 'dine_in'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Makan di Sini</span>
              </button>
              <button
                id="cart-order-type-takeaway"
                type="button"
                onClick={() => setOrderType('takeaway')}
                className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  orderType === 'takeaway'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Bungkus</span>
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="max-h-[380px] overflow-y-auto p-3 space-y-2.5 divide-y divide-stone-100">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-stone-400 space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                  <Store className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-stone-600">Keranjang masih kosong</p>
                <p className="text-[11px] text-stone-400 max-w-[200px] mx-auto">
                  Pilih lauk dari daftar menu atau buat racikan Nasi Ramesan di atas.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-2.5 first:pt-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        {item.is_ramesan && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                            RAMES
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-stone-900 leading-tight">
                          {item.menu.name}
                        </h4>
                      </div>
                      <div className="text-[11px] font-mono text-amber-800">
                        {formatRupiah(item.price)}
                      </div>
                    </div>

                    {/* Stepper Quantity */}
                    <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg border border-stone-200">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-stone-600 hover:bg-stone-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold font-mono px-1">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-stone-600 hover:bg-stone-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal & Delete */}
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-stone-900">
                        {formatRupiah(item.price * item.quantity)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-[11px] text-stone-400 hover:text-rose-600 mt-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes Section (e.g. 'Kuah dipisah', 'Tanpa pedas') */}
                  {editingNoteId === item.id ? (
                    <div className="flex gap-1 pt-1">
                      <input
                        type="text"
                        value={tempNoteText}
                        onChange={(e) => setTempNoteText(e.target.value)}
                        placeholder="Contoh: kuah dipisah, paha atas..."
                        className="w-full text-xs p-1.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveNote(item.id)}
                        className="px-2 text-xs bg-stone-900 text-white rounded-lg"
                      >
                        Simpan
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-stone-500 bg-stone-50 px-2 py-1 rounded-lg">
                      <span className="italic truncate max-w-[200px]">
                        {item.notes ? `* ${item.notes}` : 'Belum ada catatan khusus'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenNoteEdit(item.id, item.notes)}
                        className="text-amber-700 hover:underline shrink-0 text-[10px]"
                      >
                        {item.notes ? 'Ubah Catatan' : '+ Catatan'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Cart Footer Summary */}
          {cart.length > 0 && (
            <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">{formatRupiah(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-stone-900 pt-1 border-t border-stone-200">
                  <span>Total Tagihan:</span>
                  <span className="font-mono text-amber-900 text-base">
                    {formatRupiah(cartSubtotal)}
                  </span>
                </div>
              </div>

              {/* Checkout & Clear Buttons */}
              <div className="space-y-2">
                <button
                  id="cart-btn-checkout"
                  type="button"
                  onClick={() => setIsPaymentOpen(true)}
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <span>Lanjut Pembayaran</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="cart-btn-clear"
                  type="button"
                  onClick={clearCart}
                  className="w-full py-1.5 text-[11px] text-stone-500 hover:text-stone-800 transition-colors"
                >
                  Kosongkan Keranjang
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Racik Nasi Ramesan Modal */}
      <RamesanModal
        isOpen={isRamesanOpen}
        onClose={() => setIsRamesanOpen(false)}
      />

      {/* Payment Processing Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={(createdTx) => {
          setActiveReceiptTx(createdTx);
        }}
      />

      {/* Struk Kasir Modal */}
      <ReceiptModal
        transaction={activeReceiptTx}
        isOpen={Boolean(activeReceiptTx)}
        onClose={() => setActiveReceiptTx(null)}
      />
    </div>
  );
};
