import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { OrdersList } from './components/OrdersList';
import { NewOrderForm } from './components/NewOrderForm';
import { ClientsManager } from './components/ClientsManager';
import { ServicesCatalogManager } from './components/ServicesCatalogManager';
import { BillingManager } from './components/BillingManager';
import { InventoryManager } from './components/InventoryManager';
import { CashRegisterManager } from './components/CashRegisterManager';
import { MonthlyReports } from './components/MonthlyReports';
import { DatabaseManager } from './components/DatabaseManager';
import { SettingsManager } from './components/SettingsManager';
import { UserManual } from './components/UserManual';
import { AboutSection } from './components/AboutSection';
import { OrderDetailModal } from './components/OrderDetailModal';
import { DeviceHistoryModal } from './components/DeviceHistoryModal';
import { PrintableOrderVoucher } from './components/PrintableOrderVoucher';
import { DonateModal } from './components/DonateModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { BackupModal } from './components/BackupModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { useMobileBackHandler } from './hooks/useMobileBackHandler';
import { ChevronLeft } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, selectedOrderForPrint, setSelectedOrderForPrint } = useApp();
  const { exitToastVisible } = useMobileBackHandler();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Top Application Header */}
      <Header />

      {/* Main App Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 lg:p-6 flex flex-col lg:flex-row gap-3 sm:gap-5 lg:gap-6">
        {/* Left Navigation Sidebar */}
        <SidebarNav />

        {/* Dynamic Center Viewport */}
        <main className="flex-1 min-w-0">
          {activeTab === 'ordenes' && <OrdersList />}
          {activeTab === 'nueva_orden' && <NewOrderForm />}
          {activeTab === 'inventario' && <InventoryManager />}
          {activeTab === 'caja' && <CashRegisterManager />}
          {activeTab === 'clientes' && <ClientsManager />}
          {activeTab === 'servicios' && <ServicesCatalogManager />}
          {activeTab === 'facturacion' && <BillingManager />}
          {activeTab === 'reportes' && <MonthlyReports />}
          {activeTab === 'basedatos' && <DatabaseManager />}
          {activeTab === 'ajustes' && <SettingsManager />}
          {activeTab === 'manual' && <UserManual />}
          {activeTab === 'acerca_de' && <AboutSection />}
        </main>
      </div>

      {/* Global Modals */}
      <AuthModal />
      <OrderDetailModal />
      <DeviceHistoryModal />
      <DonateModal />
      <GoogleDriveModal />
      <BackupModal />

      {/* Mobile Android Double-Back Exit Toast */}
      {exitToastVisible && (
        <div
          id="mobile-back-exit-toast"
          className="fixed bottom-16 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-slate-100 border border-slate-700/80 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-medium backdrop-blur-md animate-fade-in pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4 text-blue-400" />
          <span>Presiona Atrás otra vez para salir</span>
        </div>
      )}

      {/* Printable Document (hidden on screen, visible during window.print()) */}
      {selectedOrderForPrint && (
        <PrintableOrderVoucher
          order={selectedOrderForPrint}
          onClose={() => setSelectedOrderForPrint(null)}
        />
      )}

      {/* Footer with codeghos watermark and shortcuts */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
