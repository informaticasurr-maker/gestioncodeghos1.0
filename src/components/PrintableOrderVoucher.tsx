import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  X,
  MessageCircle,
  Smartphone,
  Laptop,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Tag,
  Camera,
  Copy,
  Check,
  FileText,
  Loader2,
  Send,
  QrCode,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order } from '../types';
import { StatusBadge, DeviceIcon } from './StatusBadge';
import { downloadOrderPdf, sharePdfViaWhatsApp, printOrderCleanly } from '../utils/pdfGenerator';

export const PrintableOrderVoucher: React.FC<{
  order?: Order | null;
  onClose?: () => void;
}> = (props) => {
  const {
    companySettings,
    formatMoney,
    generateWhatsAppLink,
    selectedOrderForPrint,
    setSelectedOrderForPrint,
  } = useApp();
  const [printFormat, setPrintFormat] = useState<'a4' | 'ticket'>('a4');
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfActionSuccess, setPdfActionSuccess] = useState<string | null>(null);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const order = props.order || selectedOrderForPrint;
  const onClose = props.onClose || (() => setSelectedOrderForPrint(null));

  if (!order) return null;

  const handlePrint = () => {
    try {
      printOrderCleanly(order, companySettings, printFormat);
    } catch (err) {
      console.warn('Fallback to standard window.print:', err);
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadOrderPdf(order, companySettings, printFormat);
      setPdfActionSuccess('¡PDF generado y descargado con éxito!');
      setTimeout(() => setPdfActionSuccess(null), 3000);
    } catch (err) {
      console.error('Error generando PDF:', err);
      // Fallback: trigger print dialog to save as PDF
      try {
        printOrderCleanly(order, companySettings, printFormat);
      } catch {
        alert('Para guardar como PDF, presione Imprimir y seleccione "Guardar como PDF".');
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendPdfWhatsApp = async () => {
    try {
      setIsGeneratingPdf(true);
      const clientFirstName = (order.client?.name || 'Cliente').split(' ')[0];
      const summaryText = `Hola *${clientFirstName}*, te enviamos el comprobante de tu orden *${order.orderNumber}* (${order.device?.brand || ''} ${order.device?.model || ''}) de *${companySettings.name}*. Total: ${formatMoney(order.totalAmount || 0)} - Saldo: ${formatMoney(order.balanceDue || 0)}.`;

      await sharePdfViaWhatsApp(
        order,
        companySettings,
        summaryText,
        printFormat
      );

      setPdfActionSuccess('¡Acción de WhatsApp procesada!');
      setTimeout(() => setPdfActionSuccess(null), 3000);
    } catch (err) {
      console.error('Error compartiendo PDF:', err);
      // Fallback to standard WhatsApp message link
      window.open(generateWhatsAppLink(order), '_blank');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/#orden=${order.orderNumber}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showPrice = companySettings.orderConfig?.showPriceInClientPdf ?? true;
  const showTech = companySettings.orderConfig?.showTechnicianName ?? true;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white">
      
      <div className="w-full max-w-4xl bg-slate-100 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-300 print:border-none print:shadow-none print:bg-white print:max-w-full">
        
        {/* Action Header - Hidden on Print */}
        <div className="bg-slate-900 text-white p-2.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 print:hidden border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-sm sm:text-base text-blue-400 font-mono">
                {order.orderNumber}
              </span>
              <span className="text-xs text-slate-300 truncate max-w-[160px] sm:max-w-none">
                ({order.client?.name || 'Cliente'})
              </span>
            </div>
            <button
              onClick={onClose}
              className="sm:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            
            {/* Format Toggle */}
            <div className="bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs flex shrink-0">
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-2 py-1 rounded-md font-medium transition text-xs ${
                  printFormat === 'a4' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                A4
              </button>
              <button
                onClick={() => setPrintFormat('ticket')}
                className={`px-2 py-1 rounded-md font-medium transition text-xs ${
                  printFormat === 'ticket' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Ticket 80mm
              </button>
            </div>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-sm transition min-w-[105px]"
              title="Descargar archivo PDF"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Descargar PDF</span>
            </button>

            {/* Send PDF via WhatsApp */}
            <button
              onClick={handleSendPdfWhatsApp}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-sm transition min-w-[120px]"
              title="Enviar PDF y mensaje por WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp PDF</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 shadow-sm transition"
              title="Imprimir comprobante"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium px-2 py-1.5 rounded-lg transition"
              title="Copiar enlace"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button Desktop */}
            <button
              onClick={onClose}
              className="hidden sm:block p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

          </div>
        </div>

        {/* Feedback message banner */}
        {pdfActionSuccess && (
          <div className="bg-emerald-500 text-white text-xs font-semibold py-1.5 px-4 text-center animate-in fade-in">
            {pdfActionSuccess}
          </div>
        )}

        {/* Printable Document Body */}
        <div className="overflow-y-auto max-h-[80vh] p-2 sm:p-6 md:p-8 bg-white text-slate-800 flex justify-center print:max-h-none print:p-0">
          
          <div
            ref={printContainerRef}
            id="printable-voucher"
            className={`w-full bg-white transition-all ${
              printFormat === 'ticket' ? 'max-w-[380px] text-xs p-3 border border-dashed border-slate-300' : 'max-w-[780px] text-xs sm:text-sm p-3 sm:p-6'
            }`}
          >
            
            {/* Header: Company Info & Logo */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b-2 border-slate-800 pb-4 mb-4 gap-3 sm:gap-4">
              
              {/* Company Info Left */}
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                {companySettings.logoUrl && (
                  <img
                    src={companySettings.logoUrl}
                    alt={companySettings.name}
                    className="w-14 h-14 sm:w-20 sm:h-20 object-contain rounded-lg border border-slate-200 shrink-0 bg-slate-50"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-snug uppercase break-words">
                    {companySettings.name}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 break-words">
                    {companySettings.tradeName} {companySettings.taxId ? `• CUIT/TaxID: ${companySettings.taxId}` : ''}
                  </p>
                  {companySettings.address && (
                    <p className="text-xs text-slate-600 mt-0.5 break-words">
                      📍 {companySettings.address} {companySettings.city ? `• ${companySettings.city}` : ''} {companySettings.postalCode ? `(${companySettings.postalCode})` : ''}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 mt-0.5 break-words">
                    {companySettings.phone ? `📞 Tel/WA: ${companySettings.phone}` : ''} {companySettings.email ? `• ✉️ ${companySettings.email}` : ''}
                  </p>
                  {showTech && (
                    <p className="text-xs text-blue-700 font-semibold mt-1">
                      Técnico Responsable: {order.technician || companySettings.defaultTechnician}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Number & Status Box Right */}
              <div className="flex flex-col sm:items-end items-start sm:text-right text-left shrink-0 pt-2 sm:pt-0 border-t border-slate-100 sm:border-none">
                <div className="bg-slate-900 text-white px-3 py-1 rounded-md font-mono text-sm sm:text-base font-bold shadow-xs inline-block">
                  {order.orderNumber}
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  <span className="font-semibold text-slate-700">Fecha Ingreso:</span> {new Date(order.createdAt).toLocaleDateString('es-AR')} {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {order.estimatedDeliveryDate && (
                  <p className="text-[11px] text-blue-700 font-semibold">
                    <span>Estimado:</span> {new Date(order.estimatedDeliveryDate).toLocaleDateString('es-AR')}
                  </p>
                )}
                <div className="mt-1.5">
                  <StatusBadge status={order.status} size="sm" />
                </div>
              </div>

            </div>

            {/* Client & Device Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              
              {/* Client Box */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 border-b border-slate-200 pb-1">
                  <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Datos del Cliente</span>
                </div>
                <div className="space-y-1 text-xs break-words">
                  <p><span className="font-semibold text-slate-700">Nombre:</span> {order.client?.name || 'Cliente'}</p>
                  <p><span className="font-semibold text-slate-700">Teléfono:</span> {order.client?.phone || 'No especificado'}</p>
                  <p><span className="font-semibold text-slate-700">DNI / CUIT:</span> {order.client?.documentId || 'No especificado'}</p>
                  <p><span className="font-semibold text-slate-700">Email:</span> {order.client?.email || 'No especificado'}</p>
                  <p><span className="font-semibold text-slate-700">Domicilio:</span> {order.client?.address ? `${order.client.address}, ${order.client.city || ''}` : 'No especificado'}</p>
                </div>
              </div>

              {/* Device Box */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 border-b border-slate-200 pb-1">
                  <DeviceIcon type={order.device?.type || 'other'} className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Dispositivo Registrado</span>
                </div>
                <div className="space-y-1 text-xs break-words">
                  <p>
                    <span className="font-semibold text-slate-700">Equipo:</span>{' '}
                    <span className="font-bold text-slate-900">{order.device?.brand || ''} {order.device?.model || ''}</span>
                    {order.device?.color && <span className="text-slate-500"> ({order.device.color})</span>}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">N° Serie / IMEI:</span>{' '}
                    <span className="font-mono bg-slate-200/80 px-1 py-0.5 rounded text-[11px] inline-block">{order.device?.serialOrImei || 'Sin S/N visible'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Bloqueo / Clave:</span>{' '}
                    <span className="font-mono text-slate-800">{order.device?.lockType === 'none' || !order.device?.lockType ? 'Sin código' : `${order.device.lockType.toUpperCase()}: ${order.device.lockCode || 'Indicado por cliente'}`}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Accesorios:</span>{' '}
                    {(order.device?.accessories || []).length > 0 ? (order.device?.accessories || []).join(', ') : 'Ninguno / Solo equipo'}
                  </p>
                </div>
              </div>

            </div>

            {/* Condition Notes & Observations */}
            <div className="mb-4 bg-amber-50/70 border border-amber-200/80 p-3 rounded-lg text-xs">
              <div className="font-bold text-amber-900 flex items-center gap-1 mb-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Condiciones de Recepción / Falla Manifestada:</span>
              </div>
              <p className="text-slate-800 whitespace-pre-line leading-relaxed break-words">
                {order.conditionNotes || 'Equipo recibido para diagnóstico técnico general.'}
              </p>
            </div>

            {/* Services & Budget Table */}
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex flex-wrap items-center justify-between gap-1">
                <span>Servicios a Realizar / Presupuesto</span>
                {showPrice && <span className="text-[11px] text-slate-500 font-normal">Valores en {companySettings.currency}</span>}
              </div>

              <div className="overflow-x-auto w-full border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs min-w-[320px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <th className="py-1.5 px-2 font-semibold">Descripción del Servicio / Repuesto</th>
                      <th className="py-1.5 px-2 font-semibold text-center w-12">Cant.</th>
                      {showPrice && (
                        <>
                          <th className="py-1.5 px-2 font-semibold text-right w-24">Unitario</th>
                          <th className="py-1.5 px-2 font-semibold text-right w-24">Total</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(order.services || []).map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-2">
                          <span className="font-medium text-slate-900">{item.name}</span>
                          {item.description && (
                            <p className="text-[11px] text-slate-500">{item.description}</p>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-center text-slate-700 font-mono">{item.quantity}</td>
                        {showPrice && (
                          <>
                            <td className="py-1.5 px-2 text-right text-slate-700 font-mono">
                              {formatMoney(item.unitPrice || 0)}
                            </td>
                            <td className="py-1.5 px-2 text-right font-semibold text-slate-900 font-mono">
                              {formatMoney(item.totalPrice || 0)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {(order.spareParts || []).map((part) => (
                      <tr key={part.id} className="hover:bg-slate-50/50 bg-teal-50/20">
                        <td className="py-1.5 px-2">
                          <span className="font-medium text-slate-900">[Repuesto] {part.name}</span>
                          {part.sku && (
                            <span className="text-[10px] text-slate-500 font-mono ml-1">({part.sku})</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-center text-slate-700 font-mono">{part.quantity}</td>
                        {showPrice && (
                          <>
                            <td className="py-1.5 px-2 text-right text-slate-700 font-mono">
                              {formatMoney(part.unitPrice || 0)}
                            </td>
                            <td className="py-1.5 px-2 text-right font-semibold text-slate-900 font-mono">
                              {formatMoney(part.subtotal || 0)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total & Payment Summary */}
              {showPrice && (
                <div className="flex justify-end mt-2">
                  <div className="w-full sm:w-64 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>Total Reparación:</span>
                      <span className="font-mono text-slate-900">{formatMoney(order.totalAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Seña / Pago a Cuenta:</span>
                      <span className="font-mono font-medium">-{formatMoney(order.depositPaid || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black border-t border-slate-300 pt-1 text-blue-900">
                      <span>Saldo a Cancelar:</span>
                      <span className="font-mono">{formatMoney(order.balanceDue || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Workshop Payment & QR Code Section (if enabled) */}
            {companySettings.paymentDetails?.enabled &&
              companySettings.paymentDetails?.showInPdf !== false &&
              (companySettings.paymentDetails?.alias || companySettings.paymentDetails?.qrCodeUrl) && (
                <div className="mb-3 bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 sm:p-3 flex flex-col sm:flex-row items-center gap-3">
                  {companySettings.paymentDetails.qrCodeUrl ? (
                    <img
                      src={companySettings.paymentDetails.qrCodeUrl}
                      alt="QR de Pago"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-md border border-emerald-300 bg-white p-1 shrink-0 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-md border border-dashed border-emerald-300 flex flex-col items-center justify-center text-emerald-600 bg-white shrink-0">
                      <QrCode className="w-6 h-6 text-emerald-500" />
                      <span className="text-[8px] font-bold mt-0.5">PAGO QR</span>
                    </div>
                  )}

                  <div className="text-left text-xs space-y-1 w-full">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-emerald-950 uppercase tracking-tight text-[11px] flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pagar con QR o Transferencia:</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-700">ALIAS:</span>
                      <span className="font-mono font-black text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 text-xs sm:text-sm">
                        {companySettings.paymentDetails.alias || 'alias.taller.mp'}
                      </span>
                      {companySettings.paymentDetails.cbuCvu && (
                        <span className="text-[10px] text-slate-600 font-mono">
                          (CBU/CVU: {companySettings.paymentDetails.cbuCvu})
                        </span>
                      )}
                    </div>

                    {(companySettings.paymentDetails.bankName ||
                      companySettings.paymentDetails.accountHolder) && (
                      <p className="text-[11px] text-slate-600">
                        <strong>Banco/Titular:</strong> {companySettings.paymentDetails.bankName || ''}{' '}
                        {companySettings.paymentDetails.accountHolder
                          ? `• ${companySettings.paymentDetails.accountHolder}`
                          : ''}
                      </p>
                    )}

                    {companySettings.paymentDetails.instructions && (
                      <p className="text-[10px] text-emerald-800 font-medium italic">
                        💬 {companySettings.paymentDetails.instructions}
                      </p>
                    )}
                  </div>
                </div>
              )}

            {/* Photos Section (if photos exist) */}
            {order.photos && order.photos.length > 0 && (
              <div className="mb-4 border-t border-slate-200 pt-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Registro Fotográfico del Equipo Ingresado:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {order.photos.map((photo) => (
                    <div key={photo.id} className="border border-slate-200 rounded-lg p-1 bg-slate-50">
                      <img
                        src={photo.url}
                        alt={photo.description}
                        className="w-full h-24 sm:h-28 object-cover rounded bg-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-[10px] text-slate-600 mt-1 font-medium leading-tight">
                        {photo.description || 'Estado en recepción'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terms and Warranty Clauses */}
            <div className="border-t border-slate-200 pt-3 mb-3 text-[10px] text-slate-500 leading-tight">
              <div className="font-bold text-slate-700 flex items-center gap-1 mb-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Condiciones de Servicio y Garantía Técnica:</span>
              </div>
              <p className="whitespace-pre-line text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                {companySettings.orderConfig?.termsAndClauses || '1. Todo trabajo cuenta con garantía escrita sobre la reparación efectuada.'}
              </p>
            </div>

            {/* Promotional Propaganda Banner (if enabled) */}
            {companySettings.orderConfig?.promoBannerEnabled && companySettings.orderConfig?.promoBannerText && (
              <div className="mb-4 bg-indigo-50 border border-indigo-200 text-indigo-900 p-2 rounded-lg text-center text-xs font-medium">
                {companySettings.orderConfig.promoBannerText}
              </div>
            )}

            {/* Signatures Row */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-center text-xs">
              <div className="pt-8 border-t border-dashed border-slate-400">
                <p className="font-semibold text-slate-800">Firma del Cliente</p>
                <p className="text-[10px] text-slate-500">Aceptación de condiciones y presupuesto</p>
              </div>
              <div className="pt-8 border-t border-dashed border-slate-400">
                <p className="font-semibold text-slate-800">Firma / Sello del Taller</p>
                <p className="text-[10px] text-slate-500">{companySettings.name}</p>
              </div>
            </div>

            {/* Mandatory Footer Watermark / Socalo as requested */}
            <div className="mt-6 pt-2 border-t border-slate-300 text-center text-[11px] text-slate-400 font-medium">
              <span>codeghos/sistemas • </span>
              <a
                href="https://www.codeghos.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-600 underline font-semibold"
              >
                www.codeghos.com
              </a>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
