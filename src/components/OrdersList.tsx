import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Printer,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  History,
  Smartphone,
  Laptop,
  AlertCircle,
  Calendar,
  DollarSign,
  ChevronDown,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OrderStatus, DeviceType, Order } from '../types';
import { StatusBadge, PaymentBadge, DeviceIcon } from './StatusBadge';

export const OrdersList: React.FC = () => {
  const {
    orders,
    searchQuery,
    setSearchQuery,
    setSelectedOrderForModal,
    setSelectedOrderForPrint,
    setSelectedDeviceForHistory,
    updateOrderStatus,
    setActiveTab,
    getDeviceHistory,
    formatMoney,
    generateWhatsAppLink,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status Filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // Device Filter
      if (deviceFilter !== 'all' && order.device.type !== deviceFilter) {
        return false;
      }

      // Search Query
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchNumber = (order.orderNumber || '').toLowerCase().includes(query);
        const matchClient = (order.client?.name || '').toLowerCase().includes(query);
        const matchPhone = (order.client?.phone || '').toLowerCase().includes(query);
        const matchDevice = `${order.device?.brand || ''} ${order.device?.model || ''}`.toLowerCase().includes(query);
        const matchSerial = (order.device?.serialOrImei || '').toLowerCase().includes(query);
        const matchNotes = (order.conditionNotes || '').toLowerCase().includes(query) || (order.internalNotes || '').toLowerCase().includes(query);

        if (!matchNumber && !matchClient && !matchPhone && !matchDevice && !matchSerial && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, deviceFilter, searchQuery]);

  // Statistics counters
  const stats = useMemo(() => {
    return {
      total: orders.length,
      recibidos: orders.filter((o) => o.status === 'recibido' || o.status === 'en_revision').length,
      pendientes: orders.filter((o) => o.status === 'presupuesto_pendiente').length,
      enReparacion: orders.filter((o) => o.status === 'en_reparacion' || o.status === 'esperando_repuesto' || o.status === 'presupuesto_aprobado').length,
      listos: orders.filter((o) => o.status === 'listo_entrega').length,
      entregados: orders.filter((o) => o.status === 'entregado').length,
    };
  }, [orders]);

  return (
    <div className="space-y-4">
      
      {/* Top Banner / KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-xl border text-left transition ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-medium text-slate-500">Todas las Órdenes</span>
          <p className="text-xl font-bold font-mono mt-0.5 text-slate-900">{stats.total}</p>
        </button>

        <button
          onClick={() => setStatusFilter('presupuesto_pendiente')}
          className={`p-3 rounded-xl border text-left transition ${
            statusFilter === 'presupuesto_pendiente'
              ? 'bg-amber-900 text-white border-amber-900 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-amber-50/40'
          }`}
        >
          <span className="text-[11px] font-medium text-amber-700">Presup. Pendientes</span>
          <p className="text-xl font-bold font-mono mt-0.5 text-amber-700">{stats.pendientes}</p>
        </button>

        <button
          onClick={() => setStatusFilter('recibido')}
          className={`p-3 rounded-xl border text-left transition ${
            statusFilter === 'recibido'
              ? 'bg-sky-900 text-white border-sky-900 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-sky-50/40'
          }`}
        >
          <span className="text-[11px] font-medium text-sky-700">Ingresos / Revisión</span>
          <p className="text-xl font-bold font-mono mt-0.5 text-sky-700">{stats.recibidos}</p>
        </button>

        <button
          onClick={() => setStatusFilter('en_reparacion')}
          className={`p-3 rounded-xl border text-left transition ${
            statusFilter === 'en_reparacion'
              ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-blue-50/40'
          }`}
        >
          <span className="text-[11px] font-medium text-blue-700">En Reparación</span>
          <p className="text-xl font-bold font-mono mt-0.5 text-blue-700">{stats.enReparacion}</p>
        </button>

        <button
          onClick={() => setStatusFilter('listo_entrega')}
          className={`p-3 rounded-xl border text-left transition ${
            statusFilter === 'listo_entrega'
              ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-emerald-50/40'
          }`}
        >
          <span className="text-[11px] font-medium text-emerald-700">Listos p/ Retiro</span>
          <p className="text-xl font-bold font-mono mt-0.5 text-emerald-700">{stats.listos}</p>
        </button>

        <button
          onClick={() => setStatusFilter('entregado')}
          className={`p-3 rounded-xl border text-left transition ${
            statusFilter === 'entregado'
              ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-medium text-slate-500">Entregados</span>
          <p className="text-xl font-bold font-mono mt-0.5 text-slate-700">{stats.entregados}</p>
        </button>
      </div>

      {/* Control Bar: Filters & Quick Actions */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        
        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          
          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium pl-3 pr-8 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">🔍 Todos los estados</option>
              <option value="recibido">Recibido en Taller</option>
              <option value="en_revision">En Diagnóstico / Revisión</option>
              <option value="presupuesto_pendiente">Presupuesto Pendiente</option>
              <option value="presupuesto_aprobado">Presupuesto Aprobado</option>
              <option value="en_reparacion">En Reparación</option>
              <option value="esperando_repuesto">Esperando Repuesto</option>
              <option value="listo_entrega">Listo para Retiro</option>
              <option value="entregado">Entregado / Finalizado</option>
              <option value="presupuesto_rechazado">Presupuesto Rechazado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Device Type Dropdown */}
          <div className="relative">
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="text-xs font-medium pl-3 pr-8 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">📱 Todos los dispositivos</option>
              <option value="smartphone">Móviles / Smartphones</option>
              <option value="notebook">Notebooks / Laptops</option>
              <option value="tablet">Tablets / iPads</option>
              <option value="pc">PC / All-in-One</option>
              <option value="smartwatch">Smartwatches</option>
              <option value="console">Consolas de Videojuego</option>
              <option value="other">Otros Equipos</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Active Search indicator */}
          {searchQuery && (
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 font-medium">
              <span>Buscando: "{searchQuery}"</span>
              <button
                onClick={() => setSearchQuery('')}
                className="font-bold hover:text-slate-900"
              >
                ✕
              </button>
            </span>
          )}

        </div>

        {/* Create Order Button */}
        <button
          onClick={() => setActiveTab('nueva_orden')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition transform active:scale-95 ml-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Orden de Trabajo</span>
        </button>

      </div>

      {/* Orders Table (Desktop) / Cards List (Mobile) */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron órdenes de trabajo</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all' || deviceFilter !== 'all'
              ? 'Prueba modificando o limpiando los filtros de búsqueda actuales.'
              : 'Empieza registrando tu primer ingreso de equipo o presupuesto.'}
          </p>
          <button
            onClick={() => setActiveTab('nueva_orden')}
            className="mt-4 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primera Orden</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          
          {/* MOBILE CARDS VIEW (Clean, spacious, uncompressed) */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => {
              const historyCount = getDeviceHistory(order.device.serialOrImei, order.id).length;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm space-y-3 hover:border-indigo-300 transition"
                >
                  {/* Top Bar: Order Number, Date & Badges */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div
                        onClick={() => setSelectedOrderForModal(order)}
                        className="font-mono font-bold text-indigo-600 text-sm hover:underline cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{order.orderNumber}</span>
                        {order.photos && order.photos.length > 0 && (
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-normal">
                            📷 {order.photos.length}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(order.createdAt).toLocaleDateString('es-AR')}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={order.status} size="sm" />
                      <PaymentBadge status={order.paymentStatus} size="sm" />
                    </div>
                  </div>

                  {/* Client & Device Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium block">Cliente:</span>
                      <p className="font-semibold text-slate-900">{order.client.name}</p>
                      <p className="text-slate-500 font-mono text-[11px] mt-0.5">{order.client.phone}</p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium block">Dispositivo:</span>
                      <div className="flex items-center gap-1 font-semibold text-slate-900">
                        <DeviceIcon type={order.device.type} className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{order.device.brand} {order.device.model}</span>
                      </div>
                      {order.device.serialOrImei && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500 bg-white px-1 border border-slate-200 rounded truncate">
                            {order.device.serialOrImei}
                          </span>
                          {historyCount > 0 && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded shrink-0">
                              {historyCount + 1}° vez
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Service & Problem Description */}
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Trabajo: </span>
                    <span className="font-medium text-slate-800">
                      {order.services.map((s) => s.name).join(', ') || 'Diagnóstico'}
                    </span>
                    {order.conditionNotes && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-2">
                        "{order.conditionNotes}"
                      </p>
                    )}
                  </div>

                  {/* Financial Total & Balances */}
                  <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-2 rounded-lg font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total:</span>
                      <span className="font-bold text-sm text-white">{formatMoney(order.totalAmount)}</span>
                    </div>

                    {order.balanceDue > 0 ? (
                      <div className="text-right">
                        <span className="text-[10px] text-rose-300 block">Saldo a Cobrar:</span>
                        <span className="font-bold text-rose-400">{formatMoney(order.balanceDue)}</span>
                      </div>
                    ) : (
                      <div className="text-right text-emerald-400 text-[11px] font-bold">
                        ✓ Totalmente Abonado
                      </div>
                    )}
                  </div>

                  {/* Actions Bar on Mobile */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      onClick={() => setSelectedOrderForModal(order)}
                      className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver / Editar</span>
                    </button>

                    <button
                      onClick={() => setSelectedOrderForPrint(order)}
                      className="py-2 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF / Impr.</span>
                    </button>

                    <a
                      href={generateWhatsAppLink(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Orden / Fecha</th>
                    <th className="py-3 px-4">Cliente & Contacto</th>
                    <th className="py-3 px-4">Equipo & Serial/IMEI</th>
                    <th className="py-3 px-4">Servicio / Falla</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Presupuesto</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => {
                    const historyCount = getDeviceHistory(order.device.serialOrImei, order.id).length;

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50/80 transition group"
                      >
                        {/* Order Number & Date */}
                        <td className="py-3 px-4 align-top">
                          <div
                            onClick={() => setSelectedOrderForModal(order)}
                            className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-xs sm:text-sm"
                          >
                            {order.orderNumber}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(order.createdAt).toLocaleDateString('es-AR')}</span>
                          </p>
                          {order.photos && order.photos.length > 0 && (
                            <span className="inline-flex items-center text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium mt-1">
                              📷 {order.photos.length} foto(s)
                            </span>
                          )}
                        </td>

                        {/* Client */}
                        <td className="py-3 px-4 align-top">
                          <div className="font-semibold text-slate-900">{order.client.name}</div>
                          <p className="text-[11px] text-slate-500 font-mono">{order.client.phone}</p>
                          {order.client.documentId && (
                            <p className="text-[10px] text-slate-400">ID: {order.client.documentId}</p>
                          )}
                        </td>

                        {/* Device */}
                        <td className="py-3 px-4 align-top">
                          <div className="flex items-center gap-1.5">
                            <DeviceIcon type={order.device.type} className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <span className="font-medium text-slate-900">
                              {order.device.brand} {order.device.model}
                            </span>
                          </div>

                          {order.device.serialOrImei && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                                {order.device.serialOrImei}
                              </span>
                              
                              {/* Device History Trigger Button */}
                              {historyCount > 0 && (
                                <button
                                  onClick={() =>
                                    setSelectedDeviceForHistory({
                                      serialOrImei: order.device.serialOrImei,
                                      model: `${order.device.brand} ${order.device.model}`,
                                    })
                                  }
                                  className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded transition"
                                  title="Ver reparaciones previas de este equipo"
                                >
                                  {historyCount + 1}° vez en taller
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Service / Falla */}
                        <td className="py-3 px-4 align-top max-w-[220px]">
                          <div className="line-clamp-1 font-medium text-slate-800">
                            {order.services.map((s) => s.name).join(', ') || 'Diagnóstico'}
                          </div>
                          {order.conditionNotes && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5">
                              {order.conditionNotes}
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 align-top">
                          <div className="space-y-1">
                            <StatusBadge status={order.status} size="sm" />
                            <div>
                              <PaymentBadge status={order.paymentStatus} size="sm" />
                            </div>
                          </div>
                        </td>

                        {/* Budget / Total */}
                        <td className="py-3 px-4 align-top text-right font-mono">
                          <div className="font-bold text-slate-900 text-sm">
                            {formatMoney(order.totalAmount)}
                          </div>
                          {order.depositPaid > 0 && order.balanceDue > 0 ? (
                            <p className="text-[10px] text-slate-500">
                              Saldo: <span className="font-bold text-rose-600">{formatMoney(order.balanceDue)}</span>
                            </p>
                          ) : order.balanceDue === 0 && order.totalAmount > 0 ? (
                            <span className="text-[10px] text-emerald-600 font-semibold">100% Abonado</span>
                          ) : null}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 align-top text-center">
                          <div className="flex items-center justify-center gap-1">
                            
                            {/* View Detail Modal */}
                            <button
                              onClick={() => setSelectedOrderForModal(order)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="Ver detalle completo / Editar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Print Voucher */}
                            <button
                              onClick={() => setSelectedOrderForPrint(order)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="Imprimir comprobante / PDF"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Direct WhatsApp Send */}
                            <a
                              href={generateWhatsAppLink(order)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition"
                              title="Enviar resumen por WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Mostrando <strong className="text-slate-800">{filteredOrders.length}</strong> de <strong className="text-slate-800">{orders.length}</strong> órdenes
              </span>
              <span className="text-[11px] text-slate-400">
                TechFix Repair Suite • Control Integral
              </span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
