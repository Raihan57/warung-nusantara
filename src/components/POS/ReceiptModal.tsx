import React, { useRef } from 'react';
import { Transaction } from '../../types/database';
import { formatRupiah } from '../../lib/store';
import {
  Printer,
  Copy,
  Check,
  X,
  Share2,
  Receipt,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const orderTypeLabel =
    transaction.order_type === 'dine_in' ? 'MAKAN DI TEMPAT' : 'DIBUNGKUS (TAKEAWAY)';

  const formattedDate = new Date(transaction.created_at).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const textLines = [
      '================================',
      '      WARUNG MAKAN NUSANTARA    ',
      '  Jl. Warung Sederhana No. 12   ',
      '     Telp: 0812-3456-7890       ',
      '================================',
      `No. Nota : ${transaction.invoice_number}`,
      `Tanggal  : ${formattedDate}`,
      `Kasir    : ${transaction.cashier_name || 'Kasir'}`,
      `Pesanan  : [ ${orderTypeLabel} ]`,
      '--------------------------------',
      ...(transaction.items || []).map(
        (it) =>
          `${it.menu_name}\n  ${it.quantity}x @ ${formatRupiah(it.price_at_sale)} = ${formatRupiah(
            it.subtotal
          )}${it.notes ? `\n  * ${it.notes}` : ''}`
      ),
      '--------------------------------',
      `Total    : ${formatRupiah(transaction.total_amount)}`,
      transaction.discount > 0 ? `Diskon   : -${formatRupiah(transaction.discount)}` : '',
      `Metode   : ${transaction.payment_method.toUpperCase()}`,
      transaction.cash_tendered
        ? `Tunai    : ${formatRupiah(transaction.cash_tendered)}\nKembalian: ${formatRupiah(
            transaction.change_amount || 0
          )}`
        : '',
      '================================',
      '   Matur Nuwun / Terima Kasih   ',
      '================================',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(textLines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Action Header */}
        <div className="p-3.5 sm:p-4 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white">Struk Transaksi Kasir</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-stone-100 flex-1 flex justify-center">
          {/* Printable Struk Card (Styled like Thermal Receipt Paper) */}
          <div
            id="printable-receipt"
            ref={receiptRef}
            className="w-full max-w-[340px] bg-white p-5 rounded-lg shadow-sm border border-stone-300 font-mono-receipt text-xs text-stone-800 space-y-3"
          >
            {/* Header Struk */}
            <div className="text-center space-y-0.5">
              <h1 className="font-bold text-sm text-stone-900 tracking-wider">
                WARUNG MAKAN NUSANTARA
              </h1>
              <p className="text-[11px] text-stone-600">Aneka Masakan Rumahan &amp; Ramesan</p>
              <p className="text-[10px] text-stone-500">Jl. Warung Sederhana No. 12, Jakarta</p>
              <p className="text-[10px] text-stone-500">WA: 0812-3456-7890</p>
            </div>

            <div className="border-b border-dashed border-stone-400 my-2" />

            {/* Meta Info */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-500">No. Nota:</span>
                <span className="font-bold text-stone-900">{transaction.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Waktu:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Kasir:</span>
                <span>{transaction.cashier_name || 'Budi Santoso'}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-stone-500">Tipe Pesanan:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    transaction.order_type === 'dine_in'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-indigo-100 text-indigo-900'
                  }`}
                >
                  {orderTypeLabel}
                </span>
              </div>
            </div>

            <div className="border-b border-dashed border-stone-400 my-2" />

            {/* Transaction Items */}
            <div className="space-y-2.5">
              {(transaction.items || []).map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-medium text-stone-900">
                    <span className="truncate max-w-[200px]">{item.menu_name}</span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>
                      {item.quantity} x {formatRupiah(item.price_at_sale)}
                    </span>
                    {item.menu_sku && <span>[{item.menu_sku}]</span>}
                  </div>
                  {item.notes && (
                    <div className="text-[10px] text-amber-800 italic bg-amber-50/70 px-1 py-0.5 rounded">
                      * {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-b border-dashed border-stone-400 my-2" />

            {/* Calculations */}
            <div className="space-y-1 text-[11px]">
              {transaction.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-stone-900 pt-1">
                <span>TOTAL AKHIR:</span>
                <span>{formatRupiah(transaction.total_amount)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Metode Bayar:</span>
                <span className="font-semibold uppercase">{transaction.payment_method}</span>
              </div>

              {transaction.payment_method === 'cash' && transaction.cash_tendered && (
                <>
                  <div className="flex justify-between text-stone-600">
                    <span>Uang Diterima:</span>
                    <span>{formatRupiah(transaction.cash_tendered)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(transaction.change_amount || 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-b border-dashed border-stone-400 my-2" />

            {/* Footer */}
            <div className="text-center text-[10px] text-stone-500 space-y-1 pt-1">
              <p className="font-semibold text-stone-700">Matur Nuwun / Terima Kasih!</p>
              <p>Semoga Sehat &amp; Berkah Selalu</p>
              <p className="text-[9px] text-stone-400">
                Struk ini merupakan bukti pembayaran yang sah.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Nota</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Transaksi Baru</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
