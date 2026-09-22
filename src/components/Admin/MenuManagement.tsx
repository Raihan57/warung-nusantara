import React, { useState } from 'react';
import { useWarung, formatRupiah } from '../../lib/store';
import { Menu } from '../../types/database';
import {
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Search,
  Check,
  X,
  Layers,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const MenuManagement: React.FC = () => {
  const {
    menus,
    categories,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    resetDailyStock,
  } = useWarung();

  const [search, setSearch] = useState<string>('');
  const [filterCat, setFilterCat] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    sku_code: '',
    name: '',
    category_id: categories[0]?.id || 'cat-1',
    price: 10000,
    daily_stock: 30,
    is_available: true,
    image_url: '🍲',
  });

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetQty, setResetQty] = useState(35);

  const filteredMenus = menus.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.sku_code.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || m.category_id === filterCat;
    return matchSearch && matchCat;
  });

  const handleOpenAdd = () => {
    setEditingMenu(null);
    setFormData({
      sku_code: `LK-${String(menus.length + 1).padStart(2, '0')}`,
      name: '',
      category_id: categories[0]?.id || 'cat-1',
      price: 15000,
      daily_stock: 30,
      is_available: true,
      image_url: '🍛',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
      sku_code: menu.sku_code,
      name: menu.name,
      category_id: menu.category_id,
      price: menu.price,
      daily_stock: menu.daily_stock,
      is_available: menu.is_available,
      image_url: menu.image_url || '🍲',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMenu) {
      await updateMenuItem({
        id: editingMenu.id,
        ...formData,
      });
    } else {
      await createMenuItem(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Hapus menu "${name}" dari sistem warung?`)) {
      await deleteMenuItem(id);
    }
  };

  const handleToggleAvailable = async (menu: Menu) => {
    await updateMenuItem({
      id: menu.id,
      is_available: !menu.is_available,
    });
  };

  const handleExecuteResetStock = async () => {
    await resetDailyStock(resetQty);
    setResetModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-stone-900">
              Master Menu / Lauk &amp; Pengaturan Harga
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              Admin Mode
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Kelola data lauk, sayur, minuman, harga jual, dan ketersediaan menu warung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Reset Daily Stock Button */}
          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold border border-stone-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
            <span>Reset Stok Harian</span>
          </button>

          {/* Add Menu Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu Baru</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama menu atau SKU..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterCat('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterCat === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Semua ({menus.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCat(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterCat === cat.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menus Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Menu &amp; SKU</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga Jual</th>
                <th className="py-3 px-4">Porsi Hari Ini</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredMenus.map((menu) => {
                const categoryName =
                  categories.find((c) => c.id === menu.category_id)?.name || 'Lainnya';

                return (
                  <tr key={menu.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl p-1 bg-stone-100 rounded-lg">
                          {menu.image_url || '🍲'}
                        </span>
                        <div>
                          <div className="font-bold text-stone-900">{menu.name}</div>
                          <div className="text-[10px] font-mono text-stone-500">
                            SKU: {menu.sku_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[11px] font-medium border border-stone-200">
                        {categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">
                      {formatRupiah(menu.price)}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`font-bold ${
                          menu.daily_stock <= 0
                            ? 'text-rose-600'
                            : menu.daily_stock <= 8
                            ? 'text-amber-600'
                            : 'text-stone-800'
                        }`}
                      >
                        {menu.daily_stock} porsi
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailable(menu)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          menu.is_available && menu.daily_stock > 0
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {menu.is_available && menu.daily_stock > 0
                          ? '✓ Tersedia'
                          : '✕ Habis / Nonaktif'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(menu)}
                          className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                          title="Ubah Menu"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(menu.id, menu.name)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Menu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Menu */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-sm text-stone-900">
                {editingMenu ? 'Ubah Menu / Lauk' : 'Tambah Menu Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Emoji / Icon</label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-xl text-center text-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-stone-700 font-bold mb-1">Kode SKU</label>
                  <input
                    type="text"
                    required
                    value={formData.sku_code}
                    onChange={(e) => setFormData({ ...formData, sku_code: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Nama Menu / Lauk</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Ayam Bakar Madu"
                  className="w-full p-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Kategori</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full p-2 border border-stone-300 rounded-xl bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Porsi Awal Harian</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.daily_stock}
                    onChange={(e) =>
                      setFormData({ ...formData, daily_stock: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Daily Stock Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-3">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>Reset Porsi Harian Warung</span>
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Tindakan ini akan mereset stok seluruh menu lauk ke jumlah porsi standar (misal setiap pagi saat warung baru buka memasak batch baru).
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Atur Jumlah Porsi Default:
              </label>
              <input
                type="number"
                min="5"
                max="200"
                value={resetQty}
                onChange={(e) => setResetQty(Number(e.target.value))}
                className="w-full text-sm font-bold font-mono p-2 border border-stone-300 rounded-xl"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-3 py-2 text-xs border border-stone-300 rounded-xl text-stone-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteResetStock}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl"
              >
                Konfirmasi Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
