import React, { useState } from 'react';
import {
  Database,
  Users,
  ClipboardList,
  Wrench,
  BarChart3,
  Cloud,
  HardDrive,
  Download,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Calendar,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Eye,
  Trash2,
  Flame,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DatabaseManager: React.FC = () => {
  const {
    clients,
    orders,
    servicesCatalog,
    companySettings,
    dbStats,
    formatMoney,
    setIsGoogleDriveOpen,
    setIsBackupModalOpen,
    setSelectedOrderForModal,
    exportBackupData,
    forceSaveLocalDatabase,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'clientes' | 'ordenes' | 'servicios' | 'estadisticas'>('ordenes');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('todos');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Financial statistics
  const totalInvoiced = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalDeposits = orders.reduce((sum, o) => sum + (o.depositPaid || 0), 0);
  const totalBalanceDue = orders.reduce((sum, o) => sum + (o.balanceDue || 0), 0);
  const totalPhotos = orders.reduce((sum, o) => sum + (o.photos?.length || 0), 0);

  // Force local database flush
  const handleForceSave = async () => {
    setIsSaving(true);
    const success = await forceSaveLocalDatabase();
    setIsSaving(false);
    if (success) {
      setSaveMessage('Base de datos guardada e indexada correctamente');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Export to CSV
  const handleExportClientsCsv = () => {
    const headers = ['ID', 'Nombre', 'Teléfono', 'Email', 'DNI/CUIT', 'Dirección', 'Ciudad', 'Notas', 'Fecha_Registro'];
    const rows = clients.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email || ''}"`,
      `"${c.documentId || ''}"`,
      `"${c.address || ''}"`,
      `"${c.city || ''}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
      c.createdAt || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clientes_${companySettings.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportOrdersCsv = () => {
    const headers = ['N° Orden', 'Fecha', 'Cliente', 'Teléfono', 'Tipo Equipo', 'Marca', 'Modelo', 'Serial/IMEI', 'Estado', 'Total', 'Seña', 'Saldo', 'Técnico'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.createdAt?.split('T')[0] || '',
      `"${o.client?.name || ''}"`,
      `"${o.client?.phone || ''}"`,
      o.device?.type || '',
      `"${o.device?.brand || ''}"`,
      `"${o.device?.model || ''}"`,
      `"${o.device?.serialOrImei || ''}"`,
      o.status,
      o.totalAmount || 0,
      o.depositPaid || 0,
      o.balanceDue || 0,
      `"${o.technician || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ordenes_taller_${companySettings.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered lists
  const filteredClients = clients.filter((c) => {
    const q = (searchTerm || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.documentId && (c.documentId || '').toLowerCase().includes(q)) ||
      (c.email && (c.email || '').toLowerCase().includes(q))
    );
  });

  const filteredOrders = orders.filter((o) => {
    const q = (searchTerm || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (o.orderNumber || '').toLowerCase().includes(q) ||
      (o.client?.name || '').toLowerCase().includes(q) ||
      (o.client?.phone || '').includes(q) ||
      (o.device?.brand || '').toLowerCase().includes(q) ||
      (o.device?.model || '').toLowerCase().includes(q) ||
      (o.device?.serialOrImei || '').toLowerCase().includes(q);

    const matchesStatus = orderStatusFilter === 'todos' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-300">
              <Database className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Explorador de Base de Datos de la Empresa
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Visualiza y administra todos los registros consolidados de tu taller: clientes, órdenes de servicio técnico, servicios y copias de seguridad en Google Drive y almacenamiento local.
          </p>
        </div>

        {/* Action Buttons for Backup & Google Drive */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Flame className="w-4 h-4 text-amber-200" />
            <span>Firebase Firestore</span>
          </button>

          <button
            onClick={() => setIsGoogleDriveOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Cloud className="w-4 h-4" />
            <span>Google Drive</span>
          </button>

          <button
            onClick={exportBackupData}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Descargar .JSON</span>
          </button>

          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
          >
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>Restaurar BD</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Clientes</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{clients.length}</p>
          <span className="text-[10px] text-slate-400">Registrados</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Órdenes</span>
            <ClipboardList className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{orders.length}</p>
          <span className="text-[10px] text-slate-400">Históricas</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Servicios</span>
            <Wrench className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{servicesCatalog.length}</p>
          <span className="text-[10px] text-slate-400">En catálogo</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Total Facturado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-sm sm:text-base font-extrabold text-emerald-700 truncate">{formatMoney(totalInvoiced)}</p>
          <span className="text-[10px] text-slate-400">Acumulado</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Saldo por Cobrar</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm sm:text-base font-extrabold text-amber-700 truncate">{formatMoney(totalBalanceDue)}</p>
          <span className="text-[10px] text-slate-400">Pendiente</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Espacio BD</span>
            <HardDrive className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900">
            {(dbStats.estimatedBytes / 1024).toFixed(1)} KB
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">IndexedDB Activo</span>
        </div>
      </div>

      {/* Cloud & Drive Sync Status Card */}
      <div className="bg-gradient-to-r from-emerald-950/20 via-slate-900 to-indigo-950/30 text-white p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${companySettings.googleDrive.connected ? 'bg-emerald-600/30 border border-emerald-500/30 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-100">Estado de Respaldo en la Nube (Google Drive):</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${companySettings.googleDrive.connected ? 'bg-emerald-900 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-400'}`}>
                {companySettings.googleDrive.connected ? 'Conectado y Activo' : 'Offline / No Conectado'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {companySettings.googleDrive.connected
                ? `Cuenta vinculada: ${companySettings.googleDrive.accountEmail || 'informaticasurr@gmail.com'} • Carpeta: ${companySettings.googleDrive.folderName}`
                : 'Conecta tu cuenta de Google Drive para sincronizar automáticamente tus órdenes de trabajo.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsGoogleDriveOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shrink-0"
        >
          {companySettings.googleDrive.connected ? 'Administrar Copias en Drive' : 'Vincular Google Drive'}
        </button>
      </div>

      {/* Main Table Explorer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 pt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'ordenes', label: `Órdenes de Trabajo (${orders.length})`, icon: ClipboardList },
              { id: 'clientes', label: `Directorio de Clientes (${clients.length})`, icon: Users },
              { id: 'servicios', label: `Catálogo de Servicios (${servicesCatalog.length})`, icon: Wrench },
              { id: 'estadisticas', label: 'Estadísticas Consolidadas', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                    isSelected
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick CSV Export per table */}
          <div className="pb-3 flex items-center gap-2">
            {activeSubTab === 'clientes' && (
              <button
                onClick={handleExportClientsCsv}
                className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1.5 rounded-lg transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exportar Clientes CSV</span>
              </button>
            )}

            {activeSubTab === 'ordenes' && (
              <button
                onClick={handleExportOrdersCsv}
                className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1.5 rounded-lg transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exportar Órdenes CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls (for orders and clients) */}
        {(activeSubTab === 'ordenes' || activeSubTab === 'clientes') && (
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-amber-400 absolute left-3 top-2.5 z-10 pointer-events-none" />
              <input
                type="text"
                data-search-input="true"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  activeSubTab === 'ordenes'
                    ? 'Buscar en BD por N° de orden, cliente, serial, marca, modelo...'
                    : 'Buscar en BD por nombre, teléfono, DNI, email...'
                }
                className="search-input-fluor w-full text-xs pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>

            {activeSubTab === 'ordenes' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Estado:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium text-slate-700"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="recibido">Recibido</option>
                  <option value="presupuesto_pendiente">Presupuesto Pendiente</option>
                  <option value="en_reparacion">En Reparación</option>
                  <option value="esperando_repuesto">Esperando Repuesto</option>
                  <option value="listo_entrega">Listo para Entrega</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: ÓRDENES */}
        {activeSubTab === 'ordenes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">N° Orden</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Dispositivo</th>
                  <th className="py-3 px-4">Serial / IMEI</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Saldo</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No se encontraron órdenes registradas con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{order.orderNumber}</td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{order.createdAt?.split('T')[0]}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div>{order.client?.name}</div>
                        <div className="text-[10px] text-slate-400">{order.client?.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{order.device?.brand} {order.device?.model}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{order.device?.type}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {order.device?.serialOrImei || 'Sin S/N'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatMoney(order.totalAmount || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700">
                        {formatMoney(order.balanceDue || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedOrderForModal(order)}
                          className="p-1 text-indigo-600 hover:text-indigo-800 rounded hover:bg-indigo-50 transition"
                          title="Ver detalle completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: CLIENTES */}
        {activeSubTab === 'clientes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Nombre Completo</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">DNI / CUIT</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Dirección / Ciudad</th>
                  <th className="py-3 px-4">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No se encontraron clientes registrados con ese criterio.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{client.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{client.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{client.phone}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{client.documentId || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{client.email || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {client.address ? `${client.address}, ${client.city || ''}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                        {client.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: SERVICIOS */}
        {activeSubTab === 'servicios' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nombre del Servicio</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4 text-right">Precio Sugerido</th>
                  <th className="py-3 px-4 text-center">Tiempo Estimado</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {servicesCatalog.map((srv) => (
                  <tr key={srv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{srv.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                        {srv.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-md">{srv.description}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 font-mono">
                      {formatMoney(srv.defaultPrice)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {srv.estimatedMinutes ? `${srv.estimatedMinutes} min` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${srv.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {srv.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: ESTADÍSTICAS CONSOLIDADAS */}
        {activeSubTab === 'estadisticas' && (
          <div className="p-5 sm:p-7 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase">Total Facturado Acumulado</span>
                <p className="text-2xl font-black text-slate-900">{formatMoney(totalInvoiced)}</p>
                <p className="text-[11px] text-slate-400">Sobre un total de {orders.length} órdenes generadas</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase">Total Cobrado (Señas y Pagos)</span>
                <p className="text-2xl font-black text-emerald-600">{formatMoney(totalDeposits)}</p>
                <p className="text-[11px] text-slate-400">Dinero ya ingresado a caja / banco</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase">Saldos Pendientes de Cobro</span>
                <p className="text-2xl font-black text-amber-600">{formatMoney(totalBalanceDue)}</p>
                <p className="text-[11px] text-slate-400">A liquidar contra entrega de equipos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Distribución de Estados Técnicos
                </h4>
                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Recibido / En Revisión', count: orders.filter((o) => o.status === 'recibido' || o.status === 'en_revision').length, color: 'bg-slate-500' },
                    { label: 'Presupuesto Pendiente', count: orders.filter((o) => o.status === 'presupuesto_pendiente').length, color: 'bg-amber-500' },
                    { label: 'En Reparación / Esperando Repuesto', count: orders.filter((o) => o.status === 'en_reparacion' || o.status === 'esperando_repuesto').length, color: 'bg-indigo-500' },
                    { label: 'Listo para Entrega', count: orders.filter((o) => o.status === 'listo_entrega').length, color: 'bg-emerald-500' },
                    { label: 'Entregados y Finalizados', count: orders.filter((o) => o.status === 'entregado').length, color: 'bg-blue-600' },
                  ].map((st) => (
                    <div key={st.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                        <span className="text-slate-700">{st.label}</span>
                      </div>
                      <span className="font-bold text-slate-900 font-mono">{st.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Trazabilidad e Integridad de Datos
                </h4>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Fotos de recepción almacenadas:</span>
                    <strong className="text-slate-900 font-mono">{totalPhotos} fotos</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Clientes con número telefónico:</span>
                    <strong className="text-slate-900 font-mono">{clients.filter((c) => c.phone).length}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Garantía estándar configurada:</span>
                    <strong className="text-slate-900 font-mono">{companySettings.orderConfig.defaultWarrantyDays} días</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Google Drive Folder:</span>
                    <strong className="text-emerald-700 font-mono">{companySettings.googleDrive.folderName}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
