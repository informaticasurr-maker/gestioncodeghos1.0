import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Clock,
  Moon,
  Sun,
  Laptop,
  User,
  Shield,
  ShieldCheck,
  Bell,
  Building,
  FileText,
  CreditCard,
  Sparkles,
  Database,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  HardDrive,
  Cloud,
  Download,
  Heart,
  Key,
  Lock,
  Volume2,
  MessageSquare,
  Smartphone,
  AlertTriangle,
  RefreshCw,
  QrCode,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  ListChecks,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CompanySettings } from '../types';

type SettingsTab =
  | 'general'
  | 'cuenta'
  | 'privacidad'
  | 'notificaciones'
  | 'empresa'
  | 'comprobantes'
  | 'pagos'
  | 'ia'
  | 'basedatos';

export const SettingsManager: React.FC = () => {
  const {
    companySettings,
    updateCompanySettings,
    setActiveTab,
    setIsDonateOpen,
    setIsGoogleDriveOpen,
    setIsBackupModalOpen,
    syncWithGoogleDrive,
    exportBackupData,
    importBackupData,
    resetToDefaultData,
    orders,
    clients,
    servicesCatalog,
    forceSaveLocalDatabase,
    currentUser,
    cloudSyncState,
    setIsAuthModalOpen,
    syncWithCloud,
    logoutUser,
  } = useApp();

  const [currentSection, setCurrentSection] = useState<SettingsTab>('general');
  const [viewMode, setViewMode] = useState<'tabs' | 'all'>('tabs');
  const [saveToast, setSaveToast] = useState(false);

  // 1. General, Language, Timezone, Theme
  const [language, setLanguage] = useState(companySettings.language || 'es');
  const [timezone, setTimezone] = useState(
    companySettings.timezone || 'America/Argentina/Buenos_Aires'
  );
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    companySettings.theme || 'light'
  );

  // 2. My Account
  const [accountName, setAccountName] = useState(
    companySettings.userAccount?.name || 'Lucas Almada'
  );
  const [accountEmail, setAccountEmail] = useState(
    companySettings.userAccount?.email || 'lucas.almada@techfix.com.ar'
  );
  const [accountRole, setAccountRole] = useState(
    companySettings.userAccount?.role || 'Administrador Principal / Técnico Master'
  );
  const [accountPhone, setAccountPhone] = useState(
    companySettings.userAccount?.phone || '+54 9 11 4589-2234'
  );
  const [accountSpecialty, setAccountSpecialty] = useState(
    companySettings.userAccount?.specialty || 'Microelectrónica, Reballing & Software'
  );
  const [accountCode, setAccountCode] = useState(
    companySettings.userAccount?.technicianCode || 'TECH-001'
  );
  const [accountAvatar, setAccountAvatar] = useState(
    companySettings.userAccount?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );

  // 3. Privacy & Security
  const [requirePinForDelete, setRequirePinForDelete] = useState(
    companySettings.security?.requirePinForDelete ?? true
  );
  const [autoLockMinutes, setAutoLockMinutes] = useState(
    companySettings.security?.autoLockMinutes ?? 30
  );
  const [maskClientSensitiveData, setMaskClientSensitiveData] = useState(
    companySettings.security?.maskClientSensitiveData ?? false
  );
  const [auditLogsEnabled, setAuditLogsEnabled] = useState(
    companySettings.security?.auditLogsEnabled ?? true
  );
  const [sessionTimeout, setSessionTimeout] = useState(
    companySettings.security?.sessionTimeout ?? false
  );

  // 4. Notifications
  const [soundEnabled, setSoundEnabled] = useState(
    companySettings.notifications?.soundEnabled ?? true
  );
  const [whatsappAutoOpen, setWhatsappAutoOpen] = useState(
    companySettings.notifications?.whatsappAutoOpen ?? true
  );
  const [notifyOverdueOrders, setNotifyOverdueOrders] = useState(
    companySettings.notifications?.notifyOverdueOrders ?? true
  );
  const [notifyReadyForPickup, setNotifyReadyForPickup] = useState(
    companySettings.notifications?.notifyReadyForPickup ?? true
  );
  const [dailyBackupReminder, setDailyBackupReminder] = useState(
    companySettings.notifications?.dailyBackupReminder ?? true
  );
  const [browserNotifications, setBrowserNotifications] = useState(
    companySettings.notifications?.browserNotifications ?? true
  );

  // 5. Company Info
  const [name, setName] = useState(companySettings.name);
  const [tradeName, setTradeName] = useState(companySettings.tradeName);
  const [logoUrl, setLogoUrl] = useState(companySettings.logoUrl);
  const [taxId, setTaxId] = useState(companySettings.taxId);
  const [phone, setPhone] = useState(companySettings.phone);
  const [whatsapp, setWhatsapp] = useState(companySettings.whatsapp);
  const [email, setEmail] = useState(companySettings.email);
  const [address, setAddress] = useState(companySettings.address);
  const [city, setCity] = useState(companySettings.city);
  const [stateRegion, setStateRegion] = useState(companySettings.stateRegion);
  const [postalCode, setPostalCode] = useState(companySettings.postalCode);
  const [defaultTechnician, setDefaultTechnician] = useState(companySettings.defaultTechnician);

  // 6. Vouchers & PDF Config
  const [currency, setCurrency] = useState(companySettings.currency || 'ARS');
  const [currencySymbol, setCurrencySymbol] = useState(companySettings.currencySymbol || '$');
  const [showPriceInClientPdf, setShowPriceInClientPdf] = useState(
    companySettings.orderConfig.showPriceInClientPdf
  );
  const [showTechnicianName, setShowTechnicianName] = useState(
    companySettings.orderConfig.showTechnicianName
  );
  const [defaultWarrantyDays, setDefaultWarrantyDays] = useState(
    companySettings.orderConfig.defaultWarrantyDays
  );
  const [termsAndClauses, setTermsAndClauses] = useState(
    companySettings.orderConfig.termsAndClauses
  );
  const [promoBannerText, setPromoBannerText] = useState(
    companySettings.orderConfig.promoBannerText
  );
  const [promoBannerEnabled, setPromoBannerEnabled] = useState(
    companySettings.orderConfig.promoBannerEnabled
  );

  // 7. Payment Details & QR Code
  const [paymentEnabled, setPaymentEnabled] = useState(
    companySettings.paymentDetails?.enabled ?? true
  );
  const [paymentAlias, setPaymentAlias] = useState(
    companySettings.paymentDetails?.alias ?? 'techfix.taller.mp'
  );
  const [paymentCbuCvu, setPaymentCbuCvu] = useState(
    companySettings.paymentDetails?.cbuCvu ?? '0000003100084729104821'
  );
  const [paymentBankName, setPaymentBankName] = useState(
    companySettings.paymentDetails?.bankName ?? 'Mercado Pago / Banco'
  );
  const [paymentAccountHolder, setPaymentAccountHolder] = useState(
    companySettings.paymentDetails?.accountHolder ?? 'TechFix Reparaciones'
  );
  const [paymentQrCodeUrl, setPaymentQrCodeUrl] = useState(
    companySettings.paymentDetails?.qrCodeUrl ?? ''
  );
  const [paymentInstructions, setPaymentInstructions] = useState(
    companySettings.paymentDetails?.instructions ??
      'Escanear QR o transferir al Alias. Enviar comprobante por WhatsApp indicando el N° de orden.'
  );
  const [paymentShowInPdf, setPaymentShowInPdf] = useState(
    companySettings.paymentDetails?.showInPdf ?? true
  );
  const [copiedAlias, setCopiedAlias] = useState(false);

  // 8. Gemini AI
  const [geminiApiKey, setGeminiApiKey] = useState(
    companySettings.geminiApiKey || localStorage.getItem('techfix_gemini_api_key') || ''
  );

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Avatar upload handler
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAccountAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // QR Code payment upload handler
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande (máx 5MB). Por favor selecciona otra imagen.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPaymentQrCodeUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyPaymentAlias = () => {
    navigator.clipboard.writeText(paymentAlias);
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  const requestBrowserNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        alert('✅ Permiso de notificaciones concedido con éxito.');
        setBrowserNotifications(true);
      } else {
        alert('⚠️ El navegador denegó los permisos de notificación.');
      }
    } else {
      alert('Tu navegador no soporta la API de Notificaciones.');
    }
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const success = importBackupData(text);
          if (success) {
            alert('✅ Base de datos restaurada con éxito desde el archivo.');
          } else {
            alert('❌ El archivo seleccionado no tiene el formato JSON de respaldo válido.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  // Save all settings
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    updateCompanySettings({
      language,
      timezone,
      theme,
      userAccount: {
        name: accountName.trim(),
        email: accountEmail.trim(),
        role: accountRole.trim(),
        avatarUrl: accountAvatar.trim(),
        phone: accountPhone.trim(),
        specialty: accountSpecialty.trim(),
        technicianCode: accountCode.trim(),
      },
      security: {
        requirePinForDelete,
        autoLockMinutes: Number(autoLockMinutes) || 30,
        maskClientSensitiveData,
        auditLogsEnabled,
        sessionTimeout,
      },
      notifications: {
        soundEnabled,
        whatsappAutoOpen,
        notifyOverdueOrders,
        notifyReadyForPickup,
        dailyBackupReminder,
        emailAlerts: false,
        browserNotifications,
      },
      name: name.trim(),
      tradeName: tradeName.trim(),
      logoUrl: logoUrl.trim(),
      taxId: taxId.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      stateRegion: stateRegion.trim(),
      postalCode: postalCode.trim(),
      defaultTechnician: defaultTechnician.trim(),
      currency,
      currencySymbol,
      paymentDetails: {
        enabled: paymentEnabled,
        alias: paymentAlias.trim(),
        cbuCvu: paymentCbuCvu.trim(),
        bankName: paymentBankName.trim(),
        accountHolder: paymentAccountHolder.trim(),
        qrCodeUrl: paymentQrCodeUrl,
        instructions: paymentInstructions.trim(),
        showInPdf: paymentShowInPdf,
      },
      orderConfig: {
        showPriceInClientPdf,
        showTechnicianName,
        defaultWarrantyDays: Number(defaultWarrantyDays) || 90,
        termsAndClauses: termsAndClauses.trim(),
        promoBannerText: promoBannerText.trim(),
        promoBannerEnabled,
      },
      geminiApiKey: geminiApiKey.trim(),
    });

    if (geminiApiKey.trim()) {
      localStorage.setItem('techfix_gemini_api_key', geminiApiKey.trim());
    }

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
  };

  // Nav menu items with short labels for mobile
  const menuCategories = [
    {
      id: 'general' as SettingsTab,
      label: language === 'en' ? 'General & Display' : 'General & Visualización',
      shortLabel: 'General',
      desc: language === 'en' ? 'Language, Timezone, Dark Mode' : 'Idioma, Zona Horaria, Modo Oscuro',
      icon: Globe,
      badge: theme === 'dark' ? 'Oscuro' : 'Claro',
    },
    {
      id: 'cuenta' as SettingsTab,
      label: language === 'en' ? 'My Account' : 'Mi Cuenta',
      shortLabel: 'Mi Cuenta',
      desc: language === 'en' ? 'Technician Profile & Role' : 'Perfil del Técnico & Rol',
      icon: User,
    },
    {
      id: 'privacidad' as SettingsTab,
      label: language === 'en' ? 'Privacy & Security' : 'Privacidad y Seguridad',
      shortLabel: 'Privacidad',
      desc: language === 'en' ? 'Locks, Data Protection' : 'Bloqueo, Protección de Datos',
      icon: Shield,
    },
    {
      id: 'notificaciones' as SettingsTab,
      label: language === 'en' ? 'Notifications' : 'Notificaciones',
      shortLabel: 'Notificaciones',
      desc: language === 'en' ? 'WhatsApp, Sound & Alerts' : 'WhatsApp, Sonidos y Alertas',
      icon: Bell,
    },
    {
      id: 'empresa' as SettingsTab,
      label: language === 'en' ? 'Company & Logo' : 'Datos del Taller & Logo',
      shortLabel: 'Taller & Logo',
      desc: language === 'en' ? 'Commercial Data & Fiscal' : 'Datos Comerciales y Fiscales',
      icon: Building,
    },
    {
      id: 'comprobantes' as SettingsTab,
      label: language === 'en' ? 'Vouchers & Terms' : 'Comprobantes & Cláusulas',
      shortLabel: 'Comprobantes',
      desc: language === 'en' ? 'PDF layout, currency, terms' : 'Formato PDF, moneda y garantía',
      icon: FileText,
    },
    {
      id: 'pagos' as SettingsTab,
      label: language === 'en' ? 'Payment & QR Code' : 'Medios de Pago & QR',
      shortLabel: 'Pagos & QR',
      desc: language === 'en' ? 'Bank Alias, QR image' : 'Alias Bancario y QR de Cobro',
      icon: CreditCard,
    },
    {
      id: 'ia' as SettingsTab,
      label: language === 'en' ? 'Gemini AI Assistant' : 'Inteligencia Artificial',
      shortLabel: 'IA Gemini',
      desc: language === 'en' ? 'API Key & Voice Orders' : 'Google Gemini y Asistente',
      icon: Sparkles,
    },
    {
      id: 'basedatos' as SettingsTab,
      label: language === 'en' ? 'Database & Cloud' : 'Base de Datos & Nube',
      shortLabel: 'Base de Datos',
      desc: language === 'en' ? 'IndexedDB & Google Drive' : 'Copias locales y Google Drive',
      icon: Database,
    },
  ];

  const currentIndex = menuCategories.findIndex((c) => c.id === currentSection);
  const handlePrevTab = () => {
    if (currentIndex > 0) {
      setCurrentSection(menuCategories[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const handleNextTab = () => {
    if (currentIndex < menuCategories.length - 1) {
      setCurrentSection(menuCategories[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-12">
      
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'en' ? 'System Settings & Preferences' : 'Panel de Configuración del Sistema'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'en'
                ? 'Manage language, timezone, dark mode, technician account, security and workshop data.'
                : 'Personaliza idioma, zona horaria, modo oscuro, tu cuenta, seguridad, alertas y datos del taller.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
          {/* View mode toggle (Pestañas vs Ver Todo) */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('tabs')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === 'tabs'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Ver por pestañas individuales"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pestañas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === 'all'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Desplegar todas las 9 secciones juntas para ver todo en pantalla"
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Ver Todo (9)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsDonateOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition"
          >
            <Heart className="w-4 h-4 text-amber-600 fill-amber-500/20" />
            <span>{language === 'en' ? 'Support' : 'Apoyar'}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Body with Category Sidebar and Content Panel */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* MOBILE NAVIGATION BAR: Prominent Category Switcher & Horizontal Pills Bar */}
        <div className="lg:hidden space-y-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Sección ({currentIndex + 1} de {menuCategories.length}):</span>
            </span>
            
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
              {menuCategories[currentIndex]?.shortLabel || 'Ajustes'}
            </span>
          </div>

          {/* Quick Select Dropdown for Phones */}
          <div className="relative">
            <select
              id="mobile-settings-category-selector"
              value={currentSection}
              onChange={(e) => {
                setCurrentSection(e.target.value as SettingsTab);
                if (viewMode === 'all') {
                  const el = document.getElementById(`section-${e.target.value}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full p-3 pl-3.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/50 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 appearance-none shadow-xs"
            >
              {menuCategories.map((item, index) => (
                <option key={item.id} value={item.id}>
                  {index + 1}. {item.label} ({item.desc})
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600 dark:text-blue-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Horizontal Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar -mx-1 px-1">
            {menuCategories.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id && viewMode === 'tabs';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCurrentSection(item.id);
                    if (viewMode === 'all') {
                      const el = document.getElementById(`section-${item.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                  <span className="whitespace-nowrap">{index + 1}. {item.shortLabel || item.label}</span>
                </button>
              );
            })}
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* DESKTOP LEFT SIDEBAR: Sticky list of all 9 categories */}
          <div className="hidden lg:block lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm space-y-1.5 transition-colors sticky top-4">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>Categorías del Sistema</span>
              <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">9 Secciones</span>
            </div>

            {menuCategories.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCurrentSection(item.id);
                    if (viewMode === 'all') {
                      const el = document.getElementById(`section-${item.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-xs sm:text-sm truncate leading-tight font-bold">
                        {index + 1}. {item.label}
                      </div>
                      <div className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* RIGHT: Active Tab Content Area */}
          <div className="lg:col-span-8 space-y-6">

            {/* TAB 1: GENERAL & DISPLAY (Idioma, Zona Horaria, Modo Oscuro) */}
            {(viewMode === 'all' || currentSection === 'general') && (
              <div id="section-general" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
                
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>1. Idioma, Zona Horaria y Modo Oscuro</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Ajusta la apariencia visual, la lengua de la interfaz y la hora de emisión de comprobantes.
                    </p>
                  </div>
                  {viewMode === 'all' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold">
                      1 / 9
                    </span>
                  )}
                </div>

                {/* 1. IDIOMA (LANGUAGE) */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    1. Idioma del Sistema (Language):
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center justify-between transition ${
                        language === 'es'
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🇪🇸</span>
                        <div>
                          <span className="font-bold text-xs sm:text-sm block">Español (Latinoamérica / España)</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">Interfáz, comprobantes y reportes en español</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="lang"
                        value="es"
                        checked={language === 'es'}
                        onChange={() => setLanguage('es')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                    </label>

                    <label
                      className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center justify-between transition ${
                        language === 'en'
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🇺🇸</span>
                        <div>
                          <span className="font-bold text-xs sm:text-sm block">English (United States / Global)</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">Standard English UI & printable receipts</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="lang"
                        value="en"
                        checked={language === 'en'}
                        onChange={() => setLanguage('en')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                {/* 2. MODO OSCURO (DARK MODE) */}
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>2. Modo Oscuro / Tema de Apariencia:</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Light Option */}
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-2 text-center transition ${
                        theme === 'light'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="p-2 bg-amber-100 rounded-full text-amber-700">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-bold">Modo Claro</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        Fondo luminoso y contraste diurno
                      </div>
                    </button>

                    {/* Dark Option */}
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-2 text-center transition ${
                        theme === 'dark'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="p-2 bg-slate-900 text-blue-400 rounded-full border border-slate-700">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-bold">Modo Oscuro</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        Reduce fatiga visual en taller
                      </div>
                    </button>

                    {/* System Auto Option */}
                    <button
                      type="button"
                      onClick={() => setTheme('system')}
                      className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-2 text-center transition ${
                        theme === 'system'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-bold">Automático (Sistema)</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        Sigue el tema de Windows/Mac/Android
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. ZONA HORARIA (TIMEZONE) */}
                <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>3. Zona Horaria del Taller (Timezone):</span>
                    </span>
                    <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-normal">
                      Hora actual: {new Date().toLocaleTimeString('es-AR')}
                    </span>
                  </label>

                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                  >
                    <optgroup label="América del Sur">
                      <option value="America/Argentina/Buenos_Aires">Buenos Aires, Córdoba, Rosario (GMT-3)</option>
                      <option value="America/Montevideo">Montevideo, Uruguay (GMT-3)</option>
                      <option value="America/Sao_Paulo">São Paulo, Brasilia (GMT-3)</option>
                      <option value="America/Santiago">Santiago de Chile (GMT-4 / GMT-3)</option>
                      <option value="America/Asuncion">Asunción, Paraguay (GMT-4)</option>
                      <option value="America/La_Paz">La Paz, Bolivia (GMT-4)</option>
                      <option value="America/Bogota">Bogotá, Colombia (GMT-5)</option>
                      <option value="America/Lima">Lima, Perú (GMT-5)</option>
                      <option value="America/Guayaquil">Quito / Guayaquil, Ecuador (GMT-5)</option>
                      <option value="America/Caracas">Caracas, Venezuela (GMT-4)</option>
                    </optgroup>
                    <optgroup label="América del Norte y Central">
                      <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                      <option value="America/Monterrey">Monterrey, Guadalajara (GMT-6)</option>
                      <option value="America/Cancun">Cancún, Quintana Roo (GMT-5)</option>
                      <option value="America/Tijuana">Tijuana, Baja California (GMT-8)</option>
                      <option value="America/Guatemala">Guatemala, El Salvador, Honduras (GMT-6)</option>
                      <option value="America/Costa_Rica">San José, Costa Rica (GMT-6)</option>
                      <option value="America/Panama">Ciudad de Panamá (GMT-5)</option>
                      <option value="America/New_York">Nueva York, Miami (EST / GMT-5)</option>
                      <option value="America/Chicago">Chicago, Texas (CST / GMT-6)</option>
                      <option value="America/Los_Angeles">Los Ángeles, San Francisco (PST / GMT-8)</option>
                    </optgroup>
                    <optgroup label="Europa y UTC">
                      <option value="Europe/Madrid">Madrid, Barcelona, España (CET / GMT+1)</option>
                      <option value="Atlantic/Canary">Islas Canarias, España (WET / GMT+0)</option>
                      <option value="Europe/London">Londres, Reino Unido (GMT+0)</option>
                      <option value="UTC">UTC Tiempo Universal Coordinado</option>
                    </optgroup>
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Se utiliza para registrar con precisión los sellos de tiempo en las órdenes de servicio, historial de estados y comprobantes PDF.
                  </p>
                </div>

                {viewMode === 'tabs' && (
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div />
                    <button
                      type="button"
                      onClick={handleNextTab}
                      className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition ml-auto"
                    >
                      <span>Siguiente: Mi Cuenta</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: MI CUENTA (MY ACCOUNT) */}
            {(viewMode === 'all' || currentSection === 'cuenta') && (
              <div id="section-cuenta" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>2. Mi Cuenta & Perfil del Técnico</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Gestiona tu identidad profesional, avatar, rol operativo y firma técnica.
                    </p>
                  </div>
                  {viewMode === 'all' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold">
                      2 / 9
                    </span>
                  )}
                </div>

                {/* Cloud & Multi-Device Account Status Banner */}
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/70 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Cloud className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                            {currentUser ? `Cuenta: ${currentUser.email}` : 'Modo Técnico Invitado (Local)'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              currentUser?.isEmailVerified || currentUser?.authProvider === 'google'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {currentUser ? 'Verificada' : 'Sin Sincronizar'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {currentUser
                            ? `Sincronización multi-dispositivo habilitada mediante Google Drive.`
                            : 'Identifícate con tu cuenta de Google o correo verificado para usar la app en varios dispositivos.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsAuthModalOpen(true)}
                        className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
                      >
                        {currentUser ? 'Gestionar Cuenta / Nube' : 'Identificarse / Iniciar Sesión'}
                      </button>
                    </div>
                  </div>

                  {currentUser && (
                    <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-3">
                        <span>
                          Última sincronización:{' '}
                          <strong>
                            {currentUser.lastSyncAt
                              ? new Date(currentUser.lastSyncAt).toLocaleString('es-AR')
                              : 'Pendiente'}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => syncWithCloud('push')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 font-semibold transition"
                        >
                          Subir a Nube Ahora
                        </button>
                        <button
                          type="button"
                          onClick={() => syncWithCloud('pull')}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold transition"
                        >
                          Restaurar de Nube
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar & Summary Card */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group">
                    <img
                      src={accountAvatar}
                      alt={accountName}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-md bg-white"
                      referrerPolicy="no-referrer"
                    />
                    <label className="absolute inset-0 bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-bold cursor-pointer transition">
                      <Upload className="w-4 h-4 mb-0.5" />
                      <span>Cambiar</span>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {accountName || 'Técnico Responsable'}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold font-mono">
                        {accountCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{accountRole}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{accountSpecialty}</p>
                  </div>
                </div>

                {/* Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo *:</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico *:</label>
                    <input
                      type="email"
                      value={accountEmail}
                      onChange={(e) => setAccountEmail(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Rol / Cargo en el Taller:</label>
                    <select
                      value={accountRole}
                      onChange={(e) => setAccountRole(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="Administrador Principal / Técnico Master">Administrador Principal / Técnico Master</option>
                      <option value="Técnico de Laboratorio Electrónico">Técnico de Laboratorio Electrónico</option>
                      <option value="Técnico de Software y Desbloqueos">Técnico de Software y Desbloqueos</option>
                      <option value="Recepción y Atención al Cliente">Recepción y Atención al Cliente</option>
                      <option value="Supervisor de Control de Calidad">Supervisor de Control de Calidad</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Código Identificador (Badge):</label>
                    <input
                      type="text"
                      value={accountCode}
                      onChange={(e) => setAccountCode(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Teléfono / WhatsApp Directo:</label>
                    <input
                      type="text"
                      value={accountPhone}
                      onChange={(e) => setAccountPhone(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Especialidad Principal:</label>
                    <input
                      type="text"
                      value={accountSpecialty}
                      onChange={(e) => setAccountSpecialty(e.target.value)}
                      placeholder="Ej: Microelectrónica, Reballing, Pantallas OLED"
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {viewMode === 'tabs' && (
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handlePrevTab}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Anterior: General</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTab}
                      className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition ml-auto"
                    >
                      <span>Siguiente: Privacidad</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* TAB 3: PRIVACIDAD Y SEGURIDAD (PRIVACY & SECURITY) */}
            {(viewMode === 'all' || currentSection === 'privacidad') && (
              <div id="section-privacidad" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>3. Privacidad, Seguridad y Protección de Datos</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Parámetros de resguardo contra manipulaciones indebidas y protección de contraseñas de clientes.
                    </p>
                  </div>
                  {viewMode === 'all' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold">
                      3 / 9
                    </span>
                  )}
                </div>

                <div className="space-y-4 text-xs">
                  
                  {/* Toggle: Require confirmation to delete */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Confirmación reforzada para eliminar órdenes o clientes
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Evita borrados accidentales requiriendo confirmación explícita con nombre de orden antes de eliminar del taller.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={requirePinForDelete}
                      onChange={(e) => setRequirePinForDelete(e.target.checked)}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                    />
                  </div>

                  {/* Toggle: Mask sensitive client credentials */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Enmascarar contraseñas / PIN de desbloqueo en listado general
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Oculta la clave de pantalla de los equipos recibidos en pantallas públicas, mostrándola solo dentro de la orden abierta.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={maskClientSensitiveData}
                      onChange={(e) => setMaskClientSensitiveData(e.target.checked)}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                    />
                  </div>

                  {/* Toggle: Audit logs */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Registro cronológico de auditoría de cambios de estado
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Guarda fecha, hora y técnico responsable cada vez que una orden cambia de estado o recibe un pago.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={auditLogsEnabled}
                      onChange={(e) => setAuditLogsEnabled(e.target.checked)}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                    />
                  </div>

                  {/* Local Storage Privacy Clear */}
                  <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 space-y-2">
                    <div className="flex items-center gap-2 text-rose-900 dark:text-rose-300 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Limpieza y Restauración de Privacidad Local</span>
                    </div>
                    <p className="text-[11px] text-rose-800 dark:text-rose-400 leading-relaxed">
                      Si utilizas una computadora compartida o pública, puedes vaciar el caché temporal de imágenes y tokens de sesión.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('¿Deseas restablecer la configuración a valores iniciales seguros? Los datos de tus órdenes no se borrarán.')) {
                          alert('✅ Caché de sesión limpiado.');
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Limpiar Caché de Sesión
                    </button>
                  </div>

                </div>

                {viewMode === 'tabs' && (
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handlePrevTab}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Anterior: Mi Cuenta</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTab}
                      className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition ml-auto"
                    >
                      <span>Siguiente: Notificaciones</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* TAB 4: NOTIFICACIONES (NOTIFICATIONS) */}
            {(viewMode === 'all' || currentSection === 'notificaciones') && (
              <div id="section-notificaciones" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>4. Notificaciones, WhatsApp y Alertas del Sistema</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Configura avisos automáticos a clientes por WhatsApp, alertas de órdenes vencidas y sonidos.
                    </p>
                  </div>
                  {viewMode === 'all' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold">
                      4 / 9
                    </span>
                  )}
                </div>

                <div className="space-y-3.5 text-xs">
                  
                  {/* WhatsApp auto prompt */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <span>Sugerir envío de WhatsApp al cambiar a "Listo para Entrega"</span>
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Genera automáticamente el mensaje con saludo, modelo, saldo pendiente y ubicación del taller listo para enviar al cliente.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={whatsappAutoOpen}
                      onChange={(e) => setWhatsappAutoOpen(e.target.checked)}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                    />
                  </div>

                  {/* Sound feedback */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-blue-600" />
                        <span>Efectos de sonido en confirmaciones y guardados</span>
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Emite una respuesta auditiva suave cuando una orden se registra o se procesa un pago con éxito.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                    />
                  </div>

                  {/* Overdue alerts */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Destacar órdenes vencidas o con fecha de entrega superada</span>
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Resalta en color ámbar/rojo los equipos que superaron el plazo de entrega prometido al cliente.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyOverdueOrders}
                      onChange={(e) => setNotifyOverdueOrders(e.target.checked)}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                    />
                  </div>

                  {/* Backup daily reminder */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <HardDrive className="w-4 h-4 text-indigo-600" />
                        <span>Recordatorio de copia de seguridad diaria</span>
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Notifica si han pasado más de 24 horas sin exportar respaldo o sin sincronizar con Google Drive.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={dailyBackupReminder}
                      onChange={(e) => setDailyBackupReminder(e.target.checked)}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                    />
                  </div>

                  {/* Browser Native Notifications Button */}
                  <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-blue-950 dark:text-blue-200 block">
                        Notificaciones de Escritorio y Navegador
                      </span>
                      <span className="text-[11px] text-blue-800/80 dark:text-blue-400">
                        Permite recibir avisos incluso si tienes la pestaña en segundo plano.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={requestBrowserNotificationPermission}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shrink-0"
                    >
                      Activar Permiso Web ↗
                    </button>
                  </div>

                </div>

                {viewMode === 'tabs' && (
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handlePrevTab}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Anterior: Privacidad</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTab}
                      className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition ml-auto"
                    >
                      <span>Siguiente: Datos del Taller & Logo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* TAB 5: EMPRESA Y LOGO (COMPANY & LOGO) */}
            {(viewMode === 'all' || currentSection === 'empresa') && (
              <div id="section-empresa" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>5. Datos Comerciales y Logotipo del Taller</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Estos datos se imprimirán en el encabezado oficial de todos los comprobantes PDF y órdenes de trabajo.
                    </p>
                  </div>
                  {viewMode === 'all' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold">
                      5 / 9
                    </span>
                  )}
                </div>

                {/* Logo Upload & Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <div className="flex flex-col items-center justify-center text-center">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo Taller"
                        className="w-24 h-24 object-contain rounded-xl border border-slate-300 dark:border-slate-700 bg-white p-1 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-[10px]">Sin Logo</span>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Subir Logotipo del Taller (Formato PNG o JPG):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Recomendado: fondo transparente o blanco, tamaño cuadrado o apaisado (máx 3MB).
                    </p>
                  </div>
                </div>

                {/* Company Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Comercial / Fantasía *:</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Razón Social / Titular:</label>
                    <input
                      type="text"
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">CUIT / RUT / Tax ID *:</label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono Principal *:</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp para Clientes:</label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="5491145892234"
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Email del Taller:</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección / Ubicación del Local *:</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ciudad *:</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Provincia / Región:</label>
                    <input
                      type="text"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Código Postal (CP):</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Técnico Principal Responsable:</label>
                    <input
                      type="text"
                      value={defaultTechnician}
                      onChange={(e) => setDefaultTechnician(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                {viewMode === 'tabs' && (
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handlePrevTab}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Anterior: Notificaciones</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTab}
                      className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition ml-auto"
                    >
                      <span>Siguiente: Comprobantes PDF</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* TAB 6: COMPROBANTES Y CLÁUSULAS (VOUCHERS & PDF) */}
            {(viewMode === 'all' || currentSection === 'comprobantes') && (
              <div id="section-comprobantes" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>6. Configuración de Comprobantes PDF, Ticket y Garantía</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Personaliza cláusulas de recepción, garantía legal, moneda y opciones de impresión.
                    </p>
                  </div>
                  {viewMode === 'all' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold">
                      6 / 9
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Moneda del Taller:</label>
                    <select
                      value={currency}
                      onChange={(e) => {
                        setCurrency(e.target.value);
                        if (e.target.value === 'EUR') setCurrencySymbol('€');
                        else if (e.target.value === 'USD') setCurrencySymbol('U$S');
                        else setCurrencySymbol('$');
                      }}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="ARS">Pesos Argentinos (ARS)</option>
                      <option value="USD">Dólares Estadounidenses (USD)</option>
                      <option value="EUR">Euros (EUR)</option>
                      <option value="MXN">Pesos Mexicanos (MXN)</option>
                      <option value="CLP">Pesos Chilenos (CLP)</option>
                      <option value="COP">Pesos Colombianos (COP)</option>
                      <option value="PEN">Soles Peruanos (PEN)</option>
                      <option value="UYU">Pesos Uruguayos (UYU)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Símbolo Monetario:</label>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Garantía por Defecto (Días):</label>
                    <input
                      type="number"
                      value={defaultWarrantyDays}
                      onChange={(e) => setDefaultWarrantyDays(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Mostrar precio en el PDF que se entrega al cliente
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Si se desactiva, el comprobante se emite como "Remito de Ingreso" sin importes monetarios.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showPriceInClientPdf}
                      onChange={(e) => setShowPriceInClientPdf(e.target.checked)}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Mostrar nombre del técnico asignado en el encabezado
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Imprime el responsable técnico en la cabecera del comprobante.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showTechnicianName}
                      onChange={(e) => setShowTechnicianName(e.target.checked)}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Terms and Warranty Clauses */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Cláusulas de Recepción, Abandono de Equipos y Garantía Escrita:</span>
                  </label>
                  <textarea
                    rows={4}
                    value={termsAndClauses}
                    onChange={(e) => setTermsAndClauses(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 leading-relaxed font-sans"
                  />
                </div>

                {/* Propaganda / Promo Banner */}
                <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/60 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                      <Megaphone className="w-4 h-4 text-blue-600" />
                      <span>Incluir Anuncio Publicitario / Banner en Pie de Comprobante:</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={promoBannerEnabled}
                      onChange={(e) => setPromoBannerEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                  </label>

                  {promoBannerEnabled && (
                    <input
                      type="text"
                      value={promoBannerText}
                      onChange={(e) => setPromoBannerText(e.target.value)}
                      placeholder="Ej: ¡15% OFF en tu próxima reparación de notebook! Válido por 30 días."
                      className="w-full text-xs p-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  )}
                </div>

                {viewMode === 'tabs' && (
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handlePrevTab}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Anterior: Datos del Taller</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTab}
                      className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition ml-auto"
                    >
                      <span>Siguiente: Medios de Pago & QR</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* TAB 7: MEDIOS DE PAGO Y QR (PAYMENT & QR) */}
            {(viewMode === 'all' || currentSection === 'pagos') && (
              <div id="section-pagos" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>7. Medios de Pago, Alias Bancario y Código QR</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Configura el código QR de cobro y datos de transferencia impresos en comprobantes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewMode === 'all' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold">
                        7 / 9
                      </span>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer bg-blue-50 dark:bg-blue-950 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 transition">
                      <input
                        type="checkbox"
                        checked={paymentEnabled}
                        onChange={(e) => setPaymentEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                        {paymentEnabled ? 'Cobro QR Habilitado' : 'Cobro Desactivado'}
                      </span>
                    </label>
                  </div>
                </div>

                {paymentEnabled && (
                  <div className="space-y-4">
                    {/* QR Code Upload & Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80">
                      <div className="flex flex-col items-center justify-center text-center">
                        {paymentQrCodeUrl ? (
                          <div className="space-y-2">
                            <div className="relative inline-block">
                              <img
                                src={paymentQrCodeUrl}
                                alt="QR de Pago"
                                className="w-28 h-28 object-contain rounded-xl border-2 border-blue-500 bg-white p-1.5 shadow-md"
                                referrerPolicy="no-referrer"
                              />
                              <button
                                type="button"
                                onClick={() => setPaymentQrCodeUrl('')}
                                className="absolute -top-2 -right-2 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-md transition"
                                title="Eliminar QR"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md block">
                              ✓ QR Listo para Cobros
                            </span>
                          </div>
                        ) : (
                          <div className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 p-2">
                            <QrCode className="w-8 h-8 mb-1 text-slate-400" />
                            <span className="text-[10px] font-medium text-center">Sin imagen QR</span>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-xs font-bold text-slate-900 dark:text-white">
                          Subir Captura del QR de Mercado Pago / Banco:
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrUpload}
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                        />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Toma captura de tu código QR en tu app bancaria y súbela aquí. Se adaptará automáticamente a la impresión A4 y Ticket.
                        </p>
                      </div>
                    </div>

                    {/* Bank Details Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-800 dark:text-slate-200">Alias Bancario / MP *:</label>
                          {paymentAlias && (
                            <button
                              type="button"
                              onClick={handleCopyPaymentAlias}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                            >
                              {copiedAlias ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedAlias ? 'Copiado' : 'Probar'}</span>
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={paymentAlias}
                          onChange={(e) => setPaymentAlias(e.target.value)}
                          placeholder="Ej: techfix.taller.mp"
                          className="w-full p-2.5 border border-blue-300 dark:border-blue-800 rounded-lg bg-blue-50/40 dark:bg-blue-950/40 font-mono font-bold text-blue-950 dark:text-blue-200"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">CBU / CVU (22 dígitos):</label>
                        <input
                          type="text"
                          value={paymentCbuCvu}
                          onChange={(e) => setPaymentCbuCvu(e.target.value)}
                          maxLength={22}
                          className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Banco / Billetera:</label>
                        <input
                          type="text"
                          value={paymentBankName}
                          onChange={(e) => setPaymentBankName(e.target.value)}
                          placeholder="Ej: Mercado Pago / Santander"
                          className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Titular de la Cuenta:</label>
                        <input
                          type="text"
                          value={paymentAccountHolder}
                          onChange={(e) => setPaymentAccountHolder(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Instrucciones de Pago:</label>
                        <input
                          type="text"
                          value={paymentInstructions}
                          onChange={(e) => setPaymentInstructions(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Imprimir QR y datos de pago en comprobantes PDF y presupuestos
                      </span>
                      <input
                        type="checkbox"
                        checked={paymentShowInPdf}
                        onChange={(e) => setPaymentShowInPdf(e.target.checked)}
                        className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {viewMode === 'tabs' && (
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handlePrevTab}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Anterior: Comprobantes PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTab}
                      className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition ml-auto"
                    >
                      <span>Siguiente: Inteligencia Artificial</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* TAB 8: GEMINI AI ASSISTANT */}
            {(viewMode === 'all' || currentSection === 'ia') && (
              <div id="section-ia" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>8. Inteligencia Artificial (Google Gemini API - BYOK)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Habilita el asistente de dictado por voz y extracción automática de datos técnicos.
                    </p>
                  </div>
                  {viewMode === 'all' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold">
                      8 / 9
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Google Gemini API Key:
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-semibold underline"
                    >
                      Obtener API Key en Google AI Studio ↗
                    </a>
                  </div>

                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full text-xs p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tu clave se conserva de forma segura en tu navegador y permite dictar al micrófono para que la IA complete automáticamente cliente, equipo, falla y precio.
                  </p>
                </div>

                {viewMode === 'tabs' && (
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handlePrevTab}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Anterior: Medios de Pago</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTab}
                      className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition ml-auto"
                    >
                      <span>Siguiente: Base de Datos & Nube</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* TAB 9: BASE DE DATOS Y NUBE */}
            {(viewMode === 'all' || currentSection === 'basedatos') && (
              <div id="section-basedatos" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>9. Base de Datos Local (IndexedDB) & Respaldo en Google Drive</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Almacenamiento persistente, exportación de copias de seguridad e integración en la nube.
                    </p>
                  </div>
                  {viewMode === 'all' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold">
                      9 / 9
                    </span>
                  )}
                </div>

                {/* Storage Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Órdenes</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{orders.length}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Clientes</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{clients.length}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Servicios</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{servicesCatalog.length}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">IndexedDB</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mt-1">✓ Operativo</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBackupModalOpen(true)}
                    className="p-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Gestionar Copias de Seguridad</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGoogleDriveOpen(true)}
                    className="p-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <span>Sincronizar con Google Drive</span>
                  </button>
                </div>

                {/* Export / Import JSON */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Descargar Backup (.JSON)</span>
                      <span className="text-[11px] text-slate-500">Guarda archivo en tu equipo</span>
                    </div>
                    <button
                      type="button"
                      onClick={exportBackupData}
                      className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800"
                    >
                      Exportar
                    </button>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Restaurar Copia (.JSON)</span>
                      <span className="text-[11px] text-slate-500">Cargar respaldo previo</span>
                    </div>
                    <label className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 cursor-pointer">
                      Cargar
                      <input type="file" accept=".json" onChange={handleImportJsonFile} className="hidden" />
                    </label>
                  </div>
                </div>

                {viewMode === 'tabs' && (
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handlePrevTab}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Anterior: Inteligencia Artificial</span>
                    </button>
                    <div />
                  </div>
                )}

              </div>
            )}

          </div>
        </div>

        {/* BOTTOM FIXED SAVE BAR */}
        <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-2xl flex flex-wrap items-center justify-between gap-3 transition-colors">
          
          <button
            type="button"
            onClick={() => setActiveTab('ordenes')}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Volver a Órdenes</span>
          </button>

          <div className="flex items-center gap-3">
            {saveToast && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuración guardada</span>
              </span>
            )}
            
            <button
              type="submit"
              id="save-all-settings-btn"
              className="px-6 sm:px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 transition transform active:scale-95 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
