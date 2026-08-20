import jsPDF from 'jspdf';
import { Order, CompanySettings } from '../types';

/**
 * Format currency helper
 */
function formatCurrency(amount: number, settings?: CompanySettings): string {
  const symbol = settings?.currencySymbol || '$';
  const formatted = (amount || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${formatted}`;
}

/**
 * Format date helper
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return '---';
  try {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return dateStr;
  }
}

/**
 * Status label in Spanish
 */
function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    recibido: 'RECIBIDO',
    en_revision: 'EN REVISIÓN',
    presupuesto_pendiente: 'PRESUP. PENDIENTE',
    presupuesto_aprobado: 'PRESUP. APROBADO',
    presupuesto_rechazado: 'PRESUP. RECHAZADO',
    en_reparacion: 'EN REPARACIÓN',
    esperando_repuesto: 'ESPERANDO REPUESTO',
    listo_entrega: 'LISTO PARA ENTREGA',
    entregado: 'ENTREGADO',
    cancelado: 'CANCELADO',
  };
  return map[status] || status.toUpperCase();
}

/**
 * Generates an A4 PDF Vector document using jsPDF
 */
export function generateOrderPdfA4(order: Order, settings: CompanySettings): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const showPrice = settings.orderConfig?.showPriceInClientPdf ?? true;
  const showTech = settings.orderConfig?.showTechnicianName ?? true;

  // 1. Header Bar (Company info left, Order badge right)
  const headerStart = y;
  
  // Try adding logo if present
  let hasLogo = false;
  if (settings.logoUrl && settings.logoUrl.startsWith('data:image/')) {
    try {
      const imgProps = pdf.getImageProperties(settings.logoUrl);
      const logoWidth = 18;
      const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
      pdf.addImage(settings.logoUrl, 'JPEG', margin, y, logoWidth, Math.min(logoHeight, 18));
      hasLogo = true;
    } catch {
      hasLogo = false;
    }
  }

  const textLeftMargin = hasLogo ? margin + 22 : margin;
  
  // Company Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.text(settings.name || 'SERVICIO TÉCNICO', textLeftMargin, y + 4);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105); // slate-600
  
  let compLine = y + 8;
  if (settings.tradeName || settings.taxId) {
    pdf.text(`${settings.tradeName || ''} ${settings.taxId ? `• CUIT/TaxID: ${settings.taxId}` : ''}`, textLeftMargin, compLine);
    compLine += 3.8;
  }
  if (settings.address || settings.city) {
    pdf.text(`${settings.address || ''} • ${settings.city || ''} (${settings.postalCode || ''})`, textLeftMargin, compLine);
    compLine += 3.8;
  }
  if (settings.phone || settings.email) {
    pdf.text(`Tel/WhatsApp: ${settings.phone || ''} • Email: ${settings.email || ''}`, textLeftMargin, compLine);
    compLine += 3.8;
  }
  if (showTech) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(67, 56, 202); // indigo-700
    pdf.text(`Técnico Responsable: ${order.technician || settings.defaultTechnician || 'Taller'}`, textLeftMargin, compLine);
    compLine += 3.8;
  }

  // Order Badge Right
  const badgeWidth = 56;
  const badgeX = pageWidth - margin - badgeWidth;
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.roundedRect(badgeX, headerStart, badgeWidth, 10, 1.5, 1.5, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`ORDEN: ${order.orderNumber}`, badgeX + badgeWidth / 2, headerStart + 6.5, { align: 'center' });

  // Date and Status under badge
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Fecha: ${formatDate(order.createdAt)}`, badgeX + badgeWidth, headerStart + 14, { align: 'right' });
  
  if (order.estimatedDeliveryDate) {
    pdf.text(`Entrega Est.: ${new Date(order.estimatedDeliveryDate).toLocaleDateString('es-AR')}`, badgeX + badgeWidth, headerStart + 18, { align: 'right' });
  }

  // Status Badge
  pdf.setFillColor(241, 245, 249);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(badgeX + 6, headerStart + (order.estimatedDeliveryDate ? 21 : 17), badgeWidth - 6, 6, 1, 1, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(30, 41, 59);
  pdf.text(`ESTADO: ${getStatusLabel(order.status)}`, badgeX + 6 + (badgeWidth - 6) / 2, headerStart + (order.estimatedDeliveryDate ? 25 : 21), { align: 'center' });

  y = Math.max(compLine + 2, headerStart + 30);

  // Separator line
  pdf.setDrawColor(30, 41, 59);
  pdf.setLineWidth(0.6);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 4;

  // 2. Client and Device Boxes (2 Columns)
  const colWidth = (contentWidth - 4) / 2;
  const boxHeight = 36;

  // Left Box: Cliente
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, colWidth, boxHeight, 1.5, 1.5, 'FD');

  pdf.setFillColor(224, 231, 255); // indigo-100
  pdf.roundedRect(margin, y, colWidth, 6.5, 1.5, 1.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(49, 46, 129); // indigo-900
  pdf.text('DATOS DEL CLIENTE', margin + 3, y + 4.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(15, 23, 42);
  let cy = y + 10.5;
  pdf.text(`Nombre: ${order.client?.name || 'Cliente'}`, margin + 3, cy);
  cy += 4;
  pdf.text(`Teléfono: ${order.client?.phone || 'No especificado'}`, margin + 3, cy);
  cy += 4;
  pdf.text(`DNI / CUIT: ${order.client?.documentId || 'No especificado'}`, margin + 3, cy);
  cy += 4;
  pdf.text(`Email: ${order.client?.email || 'No especificado'}`, margin + 3, cy);
  cy += 4;
  const clientAddr = order.client?.address ? `${order.client.address}, ${order.client.city || ''}` : 'No especificado';
  const splitAddr = pdf.splitTextToSize(`Domicilio: ${clientAddr}`, colWidth - 6);
  pdf.text(splitAddr, margin + 3, cy);

  // Right Box: Dispositivo
  const rightBoxX = margin + colWidth + 4;
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(rightBoxX, y, colWidth, boxHeight, 1.5, 1.5, 'FD');

  pdf.setFillColor(224, 231, 255);
  pdf.roundedRect(rightBoxX, y, colWidth, 6.5, 1.5, 1.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(49, 46, 129);
  pdf.text('DATOS DEL DISPOSITIVO', rightBoxX + 3, y + 4.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(15, 23, 42);
  let dy = y + 10.5;
  pdf.text(`Equipo: ${order.device?.brand || ''} ${order.device?.model || ''} ${order.device?.color ? `(${order.device.color})` : ''}`, rightBoxX + 3, dy);
  dy += 4;
  pdf.text(`N° Serie / IMEI: ${order.device?.serialOrImei || 'Sin S/N visible'}`, rightBoxX + 3, dy);
  dy += 4;
  const lockText = order.device?.lockType === 'none' || !order.device?.lockType
    ? 'Sin código'
    : `${order.device.lockType.toUpperCase()}: ${order.device.lockCode || 'Indicado'}`;
  pdf.text(`Bloqueo / Clave: ${lockText}`, rightBoxX + 3, dy);
  dy += 4;
  const accText = (order.device?.accessories || []).length > 0
    ? (order.device?.accessories || []).join(', ')
    : 'Ninguno / Solo equipo';
  const splitAcc = pdf.splitTextToSize(`Accesorios: ${accText}`, colWidth - 6);
  pdf.text(splitAcc, rightBoxX + 3, dy);

  y += boxHeight + 4;

  // 3. Reception Notes / Problem
  pdf.setFillColor(254, 243, 199); // amber-100
  pdf.setDrawColor(251, 191, 36); // amber-400
  const noteText = order.conditionNotes || 'Equipo recibido para diagnóstico técnico general.';
  const noteLines = pdf.splitTextToSize(`Falla / Estado de Recepción: ${noteText}`, contentWidth - 6);
  const noteBoxHeight = Math.max(12, noteLines.length * 3.8 + 5);

  pdf.roundedRect(margin, y, contentWidth, noteBoxHeight, 1.5, 1.5, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(120, 53, 15); // amber-900
  pdf.text(noteLines, margin + 3, y + 4.5);

  y += noteBoxHeight + 4;

  // 4. Services Table
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('DETALLE DE SERVICIOS Y REPUESTOS', margin, y + 3);
  y += 5;

  // Table Header
  const colDescW = showPrice ? contentWidth - 64 : contentWidth - 18;
  const colQtyW = 18;
  const colUnitW = 23;
  const colTotW = 23;

  pdf.setFillColor(241, 245, 249);
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(margin, y, contentWidth, 6, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(51, 65, 85);
  pdf.text('DESCRIPCIÓN', margin + 2, y + 4.2);
  pdf.text('CANT.', margin + colDescW + colQtyW / 2, y + 4.2, { align: 'center' });
  if (showPrice) {
    pdf.text('P. UNIT.', margin + colDescW + colQtyW + colUnitW - 2, y + 4.2, { align: 'right' });
    pdf.text('TOTAL', margin + contentWidth - 2, y + 4.2, { align: 'right' });
  }

  y += 6;

  // Table Rows
  const items = order.services && order.services.length > 0
    ? order.services
    : [{ id: '1', name: 'Diagnóstico y Revisión Técnica', quantity: 1, unitPrice: order.totalAmount || 0, totalPrice: order.totalAmount || 0 }];

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);

  items.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? 255 : 250;
    pdf.setFillColor(rowBg, rowBg, rowBg);
    pdf.rect(margin, y, contentWidth, 5.5, 'FD');

    pdf.setTextColor(15, 23, 42);
    pdf.text(item.name || 'Servicio', margin + 2, y + 3.8);
    pdf.text(String(item.quantity || 1), margin + colDescW + colQtyW / 2, y + 3.8, { align: 'center' });

    if (showPrice) {
      pdf.text(formatCurrency(item.unitPrice || 0, settings), margin + colDescW + colQtyW + colUnitW - 2, y + 3.8, { align: 'right' });
      pdf.setFont('helvetica', 'bold');
      pdf.text(formatCurrency(item.totalPrice || 0, settings), margin + contentWidth - 2, y + 3.8, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
    }

    y += 5.5;
  });

  // Financial Summary Box (if showPrice)
  if (showPrice) {
    y += 2;
    const sumBoxW = 65;
    const sumBoxX = pageWidth - margin - sumBoxW;
    const sumBoxH = 18;

    // Optional Workshop Payment & QR Code Box (Left side of totals)
    const payDetails = settings.paymentDetails;
    if (payDetails?.enabled && payDetails?.showInPdf !== false && (payDetails?.alias || payDetails?.qrCodeUrl)) {
      const payBoxX = margin;
      const payBoxW = contentWidth - sumBoxW - 3;
      const payBoxH = sumBoxH;

      pdf.setFillColor(240, 253, 244); // emerald-50
      pdf.setDrawColor(187, 247, 208); // emerald-200
      pdf.roundedRect(payBoxX, y, payBoxW, payBoxH, 1.5, 1.5, 'FD');

      let textX = payBoxX + 2.5;

      // Render QR code image if present
      if (payDetails.qrCodeUrl && (payDetails.qrCodeUrl.startsWith('data:image') || payDetails.qrCodeUrl.startsWith('http'))) {
        try {
          const qrSize = 15;
          const format = payDetails.qrCodeUrl.includes('image/png') ? 'PNG' : 'JPEG';
          pdf.addImage(payDetails.qrCodeUrl, format, payBoxX + 1.5, y + 1.5, qrSize, qrSize);
          textX = payBoxX + qrSize + 3;
        } catch (e) {
          console.warn('No se pudo renderizar la imagen QR en el PDF:', e);
        }
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(22, 101, 52); // emerald-800
      pdf.text('PAGAR CON QR O TRANSFERENCIA:', textX, y + 3.8);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(15, 23, 42);
      pdf.text('ALIAS:', textX, y + 7.5);

      pdf.setFont('courier', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(67, 56, 202); // indigo-700
      pdf.text(payDetails.alias || 'techfix.taller.mp', textX + 9.5, y + 7.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.8);
      pdf.setTextColor(71, 85, 105);
      const bankLine = [
        payDetails.bankName,
        payDetails.cbuCvu ? `CBU/CVU: ${payDetails.cbuCvu}` : '',
        payDetails.accountHolder ? `Titular: ${payDetails.accountHolder}` : '',
      ]
        .filter(Boolean)
        .join(' • ');
      if (bankLine) {
        pdf.text(pdf.splitTextToSize(bankLine, payBoxW - (textX - payBoxX) - 2).slice(0, 1), textX, y + 11.2);
      }

      if (payDetails.instructions) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(5.2);
        pdf.setTextColor(21, 128, 61);
        pdf.text(pdf.splitTextToSize(payDetails.instructions, payBoxW - (textX - payBoxX) - 2).slice(0, 1), textX, y + 14.8);
      }
    }

    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(203, 213, 225);
    pdf.roundedRect(sumBoxX, y, sumBoxW, sumBoxH, 1.5, 1.5, 'FD');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Total Reparación:', sumBoxX + 3, y + 4.5);
    pdf.text(formatCurrency(order.totalAmount || 0, settings), sumBoxX + sumBoxW - 3, y + 4.5, { align: 'right' });

    pdf.setTextColor(16, 185, 129); // emerald-600
    pdf.text('Seña / Anticipo:', sumBoxX + 3, y + 9);
    pdf.text(`- ${formatCurrency(order.depositPaid || 0, settings)}`, sumBoxX + sumBoxW - 3, y + 9, { align: 'right' });

    pdf.setDrawColor(203, 213, 225);
    pdf.line(sumBoxX + 2, y + 11.5, sumBoxX + sumBoxW - 2, y + 11.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Saldo a Cancelar:', sumBoxX + 3, y + 15.5);
    pdf.setTextColor(190, 18, 60); // rose-700
    pdf.text(formatCurrency(order.balanceDue || 0, settings), sumBoxX + sumBoxW - 3, y + 15.5, { align: 'right' });

    y += sumBoxH + 4;
  } else {
    // If showPrice is false, render payment box full width if enabled
    const payDetails = settings.paymentDetails;
    if (payDetails?.enabled && payDetails?.showInPdf !== false && (payDetails?.alias || payDetails?.qrCodeUrl)) {
      y += 2;
      const payBoxW = contentWidth;
      const payBoxH = 16;

      pdf.setFillColor(240, 253, 244);
      pdf.setDrawColor(187, 247, 208);
      pdf.roundedRect(margin, y, payBoxW, payBoxH, 1.5, 1.5, 'FD');

      let textX = margin + 3;
      if (payDetails.qrCodeUrl && (payDetails.qrCodeUrl.startsWith('data:image') || payDetails.qrCodeUrl.startsWith('http'))) {
        try {
          const qrSize = 13;
          const format = payDetails.qrCodeUrl.includes('image/png') ? 'PNG' : 'JPEG';
          pdf.addImage(payDetails.qrCodeUrl, format, margin + 1.5, y + 1.5, qrSize, qrSize);
          textX = margin + qrSize + 3;
        } catch (e) {
          console.warn('No se pudo renderizar la imagen QR en el PDF:', e);
        }
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(22, 101, 52);
      pdf.text('DATOS DE PAGO / TRANSFERENCIAS:', textX, y + 4);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(15, 23, 42);
      pdf.text('ALIAS:', textX, y + 7.8);

      pdf.setFont('courier', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(67, 56, 202);
      pdf.text(payDetails.alias || 'techfix.taller.mp', textX + 9.5, y + 7.8);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.8);
      pdf.setTextColor(71, 85, 105);
      const bankLine = [
        payDetails.bankName,
        payDetails.cbuCvu ? `CBU/CVU: ${payDetails.cbuCvu}` : '',
        payDetails.accountHolder ? `Titular: ${payDetails.accountHolder}` : '',
      ]
        .filter(Boolean)
        .join(' • ');
      if (bankLine) {
        pdf.text(pdf.splitTextToSize(bankLine, payBoxW - (textX - margin) - 2).slice(0, 1), textX, y + 11.5);
      }

      y += payBoxH + 4;
    } else {
      y += 4;
    }
  }

  // 5. Terms & Warranty Clauses
  const termsText = settings.orderConfig?.termsAndClauses ||
    '1. Todo trabajo cuenta con garantía sobre la mano de obra realizada.\n2. Equipos no retirados pasados 90 días devengan gastos de custodia.';
  const termLines = pdf.splitTextToSize(termsText, contentWidth - 6);
  const termBoxHeight = Math.min(22, termLines.length * 3 + 6);

  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, contentWidth, termBoxHeight, 1.5, 1.5, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(51, 65, 85);
  pdf.text('TÉRMINOS Y CONDICIONES DE GARANTÍA:', margin + 3, y + 3.8);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(termLines.slice(0, 5), margin + 3, y + 7);

  y += termBoxHeight + 4;

  // 6. Promo Banner (if enabled)
  if (settings.orderConfig?.promoBannerEnabled && settings.orderConfig?.promoBannerText) {
    pdf.setFillColor(238, 242, 255);
    pdf.setDrawColor(199, 210, 254);
    pdf.roundedRect(margin, y, contentWidth, 7, 1, 1, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(67, 56, 202);
    pdf.text(settings.orderConfig.promoBannerText, margin + contentWidth / 2, y + 4.8, { align: 'center' });
    y += 9;
  }

  // 7. Signatures Row
  const sigY = pageHeight - margin - 20;
  const sigWidth = (contentWidth - 20) / 2;

  // Client signature
  pdf.setDrawColor(148, 163, 184);
  pdf.setLineDashPattern([1.5, 1.5], 0);
  pdf.line(margin + 5, sigY, margin + 5 + sigWidth, sigY);
  pdf.setLineDashPattern([], 0);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(30, 41, 59);
  pdf.text('Firma y Aclaración del Cliente', margin + 5 + sigWidth / 2, sigY + 4, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Conformidad de recepción y condiciones', margin + 5 + sigWidth / 2, sigY + 7.5, { align: 'center' });

  // Workshop signature
  const sig2X = margin + sigWidth + 15;
  pdf.setDrawColor(148, 163, 184);
  pdf.setLineDashPattern([1.5, 1.5], 0);
  pdf.line(sig2X, sigY, sig2X + sigWidth, sigY);
  pdf.setLineDashPattern([], 0);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(30, 41, 59);
  pdf.text('Firma / Sello del Servicio Técnico', sig2X + sigWidth / 2, sigY + 4, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(settings.name || 'Taller Técnico', sig2X + sigWidth / 2, sigY + 7.5, { align: 'center' });

  // 8. Mandatory Footer / Socalo
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text('codeghos/sistemas • www.codeghos.com', pageWidth / 2, pageHeight - margin + 2, { align: 'center' });

  return pdf;
}

/**
 * Generates an 80mm Ticket format PDF using jsPDF
 */
export function generateOrderPdfTicket(order: Order, settings: CompanySettings): jsPDF {
  const pageWidth = 80;
  const pageHeight = 190;
  const margin = 4;
  const contentWidth = pageWidth - margin * 2;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight],
  });

  let y = margin + 3;

  // Header Center
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text(settings.name || 'SERVICIO TÉCNICO', pageWidth / 2, y, { align: 'center' });
  y += 4;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105);
  if (settings.tradeName) {
    pdf.text(settings.tradeName, pageWidth / 2, y, { align: 'center' });
    y += 3.2;
  }
  if (settings.taxId) {
    pdf.text(`CUIT: ${settings.taxId}`, pageWidth / 2, y, { align: 'center' });
    y += 3.2;
  }
  if (settings.phone) {
    pdf.text(`Tel: ${settings.phone}`, pageWidth / 2, y, { align: 'center' });
    y += 3.2;
  }
  if (settings.address) {
    pdf.text(settings.address, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
  }

  // Dotted separator
  pdf.setLineDashPattern([1, 1], 0);
  pdf.line(margin, y, pageWidth - margin, y);
  pdf.setLineDashPattern([], 0);
  y += 3.5;

  // Order Number Big
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`ORDEN: ${order.orderNumber}`, pageWidth / 2, y, { align: 'center' });
  y += 4;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Fecha: ${formatDate(order.createdAt)}`, pageWidth / 2, y, { align: 'center' });
  y += 3;
  pdf.text(`Estado: ${getStatusLabel(order.status)}`, pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Client & Device Box
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, y, contentWidth, 24, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`Cliente: ${order.client?.name || 'Cliente'}`, margin + 2, y + 3.8);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.text(`Tel: ${order.client?.phone || 'Sin tel.'}`, margin + 2, y + 7.5);
  pdf.text(`Equipo: ${order.device?.brand || ''} ${order.device?.model || ''}`, margin + 2, y + 11.2);
  pdf.text(`S/N: ${order.device?.serialOrImei || 'Sin serial'}`, margin + 2, y + 14.8);
  const lock = order.device?.lockType === 'none' || !order.device?.lockType ? 'Sin clave' : `${order.device.lockType}: ${order.device.lockCode || ''}`;
  pdf.text(`Clave: ${lock}`, margin + 2, y + 18.5);
  y += 26;

  // Reception problem
  if (order.conditionNotes) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.text('Falla / Motivo:', margin, y);
    y += 3;
    pdf.setFont('helvetica', 'normal');
    const noteLines = pdf.splitTextToSize(order.conditionNotes, contentWidth);
    pdf.text(noteLines.slice(0, 3), margin, y);
    y += Math.min(noteLines.length * 3, 9) + 2;
  }

  // Services
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text('Servicios / Presupuesto:', margin, y);
  y += 3.5;

  (order.services || []).forEach((s) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.text(`${s.quantity}x ${s.name}`, margin, y);
    pdf.text(formatCurrency(s.totalPrice, settings), pageWidth - margin, y, { align: 'right' });
    y += 3.5;
  });

  y += 1;
  pdf.line(margin, y, pageWidth - margin, y);
  y += 3.5;

  // Totals
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('TOTAL:', margin, y);
  pdf.text(formatCurrency(order.totalAmount || 0, settings), pageWidth - margin, y, { align: 'right' });
  y += 3.5;

  if (order.depositPaid > 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.text('Seña:', margin, y);
    pdf.text(`-${formatCurrency(order.depositPaid || 0, settings)}`, pageWidth - margin, y, { align: 'right' });
    y += 3.2;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('SALDO:', margin, y);
  pdf.text(formatCurrency(order.balanceDue || 0, settings), pageWidth - margin, y, { align: 'right' });
  y += 5.5;

  // Workshop Payment QR & Alias in Ticket
  const payDetails = settings.paymentDetails;
  if (payDetails?.enabled && payDetails?.showInPdf !== false && (payDetails?.alias || payDetails?.qrCodeUrl)) {
    pdf.setLineDashPattern([1, 1], 0);
    pdf.line(margin, y, pageWidth - margin, y);
    pdf.setLineDashPattern([], 0);
    y += 3;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(22, 101, 52);
    pdf.text('MEDIOS DE PAGO / TRANSFERENCIA', pageWidth / 2, y, { align: 'center' });
    y += 3.5;

    if (payDetails.qrCodeUrl && (payDetails.qrCodeUrl.startsWith('data:image') || payDetails.qrCodeUrl.startsWith('http'))) {
      try {
        const qrSize = 22;
        const format = payDetails.qrCodeUrl.includes('image/png') ? 'PNG' : 'JPEG';
        pdf.addImage(payDetails.qrCodeUrl, format, (pageWidth - qrSize) / 2, y, qrSize, qrSize);
        y += qrSize + 2.5;
      } catch (e) {
        console.warn('Error al imprimir QR en ticket:', e);
      }
    }

    if (payDetails.alias) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`ALIAS: ${payDetails.alias}`, pageWidth / 2, y, { align: 'center' });
      y += 3.2;
    }

    if (payDetails.cbuCvu) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`CBU: ${payDetails.cbuCvu}`, pageWidth / 2, y, { align: 'center' });
      y += 2.8;
    }

    if (payDetails.bankName) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`${payDetails.bankName} ${payDetails.accountHolder ? `• ${payDetails.accountHolder}` : ''}`, pageWidth / 2, y, { align: 'center' });
      y += 2.8;
    }

    if (payDetails.instructions) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(5);
      pdf.setTextColor(21, 128, 61);
      const instLines = pdf.splitTextToSize(payDetails.instructions, contentWidth);
      pdf.text(instLines.slice(0, 2), pageWidth / 2, y, { align: 'center' });
      y += instLines.slice(0, 2).length * 2.5 + 1;
    }
  }

  y += 2;
  // Signature line
  pdf.line(margin + 6, y, pageWidth - margin - 6, y);
  y += 3.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.text('Firma del Cliente', pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Footer
  pdf.setFontSize(5.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text('codeghos/sistemas • www.codeghos.com', pageWidth / 2, y, { align: 'center' });

  return pdf;
}

/**
 * Downloads the order PDF directly to the user's computer/phone
 */
export async function downloadOrderPdf(
  order: Order,
  settings: CompanySettings,
  format: 'a4' | 'ticket' = 'a4'
): Promise<void> {
  const pdf = format === 'ticket'
    ? generateOrderPdfTicket(order, settings)
    : generateOrderPdfA4(order, settings);

  const cleanOrderNum = order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Orden_${cleanOrderNum}.pdf`;

  pdf.save(filename);
}

/**
 * Shares the PDF via Web Share API or falls back to WhatsApp
 */
export async function sharePdfViaWhatsApp(
  order: Order,
  settings: CompanySettings,
  messageText: string,
  format: 'a4' | 'ticket' = 'a4'
): Promise<{ sharedViaNative: boolean }> {
  const pdf = format === 'ticket'
    ? generateOrderPdfTicket(order, settings)
    : generateOrderPdfA4(order, settings);

  const cleanOrderNum = order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Orden_${cleanOrderNum}.pdf`;
  const blob = pdf.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });

  // Try Web Share API (native on mobile devices)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Orden de Servicio ${order.orderNumber}`,
        text: messageText,
        files: [file],
      });
      return { sharedViaNative: true };
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Error al compartir nativamente:', err);
      }
    }
  }

  // Fallback: download PDF and open WhatsApp Web/App
  pdf.save(filename);

  const cleanPhone = (order.client?.phone || '').replace(/[^0-9]/g, '');
  const encodedMsg = encodeURIComponent(
    `${messageText}\n\n📄 *Te adjunto el comprobante PDF de tu orden (${filename}).*`
  );
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedMsg}`
    : `https://wa.me/?text=${encodedMsg}`;

  setTimeout(() => {
    window.open(waUrl, '_blank');
  }, 350);

  return { sharedViaNative: false };
}

