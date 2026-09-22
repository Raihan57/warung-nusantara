import React, { useState } from 'react';
import { SUPABASE_SQL_SCHEMA } from '../../lib/sqlScripts';
import {
  getSavedSupabaseCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  testSupabaseConnection,
} from '../../lib/supabase';
import { useWarung } from '../../lib/store';
import {
  Database,
  Copy,
  Check,
  Download,
  X,
  ShieldCheck,
  Zap,
  Server,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const { refreshData, isLiveSupabase } = useWarung();

  const [activeSubTab, setActiveSubTab] = useState<'sql' | 'config' | 'architecture'>('sql');
  const [copied, setCopied] = useState(false);

  // Credentials
  const initialCreds = getSavedSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(initialCreds.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialCreds.anonKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'warung_makan_supabase_setup.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTestAndSave = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setTestResult({
        success: false,
        message: 'Harap isi URL Project Supabase dan Anon Key.',
      });
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      const res = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
      setTestResult(res);

      if (res.success) {
        saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
        await refreshData();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Gagal menguji koneksi.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = () => {
    clearSupabaseCredentials();
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setTestResult({
      success: true,
      message: 'Koneksi Supabase dinonaktifkan. Sistem kembali ke mode lokal.',
    });
    refreshData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-stone-950 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Supabase PostgreSQL Setup &amp; Skrip SQL
              </h2>
              <p className="text-[11px] text-stone-400">
                DDL Tabel, Kebijakan Keamanan RLS, dan Stored Procedure Atomic
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-stone-200 bg-stone-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('sql')}
            className={`pb-2.5 border-b-2 px-2 transition-all ${
              activeSubTab === 'sql'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Skrip SQL (DDL + RLS + RPC)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('config')}
            className={`pb-2.5 border-b-2 px-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === 'config'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>Koneksi Supabase Live</span>
            {isLiveSupabase && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('architecture')}
            className={`pb-2.5 border-b-2 px-2 transition-all ${
              activeSubTab === 'architecture'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Arsitektur &amp; Keamanan
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-100/60">
          {/* TAB 1: SQL Script Viewer */}
          {activeSubTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-stone-600">
                  Salin dan jalankan skrip ini langsung di menu <strong>SQL Editor</strong> di dashboard Supabase Anda.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSql}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 text-xs font-semibold shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .sql</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Semua SQL'}</span>
                  </button>
                </div>
              </div>

              {/* Code Display */}
              <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-950 font-mono text-[11px] text-emerald-400 p-4 max-h-[440px] overflow-y-auto leading-relaxed shadow-inner">
                <pre>{SUPABASE_SQL_SCHEMA}</pre>
              </div>
            </div>
          )}

          {/* TAB 2: Supabase Credentials Config */}
          {activeSubTab === 'config' && (
            <div className="max-w-xl mx-auto space-y-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Hubungkan ke Database Supabase Anda
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Masukkan Project URL dan API Anon/Public Key dari dashboard Supabase Anda.
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full p-2.5 border border-stone-300 rounded-xl font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Supabase Anon / Public API Key
                  </label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full p-2.5 border border-stone-300 rounded-xl font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-100">
                {isLiveSupabase ? (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Putus Koneksi
                  </button>
                ) : (
                  <span className="text-[11px] text-stone-400">
                    Mode Lokal (Simulasi Storage) aktif
                  </span>
                )}

                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTestAndSave}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-300 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  {testing ? (
                    <span>Menguji Koneksi...</span>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Uji &amp; Simpan Koneksi</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Architecture & Security */}
          {activeSubTab === 'architecture' && (
            <div className="space-y-4 text-xs text-stone-700">
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>1. Role-Based Access Control (RBAC) &amp; RLS Policies</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Row Level Security (RLS) diaktifkan pada tabel <code>profiles</code>,{' '}
                  <code>categories</code>, <code>menus</code>, <code>transactions</code>, dan{' '}
                  <code>transaction_items</code>.
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-stone-600">
                  <li>
                    <strong>Admin/Pemilik Warung:</strong> Memiliki kebijakan <code>ALL</code>{' '}
                    (SELECT, INSERT, UPDATE, DELETE) di seluruh tabel melalui fungsi{' '}
                    <code>is_admin()</code>.
                  </li>
                  <li>
                    <strong>Kasir/Petugas:</strong> Hanya bisa melakukan <code>SELECT</code> pada menu &amp; kategori, serta <code>INSERT</code> dan <code>SELECT</code> pada transaksi penjualan.
                  </li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>2. Transaksi Atomik (RPC create_transaction_atomic)</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Untuk warung makan dengan volume transaksi tinggi di jam makan siang, checkout tidak boleh dilakukan secara terpisah-pisah antar query. Fungsi PostgreSQL RPC:{' '}
                  <code>create_transaction_atomic</code> melakukan:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-stone-600">
                  <li>
                    Row Locking (<code>FOR UPDATE</code>) pada baris stok lauk yang dipesan.
                  </li>
                  <li>
                    Verifikasi stok otomatis — jika ada lauk yang porsinya kurang, seluruh transaksi otomatis dibatalkan (Rollback aman tanpa over-selling).
                  </li>
                  <li>
                    Pengurangan <code>daily_stock</code> seketika dan auto-toggle <code>is_available = false</code> jika porsi mencapai 0.
                  </li>
                  <li>
                    Auto-generate nomor invoice unik berurutan <code>INV-YYYYMMDD-XXXX</code>.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
