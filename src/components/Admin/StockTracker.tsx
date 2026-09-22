import React, { useState } from 'react';
import { useWarung } from '../../lib/store';
import { Menu } from '../../types/database';
import {
  Flame,
  AlertTriangle,
  PackageCheck,
  PackageX,
  Plus,
  RotateCcw,
  CheckCircle2,
  TrendingDown,
  CookingPot,
} from 'lucide-react';

export const StockTracker: React.FC = () => {
  const { menus, categories, updateMenuStock, resetDailyStock } = useWarung();

  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [replenishingId, setReplenishingId] = useState<string | null>(null);
  const [customAddQty, setCustomAddQty] = useState<number>(10);

  const filteredMenus = menus.filter((m) =>
    selectedCat === 'all' ? true : m.category_id === selectedCat
  );

  // Statistics
  const totalPortions = menus.reduce((acc, m) => acc + m.daily_stock, 0);
  const lowStockItems = menus.filter((m) => m.daily_stock > 0 && m.daily_stock <= 8);
  const outOfStockItems = menus.filter((m) => m.daily_stock <= 0);

  const handleQuickAdd = async (menu: Menu, qty: number) => {
    await updateMenuStock(menu.id, menu.daily_stock + qty);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Stock */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
            <CookingPot className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-medium">Total Porsi Etalase Hari Ini</div>
            <div className="text-xl font-bold font-mono text-stone-900">
              {totalPortions} porsi
            </div>
            <div className="text-[10px] text-stone-400">Tersebar di {menus.length} menu</div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-medium">Stok Menipis (Kritis)</div>
            <div className="text-xl font-bold font-mono text-amber-800">
              {lowStockItems.length} menu
            </div>
            <div className="text-[10px] text-amber-700">Perlu dimasak tambahan di dapur</div>
          </div>
        </div>

        {/* Out of stock */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
            <PackageX className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-medium">Lauk Habis (Sold Out)</div>
            <div className="text-xl font-bold font-mono text-rose-700">
              {outOfStockItems.length} menu
            </div>
            <div className="text-[10px] text-stone-400">Otomatis terkunci di POS kasir</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Categories & Quick replenishment */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCat === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Semua ({menus.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCat === c.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="text-xs text-stone-500 italic">
          💡 Tips: Tambah porsi saat koki selesai memasak batch baru
        </div>
      </div>

      {/* Grid of Menus with Live Stock Gauge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredMenus.map((menu) => {
          const isOut = menu.daily_stock <= 0;
          const isLow = menu.daily_stock > 0 && menu.daily_stock <= 8;

          // Progress percentage assuming base ~35
          const maxRef = 40;
          const percentage = Math.min(100, Math.round((menu.daily_stock / maxRef) * 100));

          return (
            <div
              key={menu.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs transition-all ${
                isOut
                  ? 'border-rose-300 bg-rose-50/30'
                  : isLow
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-stone-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl p-1.5 bg-stone-100 rounded-xl">
                    {menu.image_url || '🍲'}
                  </span>
                  <div>
                    <h3 className="font-bold text-xs text-stone-900 leading-tight">
                      {menu.name}
                    </h3>
                    <span className="text-[10px] font-mono text-stone-500">
                      SKU: {menu.sku_code}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-base font-black font-mono ${
                      isOut
                        ? 'text-rose-600'
                        : isLow
                        ? 'text-amber-700'
                        : 'text-stone-900'
                    }`}
                  >
                    {menu.daily_stock}
                  </span>
                  <span className="text-[10px] text-stone-500 block -mt-0.5">porsi</span>
                </div>
              </div>

              {/* Visual Stock Bar */}
              <div className="space-y-1 mb-3">
                <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isOut
                        ? 'bg-rose-500'
                        : isLow
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${isOut ? 5 : Math.max(8, percentage)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>Status:</span>
                  <span
                    className={`font-semibold ${
                      isOut
                        ? 'text-rose-600'
                        : isLow
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {isOut ? 'Habis (Sold Out)' : isLow ? 'Hampir Habis' : 'Stok Aman'}
                  </span>
                </div>
              </div>

              {/* Quick Restock Buttons */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5">
                <span className="text-[11px] font-medium text-stone-600">Tambah Lauk:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(menu, 5)}
                    className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[11px] font-bold transition-colors font-mono"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(menu, 10)}
                    className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[11px] font-bold transition-colors font-mono"
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(menu, 20)}
                    className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-[11px] font-bold transition-colors font-mono"
                  >
                    +20
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
