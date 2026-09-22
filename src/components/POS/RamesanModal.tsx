import React, { useState } from 'react';
import { useWarung, formatRupiah } from '../../lib/store';
import { Menu, CartItem } from '../../types/database';
import { X, Check, Utensils, Sparkles, PlusCircle } from 'lucide-react';

interface RamesanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RamesanModal: React.FC<RamesanModalProps> = ({ isOpen, onClose }) => {
  const { menus, addToCart } = useWarung();

  // Rice options
  const riceOptions = [
    { id: 'rice-full', name: 'Nasi Putih 1 Porsi Penuh', price: 5000 },
    { id: 'rice-half', name: 'Nasi Putih 1/2 Porsi', price: 3000 },
    { id: 'rice-none', name: 'Tanpa Nasi (Lauk Saja)', price: 0 },
  ];

  // Separate menus by category
  const mainDishes = menus.filter((m) => m.category_id === 'cat-1' && m.daily_stock > 0);
  const vegDishes = menus.filter((m) => m.category_id === 'cat-2' && m.daily_stock > 0);
  const sideDishes = menus.filter((m) => m.category_id === 'cat-3' && m.id !== 'm-11' && m.daily_stock > 0);

  // States
  const [selectedRice, setSelectedRice] = useState(riceOptions[0]);
  const [selectedMainDish, setSelectedMainDish] = useState<Menu | null>(mainDishes[0] || null);
  const [selectedVegDish, setSelectedVegDish] = useState<Menu | null>(vegDishes[0] || null);
  const [selectedSideDish, setSelectedSideDish] = useState<Menu | null>(sideDishes[0] || null);
  const [gravyOption, setGravyOption] = useState<string>('Kuah Gulai Sedang');
  const [customNote, setCustomNote] = useState<string>('Sambal dipisah, minta lalapan');

  if (!isOpen) return null;

  // Calculate dynamic total price
  const totalPrice =
    selectedRice.price +
    (selectedMainDish ? selectedMainDish.price : 0) +
    (selectedVegDish ? selectedVegDish.price : 0) +
    (selectedSideDish ? selectedSideDish.price : 0);

  const handleAddRamesanToCart = () => {
    // Generate descriptive name
    const ramesanName = `Nasi Rames Racik: ${selectedMainDish ? selectedMainDish.name : 'Tanpa Lauk'} + ${
      selectedVegDish ? selectedVegDish.name : ''
    }`;

    // Combine notes
    const fullNotes = [
      selectedRice.name,
      selectedVegDish ? `Sayur: ${selectedVegDish.name}` : '',
      selectedSideDish ? `Pelengkap: ${selectedSideDish.name}` : '',
      `Kuah: ${gravyOption}`,
      customNote.trim(),
    ]
      .filter(Boolean)
      .join(' | ');

    // We can pick the main dish as base menu reference or virtual ramesan
    const baseMenu: Menu = selectedMainDish ||
      menus[0] || {
        id: 'rames-custom',
        sku_code: 'RM-CUSTOM',
        name: ramesanName,
        category_id: 'cat-5',
        price: totalPrice,
        daily_stock: 99,
        is_available: true,
      };

    const customCartData: Partial<CartItem> = {
      price: totalPrice,
      is_ramesan: true,
      ramesan_details: {
        rice_type: selectedRice.name,
        main_dish: selectedMainDish?.name || '-',
        vegetable: selectedVegDish?.name || '-',
        condiment: selectedSideDish?.name || '-',
      },
    };

    addToCart(
      {
        ...baseMenu,
        name: ramesanName,
        price: totalPrice,
      },
      fullNotes,
      customCartData
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-amber-50 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Mode Racik Porsi Nasi Ramesan
              </h2>
              <p className="text-xs text-stone-600">
                Kombinasi cepat prasmanan: Nasi + Lauk Utama + Sayur + Pelengkap
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Step 1: Pilihan Nasi */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              1. Pilihan Porsi Nasi
            </label>
            <div className="grid grid-cols-3 gap-2">
              {riceOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedRice(opt)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedRice.id === opt.id
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 text-stone-900 font-semibold'
                      : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <div className="text-xs">{opt.name}</div>
                  <div className="text-xs text-amber-700 font-mono mt-1">
                    +{formatRupiah(opt.price)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Lauk Utama */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              2. Lauk Utama (Pilih 1)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {mainDishes.map((dish) => {
                const isSelected = selectedMainDish?.id === dish.id;
                return (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => setSelectedMainDish(dish)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 text-stone-900 font-semibold'
                        : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{dish.image_url}</span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        Sisa {dish.daily_stock}
                      </span>
                    </div>
                    <div className="text-xs truncate">{dish.name}</div>
                    <div className="text-xs text-amber-700 font-mono font-medium">
                      +{formatRupiah(dish.price)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Pilihan Sayuran */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              3. Pilihan Sayur
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {vegDishes.map((veg) => {
                const isSelected = selectedVegDish?.id === veg.id;
                return (
                  <button
                    key={veg.id}
                    type="button"
                    onClick={() => setSelectedVegDish(isSelected ? null : veg)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 text-stone-900 font-semibold'
                        : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div className="text-base mb-0.5">{veg.image_url}</div>
                    <div className="text-xs truncate">{veg.name}</div>
                    <div className="text-xs text-amber-700 font-mono">
                      +{formatRupiah(veg.price)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Gorengan / Pelengkap */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              4. Gorengan / Pelengkap
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sideDishes.map((side) => {
                const isSelected = selectedSideDish?.id === side.id;
                return (
                  <button
                    key={side.id}
                    type="button"
                    onClick={() => setSelectedSideDish(isSelected ? null : side)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 text-stone-900 font-semibold'
                        : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div className="text-base mb-0.5">{side.image_url}</div>
                    <div className="text-xs truncate">{side.name}</div>
                    <div className="text-xs text-amber-700 font-mono">
                      +{formatRupiah(side.price)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 5: Kuah & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Siraman Kuah Warung
              </label>
              <select
                value={gravyOption}
                onChange={(e) => setGravyOption(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Kuah Gulai Sedang">Kuah Gulai (Siram Sedang)</option>
                <option value="Kuah Gulai Banjir">Kuah Gulai (Banjir di Nasi)</option>
                <option value="Kuah Opor / Sayur Lodeh">Kuah Sayur Lodeh</option>
                <option value="Kuah Dipisah Plastik">Kuah Dipisah (Plastik)</option>
                <option value="Kering Tanpa Kuah">Kering (Tanpa Kuah)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Catatan Khusus Ramesan
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Misal: Sambal banyak, tanpa timun"
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Total Summary Footer Box */}
          <div className="bg-stone-900 text-stone-100 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-400 block">Total Paket Ramesan:</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {formatRupiah(totalPrice)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddRamesanToCart}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Masukkan ke Kasir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
