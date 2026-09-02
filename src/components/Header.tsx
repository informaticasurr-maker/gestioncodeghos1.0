import React from 'react';
import {
  Wrench,
  UserPlus,
  Search,
  Cloud,
  Smartphone,
  Laptop,
  CheckCircle2,
  HardDrive,
  Settings,
  User,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemeToggle } from './ThemeToggle';

export const Header: React.FC = () => {
  const {
    companySettings,
    searchQuery,
    setSearchQuery,
    setActiveTab,
    setIsGoogleDriveOpen,
    setIsBackupModalOpen,
    orders,
    currentUser,
    cloudSyncState,
    setIsAuthModalOpen,
    syncWithCloud,
  } = useApp();

  const inProgressCount = orders.filter(
    (o) => o.status === 'en_reparacion' || o.status === 'presupuesto_pendiente'
  ).length;
  const readyCount = orders.filter((o) => o.status === 'listo_entrega').length;

  const formatCountdown = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return '15m';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <header id="main-header" className="bg-white dark:bg-[#090f1d] text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-[#1a2640] sticky top-0 z-40 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Company Name */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('ordenes')}>
            <img
              src={companySettings.logoUrl || '/app-icon.jpg'}
              alt="Logo Empresa"
              className="w-10 h-10 rounded-lg object-contain border border-slate-200 dark:border-[#1e2947] bg-slate-50 dark:bg-[#0c1322] p-0.5 shadow-xs transition group-hover:border-[#00f2fe]/50"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/app-icon.jpg';
              }}
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight leading-none text-slate-900 dark:text-white line-clamp-1">
                  {companySettings.name}
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-[#111b30] text-slate-700 dark:text-[#38bdf8] border border-slate-200 dark:border-[#1e2947]">
                  Taller Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5">
                {companySettings.city || 'Laboratorio Técnico'} • {companySettings.phone || ''}
              </p>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                id="global-search-input"
                type="text"
                data-search-input="true"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por N° de Orden, Cliente, IMEI, Serial, Modelo..."
                className="search-input-fluor block w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-[#1a2640] rounded-lg leading-5 bg-slate-50 dark:bg-[#080e1a] focus:outline-none focus:bg-white dark:focus:bg-[#0c1527] text-xs transition duration-150 ease-in-out"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Quick Status Indicators */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              {readyCount > 0 && (
                <button
                  onClick={() => setActiveTab('ordenes')}
                  className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#05d59e] border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-1 rounded-full font-medium transition hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                  title="Equipos listos para retirar"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#05d59e]" />
                  <span>{readyCount} para retiro</span>
                </button>
              )}
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0c1322] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1a2640] px-2.5 py-1 rounded-full">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                <span>{inProgressCount} en taller</span>
              </span>
            </div>

            {/* Local Backup / Copia de Seguridad */}
            <button
              id="header-backup-btn"
              onClick={() => setIsBackupModalOpen(true)}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#1a2640] bg-slate-50 dark:bg-[#0c1322] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#111b30] hover:text-slate-900 dark:hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
              title="Copias de Seguridad (PC / Celular y Nube)"
            >
              <HardDrive className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="hidden xl:inline">Respaldo</span>
            </button>

            {/* User Profile & Multi-Device Cloud Sync Button */}
            <button
              id="header-user-btn"
              onClick={() => setIsAuthModalOpen(true)}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition ${
                currentUser
                  ? 'bg-indigo-50 dark:bg-[#131c38] border-indigo-200 dark:border-[#2b3c66] text-indigo-800 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-[#172344]'
                  : 'bg-slate-50 dark:bg-[#0c1322] border-slate-200 dark:border-[#1a2640] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#111b30]'
              }`}
              title={
                currentUser
                  ? `Técnico: ${currentUser.name} (${currentUser.email}) - Sincronización cada 15 min (Próxima en ${formatCountdown(cloudSyncState.nextAutoSyncInSeconds)})`
                  : 'Identificarse / Crear Cuenta de Técnico para Sincronizar Dispositivos'
              }
            >
              <div className="relative">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-5 h-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-600/40 border border-indigo-300 dark:border-indigo-400/40 flex items-center justify-center text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                    {currentUser ? currentUser.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                  </div>
                )}

                {/* Cloud status dot indicator */}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#090f1d] ${
                    cloudSyncState.isSyncing
                      ? 'bg-amber-400 animate-pulse'
                      : !cloudSyncState.isOnline
                      ? 'bg-amber-500'
                      : currentUser?.googleDriveConnected || companySettings.googleDrive.connected
                      ? 'bg-emerald-400'
                      : currentUser
                      ? 'bg-blue-400'
                      : 'bg-slate-400'
                  }`}
                />
              </div>

              <div className="hidden md:flex flex-col text-left leading-none">
                <span className="font-semibold text-slate-800 dark:text-white text-[11px] truncate max-w-[90px]">
                  {currentUser ? currentUser.name.split(' ')[0] : 'Identificarse'}
                </span>
                <span className="text-[9px] text-indigo-600 dark:text-indigo-300/80 truncate max-w-[90px] mt-0.5 flex items-center gap-1">
                  {cloudSyncState.isSyncing ? (
                    'Sincronizando...'
                  ) : !cloudSyncState.isOnline ? (
                    <>
                      <WifiOff className="w-2.5 h-2.5 text-amber-500" />
                      <span>Offline</span>
                    </>
                  ) : currentUser ? (
                    <>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{formatCountdown(cloudSyncState.nextAutoSyncInSeconds)}</span>
                    </>
                  ) : (
                    'Sin Sesión'
                  )}
                </span>
              </div>
            </button>

            {/* Quick Differential Cloud Sync Button */}
            {currentUser && (
              <button
                id="header-quick-sync-btn"
                onClick={() => syncWithCloud('auto')}
                disabled={cloudSyncState.isSyncing || !cloudSyncState.isOnline}
                className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                  cloudSyncState.isSyncing
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-600/40 text-amber-700 dark:text-amber-300 cursor-wait'
                    : !cloudSyncState.isOnline
                    ? 'bg-slate-100 dark:bg-[#0c1322]/40 border-slate-200 dark:border-[#1a2640] text-slate-400 cursor-not-allowed'
                    : 'bg-slate-50 dark:bg-[#0c1322] border-indigo-200 dark:border-[#2b3c66] text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-[#172344]'
                }`}
                title={
                  !cloudSyncState.isOnline
                    ? 'Modo sin conexión (datos guardados localmente)'
                    : `Sincronización diferencial activa (cada 15 min). Próxima en: ${formatCountdown(cloudSyncState.nextAutoSyncInSeconds)}`
                }
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncState.isSyncing ? 'animate-spin text-amber-500' : ''}`} />
                <span className="hidden xl:inline text-[11px]">
                  {cloudSyncState.isSyncing ? 'Sincronizando' : 'Sincronizar'}
                </span>
              </button>
            )}

            {/* Google Drive Status */}
            <button
              id="header-drive-btn"
              onClick={() => setIsGoogleDriveOpen(true)}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                companySettings.googleDrive.connected
                  ? 'bg-emerald-50 dark:bg-[#0c1322] border-emerald-200 dark:border-emerald-700/60 text-emerald-700 dark:text-[#05d59e] hover:bg-emerald-100 dark:hover:bg-[#111b30]'
                  : 'bg-slate-50 dark:bg-[#0c1322] border-slate-200 dark:border-[#1a2640] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#111b30] hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={
                companySettings.googleDrive.connected
                  ? 'Google Drive conectado (Copia activa)'
                  : 'Conectar Google Drive'
              }
            >
              <Cloud className="w-4 h-4" />
              <span className="hidden xl:inline">Drive</span>
            </button>

            {/* Theme Toggle Button (Dark/Light Mode) */}
            <ThemeToggle showLabel={false} />

            {/* Settings Button */}
            <button
              id="header-settings-btn"
              onClick={() => setActiveTab('ajustes')}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#1a2640] bg-slate-50 dark:bg-[#0c1322] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#111b30] hover:text-slate-900 dark:hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
              title="Ajustes, Idioma, Modo Oscuro y Mi Cuenta"
            >
              <Settings className="w-4 h-4 text-blue-500 dark:text-[#00f2fe]" />
              <span className="hidden sm:inline">Ajustes</span>
            </button>

            {/* New Client Button */}
            <button
              id="header-new-client-btn"
              onClick={() => setActiveTab('clientes')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1a2640] bg-slate-50 dark:bg-[#0c1322] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#111b30] hover:text-slate-900 dark:hover:text-white text-xs font-medium transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Cliente</span>
            </button>

          </div>
        </div>

        {/* Mobile Search input */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              data-search-input="true"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar orden, cliente, IMEI, serial..."
              className="search-input-fluor block w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-slate-50 dark:bg-[#080e1a] focus:outline-none text-xs"
            />
          </div>
        </div>

      </div>
    </header>
  );
};

