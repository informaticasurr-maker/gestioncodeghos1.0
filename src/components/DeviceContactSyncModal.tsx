import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  RefreshCw,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  UserCheck,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client } from '../types';

interface ParsedContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  isDuplicate: boolean;
  duplicateOf?: string;
  selected: boolean;
}

interface DeviceContactSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceContactSyncModal: React.FC<DeviceContactSyncModalProps> = ({ isOpen, onClose }) => {
  const { clients, batchAddClients } = useApp();

  const [activeSourceTab, setActiveSourceTab] = useState<'device' | 'vcf' | 'csv' | 'paste' | 'export'>('device');
  const [isSupportedContactPicker, setIsSupportedContactPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Parsed contacts ready for review
  const [contactsList, setContactsList] = useState<ParsedContact[]>([]);
  const [previewSearch, setPreviewSearch] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Quick paste text area
  const [pastedText, setPastedText] = useState('');

  // Check if Contact Picker API is available in current browser/device
  useEffect(() => {
    const isSupported = 'contacts' in navigator && 'ContactsManager' in window && typeof (navigator as any).contacts?.select === 'function';
    setIsSupportedContactPicker(isSupported);
    if (!isSupported && activeSourceTab === 'device') {
      // Keep on device tab with instructions or allow user to see native status
    }
  }, [activeSourceTab]);

  if (!isOpen) return null;

  // Clean phone helper for comparison
  const normalizePhone = (num: string) => {
    return (num || '').replace(/[^0-9]/g, '');
  };

  // Process raw imported contacts and check for duplicates against existing DB
  const processRawContacts = (rawList: Array<{ name: string; phone: string; email?: string; address?: string; city?: string; notes?: string }>) => {
    if (!rawList || rawList.length === 0) {
      setStatusMessage({ type: 'info', text: 'No se encontraron contactos válidos en la fuente seleccionada.' });
      return;
    }

    const processed: ParsedContact[] = rawList
      .filter((c) => c.name.trim() || c.phone.trim())
      .map((c, index) => {
        const cleanNumber = normalizePhone(c.phone);
        const existingClient = clients.find((existing) => {
          const existingClean = normalizePhone(existing.phone);
          if (cleanNumber && existingClean && (cleanNumber === existingClean || cleanNumber.endsWith(existingClean) || existingClean.endsWith(cleanNumber))) {
            return true;
          }
          if ((existing.name || '').toLowerCase().trim() === (c.name || '').toLowerCase().trim() && c.name?.trim().length > 3) {
            return true;
          }
          return false;
        });

        const isDup = Boolean(existingClient);

        return {
          id: `tmp-${Date.now()}-${index}`,
          name: c.name.trim() || `Contacto ${c.phone}`,
          phone: c.phone.trim(),
          email: (c.email || '').trim(),
          address: (c.address || '').trim(),
          city: (c.city || '').trim(),
          notes: (c.notes || '').trim() || 'Importado desde contactos del dispositivo',
          isDuplicate: isDup,
          duplicateOf: existingClient ? `${existingClient.name} (${existingClient.phone})` : undefined,
          selected: !isDup, // Preselect if not duplicate
        };
      });

    setContactsList(processed);
    const newCount = processed.filter((c) => !c.isDuplicate).length;
    const dupCount = processed.filter((c) => c.isDuplicate).length;

    setStatusMessage({
      type: 'success',
      text: `Se cargaron ${processed.length} contactos (${newCount} nuevos, ${dupCount} ya registrados). Revisa la lista abajo y confirma la sincronización.`,
    });
  };

  // 1. Native Device Contact Picker API
  const handlePickNativeContacts = async () => {
    try {
      setIsLoading(true);
      setStatusMessage(null);

      if (!('contacts' in navigator && (navigator as any).contacts?.select)) {
        throw new Error('El navegador no soporta el selector nativo de contactos. Por favor usa la opción de archivo .VCF o pega tus contactos.');
      }

      const props = ['name', 'tel', 'email', 'address'];
      const opts = { multiple: true };
      const contacts = await (navigator as any).contacts.select(props, opts);

      if (!contacts || contacts.length === 0) {
        setIsLoading(false);
        setStatusMessage({ type: 'info', text: 'No se seleccionó ningún contacto del dispositivo.' });
        return;
      }

      const formatted = contacts.map((c: any) => {
        const contactName = Array.isArray(c.name) ? c.name[0] : c.name || 'Sin Nombre';
        const contactTel = Array.isArray(c.tel) ? c.tel[0] : c.tel || '';
        const contactEmail = Array.isArray(c.email) ? c.email[0] : c.email || '';
        let contactAddress = '';
        let contactCity = '';

        if (Array.isArray(c.address) && c.address[0]) {
          const addr = c.address[0];
          contactAddress = addr.addressLine?.[0] || '';
          contactCity = addr.city || '';
        }

        return {
          name: contactName,
          phone: contactTel,
          email: contactEmail,
          address: contactAddress,
          city: contactCity,
          notes: 'Sincronizado desde agenda nativa del dispositivo',
        };
      });

      processRawContacts(formatted);
    } catch (err: any) {
      console.warn('Contact picker error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'No se pudo acceder a los contactos del dispositivo. Verifica los permisos de tu navegador.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Parse vCard (.vcf) File
  const handleVcfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('Archivo vacío');

        // Split by BEGIN:VCARD
        const cards = text.split(/BEGIN:VCARD/i).filter((card) => card.trim().length > 0);
        const parsed: Array<{ name: string; phone: string; email?: string; address?: string; city?: string; notes?: string }> = [];

        cards.forEach((card) => {
          let name = '';
          let phone = '';
          let email = '';
          let address = '';
          let city = '';
          let notes = '';

          // Lines in this vcard
          const lines = card.split(/\r\n|\r|\n/);

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            // FN: Full Name
            if (/^FN/i.test(cleanLine)) {
              const parts = cleanLine.split(':');
              if (parts.length > 1) {
                name = parts.slice(1).join(':').trim();
              }
            } else if (!name && /^N/i.test(cleanLine)) {
              // N:LastName;FirstName;Middle;Prefix;Suffix
              const parts = cleanLine.split(':');
              if (parts.length > 1) {
                const sub = parts.slice(1).join(':').split(';');
                const lastName = sub[0] || '';
                const firstName = sub[1] || '';
                name = `${firstName} ${lastName}`.trim();
              }
            }

            // TEL:
            if (/^TEL/i.test(cleanLine)) {
              const parts = cleanLine.split(':');
              if (parts.length > 1 && !phone) {
                phone = parts.slice(1).join(':').trim();
              }
            }

            // EMAIL:
            if (/^EMAIL/i.test(cleanLine)) {
              const parts = cleanLine.split(':');
              if (parts.length > 1 && !email) {
                email = parts.slice(1).join(':').trim();
              }
            }

            // ADR:
            if (/^ADR/i.test(cleanLine)) {
              const parts = cleanLine.split(':');
              if (parts.length > 1) {
                const sub = parts.slice(1).join(':').split(';');
                // ADR format: ;;Street;City;State;Postal;Country
                address = sub[2] || '';
                city = sub[3] || '';
              }
            }

            // NOTE:
            if (/^NOTE/i.test(cleanLine)) {
              const parts = cleanLine.split(':');
              if (parts.length > 1) {
                notes = parts.slice(1).join(':').trim();
              }
            }
          }

          if (name || phone) {
            parsed.push({
              name: name || `Contacto ${phone}`,
              phone: phone || 'Sin teléfono',
              email,
              address,
              city,
              notes: notes || 'Importado desde archivo vCard .vcf del dispositivo',
            });
          }
        });

        processRawContacts(parsed);
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: 'Error al interpretar el archivo .vcf: ' + err.message });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // 3. Parse CSV File
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('Archivo vacío');

        const lines = text.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) throw new Error('El archivo CSV debe tener encabezados y al menos un contacto.');

