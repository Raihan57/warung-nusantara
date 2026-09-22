import React, { useState } from 'react';
import { WarungProvider, useWarung } from './lib/store';
import { Header } from './components/Header';
import { PosView } from './components/POS/PosView';
import { MenuManagement } from './components/Admin/MenuManagement';
import { StockTracker } from './components/Admin/StockTracker';
import { SalesReport } from './components/Admin/SalesReport';
import { SupabaseModal } from './components/Database/SupabaseModal';
import { ShieldAlert, UserCheck } from 'lucide-react';

function WarungAppContent() {
  const { currentProfile, switchRole } = useWarung();
  const [activeTab, setActiveTab] = useState<'pos' | 'menu' | 'stock' | 'sales' | 'sql'>('pos');
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);

  const isAdmin = currentProfile.role === 'admin';

  const handleOpenSqlModal = () => {
    setIsSqlModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'sql') {
            setIsSqlModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenSqlModal={handleOpenSqlModal}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {/* Tab 1: POS Kasir */}
        {activeTab === 'pos' && <PosView />}

        {/* Tab 2: Master Menu (Admin only) */}
        {activeTab === 'menu' && (
          isAdmin ? (
            <MenuManagement />
          ) : (
            <UnauthorizedNotice onSwitchToAdmin={() => switchRole('admin')} />
          )
        )}

        {/* Tab 3: Stok Porsi Harian (Admin only) */}
        {activeTab === 'stock' && (
          isAdmin ? (
            <StockTracker />
          ) : (
            <UnauthorizedNotice onSwitchToAdmin={() => switchRole('admin')} />
          )
        )}

        {/* Tab 4: Rekap Penjualan & Shift (Admin only) */}
        {activeTab === 'sales' && (
          isAdmin ? (
            <SalesReport />
          ) : (
            <UnauthorizedNotice onSwitchToAdmin={() => switchRole('admin')} />
          )
        )}
      </main>

      {/* Supabase SQL & Config Modal */}
      <SupabaseModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </div>
  );
}

function UnauthorizedNotice({ onSwitchToAdmin }: { onSwitchToAdmin: () => void }) {
  return (
    <div className="max-w-md mx-auto my-16 p-6 bg-white rounded-2xl border border-stone-200 shadow-md text-center space-y-4">
      <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <div>
        <h2 className="text-base font-bold text-stone-900">Hak Akses Terbatas (Kasir)</h2>
        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
          Halaman ini hanya dapat diakses oleh <strong>Admin / Pemilik Warung</strong> sesuai kebijakan Row Level Security (RLS) Supabase.
        </p>
      </div>
      <button
        type="button"
        onClick={onSwitchToAdmin}
        className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
      >
        <UserCheck className="w-4 h-4" />
        <span>Beralih ke Peran Admin (Bu Ratna)</span>
      </button>
    </div>
  );
}

export default function App() {
  return (
    <WarungProvider>
      <WarungAppContent />
    </WarungProvider>
  );
}
