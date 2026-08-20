import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Send,
  Sparkles,
  Smartphone,
  Calendar,
  DollarSign,
  Info,
} from 'lucide-react';
import { Order, WhatsAppTemplateType } from '../types';
import { useApp } from '../context/AppContext';

interface WhatsAppTemplatesModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppTemplatesModal: React.FC<WhatsAppTemplatesModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { companySettings, formatMoney } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateType>('listo_entrega');
  const [copied, setCopied] = useState(false);
  const [customNotes, setCustomNotes] = useState('');

  if (!isOpen) return null;

  const clientFirstName = (order.client?.name || 'Cliente').split(' ')[0];
  const deviceName = `${order.device?.brand || ''} ${order.device?.model || ''}`.trim() || 'Equipo';
  const cleanPhone = (order.client?.phone || '').replace(/[^0-9]/g, '');

  const paymentInfo =
    companySettings.paymentDetails?.enabled && companySettings.paymentDetails?.alias
      ? `\n💳 *Alias para transferencia:* ${companySettings.paymentDetails.alias}${
          companySettings.paymentDetails.bankName ? ` (${companySettings.paymentDetails.bankName})` : ''
        }`
      : '';

  const getTemplateMessage = (type: WhatsAppTemplateType): string => {
    const servicesList = (order.services || [])
      .map((s) => `• ${s.name}: ${formatMoney(s.totalPrice || 0)}`)
      .join('\n');

    switch (type) {
      case 'ingreso_taller':
        return `Hola *${clientFirstName}*, te confirmamos que tu equipo *${deviceName}* ha ingresado a nuestro taller técnico *${companySettings.name}*.
📋 *Orden de Servicio:* ${order.orderNumber}
🔍 *Falla declarada:* ${order.device?.reportedFault || order.conditionNotes || 'Revisión general'}
💵 *Seña abonada:* ${formatMoney(order.depositPaid || 0)}
⏱️ *Diagnóstico estimado:* 24 a 48 hs hábiles.

Te estaremos notificando en cuanto tengamos el diagnóstico listo. ¡Muchas gracias por confiar en nosotros!
📍 *${companySettings.address || ''}* | 📞 *${companySettings.phone || ''}*`;

      case 'presupuesto_pendiente':
        return `Hola *${clientFirstName}*, te contactamos de *${companySettings.name}* con el diagnóstico de tu *${deviceName}* (Orden *${order.orderNumber}*):

🔍 *Diagnóstico técnico:* ${order.diagnosis || order.internalNotes || 'Revisión completada.'}
🛠️ *Detalle del trabajo:*
${servicesList || '• Reparación y componentes'}

💰 *Presupuesto total:* ${formatMoney(order.totalAmount || 0)}
💵 *Seña previa:* ${formatMoney(order.depositPaid || 0)}
💳 *Saldo final:* ${formatMoney(order.balanceDue || 0)}
⏱️ *Tiempo estimado de reparación:* ${order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString('es-AR') : '24-48 hs'}

¿Nos confirmas si *aprobás el presupuesto* para comenzar con el trabajo?`;

      case 'en_reparacion':
        return `Hola *${clientFirstName}*, te informamos de *${companySettings.name}* que tu equipo *${deviceName}* (Orden *${order.orderNumber}*) ya se encuentra *en proceso de reparación*.

Nuestro equipo técnico está trabajando en él. Te avisaremos apenas supere las pruebas de control de calidad.
📞 Consultas: *${companySettings.phone || ''}*`;

      case 'listo_entrega':
        return `🎉 ¡Buenas noticias, *${clientFirstName}*! Tu *${deviceName}* (Orden *${order.orderNumber}*) ya está *LISTO PARA RETIRAR* en *${companySettings.name}*.

✅ Ha superado todas nuestras pruebas de control de calidad.
💰 *Total de la orden:* ${formatMoney(order.totalAmount || 0)}
💵 *Seña entregada:* ${formatMoney(order.depositPaid || 0)}
💳 *Saldo a abonar:* ${formatMoney(order.balanceDue || 0)}${paymentInfo}

📍 *Podes retirarlo en:* ${companySettings.address || ''}, ${companySettings.city || ''}
🕒 *Horarios de atención:* Lun a Vie 09:00 a 19:00 / Sáb 09:00 a 13:00
${customNotes ? `\n📝 *Nota adicional:* ${customNotes}` : ''}
¡Te esperamos!`;

      case 'entregado_garantia':
        return `Hola *${clientFirstName}*, ¡gracias por confiar tu *${deviceName}* a *${companySettings.name}*!

🛡️ Recordá que contás con *${order.warrantyDays || 90} días de garantía* sobre el trabajo realizado (Orden *${order.orderNumber}*).
Ante cualquier duda o consulta sobre el funcionamiento, no dudes en escribirnos por este medio.

⭐⭐⭐⭐⭐ Si estás satisfecho con nuestro servicio, nos ayuda mucho que nos recomiendes. ¡Que tengas un excelente día!`;

      case 'recordatorio_retiro':
        return `Hola *${clientFirstName}*, te recordamos de *${companySettings.name}* que tu *${deviceName}* (Orden *${order.orderNumber}*) se encuentra listo para retirar en nuestro local.

💳 *Saldo pendiente:* ${formatMoney(order.balanceDue || 0)}
📍 *Dirección:* ${companySettings.address || ''}

Por favor coordiná tu visita para retirar el equipo. ¡Muchas gracias!`;

      default:
        return '';
    }
  };

  const messageText = getTemplateMessage(selectedTemplate);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  const templates: { id: WhatsAppTemplateType; label: string; icon: string; desc: string }[] = [
    {
      id: 'ingreso_taller',
      label: 'Ingreso al Taller',
      icon: '📥',
      desc: 'Notificar recepción del equipo y datos de orden',
    },
    {
      id: 'presupuesto_pendiente',
      label: 'Presupuesto y Costos',
      icon: '📋',
      desc: 'Enviar diagnóstico y solicitar aprobación',
    },
    {
      id: 'en_reparacion',
      label: 'En Reparación',
      icon: '🛠️',
      desc: 'Informar que se inició el trabajo técnico',
    },
    {
      id: 'listo_entrega',
      label: '¡Listo para Retirar!',
      icon: '🎉',
      desc: 'Avisar que el equipo está listo y saldo a pagar',
    },
    {
      id: 'entregado_garantia',
      label: 'Garantía y Gracias',
      icon: '🛡️',
      desc: 'Confirmación post-entrega y días de garantía',
    },
    {
      id: 'recordatorio_retiro',
      label: 'Recordatorio Retiro',
      icon: '⏳',
      desc: 'Reiterar retiro para equipos listos',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="whatsapp-template-modal"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">Plantillas de WhatsApp</h3>
              <p className="text-xs text-emerald-100">
                Orden {order.orderNumber} • {order.client?.name} ({order.client?.phone || 'Sin tel.'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50 dark:bg-slate-900/50">
          {/* Template Selector Grid */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
              Seleccionar Plantilla de Notificación
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {templates.map((tpl) => {
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium text-sm mb-1">
                      <span>{tpl.icon}</span>
                      <span>{tpl.label}</span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {tpl.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note Injection */}
          {selectedTemplate === 'listo_entrega' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                Nota adicional para este cliente (opcional):
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Ej: Traer el cargador original para prueba final..."
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          )}

          {/* Message Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Vista Previa del Mensaje Formateado
              </label>
              <span className="text-xs text-slate-400">
                {messageText.length} caracteres
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative group">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 dark:text-slate-200 leading-relaxed max-h-60 overflow-y-auto">
                {messageText}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-slate-400" />
            <span>Destino: {cleanPhone ? `+${cleanPhone}` : 'Sin número registrado'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              onClick={handleSendWhatsApp}
              disabled={!cleanPhone}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Abrir WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
