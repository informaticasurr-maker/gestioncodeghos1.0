import React from 'react';
import { X, History, Smartphone, Laptop, Calendar, Wrench, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge, DeviceIcon } from './StatusBadge';

export const DeviceHistoryModal: React.FC = () => {
  const {
    selectedDeviceForHistory,
    setSelectedDeviceForHistory,
    orders,
    setSelectedOrderForModal,
    formatMoney,
  } = useApp();

  if (!selectedDeviceForHistory) return null;

  const deviceOrders = orders.filter(
    (o) =>
      o.device?.serialOrImei &&
      selectedDeviceForHistory?.serialOrImei &&
      (o.device.serialOrImei || '').toLowerCase().trim() ===
        (selectedDeviceForHistory.serialOrImei || '').toLowerCase().trim()
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <History className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Historial de Reparaciones del Dispositivo
              </h3>
              <p className="text-xs text-slate-400">
                {selectedDeviceForHistory.model} • S/N / IMEI: <span className="font-mono text-indigo-300 font-semibold">{selectedDeviceForHistory.serialOrImei}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedDeviceForHistory(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
          {deviceOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium">No se encontraron otras órdenes registradas para este número de serie/IMEI.</p>
              <p className="text-xs text-slate-400 mt-1">Este dispositivo no registra ingresos previos en la base de datos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                Se encontraron <span className="font-bold text-indigo-600">{deviceOrders.length}</span> órdenes de servicio técnico para este equipo:
              </p>

              <div className="space-y-3">
                {deviceOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {ord.orderNumber}
                          </span>
                          <StatusBadge status={ord.status} size="sm" />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Ingresado: {new Date(ord.createdAt).toLocaleDateString('es-AR')}</span>
                          <span>• Cliente: {ord.client.name}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedDeviceForHistory(null);
                          setSelectedOrderForModal(ord);
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition"
                      >
                        <span>Ver Orden</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Services performed */}
                    <div className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-200 space-y-1">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-indigo-600" />
                        <span>Trabajos realizados / diagnosticados:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 pl-1 text-slate-600">
                        {ord.services.map((s, idx) => (
                          <li key={idx}>
                            {s.name} ({formatMoney(s.totalPrice)})
                          </li>
                        ))}
                      </ul>
                      {ord.conditionNotes && (
                        <p className="text-[11px] text-slate-500 italic mt-1 border-t border-slate-100 pt-1">
                          Falla inicial: {ord.conditionNotes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-right">
          <button
            onClick={() => setSelectedDeviceForHistory(null)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition"
          >
            Cerrar Historial
          </button>
        </div>

      </div>
    </div>
  );
};
