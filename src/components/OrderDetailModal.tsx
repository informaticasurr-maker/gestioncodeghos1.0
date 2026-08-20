import React, { useState } from 'react';
import {
  X,
  Printer,
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  Camera,
  Plus,
  Trash2,
  CreditCard,
  History,
  ShieldAlert,
  User,
  Smartphone,
  FileText,
  DollarSign,
  AlertTriangle,
  Upload,
  Boxes,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OrderStatus, PaymentMethod, DeviceChecklist } from '../types';
import { StatusBadge, PaymentBadge, DeviceIcon } from './StatusBadge';
import { compressImage } from '../utils/imageCompressor';
import { WhatsAppTemplatesModal } from './WhatsAppTemplatesModal';
import { DeviceChecklistSection } from './DeviceChecklistSection';

export const OrderDetailModal: React.FC = () => {
  const {
    selectedOrderForModal,
    setSelectedOrderForModal,
    setSelectedOrderForPrint,
    setSelectedDeviceForHistory,
    updateOrderStatus,
    updateOrder,
    addOrderPayment,
    addOrderPhoto,
    deleteOrderPhoto,
    approveBudget,
    rejectBudget,
    deleteOrder,
    getDeviceHistory,
    inventory,
    addSparePartToOrder,
    removeSparePartFromOrder,
    formatMoney,
    generateWhatsAppLink,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'photos' | 'payments' | 'history'>('general');
  const [isWhatsAppTemplatesOpen, setIsWhatsAppTemplatesOpen] = useState(false);
  
  // Status change state
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  
  // Payment add state
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [paymentNote, setPaymentNote] = useState('');

  // Photo add state
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');

  // Spare part add state
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState('');
  const [sparePartQty, setSparePartQty] = useState(1);

  if (!selectedOrderForModal) return null;
  const order = selectedOrderForModal;

  const pastHistoryCount = getDeviceHistory(order.device.serialOrImei, order.id).length;

  const handleStatusChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus) return;
    updateOrderStatus(order.id, newStatus, statusNote);
    setNewStatus('');
    setStatusNote('');
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    addOrderPayment(order.id, amountNum, paymentMethod, paymentNote);
    setPaymentAmount('');
    setPaymentNote('');
  };

  const handleAddPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) return;
    addOrderPhoto(order.id, {
      url: photoUrl,
      description: photoDescription || 'Foto del estado del equipo',
    });
    setPhotoUrl('');
    setPhotoDescription('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1280, 1280, 0.75);
        setPhotoUrl(compressed);
      } catch (err) {
        console.warn('Error compressing photo:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setPhotoUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddSparePartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventoryItemId) return;
    const inv = inventory.find((i) => i.id === selectedInventoryItemId);
    if (!inv) return;

    addSparePartToOrder(order.id, inv, Math.max(1, sparePartQty));
    setSelectedInventoryItemId('');
    setSparePartQty(1);
  };

  const handleUpdateChecklist = (newChecklist: DeviceChecklist) => {
    updateOrder({
      ...order,
      checklist: newChecklist,
      device: {
        ...order.device,
        checklist: newChecklist,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
              <DeviceIcon type={order.device.type} className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-slate-100 font-mono">
                  {order.orderNumber}
                </h2>
                <StatusBadge status={order.status} size="sm" />
                <PaymentBadge status={order.paymentStatus} size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                {order.device.brand} {order.device.model} • Cliente: <span className="text-slate-200 font-medium">{order.client.name}</span>
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Print / PDF */}
            <button
              onClick={() => setSelectedOrderForPrint(order)}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition shadow-sm"
              title="Ver comprobante, descargar PDF o compartir por WhatsApp"
            >
              <Printer className="w-4 h-4" />
              <span>PDF / Imprimir</span>
            </button>

            {/* Plantillas WhatsApp Modal */}
            <button
              onClick={() => setIsWhatsAppTemplatesOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition shadow-sm"
              title="Elegir plantilla de mensaje inteligente por WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Plantillas</span>
            </button>

            {/* Direct WhatsApp */}
            <a
              href={generateWhatsAppLink(order)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition shadow-sm"
              title="Notificar por WhatsApp rápido"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Close */}
            <button
              onClick={() => setSelectedOrderForModal(null)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex gap-2 overflow-x-auto shrink-0 text-xs font-medium">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Detalle & Diagnóstico</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'photos'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Fotos del Equipo ({order.photos?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Cobros & Señas ({formatMoney(order.depositPaid)} / {formatMoney(order.totalAmount)})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial de Estados ({order.statusHistory?.length || 0})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {activeTab === 'general' && (
            <>
              {/* Presupuesto Action Callout (if pending) */}
              {order.status === 'presupuesto_pendiente' && (
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-600 text-white rounded-lg">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-purple-950">
                        Presupuesto Pendiente de Aprobación
                      </h4>
                      <p className="text-xs text-purple-700">
                        El cliente debe confirmar si acepta el monto de {formatMoney(order.totalAmount)}.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveBudget(order.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aprobar Presupuesto</span>
                    </button>
                    <button
                      onClick={() => rejectBudget(order.id)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status Update Quick Selector */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Actualizar Estado de la Orden</span>
                </h4>

                <form onSubmit={handleStatusChangeSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Nuevo Estado:</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- Seleccionar Estado --</option>
                      <option value="recibido">Recibido en Taller</option>
                      <option value="en_revision">En Diagnóstico / Revisión</option>
                      <option value="presupuesto_pendiente">Presupuesto Pendiente</option>
                      <option value="presupuesto_aprobado">Presupuesto Aprobado</option>
                      <option value="en_reparacion">En Reparación</option>
                      <option value="esperando_repuesto">Esperando Repuesto</option>
                      <option value="listo_entrega">Listo para Retiro 🎉</option>
                      <option value="entregado">Entregado / Finalizado ✅</option>
                      <option value="presupuesto_rechazado">Presupuesto Rechazado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Nota del cambio (opcional):</label>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Ej: Se reemplazó módulo, en pruebas..."
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!newStatus}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Guardar Cambio
                    </button>
                  </div>
                </form>
              </div>

              {/* Client & Device Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Client Data */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Cliente</span>
                    </div>
                    <a
                      href={`tel:${order.client.phone}`}
                      className="text-xs text-indigo-600 hover:underline font-semibold"
                    >
                      {order.client.phone}
                    </a>
                  </div>
                  <div className="space-y-1 text-xs text-slate-700">
                    <p><span className="font-semibold text-slate-900">Nombre:</span> {order.client.name}</p>
                    <p><span className="font-semibold text-slate-900">DNI/CUIT:</span> {order.client.documentId || 'No especificado'}</p>
                    <p><span className="font-semibold text-slate-900">Email:</span> {order.client.email || 'No especificado'}</p>
                    <p><span className="font-semibold text-slate-900">Dirección:</span> {order.client.address ? `${order.client.address}, ${order.client.city}` : 'No especificada'}</p>
                    {order.client.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-200 mt-1">
                        Nota: {order.client.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Device Data */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase">
                      <DeviceIcon type={order.device.type} className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Dispositivo</span>
                    </div>

                    {pastHistoryCount > 0 && (
                      <button
                        onClick={() =>
                          setSelectedDeviceForHistory({
                            serialOrImei: order.device.serialOrImei,
                            model: `${order.device.brand} ${order.device.model}`,
                          })
                        }
                        className="text-[11px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full hover:bg-indigo-200 transition"
                      >
                        {pastHistoryCount} reparaciones previas
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-900">Modelo:</span>{' '}
                      <span className="font-bold text-slate-900">{order.device.brand} {order.device.model}</span>
                      {order.device.color && ` (${order.device.color})`}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">S/N / IMEI:</span>{' '}
                      <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                        {order.device.serialOrImei || 'Sin S/N especificado'}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Patrón / Clave:</span>{' '}
                      <span className="font-mono font-medium text-indigo-700 bg-indigo-50 px-1 rounded">
                        {order.device.lockType === 'none' ? 'Sin código' : `${order.device.lockType.toUpperCase()}: ${order.device.lockCode || '-'}`}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Accesorios:</span>{' '}
                      {order.device.accessories?.length ? order.device.accessories.join(', ') : 'Ninguno'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Conditions & Technical Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Reception condition */}
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 text-xs">
                  <h5 className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Estado / Condiciones de Recepción:</span>
                  </h5>
                  <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                    {order.conditionNotes || 'Sin observaciones de ingreso detalladas.'}
                  </p>
                </div>

                {/* Internal notes */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <h5 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Nota Interna de Taller (Privada):</span>
                  </h5>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed italic">
                    {order.internalNotes || 'Sin notas internas registradas.'}
                  </p>
                </div>

              </div>

              {/* Device Inspection Checklist */}
              <div>
                <DeviceChecklistSection
                  checklist={order.checklist || {
                    powersOn: 'yes',
                    screenCondition: 'ok',
                    touchWorks: 'yes',
                    batteryHealth: 'ok',
                    chargingPort: 'yes',
                    camerasWorking: 'yes',
                    speakersWorking: 'yes',
                    microphoneWorking: 'yes',
                    wifiBluetooth: 'yes',
                    buttonsWorking: 'yes',
                    waterDamage: 'no',
                    chassisCondition: 'ok',
                    biometrics: 'yes',
                  }}
                  onChange={handleUpdateChecklist}
                  readOnly={false}
                />
              </div>

              {/* Spare Parts from Stock Management */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-teal-600" />
                    <span>Repuestos Utilizados de Inventario ({order.spareParts?.length || 0})</span>
                  </h4>
                  <span className="text-xs font-mono font-bold text-teal-700">
                    Subtotal Repuestos: {formatMoney((order.spareParts || []).reduce((acc, p) => acc + (p.subtotal || 0), 0))}
                  </span>
                </div>

                {/* Add spare part from inventory form */}
                <form onSubmit={handleAddSparePartSubmit} className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <select
                      value={selectedInventoryItemId}
                      onChange={(e) => setSelectedInventoryItemId(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">-- Cargar Repuesto del Inventario --</option>
                      {inventory.map((item) => (
                        <option key={item.id} value={item.id} disabled={item.stock <= 0}>
                          {item.name} [{item.sku || 'S/N'}] - Stock: {item.stock} un. ({formatMoney(item.salePrice)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={sparePartQty}
                      onChange={(e) => setSparePartQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-xs p-2 text-center border border-slate-300 rounded-lg bg-white font-mono"
                      title="Cantidad de unidades"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!selectedInventoryItemId}
                    className="px-3 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Asignar & Descontar</span>
                  </button>
                </form>

                {/* Assigned spare parts table */}
                {(order.spareParts || []).length > 0 ? (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden text-xs">
                    {order.spareParts?.map((part) => (
                      <div key={part.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                        <div>
                          <p className="font-semibold text-slate-900">{part.name}</p>
                          <p className="text-[11px] text-slate-500">
                            SKU: {part.sku || 'N/A'} • {part.quantity} un. x {formatMoney(part.unitPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-slate-900">{formatMoney(part.subtotal)}</span>
                          <button
                            type="button"
                            onClick={() => removeSparePartFromOrder(order.id, part.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                            title="Quitar repuesto y devolver a stock"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No hay repuestos descontados del stock para esta reparación.</p>
                )}
              </div>

              {/* Services & Budget Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 p-3 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>Mano de Obra y Servicios Cargados</span>
                  <span>Garantía: {order.warrantyDays || 90} días</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[320px]">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Servicio / Tarea</th>
                        <th className="p-2.5 text-center">Cant.</th>
                        <th className="p-2.5 text-right">Precio Unitario</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {order.services.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-900">
                            {item.name}
                            {item.category && <span className="text-[10px] text-slate-400 ml-1.5">({item.category})</span>}
                          </td>
                          <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                          <td className="p-2.5 text-right font-mono text-slate-600">{formatMoney(item.unitPrice)}</td>
                          <td className="p-2.5 text-right font-mono font-semibold text-slate-900">{formatMoney(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial bar */}
                <div className="bg-slate-50 p-3 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3 text-xs">
                  <div className="flex gap-4">
                    <div>
                      <span className="text-slate-500">Seña pagada:</span>{' '}
                      <span className="font-bold text-emerald-700 font-mono">{formatMoney(order.depositPaid)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Saldo pendiente:</span>{' '}
                      <span className="font-bold text-rose-700 font-mono">{formatMoney(order.balanceDue)}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold mr-1">Total Presupuestado:</span>
                    <span className="text-base font-black text-indigo-900 font-mono">{formatMoney(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-4">
              
              {/* Add Photo Form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Añadir Foto del Dispositivo</span>
                </h4>

                <form onSubmit={handleAddPhotoSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* File Upload / Camera */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Cargar desde dispositivo / Cámara:
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>

                    {/* Or Image URL */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        O pegar URL de imagen:
                      </label>
                      <input
                        type="url"
                        value={photoUrl.startsWith('data:') ? 'Imagen local cargada' : photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Descripción breve de lo que se ve en la foto:
                    </label>
                    <input
                      type="text"
                      value={photoDescription}
                      onChange={(e) => setPhotoDescription(e.target.value)}
                      placeholder="Ej: Rayadura en carcasa, vidrio partido superior, etc."
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!photoUrl}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Guardar Foto en la Orden</span>
                  </button>
                </form>
              </div>

              {/* Photos Gallery */}
              {order.photos?.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Camera className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                  <p className="text-xs font-medium">No hay fotos cargadas aún para esta orden de trabajo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {order.photos.map((photo) => (
                    <div key={photo.id} className="group relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <img
                        src={photo.url}
                        alt={photo.description}
                        className="w-full h-40 object-cover bg-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="p-2.5 text-xs">
                        <p className="font-semibold text-slate-800 line-clamp-2">{photo.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(photo.date).toLocaleDateString('es-AR')}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteOrderPhoto(order.id, photo.id)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition shadow hover:bg-rose-700"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              
              {/* Financial Balance Summary Card */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Total Presupuestado</span>
                  <p className="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5">
                    {formatMoney(order.totalAmount)}
                  </p>
                </div>
                <div className="border-x border-slate-200">
                  <span className="text-[11px] text-emerald-600 font-medium">Abonado / Señas</span>
                  <p className="text-base sm:text-lg font-black text-emerald-600 font-mono mt-0.5">
                    {formatMoney(order.depositPaid)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-rose-600 font-medium">Saldo Restante</span>
                  <p className="text-base sm:text-lg font-black text-rose-600 font-mono mt-0.5">
                    {formatMoney(order.balanceDue)}
                  </p>
                </div>
              </div>

              {/* Record New Payment Form */}
              {order.balanceDue > 0 ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Registrar Nuevo Pago / Cobro</span>
                  </h4>

                  <form onSubmit={handleAddPaymentSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Monto a cobrar:</label>
                      <input
                        type="number"
                        min="1"
                        max={order.balanceDue}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder={`Hasta ${order.balanceDue}`}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Medio de Pago:</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia Bancaria</option>
                        <option value="mercadopago">MercadoPago</option>
                        <option value="tarjeta_debito">Tarjeta de Débito</option>
                        <option value="tarjeta_credito">Tarjeta de Crédito</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Detalle / Recibo N°:</label>
                      <input
                        type="text"
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        placeholder="Ej: Pago saldo al retirar"
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Registrar Cobro
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Esta orden se encuentra 100% saldada.</span>
                </div>
              )}

              {/* Payments History List */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Historial de Pagos Recibidos ({order.payments?.length || 0})
                </h4>

                <div className="space-y-2">
                  {order.payments?.map((pay) => (
                    <div
                      key={pay.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 font-mono text-sm">
                            {formatMoney(pay.amount)}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium capitalize">
                            {pay.method}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(pay.date).toLocaleDateString('es-AR')} {new Date(pay.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} • {pay.note || 'Sin nota'}
                        </p>
                      </div>

                      <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Acreditado</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Trazabilidad y Auditoría de Estados
              </h4>

              <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
                {order.statusHistory?.map((hist, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-sm" />
                    
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <StatusBadge status={hist.status} size="sm" />
                        <span className="text-[11px] text-slate-400">
                          {new Date(hist.date).toLocaleDateString('es-AR')} {new Date(hist.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700">{hist.note || 'Sin comentario adicional'}</p>
                      {hist.technician && (
                        <p className="text-[10px] text-indigo-700 font-medium mt-1">
                          Responsable: {hist.technician}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 p-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => {
              if (confirm(`¿Estás seguro de eliminar la orden ${order.orderNumber}?`)) {
                deleteOrder(order.id);
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Orden</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedOrderForPrint(order)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Ver Comprobante / Imprimir</span>
            </button>
            <button
              onClick={() => setSelectedOrderForModal(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>

      {/* WhatsApp Smart Templates Modal */}
      <WhatsAppTemplatesModal
        isOpen={isWhatsAppTemplatesOpen}
        onClose={() => setIsWhatsAppTemplatesOpen(false)}
        order={order}
      />
    </div>
  );
};
