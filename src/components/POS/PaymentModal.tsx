import React, { useState, useMemo } from 'react';
import { useWarung, formatRupiah } from '../../lib/store';
import { PaymentMethod, Transaction } from '../../types/database';
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Percent,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: Transaction) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    cart,
    cartSubtotal,
    orderType,
    currentProfile,
    processCheckout,
  } = useWarung();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discount, setDiscount] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Total after discount
  const finalTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discount);
  }, [cartSubtotal, discount]);

  // Initial money preset when opened
  React.useEffect(() => {
    if (isOpen) {
      setCashTendered(finalTotal);
      setErrorMsg('');
    }
  }, [isOpen, finalTotal]);

  if (!isOpen) return null;

  const changeAmount = cashTendered - finalTotal;

  // Quick cash presets
  const cashPresets = [
    { label: 'Uang Pas', value: finalTotal },
    { label: 'Rp 20.000', value: 20000 },
    { label: 'Rp 50.000', value: 50000 },
    { label: 'Rp 100.000', value: 100000 },
    { label: 'Rp 150.000', value: 150000 },
    { label: 'Rp 200.000', value: 200000 },
  ].filter((p) => p.value >= finalTotal || p.label === 'Uang Pas');

  const handleSubmit = async () => {
    setErrorMsg('');
    if (paymentMethod === 'cash' && cashTendered < finalTotal) {
      setErrorMsg('Uang yang diterima kasir kurang dari total pembayaran.');
      return;
    }

    try {
      setSubmitting(true);
      const createdTx = await processCheckout({
        paymentMethod,
        discount,
        cashTendered: paymentMethod === 'cash' ? cashTendered : undefined,
      });

      onSuccess(createdTx);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-stone-100 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Pembayaran Kasir</h2>
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <span className="capitalize">
                  {orderType === 'dine_in' ? '🍽️ Makan di Tempat' : '🛍️ Bungkus (Takeaway)'}
                </span>
                <span>•</span>
                <span>Kasir: {currentProfile.full_name}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Amount Due Box */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-800 font-medium">Total yang Harus Dibayar:</div>
              <div className="text-2xl font-black text-amber-950 font-mono">
                {formatRupiah(finalTotal)}
              </div>
            </div>
            <div className="text-right text-xs text-stone-500">
              <div>Subtotal: {formatRupiah(cartSubtotal)}</div>
              {discount > 0 && (
                <div className="text-emerald-700 font-medium">
                  Diskon: -{formatRupiah(discount)}
                </div>
              )}
            </div>
          </div>

          {/* Diskon / Potongan */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Potongan Harga / Diskon (Opsional)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-mono">Rp</span>
                <input
                  type="number"
                  min="0"
                  max={cartSubtotal}
                  value={discount === 0 ? '' : discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 font-mono text-stone-800 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setDiscount(0)}
                className="px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-500 hover:bg-stone-100"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 font-bold'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <Banknote className="w-5 h-5 text-amber-600" />
                <span className="text-xs">Tunai (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'qris'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 font-bold'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <QrCode className="w-5 h-5 text-indigo-600" />
                <span className="text-xs">QRIS Dinamis</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 font-bold'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Transfer Bank</span>
              </button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3 pt-2 border-t border-stone-200">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Uang yang Diterima Kasir:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={cashTendered === 0 ? '' : cashTendered}
                    onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                    placeholder="Masukkan nominal uang..."
                    className="w-full text-base font-bold bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-2 font-mono text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Nominal Presets */}
              <div className="flex flex-wrap gap-1.5">
                {cashPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCashTendered(preset.value)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border font-mono transition-colors ${
                      cashTendered === preset.value
                        ? 'bg-stone-900 text-amber-400 border-stone-900 font-bold'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Kembalian Display Box */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  changeAmount >= 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div>
                  <span className="text-xs block">
                    {changeAmount >= 0 ? 'Kembalian Pelanggan:' : 'Uang Kurang:'}
                  </span>
                  <span className="text-lg font-black font-mono">
                    {formatRupiah(Math.abs(changeAmount))}
                  </span>
                </div>
                {changeAmount >= 0 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                )}
              </div>
            </div>
          )}

          {/* QRIS Payment Details */}
          {paymentMethod === 'qris' && (
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-center space-y-3">
              <div className="inline-block p-3 bg-white border border-stone-200 rounded-xl shadow-xs">
                {/* Visual QR Code SVG Simulation */}
                <div className="w-40 h-40 bg-stone-900 text-white p-2 rounded-lg flex flex-col items-center justify-center font-mono text-[9px] relative overflow-hidden">
                  <div className="absolute top-1 left-1 w-6 h-6 border-2 border-white flex items-center justify-center">
                    <div className="w-3 h-3 bg-white" />
                  </div>
                  <div className="absolute top-1 right-1 w-6 h-6 border-2 border-white flex items-center justify-center">
                    <div className="w-3 h-3 bg-white" />
                  </div>
                  <div className="absolute bottom-1 left-1 w-6 h-6 border-2 border-white flex items-center justify-center">
                    <div className="w-3 h-3 bg-white" />
                  </div>
                  <div className="w-10 h-10 rounded bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-[10px] shadow-sm z-10">
                    QRIS
                  </div>
                  <div className="text-[8px] text-stone-300 mt-2 z-10">WARUNG NUSANTARA</div>
                </div>
              </div>
              <div className="text-xs text-stone-600 space-y-1">
                <p className="font-semibold text-stone-900">
                  Scan QRIS untuk pembayaran {formatRupiah(finalTotal)}
                </p>
                <p className="text-[11px] text-stone-500">
                  Dukungan: BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA
                </p>
              </div>
            </div>
          )}

          {/* Transfer Bank Details */}
          {paymentMethod === 'transfer' && (
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Rekening Resmi Warung Makan</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-stone-200 space-y-1 font-mono">
                <div className="text-stone-500 text-[11px]">Bank Central Asia (BCA)</div>
                <div className="text-sm font-bold text-stone-900 flex items-center justify-between">
                  <span>8820-1928-11</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Salin
                  </span>
                </div>
                <div className="text-stone-500 text-[11px]">a/n Warung Makan Nusantara</div>
              </div>
              <p className="text-[11px] text-stone-500">
                Kasir harap pastikan dana masuk ke rekening sebelum menyelesaikan transaksi.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={submitting || (paymentMethod === 'cash' && cashTendered < finalTotal)}
              onClick={handleSubmit}
              className="flex-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-300 disabled:cursor-not-allowed text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
            >
              {submitting ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selesaikan &amp; Cetak Struk</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
