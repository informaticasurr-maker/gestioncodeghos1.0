import React, { useState } from 'react';
import {
  User,
  Plus,
  UserPlus,
  Wrench,
  Camera,
  Trash2,
  Calendar,
  DollarSign,
  ShieldCheck,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Search,
  Sparkles,
  Boxes,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  Client,
  DeviceType,
  OrderItemService,
  DevicePhoto,
  PaymentMethod,
  OrderStatus,
  DatosOrdenVoz,
  DeviceChecklist,
  SparePartUsage,
} from '../types';
import { DeviceIcon } from './StatusBadge';
import { compressImage } from '../utils/imageCompressor';
import { VoiceOrderAssistant } from './VoiceOrderAssistant';
import { DeviceChecklistSection } from './DeviceChecklistSection';

export const NewOrderForm: React.FC = () => {
  const {
    clients,
    addClient,
    servicesCatalog,
    inventory,
    companySettings,
    addOrder,
    setActiveTab,
    setSelectedOrderForPrint,
    formatMoney,
  } = useApp();

  // Client Selection State
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [clientModalError, setClientModalError] = useState<string | null>(null);

  // Quick New Client Form fields
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientDocumentId, setNewClientDocumentId] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientCity, setNewClientCity] = useState(companySettings.city || '');

  // Device Info State
  const [deviceType, setDeviceType] = useState<DeviceType>('smartphone');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [deviceSerialOrImei, setDeviceSerialOrImei] = useState('');
  const [deviceColor, setDeviceColor] = useState('');
  const [deviceLockType, setDeviceLockType] = useState<'pin' | 'pattern' | 'password' | 'none'>('none');
  const [deviceLockCode, setDeviceLockCode] = useState('');

  // Accessories checked
  const [accessoryCharger, setAccessoryCharger] = useState(false);
  const [accessoryCover, setAccessoryCover] = useState(false);
  const [accessorySim, setAccessorySim] = useState(false);
  const [accessoryBox, setAccessoryBox] = useState(false);
  const [accessoryOther, setAccessoryOther] = useState('');

  // Services / Items state
  const [servicesList, setServicesList] = useState<OrderItemService[]>([
    {
      id: 'srv-init-1',
      name: 'Diagnóstico Técnico General',
      category: 'General',
      quantity: 1,
      unitPrice: 8000,
      totalPrice: 8000,
    },
  ]);

  // Spare Parts from Inventory
  const [sparePartsList, setSparePartsList] = useState<SparePartUsage[]>([]);
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string>('');
  const [sparePartQty, setSparePartQty] = useState<number>(1);

  // Device Inspection Checklist
  const [checklist, setChecklist] = useState<DeviceChecklist>({
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
  });

  // Quick Catalog item select
  const [catalogSelectId, setCatalogSelectId] = useState('');
  const [manualServiceName, setManualServiceName] = useState('');
  const [manualServicePrice, setManualServicePrice] = useState('');

  // Conditions & Observations
  const [conditionNotes, setConditionNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [initialStatus, setInitialStatus] = useState<OrderStatus>('recibido');
  const [technician, setTechnician] = useState(companySettings.defaultTechnician || 'Lucas Almada');
  const [warrantyDays, setWarrantyDays] = useState<number>(companySettings.orderConfig?.defaultWarrantyDays || 90);

  // Dates & Estimates
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });

  // Financials & Seña
  const [depositAmount, setDepositAmount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');

  // Photos State
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; description: string; date: string }>>([]);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');
  const [currentPhotoDesc, setCurrentPhotoDesc] = useState('');

  // Handler for mapping AI voice extraction to form inputs
  const handleVoiceOrderExtracted = (data: DatosOrdenVoz, rawSpeech: string) => {
    setFormError(null);

    // 1. Map client & contact
    if (data.cliente || data.contacto) {
      const clientNameQuery = data.cliente ? data.cliente.trim().toLowerCase() : '';
      const clientContactQuery = data.contacto ? data.contacto.replace(/[^0-9]/g, '') : '';

      // Check if existing client matches
      const existingMatch = clients.find((c) => {
        const matchName = clientNameQuery && c.name.toLowerCase().includes(clientNameQuery);
        const matchPhone = clientContactQuery && c.phone.replace(/[^0-9]/g, '').includes(clientContactQuery);
        return matchName || matchPhone;
      });

      if (existingMatch) {
        setSelectedClientId(existingMatch.id);
      } else if (data.cliente || data.contacto) {
        // Auto create or set client
        const newName = data.cliente ? data.cliente.trim() : `Cliente ${data.contacto || 'Nuevo'}`;
        const newPhone = data.contacto ? data.contacto.trim() : '+54 9 S/D';

        try {
          const created = addClient({
            name: newName,
            phone: newPhone,
            email: '',
            documentId: '',
            address: '',
            city: companySettings.city || 'Buenos Aires',
            notes: 'Cliente registrado automáticamente mediante asistente por voz',
          });
          setSelectedClientId(created.id);
        } catch (e) {
          console.warn('Error auto-creating client:', e);
        }
      }
    }

    // 2. Map Device (brand, model, type)
    if (data.equipo) {
      const eq = data.equipo.trim();
      const lower = eq.toLowerCase();

      // Guess device type
      if (lower.includes('macbook') || lower.includes('notebook') || lower.includes('laptop') || lower.includes('thinkpad') || lower.includes('dell') || lower.includes('hp') || lower.includes('lenovo')) {
        setDeviceType('notebook');
      } else if (lower.includes('ipad') || lower.includes('tablet') || lower.includes('tab')) {
        setDeviceType('tablet');
      } else if (lower.includes('playstation') || lower.includes('ps4') || lower.includes('ps5') || lower.includes('xbox') || lower.includes('nintendo') || lower.includes('switch')) {
        setDeviceType('console');
      } else if (lower.includes('smartwatch') || lower.includes('reloj') || lower.includes('apple watch')) {
        setDeviceType('smartwatch');
      } else if (lower.includes('pc') || lower.includes('all in one') || lower.includes('aio') || lower.includes('computadora')) {
        setDeviceType('pc');
      } else {
        setDeviceType('smartphone');
      }

      // Extract brand and model
      const knownBrands = ['Samsung', 'Apple', 'Motorola', 'Xiaomi', 'iPhone', 'Lenovo', 'Dell', 'HP', 'Asus', 'Acer', 'Sony', 'LG', 'Huawei', 'Nokia', 'Nintendo', 'PlayStation', 'Xbox', 'TCL', 'Alcatel', 'ZTE'];
      let detectedBrand = '';
      for (const b of knownBrands) {
        if (new RegExp(`\\b${b}\\b`, 'i').test(eq)) {
          detectedBrand = b;
          break;
        }
      }

      if (detectedBrand) {
        setDeviceBrand(detectedBrand);
        const modelRest = eq.replace(new RegExp(`^${detectedBrand}\\s*`, 'i'), '').trim();
        setDeviceModel(modelRest || eq);
      } else {
        const parts = eq.split(' ');
        if (parts.length > 1) {
          setDeviceBrand(parts[0]);
          setDeviceModel(parts.slice(1).join(' '));
        } else {
          setDeviceBrand(eq);
          setDeviceModel(eq);
        }
      }
    }

    // 3. Map Falla / Condition Notes
    if (data.falla) {
      setConditionNotes(data.falla.trim());
    }

    // 4. Map Presupuesto / Services
    if (typeof data.presupuesto === 'number' && data.presupuesto > 0) {
      setServicesList([
        {
          id: `srv-voice-${Date.now()}`,
          name: data.falla ? `Reparación: ${data.falla.slice(0, 50)}` : 'Servicio Técnico / Reparación',
          category: 'Servicio Técnico',
          quantity: 1,
          unitPrice: data.presupuesto,
          totalPrice: data.presupuesto,
        },
      ]);
    }

    // 5. Map Garantía
    if (typeof data.garantia_dias === 'number' && data.garantia_dias > 0) {
      setWarrantyDays(data.garantia_dias);
    }
  };

  // Calculate totals
  const servicesTotal = servicesList.reduce((acc, item) => acc + item.totalPrice, 0);
  const sparePartsTotal = sparePartsList.reduce((acc, part) => acc + (part.subtotal || 0), 0);
  const totalAmount = servicesTotal + sparePartsTotal;
  const depositNum = Math.min(totalAmount, Math.max(0, parseFloat(depositAmount) || 0));
  const balanceDue = Math.max(0, totalAmount - depositNum);

  // Quick Add Spare Part from Inventory
  const handleAddSparePart = () => {
    if (!selectedInventoryItemId) return;
    const inv = inventory.find((i) => i.id === selectedInventoryItemId);
    if (!inv) return;

    const qty = Math.max(1, sparePartQty);
    const subtotal = inv.salePrice * qty;

    setSparePartsList((prev) => [
      ...prev,
      {
        id: `part-${Date.now()}`,
        inventoryItemId: inv.id,
        name: inv.name,
        sku: inv.sku,
        quantity: qty,
        unitCost: inv.costPrice,
        unitPrice: inv.salePrice,
        subtotal,
      },
    ]);
    setSelectedInventoryItemId('');
    setSparePartQty(1);
  };

  const handleRemoveSparePart = (id: string) => {
    setSparePartsList((prev) => prev.filter((p) => p.id !== id));
  };

  // Quick Add Service from Catalog
  const handleAddFromCatalog = () => {
    if (!catalogSelectId) return;
    const cat = servicesCatalog.find((s) => s.id === catalogSelectId);
    if (!cat) return;

    setServicesList((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: cat.name,
        category: cat.category,
        quantity: 1,
        unitPrice: cat.defaultPrice,
        totalPrice: cat.defaultPrice,
      },
    ]);
    setCatalogSelectId('');
  };

  // Quick Add Manual Service
  const handleAddManualService = () => {
    if (!manualServiceName.trim()) return;
    const price = parseFloat(manualServicePrice) || 0;

    setServicesList((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: manualServiceName.trim(),
        quantity: 1,
        unitPrice: price,
        totalPrice: price,
      },
    ]);
    setManualServiceName('');
    setManualServicePrice('');
  };

  const handleRemoveService = (idx: number) => {
    setServicesList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateServicePrice = (idx: number, price: number) => {
    setServicesList((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, unitPrice: price, totalPrice: price * item.quantity } : item
      )
    );
  };

  // Photo handlers
  const handleAddPhoto = () => {
    if (!currentPhotoUrl) return;
    setPhotos((prev) => [
      ...prev,
      {
        id: `photo-${Date.now()}`,
        url: currentPhotoUrl,
        description: currentPhotoDesc || 'Condición del equipo al ingresar',
        date: new Date().toISOString(),
      },
    ]);
    setCurrentPhotoUrl('');
    setCurrentPhotoDesc('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1280, 1280, 0.75);
        setCurrentPhotoUrl(compressed);
      } catch (err) {
        console.warn('Error compressing photo:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setCurrentPhotoUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Quick Create Client
  const handleCreateClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientModalError(null);
    if (!newClientName.trim() || !newClientPhone.trim()) {
      setClientModalError('Por favor ingrese al menos Nombre y Teléfono del cliente');
      return;
    }

    try {
      const created = addClient({
        name: newClientName.trim(),
        phone: newClientPhone.trim(),
        email: newClientEmail.trim(),
        documentId: newClientDocumentId.trim(),
        address: newClientAddress.trim(),
        city: newClientCity.trim() || companySettings.city || 'Buenos Aires',
      });

      setSelectedClientId(created.id);
      setShowNewClientModal(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientEmail('');
      setNewClientDocumentId('');
      setNewClientAddress('');
      setClientModalError(null);
    } catch (err: any) {
      setClientModalError('Error creando cliente: ' + (err?.message || 'Reintente'));
    }
  };

  // Final Form Submit
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) {
      setFormError('Por favor seleccione o cree un cliente para la orden.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!deviceBrand.trim() || !deviceModel.trim()) {
      setFormError('Por favor complete la marca y modelo del dispositivo.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Build accessories array
    const accessories: string[] = [];
    if (accessoryCharger) accessories.push('Cargador');
    if (accessoryCover) accessories.push('Funda/Carcasa');
    if (accessorySim) accessories.push('Tarjeta SIM/Chip');
    if (accessoryBox) accessories.push('Caja original');
    if (accessoryOther.trim()) accessories.push(accessoryOther.trim());

    // Build initial payment if deposit > 0
    const initialPayments =
      depositNum > 0
        ? [
          {
            id: `pay-init-${Date.now()}`,
            amount: depositNum,
            date: new Date().toISOString(),
            method: paymentMethod,
            note: 'Seña inicial de ingreso',
          },
        ]
        : [];

    let paymentStatus: 'pendiente' | 'seña_parcial' | 'pagado' = 'pendiente';
    if (depositNum >= totalAmount && totalAmount > 0) {
      paymentStatus = 'pagado';
    } else if (depositNum > 0) {
      paymentStatus = 'seña_parcial';
    }

    try {
      const createdOrder = addOrder({
        client,
        device: {
          type: deviceType,
          brand: deviceBrand.trim(),
          model: deviceModel.trim(),
          serialOrImei: deviceSerialOrImei.trim(),
          color: deviceColor.trim(),
          lockType: deviceLockType,
          lockCode: deviceLockCode.trim(),
          accessories,
          checklist,
        },
        services: servicesList,
        spareParts: sparePartsList,
        checklist,
        conditionNotes: conditionNotes.trim(),
        internalNotes: internalNotes.trim(),
        photos,
        status: initialStatus,
        technician: technician || companySettings.defaultTechnician || 'Lucas Almada',
        totalAmount: Number(totalAmount) || 0,
        depositPaid: Number(depositNum) || 0,
        balanceDue: Number(balanceDue) || 0,
        paymentStatus,
        paymentMethod: depositNum > 0 ? paymentMethod : undefined,
        payments: initialPayments,
        warrantyDays: warrantyDays || companySettings.orderConfig?.defaultWarrantyDays || 90,
        estimatedDeliveryDate,
      });

      // Switch view and open printable voucher
      setSelectedOrderForPrint(createdOrder);
      setActiveTab('ordenes');
    } catch (err: any) {
      console.error('Error creando orden:', err);
      setFormError('Error al guardar la orden: ' + (err?.message || 'Error desconocido'));
    }
  };

  const filteredClients = clients.filter((c) => {
    const q = (clientSearch || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.documentId || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">

      {/* Title Bar */}
      <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-[#1a2640] shadow-sm flex flex-wrap items-center justify-between gap-3 transition-colors duration-200">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600 dark:text-[#00f2fe]" />
            <span>Confeccionar Nueva Orden de Trabajo / Presupuesto</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ingreso técnico de dispositivo, condiciones iniciales, registro fotográfico y presupuesto.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('ordenes')}
          className="px-3.5 py-1.5 border border-slate-300 dark:border-[#1a2640] rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#111b30] transition"
        >
          Ver Todas las Órdenes
        </button>
      </div>

      {/* VOICE ORDER ASSISTANT (SPEECH-TO-TEXT + GEMINI AI) */}
      <VoiceOrderAssistant
        apiKey={companySettings.geminiApiKey}
        onOrderDataExtracted={handleVoiceOrderExtracted}
      />

      {formError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm">
          <span>⚠️ {formError}</span>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="text-rose-600 hover:text-rose-900 dark:text-rose-300 dark:hover:text-white ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="space-y-6">

        {/* STEP 1: CLIENT SELECTION */}
        <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-[#1a2640] shadow-sm space-y-4 transition-colors duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2640] pb-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600 dark:text-[#00f2fe]" />
              <span>1. Datos del Cliente / Contacto</span>
            </h3>

            <button
              type="button"
              onClick={() => setShowNewClientModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/80 px-3 py-1.5 rounded-lg transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Crear Nuevo Cliente</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Buscar o Seleccionar Cliente Existente:
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  data-search-input="true"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Filtrar por nombre, teléfono o DNI..."
                  className="search-input-fluor w-full text-xs p-2 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-slate-50 dark:bg-[#080e1a]"
                />

                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe] font-medium"
                  required
                >
                  <option value="">-- Seleccione un cliente --</option>
                  {filteredClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - {c.city || 'S/D'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Client Preview Card */}
            {selectedClientId && (
              <div className="bg-slate-50 dark:bg-[#080e1a] border border-slate-200 dark:border-[#1a2640] p-4 rounded-xl shadow-inner space-y-1.5">
                {(() => {
                  const sel = clients.find((c) => c.id === selectedClientId);
                  if (!sel) return null;
                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{sel.name}</span>
                        <span className="text-[11px] font-mono text-indigo-700 dark:text-[#00f2fe] bg-indigo-50 dark:bg-[#0c1322] px-2 py-0.5 rounded border border-indigo-200 dark:border-[#1a2640] font-semibold">
                          {sel.phone}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-xs">
                        DNI / CUIT: <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">{sel.documentId || 'No especificado'}</span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 text-xs">
                        Email: <span className="text-slate-900 dark:text-slate-100">{sel.email || 'No especificado'}</span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 text-xs">
                        Dirección: <span className="text-slate-900 dark:text-slate-100">{sel.address ? `${sel.address}, ${sel.city}` : 'No especificada'}</span>
                      </p>
                      {sel.notes && <p className="text-slate-500 dark:text-slate-400 italic text-[11px]">Nota: {sel.notes}</p>}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: DEVICE INFORMATION */}
        <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-[#1a2640] shadow-sm space-y-4 transition-colors duration-200">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-[#1a2640] pb-2">
            <DeviceIcon type={deviceType} className="w-4 h-4 text-indigo-600 dark:text-[#00f2fe]" />
            <span>2. Dispositivo a Reparar</span>
          </h3>

          {/* Device Type Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Equipo:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {[
                { id: 'smartphone', label: 'Smartphone / Móvil', icon: Smartphone },
                { id: 'notebook', label: 'Notebook / Laptop', icon: Laptop },
                { id: 'tablet', label: 'Tablet / iPad', icon: Smartphone },
                { id: 'pc', label: 'PC / All-in-One', icon: Laptop },
                { id: 'smartwatch', label: 'Smartwatch', icon: Smartphone },
                { id: 'console', label: 'Consola Videojuego', icon: Laptop },
                { id: 'other', label: 'Otro Dispositivo', icon: Wrench },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setDeviceType(t.id as DeviceType)}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition ${deviceType === t.id
                      ? 'bg-blue-600 dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-600 text-white border-blue-600 dark:border-cyan-500 shadow-sm dark:shadow-[0_0_15px_rgba(0,242,254,0.25)]'
                      : 'bg-slate-50 dark:bg-[#080e1a] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1a2640] hover:bg-slate-100 dark:hover:bg-[#111b30]'
                    }`}
                >
                  <t.icon className="w-4 h-4" />
                  <span className="text-center text-[11px] leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Device Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Marca *:</label>
              <input
                type="text"
                value={deviceBrand}
                onChange={(e) => setDeviceBrand(e.target.value)}
                placeholder="Ej: Samsung, Apple, Lenovo, Dell"
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Modelo Exacto *:</label>
              <input
                type="text"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                placeholder="Ej: Galaxy S23, ThinkPad E14, iPhone 13"
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">N° de Serie / IMEI:</label>
              <input
                type="text"
                value={deviceSerialOrImei}
                onChange={(e) => setDeviceSerialOrImei(e.target.value)}
                placeholder="Ej: 358921098412940 ó PF-29X8B"
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] font-mono text-blue-700 dark:text-[#00f2fe]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Color / Versión:</label>
              <input
                type="text"
                value={deviceColor}
                onChange={(e) => setDeviceColor(e.target.value)}
                placeholder="Ej: Phantom Black, Gris Espacial"
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe]"
              />
            </div>
          </div>

          {/* Unlock Code / Pattern & Accessories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">

            {/* Lock Code */}
            <div className="bg-slate-50 dark:bg-[#080e1a] p-3 rounded-lg border border-slate-200 dark:border-[#1a2640] space-y-2">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Bloqueo / Clave de Desbloqueo:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={deviceLockType}
                  onChange={(e) => setDeviceLockType(e.target.value as any)}
                  className="text-xs p-2 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#0c1322] text-blue-700 dark:text-[#00f2fe]"
                >
                  <option value="none">Sin Clave / Libre</option>
                  <option value="pin">Código PIN Numérico</option>
                  <option value="pattern">Patrón de Desbloqueo</option>
                  <option value="password">Contraseña Alfanumérica</option>
                </select>

                {deviceLockType !== 'none' && (
                  <input
                    type="text"
                    value={deviceLockCode}
                    onChange={(e) => setDeviceLockCode(e.target.value)}
                    placeholder="Clave / Secuencia (ej: 1234)"
                    className="text-xs p-2 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#0c1322] font-mono text-blue-700 dark:text-[#00f2fe]"
                  />
                )}
              </div>
            </div>

            {/* Accessories Left */}
            <div className="bg-slate-50 dark:bg-[#080e1a] p-3 rounded-lg border border-slate-200 dark:border-[#1a2640]">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Accesorios Dejados en Recepción:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accessoryCharger}
                    onChange={(e) => setAccessoryCharger(e.target.checked)}
                    className="rounded text-blue-600 dark:text-[#00f2fe]"
                  />
                  <span>Cargador / Cable</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accessoryCover}
                    onChange={(e) => setAccessoryCover(e.target.checked)}
                    className="rounded text-blue-600 dark:text-[#00f2fe]"
                  />
                  <span>Funda / Carcasa</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accessorySim}
                    onChange={(e) => setAccessorySim(e.target.checked)}
                    className="rounded text-blue-600 dark:text-[#00f2fe]"
                  />
                  <span>Chip / Tarjeta SIM</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accessoryBox}
                    onChange={(e) => setAccessoryBox(e.target.checked)}
                    className="rounded text-blue-600 dark:text-[#00f2fe]"
                  />
                  <span>Caja / Empaque</span>
                </label>
              </div>
              <input
                type="text"
                value={accessoryOther}
                onChange={(e) => setAccessoryOther(e.target.value)}
                placeholder="Otros accesorios (mochila, mouse, lápiz, etc.)..."
                className="w-full text-[11px] p-1.5 mt-2 border border-slate-300 dark:border-[#1a2640] rounded bg-white dark:bg-[#0c1322] text-blue-700 dark:text-[#00f2fe]"
              />
            </div>

          </div>

          {/* Device Inspection Checklist Section */}
          <div className="pt-2">
            <DeviceChecklistSection
              checklist={checklist}
              onChange={setChecklist}
              readOnly={false}
            />
          </div>

        </div>

        {/* STEP 3: SERVICES & BUDGET */}
        <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-[#1a2640] shadow-sm space-y-4 transition-colors duration-200">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-[#1a2640] pb-2">
            <Wrench className="w-4 h-4 text-indigo-600 dark:text-[#00f2fe]" />
            <span>3. Mano de Obra, Repuestos & Presupuesto</span>
          </h3>

          {/* Quick Select from Services Catalog or Add Manual */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-[#080e1a] p-3.5 rounded-xl border border-slate-200 dark:border-[#1a2640]">

            {/* From Services Catalog */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                1. Catálogo de Mano de Obra:
              </label>
              <div className="flex gap-1.5">
                <select
                  value={catalogSelectId}
                  onChange={(e) => setCatalogSelectId(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#0c1322] text-blue-700 dark:text-[#00f2fe]"
                >
                  <option value="">-- Mano de Obra --</option>
                  {servicesCatalog.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.category}] {s.name} - {formatMoney(s.defaultPrice)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddFromCatalog}
                  disabled={!catalogSelectId}
                  className="px-2.5 py-2 bg-blue-600 hover:bg-blue-500 dark:bg-[#00f2fe] dark:hover:bg-[#38bdf8] disabled:opacity-50 text-white dark:text-[#070b14] rounded-lg text-xs font-bold shrink-0 shadow-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* From Inventory Spare Parts */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                2. Repuestos del Inventario:
              </label>
              <div className="flex gap-1.5">
                <select
                  value={selectedInventoryItemId}
                  onChange={(e) => setSelectedInventoryItemId(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#0c1322] text-blue-700 dark:text-[#00f2fe]"
                >
                  <option value="">-- Seleccionar Repuesto --</option>
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id} disabled={inv.stock <= 0}>
                      {inv.name} (Stock: {inv.stock}) - {formatMoney(inv.salePrice)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={sparePartQty}
                  onChange={(e) => setSparePartQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-xs p-1 text-center border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#0c1322] font-mono text-blue-700 dark:text-[#00f2fe]"
                  title="Cantidad"
                />
                <button
                  type="button"
                  onClick={handleAddSparePart}
                  disabled={!selectedInventoryItemId}
                  className="px-2.5 py-2 bg-teal-600 hover:bg-teal-500 dark:bg-[#05d59e] dark:hover:bg-emerald-400 disabled:opacity-50 text-white dark:text-[#070b14] rounded-lg text-xs font-bold shrink-0 shadow-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Manual Service Entry */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                3. Ítem Manual / A Medida:
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={manualServiceName}
                  onChange={(e) => setManualServiceName(e.target.value)}
                  placeholder="Detalle..."
                  className="flex-1 min-w-0 text-xs p-2 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#0c1322] text-blue-700 dark:text-[#00f2fe]"
                />
                <input
                  type="number"
                  value={manualServicePrice}
                  onChange={(e) => setManualServicePrice(e.target.value)}
                  placeholder="$"
                  className="w-16 text-xs p-2 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#0c1322] font-mono text-blue-700 dark:text-[#00f2fe]"
                />
                <button
                  type="button"
                  onClick={handleAddManualService}
                  disabled={!manualServiceName.trim()}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-[#1e2947] dark:hover:bg-[#283860] disabled:opacity-50 text-white rounded-lg text-xs font-bold shrink-0 shadow-xs"
                >
                  +
                </button>
              </div>
            </div>

          </div>

          {/* Spare Parts List (if any added) */}
          {sparePartsList.length > 0 && (
            <div className="border border-teal-200 dark:border-teal-800/60 bg-teal-50/40 dark:bg-teal-950/30 rounded-xl overflow-hidden p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-teal-900 dark:text-teal-300">
                <span className="flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-teal-600 dark:text-[#05d59e]" />
                  Repuestos Asignados ({sparePartsList.length})
                </span>
                <span className="font-mono text-teal-800 dark:text-[#05d59e]">{formatMoney(sparePartsTotal)}</span>
              </div>
              <div className="divide-y divide-teal-100 dark:divide-teal-900/40 bg-white dark:bg-[#080e1a] rounded-lg border border-teal-200 dark:border-teal-800/40 text-xs">
                {sparePartsList.map((part) => (
                  <div key={part.id} className="p-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{part.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        SKU: {part.sku || 'N/A'} • Cantidad: {part.quantity} un. x {formatMoney(part.unitPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-[#05d59e] font-mono">{formatMoney(part.subtotal)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSparePart(part.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 transition"
                        title="Quitar repuesto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Services Items List */}
          <div className="border border-slate-200 dark:border-[#1a2640] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-[#0e172a] text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-[#1a2640]">
                <tr>
                  <th className="p-2.5">Servicio / Tarea</th>
                  <th className="p-2.5 text-center w-16">Cant.</th>
                  <th className="p-2.5 text-right w-32">Precio Unitario</th>
                  <th className="p-2.5 text-right w-32">Subtotal</th>
                  <th className="p-2.5 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {servicesList.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">
                      {item.name}
                      {item.category && <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1.5">({item.category})</span>}
                    </td>
                    <td className="p-2.5 text-center font-mono text-slate-800 dark:text-slate-200">{item.quantity}</td>
                    <td className="p-2.5 text-right">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateServicePrice(idx, parseFloat(e.target.value) || 0)}
                        className="w-24 text-right p-1 text-xs border border-slate-300 dark:border-[#1a2640] rounded font-mono font-semibold bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe]"
                      />
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-[#00f2fe]">
                      {formatMoney(item.totalPrice)}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveService(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 transition"
                        title="Quitar ítem"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary */}
            <div className="bg-slate-50 dark:bg-[#080e1a] p-4 border-t border-slate-200 dark:border-[#1a2640] flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Garantía:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    value={warrantyDays}
                    onChange={(e) => setWarrantyDays(parseInt(e.target.value) || 0)}
                    className="w-16 p-1 text-xs border border-slate-300 dark:border-[#1a2640] rounded font-mono font-bold text-center bg-white dark:bg-[#0c1322] text-blue-700 dark:text-[#00f2fe]"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">días</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Presupuestado:</span>
                <span className="text-lg font-black text-blue-600 dark:text-[#00f2fe] font-mono">
                  {formatMoney(totalAmount)}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* STEP 4: CONDITION NOTES, OBSERVATIONS & PHOTOS */}
        <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-[#1a2640] shadow-sm space-y-4 transition-colors duration-200">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-[#1a2640] pb-2">
            <Camera className="w-4 h-4 text-indigo-600 dark:text-[#00f2fe]" />
            <span>4. Observaciones, Estado de Recepción y Fotos del Equipo</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Condition Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Condiciones de Recepción / Falla que Manifiesta el Cliente:
              </label>
              <textarea
                rows={3}
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                placeholder="Detalle si enciende, roturas en pantalla, rayones visibles, humedad, tornillos faltantes, etc."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe] leading-relaxed"
              />
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Nota Interna del Taller (Uso Técnico Privado):
              </label>
              <textarea
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Notas que solo verán los técnicos (número de guía de repuesto, mediciones, advertencias)..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe] leading-relaxed"
              />
            </div>

          </div>

          {/* Photos Upload & List */}
          <div className="bg-slate-50 dark:bg-[#080e1a] p-4 rounded-xl border border-slate-200 dark:border-[#1a2640] space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Añadir Fotos del Equipo Recibido:
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {photos.length} foto(s) adjuntas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-[#1a2640] file:text-indigo-700 dark:file:text-[#00f2fe] hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={currentPhotoDesc}
                  onChange={(e) => setCurrentPhotoDesc(e.target.value)}
                  placeholder="Descripción breve de lo que se ve..."
                  className="w-full text-xs p-2 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#0c1322] text-blue-700 dark:text-[#00f2fe]"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  disabled={!currentPhotoUrl}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  + Adjuntar Foto
                </button>
              </div>
            </div>

            {/* Photos Preview Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {photos.map((p, idx) => (
                  <div key={p.id} className="relative group border border-slate-300 dark:border-[#1a2640] rounded-lg overflow-hidden bg-white dark:bg-[#0c1322] p-1">
                    <img
                      src={p.url}
                      alt={p.description}
                      className="w-full h-20 object-cover rounded bg-slate-100 dark:bg-slate-800"
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 font-medium truncate">{p.description}</p>
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* STEP 5: INITIAL PAYMENT, ASSIGNED TECH & STATUS */}
        <div className="bg-white dark:bg-[#0c1322] p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-[#1a2640] shadow-sm space-y-4 transition-colors duration-200">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-[#1a2640] pb-2">
            <DollarSign className="w-4 h-4 text-indigo-600 dark:text-[#00f2fe]" />
            <span>5. Estado Inicial, Seña y Técnico Asignado</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Initial Status */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Estado de Ingreso:</label>
              <select
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as OrderStatus)}
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe] font-medium"
              >
                <option value="recibido">Recibido en Taller</option>
                <option value="en_revision">En Diagnóstico / Revisión</option>
                <option value="presupuesto_pendiente">Presupuesto Pendiente</option>
                <option value="presupuesto_aprobado">Presupuesto Aprobado</option>
                <option value="en_reparacion">En Reparación</option>
              </select>
            </div>

            {/* Technician */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Técnico Asignado:</label>
              <input
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe]"
              />
            </div>

            {/* Estimated Delivery Date */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha Estimada de Retiro:</label>
              <input
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe] font-medium"
              />
            </div>

            {/* Seña / Deposit */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Seña Abonada (Opcional):</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0"
                  className="w-full text-xs p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] font-mono font-bold text-blue-700 dark:text-[#00f2fe]"
                />
                {depositNum > 0 && (
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="text-xs p-1 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe]"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transf.</option>
                    <option value="mercadopago">MP</option>
                    <option value="tarjeta_debito">Débito</option>
                  </select>
                )}
              </div>
            </div>

          </div>

          {/* Final Calculation Banner */}
          <div className="bg-slate-900 dark:bg-[#080e1a] border border-slate-800 dark:border-[#1a2640] text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-slate-400">Total Orden</span>
                <p className="text-xl font-bold font-mono text-white dark:text-[#00f2fe]">{formatMoney(totalAmount)}</p>
              </div>
              <div>
                <span className="text-xs text-emerald-400 dark:text-[#05d59e]">Seña Ingresada</span>
                <p className="text-xl font-bold font-mono text-emerald-400 dark:text-[#05d59e]">{formatMoney(depositNum)}</p>
              </div>
              <div>
                <span className="text-xs text-rose-300">Saldo Pendiente</span>
                <p className="text-xl font-bold font-mono text-rose-300">{formatMoney(balanceDue)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('ordenes')}
                className="px-4 py-2.5 rounded-lg border border-slate-700 dark:border-[#1a2640] text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 dark:hover:bg-[#111b30] transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                id="submit-create-order-btn"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 text-white rounded-lg text-sm font-bold shadow-lg transition transform active:scale-95 flex items-center gap-2 dark:shadow-[0_0_20px_rgba(0,242,254,0.3)]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar y Generar Orden</span>
              </button>
            </div>
          </div>

        </div>

      </form>

      {/* QUICK NEW CLIENT MODAL */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#0c1322] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-[#1a2640]">
            <div className="bg-slate-900 dark:bg-[#080e1a] text-white p-4 flex items-center justify-between border-b border-slate-800 dark:border-[#1a2640]">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400 dark:text-[#00f2fe]" />
                <span>Registrar Nuevo Cliente / Contacto</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClientSubmit} className="p-4 sm:p-6 space-y-3 text-xs">
              {clientModalError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-lg text-xs font-semibold">
                  ⚠️ {clientModalError}
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo *:</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Teléfono / WhatsApp *:</label>
                  <input
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="Ej: +54 9 11 1234-5678"
                    className="w-full p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] font-mono text-blue-700 dark:text-[#00f2fe]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">DNI / CUIT:</label>
                  <input
                    type="text"
                    value={newClientDocumentId}
                    onChange={(e) => setNewClientDocumentId(e.target.value)}
                    placeholder="Ej: 38.412.901"
                    className="w-full p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email:</label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="ejemplo@email.com"
                  className="w-full p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Domicilio:</label>
                  <input
                    type="text"
                    value={newClientAddress}
                    onChange={(e) => setNewClientAddress(e.target.value)}
                    placeholder="Calle y N°"
                    className="w-full p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ciudad:</label>
                  <input
                    type="text"
                    value={newClientCity}
                    onChange={(e) => setNewClientCity(e.target.value)}
                    placeholder="Ciudad"
                    className="w-full p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-blue-700 dark:text-[#00f2fe]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-[#1a2640]">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-[#1a2640] rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-[#111b30]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 dark:bg-[#00f2fe] dark:hover:bg-[#38bdf8] text-white dark:text-[#070b14] rounded-lg font-bold shadow transition"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