        // Parse header
        const headers = lines[0].split(/[,;\t]/).map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

        const nameIndex = headers.findIndex((h) => h.includes('name') || h.includes('nombre') || h.includes('display'));
        const firstNameIndex = headers.findIndex((h) => h.includes('first name') || h.includes('given'));
        const lastNameIndex = headers.findIndex((h) => h.includes('last name') || h.includes('family'));
        const phoneIndex = headers.findIndex((h) => h.includes('phone') || h.includes('tel') || h.includes('cel') || h.includes('móvil'));
        const emailIndex = headers.findIndex((h) => h.includes('email') || h.includes('correo') || h.includes('mail'));
        const addressIndex = headers.findIndex((h) => h.includes('address') || h.includes('dirección') || h.includes('calle'));
        const cityIndex = headers.findIndex((h) => h.includes('city') || h.includes('ciudad') || h.includes('localidad'));

        const parsed: Array<{ name: string; phone: string; email?: string; address?: string; city?: string; notes?: string }> = [];

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(/[,;\t]/).map((cell) => cell.replace(/^["']|["']$/g, '').trim());
          if (row.length === 0 || row.every((c) => !c)) continue;

          let name = '';
          if (nameIndex >= 0 && row[nameIndex]) {
            name = row[nameIndex];
          } else if (firstNameIndex >= 0 || lastNameIndex >= 0) {
            const first = firstNameIndex >= 0 ? row[firstNameIndex] || '' : '';
            const last = lastNameIndex >= 0 ? row[lastNameIndex] || '' : '';
            name = `${first} ${last}`.trim();
          }

          const phone = phoneIndex >= 0 ? row[phoneIndex] || '' : '';
          const email = emailIndex >= 0 ? row[emailIndex] || '' : '';
          const address = addressIndex >= 0 ? row[addressIndex] || '' : '';
          const city = cityIndex >= 0 ? row[cityIndex] || '' : '';

          if (name || phone) {
            parsed.push({
              name: name || `Contacto ${phone}`,
              phone: phone || 'Sin teléfono',
              email,
              address,
              city,
              notes: 'Importado desde archivo CSV de contactos',
            });
          }
        }

        processRawContacts(parsed);
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: 'Error al interpretar el archivo CSV: ' + err.message });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // 4. Quick Paste Parser
  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setStatusMessage({ type: 'info', text: 'Pega al menos una línea con datos de contacto (ej: Nombre, Teléfono).' });
      return;
    }

    const lines = pastedText.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
    const parsed: Array<{ name: string; phone: string; email?: string; address?: string; city?: string; notes?: string }> = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      // Try split by comma, hyphen or tab
      const parts = trimmed.split(/[,-|\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        const part1 = parts[0];
        const part2 = parts[1];
        const part3 = parts[2] || '';

        // If part1 looks like digits, then it's phone, else part1 is name
        const isPart1Phone = /^\+?[0-9\s()\-]{6,}$/.test(part1);
        const name = isPart1Phone ? part2 : part1;
        const phone = isPart1Phone ? part1 : part2;
        const email = part3.includes('@') ? part3 : '';

        parsed.push({
          name: name || `Contacto ${phone}`,
          phone: phone || 'Sin teléfono',
          email,
          notes: 'Importado mediante texto copiado rápido',
        });
      } else if (trimmed) {
        // Single column - try to detect phone or name
        if (/^\+?[0-9\s()\-]{6,}$/.test(trimmed)) {
          parsed.push({
            name: `Contacto ${trimmed}`,
            phone: trimmed,
            notes: 'Importado mediante texto copiado rápido',
          });
        } else {
          parsed.push({
            name: trimmed,
            phone: 'Sin teléfono',
            notes: 'Importado mediante texto copiado rápido',
          });
        }
      }
    });

    processRawContacts(parsed);
  };

  // Toggle selection
  const toggleContactSelect = (id: string) => {
    setContactsList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const selectAll = (selected: boolean) => {
    setContactsList((prev) =>
      prev.map((c) => {
        if (skipDuplicates && c.isDuplicate && selected) {
          return { ...c, selected: false };
        }
        return { ...c, selected };
      })
    );
  };

  // Perform the actual batch import into AppContext
  const handleConfirmImport = () => {
    const selectedToImport = contactsList.filter((c) => c.selected);

    if (selectedToImport.length === 0) {
      alert('Por favor selecciona al menos un contacto para importar.');
      return;
    }

    const payload = selectedToImport.map((c) => ({
      name: c.name,
      phone: c.phone || 'S/N',
      email: c.email || '',
      documentId: '',
      address: c.address || '',
      city: c.city || '',
      notes: c.notes || 'Sincronizado desde contactos',
    }));

    const importedCount = batchAddClients(payload);
    alert(`🎉 ¡Éxito! Se han importado y sincronizado ${importedCount} contactos en el directorio del taller.`);
    onClose();
  };

  // Export all clients to vCard .vcf file for device
  const handleExportVcf = () => {
    if (clients.length === 0) {
      alert('No hay clientes en el directorio para exportar.');
      return;
    }

    let vcfContent = '';
    clients.forEach((c) => {
      vcfContent += 'BEGIN:VCARD\r\n';
      vcfContent += 'VERSION:3.0\r\n';
      vcfContent += `FN:${c.name}\r\n`;
      vcfContent += `N:${c.name};;;;\r\n`;
      if (c.phone) vcfContent += `TEL;TYPE=CELL:${c.phone}\r\n`;
      if (c.email) vcfContent += `EMAIL;TYPE=INTERNET:${c.email}\r\n`;
      if (c.address || c.city) vcfContent += `ADR;TYPE=HOME:;;${c.address || ''};${c.city || ''};;;;\r\n`;
      if (c.documentId) vcfContent += `NOTE:DNI/CUIT: ${c.documentId} - ${c.notes || ''}\r\n`;
      vcfContent += 'ORG:Cliente Taller TechFix\r\n';
      vcfContent += 'END:VCARD\r\n';
    });

    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contactos_Clientes_Taller_${new Date().toISOString().slice(0, 10)}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export all clients to CSV
  const handleExportCsv = () => {
    if (clients.length === 0) {
      alert('No hay clientes en el directorio para exportar.');
      return;
    }

    const headers = ['Nombre', 'Telefono', 'Email', 'DNI_CUIT', 'Direccion', 'Ciudad', 'Notas', 'Ordenes_Registradas'];
    const rows = clients.map((c) => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.documentId || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${(c.city || '').replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
      c.totalOrdersCount || 0,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Clientes_Taller_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered contacts in preview
  const filteredList = contactsList.filter((c) => {
    const q = (previewSearch || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  const selectedCount = contactsList.filter((c) => c.selected).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] transition-colors">
        
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight text-white">
                  Sincronizar Contactos del Dispositivo
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                  Agenda & Libreta
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Importa contactos directamente de tu teléfono móvil, tablet, archivo vCard (.vcf) o lista CSV.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Switch Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800/60 p-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSourceTab('device')}
            className={`px-3 py-2 rounded-xl flex items-center gap-2 transition ${
              activeSourceTab === 'device'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Teléfono / Contactos Nativos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSourceTab('vcf')}
            className={`px-3 py-2 rounded-xl flex items-center gap-2 transition ${
              activeSourceTab === 'vcf'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Archivo vCard (.vcf)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSourceTab('csv')}
            className={`px-3 py-2 rounded-xl flex items-center gap-2 transition ${
              activeSourceTab === 'csv'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Archivo CSV / Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSourceTab('paste')}
            className={`px-3 py-2 rounded-xl flex items-center gap-2 transition ${
              activeSourceTab === 'paste'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Pegar Texto Rápido</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSourceTab('export')}
            className={`px-3 py-2 rounded-xl flex items-center gap-2 transition ml-auto ${
              activeSourceTab === 'export'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Exportar al Teléfono</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* TAB 1: NATIVE DEVICE CONTACT PICKER */}
          {activeSourceTab === 'device' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Libreta de Contactos del Dispositivo (Android / Chrome)
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Abre el selector nativo del sistema para elegir contactos guardados en tu teléfono o cuenta de Google vinculada.
                  </p>
                  <div className="pt-1">
                    {isSupportedContactPicker ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" />
                        API Nativa de Contactos Disponible en este Navegador
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                        <AlertCircle className="w-3 h-3" />
                        Disponible en navegadores móviles (Android Chrome / Edge). En PC puedes usar archivo .vcf o CSV.
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePickNativeContacts}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 shrink-0 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Accediendo...' : 'Abrir Contactos del Teléfono'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">💡 ¿Cómo funciona en el teléfono?</span>
                <p>1. Al pulsar el botón, tu teléfono mostrará la lista de contactos para que selecciones los que desees.</p>
                <p>2. Podrás previsualizarlos aquí antes de guardarlos, evitando duplicados con los clientes existentes del taller.</p>
              </div>
            </div>
          )}

          {/* TAB 2: VCARD .VCF FILE */}
          {activeSourceTab === 'vcf' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Importar archivo de Contactos de Teléfono / iCloud (.vcf)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Carga el archivo <code>.vcf</code> exportado desde la app Contactos de Android, iPhone, Google Contacts o WhatsApp.
                </p>

                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-blue-500 transition bg-white dark:bg-slate-900">
                  <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Haz clic para seleccionar tu archivo .VCF
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">
                    Compatible con vCard 2.1, 3.0 y 4.0 (contactos únicos o libreta completa)
                  </p>
                  <label className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer transition">
                    <span>Examinar Archivo .VCF</span>
                    <input type="file" accept=".vcf,.vcard" onChange={handleVcfFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CSV FILE */}
          {activeSourceTab === 'csv' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Importar archivo CSV de Google Contacts / Excel
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Importa listas de clientes descargadas desde Google Contacts, Outlook o planillas de cálculo.
                </p>

                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-emerald-500 transition bg-white dark:bg-slate-900">
                  <Upload className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Haz clic para cargar tu archivo .CSV
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">
                    Reconoce columnas como Nombre, Teléfono, Email, Ciudad y Dirección automáticamente
                  </p>
                  <label className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer transition">
                    <span>Examinar Archivo .CSV</span>
                    <input type="file" accept=".csv,.txt" onChange={handleCsvFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QUICK PASTE */}
          {activeSourceTab === 'paste' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Pegar Lista de Contactos de WhatsApp o Bloc de Notas
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pega un listado con un contacto por línea (ej: <code>Juan Perez, +54 9 11 4455-6677, juan@mail.com</code>).
                </p>
              </div>

              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Carlos Gómez, 1133445566&#10;Marina Fernández, +54 9 11 8877-6655, marina@gmail.com&#10;Roberto Silva, 341 5566778"
                className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Procesar Contactos Pegados</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: EXPORT TO PHONE */}
          {activeSourceTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Exportar Directorio del Taller a tu Teléfono
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Descarga todos los clientes registrados ({clients.length}) en formato vCard (.vcf) para guardarlos directamente en la agenda de tu teléfono o sincronizarlos con WhatsApp Business.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportVcf}
                  className="p-4 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 hover:border-indigo-600 text-left transition flex items-start gap-3"
                >
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                      Descargar vCard (.vcf) para Teléfono
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Compatible con Android, iPhone y Google Contacts (1 toque para importar)
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="p-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-600 text-left transition flex items-start gap-3"
                >
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                      Descargar archivo CSV / Excel
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Para abrir en hojas de cálculo o bases de datos externas
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <span className="flex-1 font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* PREVIEW & SELECTION SECTION */}
          {contactsList.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
              
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Contactos Encontrados ({contactsList.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Seleccionados para sincronizar: <strong className="text-blue-600 dark:text-blue-400">{selectedCount}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => selectAll(true)}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Seleccionar Todos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectAll(false)}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Deseleccionar</span>
                  </button>
                </div>
              </div>

              {/* Filter in preview */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  placeholder="Filtrar en la lista..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Contacts preview table/cards */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {filteredList.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => toggleContactSelect(contact.id)}
                    className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                      contact.selected
                        ? 'bg-blue-50/70 dark:bg-blue-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={contact.selected}
                        onChange={() => {}} // Handled by div click
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {contact.name}
                          </span>
                          {contact.isDuplicate ? (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0">
                              Ya en Taller: {contact.duplicateOf}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                              Nuevo
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                            <Phone className="w-3 h-3 text-blue-500" />
                            {contact.phone}
                          </span>
                          {contact.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {contact.email}
                            </span>
                          )}
                          {contact.address && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {contact.address} {contact.city}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Cancelar
          </button>

          {contactsList.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={selectedCount === 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Sincronizar e Importar ({selectedCount}) Contactos</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
