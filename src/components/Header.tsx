import React from 'react';
import { useWarung, formatRupiah } from '../lib/store';
import {
  UtensilsCrossed,
  Shield,
  UserCheck,
  Database,
  ReceiptText,
  ShoppingBag,
  Store,
  Layers,
  BarChart3,
  Flame,
} from 'lucide-react';
import { UserRole } from '../types/database';

interface HeaderProps {
  activeTab: 'pos' | 'menu' | 'stock' | 'sales' | 'sql';
  setActiveTab: (tab: 'pos' | 'menu' | 'stock' | 'sales' | 'sql') => void;
  onOpenSqlModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSqlModal,
}) => {
  const {
    currentProfile,
    switchRole,
    orderType,
    setOrderType,
    cartItemCount,
    cartSubtotal,
    isLiveSupabase,
  } = useWarung();

  const isAdmin = currentProfile.role === 'admin';

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner with Brand & Role Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Warung Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xl shadow-inner">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-amber-400">
                  WARUNG NUSANTARA
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono border border-stone-700">
                  POS v2.0
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden sm:block">
                Sistem Kasir &amp; Manajemen Porsi Harian Ramesan
              </p>
            </div>
          </div>

          {/* Quick Order Type Selector (Dine-in vs Takeaway) */}
          <div className="flex items-center bg-stone-800/90 p-1 rounded-xl border border-stone-700">
            <button
              id="header-order-dinein"
              type="button"
              onClick={() => setOrderType('dine_in')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                orderType === 'dine_in'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Makan di Tempat</span>
            </button>
            <button
              id="header-order-takeaway"
              type="button"
              onClick={() => setOrderType('takeaway')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                orderType === 'takeaway'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bungkus</span>
            </button>
          </div>

          {/* Role Switcher & Supabase Status */}
          <div className="flex items-center gap-2.5">
            {/* Supabase status badge */}
            <button
              id="header-btn-supabase-status"
              type="button"
              onClick={onOpenSqlModal}
              title="Klik untuk melihat skrip SQL &amp; pengaturan Supabase"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs text-stone-300 transition-colors"
            >
              <Database
                className={`w-3.5 h-3.5 ${
                  isLiveSupabase ? 'text-emerald-400' : 'text-amber-400'
                }`}
              />
              <span className="hidden md:inline">
                {isLiveSupabase ? 'Supabase Connected' : 'Supabase SQL'}
              </span>
            </button>

            {/* Role switch toggle */}
            <div className="flex items-center gap-1.5 bg-stone-800/80 px-2.5 py-1.5 rounded-xl border border-stone-700">
              {isAdmin ? (
                <Shield className="w-4 h-4 text-emerald-400" />
              ) : (
                <UserCheck className="w-4 h-4 text-sky-400" />
              )}
              <div className="text-left hidden lg:block mr-1">
                <div className="text-[11px] leading-tight text-stone-400">Petugas Aktif</div>
                <div className="text-xs font-semibold text-stone-200 leading-tight">
                  {currentProfile.full_name.split(' ')[0]}
                </div>
              </div>

              <select
                id="header-select-role"
                value={currentProfile.role}
                onChange={(e) => switchRole(e.target.value as UserRole)}
                className="bg-stone-900 text-xs text-amber-400 font-semibold rounded-lg px-2 py-1 border border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                title="Ganti Peran Pengguna (RBAC Simulation)"
              >
                <option value="kasir">Peran: Kasir (Budi)</option>
                <option value="admin">Peran: Admin (Bu Ratna)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-stone-950 border-t border-stone-800/80 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar py-1">
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-tab-pos"
              type="button"
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'pos'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-300 hover:bg-stone-900 hover:text-white'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Kasir (POS)</span>
              {cartItemCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'pos'
                      ? 'bg-stone-950 text-amber-400'
                      : 'bg-amber-500 text-stone-950'
                  }`}
                >
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Admin-only navigation items */}
            {isAdmin && (
              <>
                <button
                  id="nav-tab-menu"
                  type="button"
                  onClick={() => setActiveTab('menu')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'menu'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Master Menu &amp; Harga</span>
                </button>

                <button
                  id="nav-tab-stock"
                  type="button"
                  onClick={() => setActiveTab('stock')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'stock'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  <span>Stok Porsi Harian</span>
                </button>

                <button
                  id="nav-tab-sales"
                  type="button"
                  onClick={() => setActiveTab('sales')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'sales'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Rekap Omset &amp; Shift</span>
                </button>
              </>
            )}

            <button
              id="nav-tab-sql"
              type="button"
              onClick={onOpenSqlModal}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'sql'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Skrip Supabase (SQL &amp; RLS)</span>
            </button>
          </nav>

          {/* Cart quick summary preview */}
          {cartItemCount > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-stone-300 font-mono pl-4 border-l border-stone-800">
              <span className="text-stone-400">Total Keranjang:</span>
              <span className="font-bold text-amber-400">{formatRupiah(cartSubtotal)}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