/**
 * Clean Printing Function that works reliably in iframes, desktops and mobile
 */
export function printOrderCleanly(
  order: Order,
  settings: CompanySettings,
  format: 'a4' | 'ticket' = 'a4'
): void {
  const showPrice = settings.orderConfig?.showPriceInClientPdf ?? true;
  const showTech = settings.orderConfig?.showTechnicianName ?? true;

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Orden_${order.orderNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      font-size: ${format === 'ticket' ? '11px' : '12px'};
      padding: ${format === 'ticket' ? '6px' : '16px'};
      line-height: 1.4;
    }
    .page-container {
      max-width: ${format === 'ticket' ? '360px' : '800px'};
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .company-title {
      font-size: ${format === 'ticket' ? '14px' : '18px'};
      font-weight: 800;
      text-transform: uppercase;
    }
    .order-badge {
      background: #0f172a;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 700;
      font-family: monospace;
      font-size: 14px;
      text-align: right;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: ${format === 'ticket' ? '1fr' : '1fr 1fr'};
      gap: 10px;
      margin-bottom: 12px;
    }
    .box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
    }
    .box-title {
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      color: #312e81;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .alert-box {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      color: #78350f;
      padding: 8px 10px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 11px;
    }
    th {
      background: #f1f5f9;
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1px solid #cbd5e1;
      font-weight: 700;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 14px;
    }
    .totals-card {
      width: 240px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 24px;
      text-align: center;
    }
    .sig-line {
      border-top: 1px dashed #94a3b8;
      padding-top: 6px;
      font-weight: 600;
      font-size: 11px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 10px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header">
      <div>
        <div class="company-title">${settings.name || 'SERVICIO TÉCNICO'}</div>
        <div style="font-size: 11px; color: #475569;">${settings.tradeName || ''} • CUIT: ${settings.taxId || ''}</div>
        <div style="font-size: 11px; color: #475569;">📍 ${settings.address || ''} • ${settings.city || ''}</div>
        <div style="font-size: 11px; color: #475569;">📞 Tel: ${settings.phone || ''} • ✉️ ${settings.email || ''}</div>
        ${showTech ? `<div style="color: #4338ca; font-weight: 600; font-size: 11px;">Técnico: ${order.technician || settings.defaultTechnician || 'Taller'}</div>` : ''}
      </div>
      <div style="text-align: right;">
        <div class="order-badge">${order.orderNumber}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Fecha: ${formatDate(order.createdAt)}</div>
        <div style="font-size: 11px; color: #4338ca; font-weight: 600; margin-top: 2px;">Estado: ${getStatusLabel(order.status)}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="box">
        <div class="box-title">Datos del Cliente</div>
        <div><strong>Nombre:</strong> ${order.client?.name || 'Cliente'}</div>
        <div><strong>Teléfono:</strong> ${order.client?.phone || 'No especificado'}</div>
        <div><strong>DNI/CUIT:</strong> ${order.client?.documentId || 'No especificado'}</div>
        <div><strong>Email:</strong> ${order.client?.email || 'No especificado'}</div>
        <div><strong>Domicilio:</strong> ${order.client?.address ? `${order.client.address}, ${order.client.city || ''}` : 'No especificado'}</div>
      </div>

      <div class="box">
        <div class="box-title">Dispositivo Registrado</div>
        <div><strong>Equipo:</strong> ${order.device?.brand || ''} ${order.device?.model || ''} ${order.device?.color ? `(${order.device.color})` : ''}</div>
        <div><strong>N° Serie/IMEI:</strong> <code>${order.device?.serialOrImei || 'Sin S/N'}</code></div>
        <div><strong>Bloqueo:</strong> ${order.device?.lockType === 'none' || !order.device?.lockType ? 'Sin código' : `${order.device.lockType.toUpperCase()}: ${order.device.lockCode || ''}`}</div>
        <div><strong>Accesorios:</strong> ${(order.device?.accessories || []).length > 0 ? (order.device?.accessories || []).join(', ') : 'Ninguno'}</div>
      </div>
    </div>

    <div class="alert-box">
      <strong>Falla / Estado de Recepción:</strong>
      <div>${order.conditionNotes || 'Recepción para diagnóstico técnico general.'}</div>
    </div>

    <div style="font-weight: 700; margin-bottom: 6px; font-size: 11px;">DETALLE DE SERVICIOS Y REPUESTOS</div>
    <table>
      <thead>
        <tr>
          <th>Descripción</th>
          <th class="text-center" style="width: 50px;">Cant.</th>
          ${showPrice ? `<th class="text-right" style="width: 100px;">Precio Unit.</th><th class="text-right" style="width: 100px;">Total</th>` : ''}
        </tr>
      </thead>
      <tbody>
        ${(order.services || []).map(item => `
          <tr>
            <td><strong>${item.name}</strong>${item.description ? `<br><small style="color: #64748b;">${item.description}</small>` : ''}</td>
            <td class="text-center">${item.quantity}</td>
            ${showPrice ? `<td class="text-right">${formatCurrency(item.unitPrice || 0, settings)}</td><td class="text-right"><strong>${formatCurrency(item.totalPrice || 0, settings)}</strong></td>` : ''}
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${showPrice ? `
      <div class="totals">
        <div class="totals-card">
          <div style="display: flex; justify-content: space-between;"><span>Total:</span> <strong>${formatCurrency(order.totalAmount || 0, settings)}</strong></div>
          <div style="display: flex; justify-content: space-between; color: #16a34a;"><span>Seña:</span> <span>-${formatCurrency(order.depositPaid || 0, settings)}</span></div>
          <div style="display: flex; justify-content: space-between; font-weight: 800; border-top: 1px solid #cbd5e1; padding-top: 4px; margin-top: 4px; color: #be123c;">
            <span>Saldo a Cobrar:</span> <span>${formatCurrency(order.balanceDue || 0, settings)}</span>
          </div>
        </div>
      </div>
    ` : ''}

    ${settings.paymentDetails && settings.paymentDetails.enabled && settings.paymentDetails.showInPdf !== false && (settings.paymentDetails.alias || settings.paymentDetails.qrCodeUrl) ? `
      <div style="display: flex; gap: 12px; background: #f0fdf4; border: 1px solid #86efac; padding: 10px; border-radius: 6px; margin-bottom: 12px; align-items: center;">
        ${settings.paymentDetails.qrCodeUrl ? `
          <img src="${settings.paymentDetails.qrCodeUrl}" alt="QR de Pago" style="width: 72px; height: 72px; object-fit: contain; background: #fff; padding: 3px; border-radius: 6px; border: 1px solid #bbf7d0;" />
        ` : ''}
        <div style="font-size: 11px; color: #14532d; flex: 1;">
          <div style="font-weight: 800; text-transform: uppercase; margin-bottom: 3px; color: #166534; font-size: 11px;">💳 Medios de Pago & Transferencias</div>
          ${settings.paymentDetails.alias ? `<div><strong>ALIAS:</strong> <code style="background: #dcfce7; padding: 2px 6px; border-radius: 4px; font-weight: 800; color: #15803d; font-family: monospace; font-size: 12px;">${settings.paymentDetails.alias}</code></div>` : ''}
          ${settings.paymentDetails.cbuCvu ? `<div style="margin-top: 2px;"><strong>CBU/CVU:</strong> <code style="font-size: 10px; font-family: monospace;">${settings.paymentDetails.cbuCvu}</code></div>` : ''}
          ${settings.paymentDetails.bankName || settings.paymentDetails.accountHolder ? `<div style="margin-top: 2px; color: #166534;"><strong>Banco / Titular:</strong> ${settings.paymentDetails.bankName || ''} ${settings.paymentDetails.accountHolder ? `(${settings.paymentDetails.accountHolder})` : ''}</div>` : ''}
          ${settings.paymentDetails.instructions ? `<div style="font-size: 10px; color: #15803d; margin-top: 4px; font-style: italic;">💬 ${settings.paymentDetails.instructions}</div>` : ''}
        </div>
      </div>
    ` : ''}

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px; font-size: 10px; color: #475569; margin-bottom: 14px;">
      <strong>Garantía y Condiciones:</strong>
      <div>${settings.orderConfig?.termsAndClauses || 'Todo trabajo cuenta con garantía técnica sobre la mano de obra.'}</div>
    </div>

    ${settings.orderConfig?.promoBannerEnabled && settings.orderConfig?.promoBannerText ? `
      <div style="background: #eef2ff; border: 1px solid #c7d2fe; color: #4338ca; text-align: center; padding: 6px; border-radius: 6px; font-weight: 600; margin-bottom: 14px;">
        ${settings.orderConfig.promoBannerText}
      </div>
    ` : ''}

    <div class="signatures">
      <div class="sig-line">
        Firma del Cliente<br>
        <small style="color: #64748b; font-weight: normal;">Conformidad de servicio</small>
      </div>
      <div class="sig-line">
        Firma / Sello del Taller<br>
        <small style="color: #64748b; font-weight: normal;">${settings.name || 'Servicio Técnico'}</small>
      </div>
    </div>

    <div class="footer">
      codeghos/sistemas • www.codeghos.com
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>
  `;

  // Create a hidden print iframe
  let printIframe = document.getElementById('techfix-print-frame') as HTMLIFrameElement;
  if (!printIframe) {
    printIframe = document.createElement('iframe');
    printIframe.id = 'techfix-print-frame';
    printIframe.style.position = 'fixed';
    printIframe.style.top = '-9999px';
    printIframe.style.left = '-9999px';
    printIframe.style.width = '10px';
    printIframe.style.height = '10px';
    printIframe.style.border = 'none';
    document.body.appendChild(printIframe);
  }

  try {
    const doc = printIframe.contentDocument || printIframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (e) {
          // Fallback to window.print()
          window.print();
        }
      }, 500);
      return;
    }
  } catch (err) {
    console.warn('Iframe print failed, falling back to window.print():', err);
  }

  // Fallback if iframe fails
  window.print();
}
