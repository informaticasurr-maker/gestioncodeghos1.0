import React from 'react';
import {
  ClipboardList,
  PlusCircle,
  Users,
  Wrench,
  ReceiptText,
  BarChart3,
  Settings,
  Cloud,
  Heart,
  HardDrive,
  Database,
  BookOpen,
  Info,
  Boxes,
  Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';

export const SidebarNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    orders,
    inventory,
    setIsDonateOpen,
    setIsGoogleDriveOpen,
    setIsBackupModalOpen,
    companySettings,
  } = useApp();

  const pendingBudgetCount = orders.filter((o) => o.status === 'presupuesto_pendiente').length;
  const activeRepairsCount = orders.filter(
    (o) => o.status === 'en_reparacion' || o.status === 'esperando_repuesto'
  ).length;
  const lowStockCount = inventory.filter((i) => i.stock <= i.minStock).length;

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'ordenes',
      label: 'Órdenes de Trabajo',
      icon: ClipboardList,
      badge: activeRepairsCount + pendingBudgetCount,
      badgeColor: 'bg-slate-800 text-slate-100 border border-slate-700',
    },
    {
      id: 'nueva_orden',
      label: 'Nueva Orden',
      icon: PlusCircle,
    },
    {
      id: 'inventario',
      label: 'Inventario & Repuestos',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'caja',
      label: 'Caja & Movimientos',
      icon: Wallet,
    },
    {
      id: 'clientes',
      label: 'Clientes / Contactos',
      icon: Users,
    },
    {
      id: 'servicios',
      label: 'Catálogo de Servicios',
      icon: Wrench,
    },
    {
      id: 'facturacion',
      label: 'Facturación & Pagos',
      icon: ReceiptText,
    },
    {
      id: 'reportes',
      label: 'Reportes Estadísticos',
      icon: BarChart3,
    },
    {
      id: 'basedatos',
      label: 'Base de Datos',
      icon: Database,
    },
    {
      id: 'ajustes',
      label: 'Ajustes & Empresa',
      icon: Settings,
    },
    {
      id: 'manual',
      label: 'Manual de Uso',
      icon: BookOpen,
    },
    {
      id: 'acerca_de',
      label: 'Acerca de',
      icon: Info,
    },
  ];

  return (
    <aside id="sidebar-navigation" className="w-full lg:w-64 bg-slate-900 text-slate-300 rounded-xl lg:rounded-2xl border border-slate-800 flex flex-col shrink-0 shadow-md overflow-hidden sticky top-[108px] md:top-[68px] lg:top-20 z-30 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      
      {/* Navigation Links (Horizontal scroll on mobile, vertical stack on desktop) */}
      <div className="p-2 sm:p-3 flex lg:flex-col flex-row gap-1.5 overflow-x-auto no-scrollbar lg:overflow-x-visible">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink w-auto lg:w-full ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isActive ? 'bg-blue-800 text-blue-100' : item.badgeColor || 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Auxiliary Actions (Desktop) */}
      <div className="mt-auto hidden lg:block p-3 border-t border-slate-800/80 space-y-2">
        
        {/* Local PC/Phone Backup Box */}
        <div
          onClick={() => setIsBackupModalOpen(true)}
          className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/70 hover:bg-slate-800 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-200">Respaldo Local</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
              Activo
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            Copias .JSON y Memoria del Dispositivo
          </p>
        </div>

        {/* Google Drive Status Box */}
        <div
          onClick={() => setIsGoogleDriveOpen(true)}
          className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className={`w-4 h-4 ${companySettings.googleDrive.connected ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-xs font-semibold text-slate-200">Google Drive</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                companySettings.googleDrive.connected
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {companySettings.googleDrive.connected ? 'Sincronizado' : 'Offline'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {companySettings.googleDrive.connected
              ? companySettings.googleDrive.accountEmail || 'Copia de seguridad activa'
              : 'Conectar para respaldo en la nube'}
          </p>
        </div>

        {/* Support / Donate Banner */}
        <button
          onClick={() => setIsDonateOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-amber-500/20 bg-gradient-to-r from-amber-950/40 to-slate-800 hover:from-amber-900/40 text-amber-300 text-xs font-medium transition"
        >
          <Heart className="w-3.5 h-3.5 fill-amber-400/30 text-amber-400" />
          <span>Apoyar el Sistema</span>
        </button>

      </div>
    </aside>
  );
};
