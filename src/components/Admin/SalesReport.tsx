import React, { useState, useMemo } from 'react';
import { useWarung, formatRupiah } from '../../lib/store';
import { Transaction } from '../../types/database';
import {
  BarChart3,
  Banknote,
  QrCode,
  CreditCard,
  Printer,
  Download,
  Calendar,
  Store,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { ReceiptModal } from '../POS/ReceiptModal';

export const SalesReport: React.FC = () => {
  const { transactions } = useWarung();

  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('today');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchInvoice, setSearchInvoice] = useState<string>('');
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);

  // Filter Transactions by Date
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 86400000;

    return transactions.filter((tx) => {
      const txTime = new Date(tx.created_at).getTime();

      let matchDate = true;
      if (dateFilter === 'today') {
        matchDate = txTime >= startOfToday;
      } else if (dateFilter === 'week') {
        matchDate = txTime >= sevenDaysAgo;
      }

      const matchMethod = methodFilter === 'all' || tx.payment_method === methodFilter;
      const matchSearch =
        tx.invoice_number.toLowerCase().includes(searchInvoice.toLowerCase()) ||
        (tx.cashier_name || '').toLowerCase().includes(searchInvoice.toLowerCase());

      return matchDate && matchMethod && matchSearch;
    });
  }, [transactions, dateFilter, methodFilter, searchInvoice]);

  // Aggregate Metrics
  const totalRevenue = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + tx.total_amount, 0);
  }, [filteredTransactions]);

  const cashRevenue = useMemo(() => {
    return filteredTransactions
      .filter((tx) => tx.payment_method === 'cash')
      .reduce((acc, tx) => acc + tx.total_amount, 0);
  }, [filteredTransactions]);

  const qrisRevenue = useMemo(() => {
    return filteredTransactions
      .filter((tx) => tx.payment_method === 'qris')
      .reduce((acc, tx) => acc + tx.total_amount, 0);
  }, [filteredTransactions]);

  const transferRevenue = useMemo(() => {
    return filteredTransactions
      .filter((tx) => tx.payment_method === 'transfer')
      .reduce((acc, tx) => acc + tx.total_amount, 0);
  }, [filteredTransactions]);

  const dineInCount = useMemo(() => {
    return filteredTransactions.filter((tx) => tx.order_type === 'dine_in').length;
  }, [filteredTransactions]);

  const takeawayCount = useMemo(() => {
    return filteredTransactions.filter((tx) => tx.order_type === 'takeaway').length;
  }, [filteredTransactions]);

  // Total Portions Sold
  const totalPortionsSold = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
      const itemsCount = (tx.items || []).reduce((sum, it) => sum + it.quantity, 0);
      return acc + itemsCount;
    }, 0);
  }, [filteredTransactions]);

  // Top Selling Dishes
  const topDishes = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();

    filteredTransactions.forEach((tx) => {
      (tx.items || []).forEach((item) => {
        const existing = map.get(item.menu_id) || {
          name: item.menu_name || 'Lauk',
          qty: 0,
          revenue: 0,
        };
        existing.qty += item.quantity;
        existing.revenue += item.subtotal;
        map.set(item.menu_id, existing);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredTransactions]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'No. Invoice',
      'Waktu',
      'Kasir',
      'Tipe Pesanan',
      'Metode Bayar',
      'Total (Rp)',
      'Diskon (Rp)',
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.invoice_number,
      new Date(tx.created_at).toLocaleString('id-ID'),
      tx.cashier_name || 'Kasir',
      tx.order_type,
      tx.payment_method,
      tx.total_amount,
      tx.discount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap-omset-warung-${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintShiftReport = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-stone-900">
              Laporan Rekapitulasi Omset &amp; Penutupan Kas
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
              Shift Closing
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Rekapitulasi pendapatan harian, rincian pembayaran kasir, dan analisa lauk terlaris.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold border border-stone-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintShiftReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rekap Shift</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-1.5 bg-stone-200/70 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setDateFilter('today')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            dateFilter === 'today' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
          }`}
        >
          Hari Ini
        </button>
        <button
          type="button"
          onClick={() => setDateFilter('week')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            dateFilter === 'week' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
          }`}
        >
          7 Hari Terakhir
        </button>
        <button
          type="button"
          onClick={() => setDateFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            dateFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
          }`}
        >
          Semua Periode
        </button>
      </div>

      {/* KPI Cards: Total Omset, Tunai di Laci, QRIS, Transfer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Total Omset</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-stone-900">
            {formatRupiah(totalRevenue)}
          </div>
          <div className="text-[10px] text-stone-400">
            {filteredTransactions.length} transaksi ({totalPortionsSold} porsi terjual)
          </div>
        </div>

        {/* Tunai (Cash di Laci) */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-800 font-medium">
            <span>Tunai (Cash di Laci)</span>
            <Banknote className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-950">
            {formatRupiah(cashRevenue)}
          </div>
          <div className="text-[10px] text-stone-400">
            Wajib dicocokkan dengan fisik laci kasir
          </div>
        </div>

        {/* QRIS */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-indigo-800 font-medium">
            <span>QRIS Digital</span>
            <QrCode className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-950">
            {formatRupiah(qrisRevenue)}
          </div>
          <div className="text-[10px] text-stone-400">Langsung masuk e-wallet / settlement</div>
        </div>

        {/* Transfer Bank */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-blue-800 font-medium">
            <span>Transfer Bank</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-950">
            {formatRupiah(transferRevenue)}
          </div>
          <div className="text-[10px] text-stone-400">Rekening BCA Warung Makan</div>
        </div>
      </div>

      {/* Middle Section: Top Dishes & Order Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top 5 Dishes */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-stone-900">
              Lauk &amp; Menu Terlaris (Ranking Penjualan)
            </h2>
            <span className="text-[11px] text-stone-400">Berdasarkan porsi terjual</span>
          </div>

          <div className="space-y-3">
            {topDishes.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">
                Belum ada transaksi di periode ini.
              </p>
            ) : (
              topDishes.map((dish, idx) => {
                const maxQty = topDishes[0]?.qty || 1;
                const percent = Math.round((dish.qty / maxQty) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-stone-800">{dish.name}</span>
                      </div>
                      <div className="font-mono text-stone-600 font-semibold">
                        {dish.qty} porsi ({formatRupiah(dish.revenue)})
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Order Type Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-sm text-stone-900 mb-1">Tipe Pesanan</h2>
            <p className="text-xs text-stone-500">
              Perbandingan makan di tempat vs dibungkus
            </p>
          </div>

          <div className="space-y-3 my-auto">
            {/* Dine-in */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-700" />
                <div>
                  <div className="text-xs font-bold text-stone-900">Makan di Tempat</div>
                  <div className="text-[10px] text-stone-500">Dine-in</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-base font-bold text-amber-900">{dineInCount} pesanan</div>
                <div className="text-[10px] text-stone-500">
                  {filteredTransactions.length > 0
                    ? Math.round((dineInCount / filteredTransactions.length) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>

            {/* Takeaway */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-700" />
                <div>
                  <div className="text-xs font-bold text-stone-900">Bungkus (Takeaway)</div>
                  <div className="text-[10px] text-stone-500">Pesanan Dibungkus</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-base font-bold text-indigo-900">{takeawayCount} pesanan</div>
                <div className="text-[10px] text-stone-500">
                  {filteredTransactions.length > 0
                    ? Math.round((takeawayCount / filteredTransactions.length) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-stone-400 text-center pt-2 border-t border-stone-100">
            Total {filteredTransactions.length} pesanan diselesaikan
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden space-y-3 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="font-bold text-sm text-stone-900">
            Daftar Transaksi Terakhir ({filteredTransactions.length})
          </h2>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchInvoice}
                onChange={(e) => setSearchInvoice(e.target.value)}
                placeholder="Cari no. invoice..."
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs border border-stone-300 rounded-lg px-2 py-1.5 bg-white text-stone-700"
            >
              <option value="all">Semua Metode</option>
              <option value="cash">Tunai (Cash)</option>
              <option value="qris">QRIS</option>
              <option value="transfer">Transfer Bank</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-2.5 px-3">No. Invoice</th>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Tipe</th>
                <th className="py-2.5 px-3">Metode</th>
                <th className="py-2.5 px-3">Items Lauk</th>
                <th className="py-2.5 px-3 text-right">Total Bayar</th>
                <th className="py-2.5 px-3 text-center">Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTransactions.map((tx) => {
                const formattedTime = new Date(tx.created_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={tx.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                      {tx.invoice_number}
                    </td>
                    <td className="py-2.5 px-3 text-stone-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{formattedTime}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.order_type === 'dine_in'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-indigo-100 text-indigo-900'
                        }`}
                      >
                        {tx.order_type === 'dine_in' ? 'Makan di Tempat' : 'Bungkus'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold uppercase text-stone-700">
                      {tx.payment_method}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 max-w-[220px] truncate">
                      {(tx.items || []).map((it) => `${it.quantity}x ${it.menu_name}`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900">
                      {formatRupiah(tx.total_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedTxForReceipt(tx)}
                        className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Lihat</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Struk Kasir Modal */}
      <ReceiptModal
        transaction={selectedTxForReceipt}
        isOpen={Boolean(selectedTxForReceipt)}
        onClose={() => setSelectedTxForReceipt(null)}
      />
    </div>
  );
};
