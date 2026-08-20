import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Client,
  CatalogService,
  CompanySettings,
  Order,
  OrderStatus,
  PaymentMethod,
  DevicePhoto,
  ActiveTab,
  DriveBackupItem,
  DBStats,
  InventoryItem,
  CashMovement,
  WhatsAppTemplateType,
  SparePartUsage,
  UserProfile,
  UserRole,
  CloudSyncState,
  PendingEmailVerification,
} from '../types';
import { GoogleDriveService, UserDriveProfile } from '../services/googleDriveService';
import { LocalDatabaseService } from '../services/localDatabase';
import { CloudSyncService } from '../services/cloudSyncService';
import {
  initialClients,
  initialCompanySettings,
  initialOrders,
  initialServicesCatalog,
  initialInventoryItems,
  initialCashMovements,
} from '../data/initialData';

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  orders: Order[];
  clients: Client[];
  servicesCatalog: CatalogService[];
  inventory: InventoryItem[];
  cashMovements: CashMovement[];
  companySettings: CompanySettings;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedOrderForModal: Order | null;
  setSelectedOrderForModal: (order: Order | null) => void;
  selectedOrderForPrint: Order | null;
  setSelectedOrderForPrint: (order: Order | null) => void;
  selectedDeviceForHistory: { serialOrImei: string; model: string } | null;
  setSelectedDeviceForHistory: (device: { serialOrImei: string; model: string } | null) => void;
  isDonateOpen: boolean;
  setIsDonateOpen: (open: boolean) => void;
  isGoogleDriveOpen: boolean;
  setIsGoogleDriveOpen: (open: boolean) => void;
  isBackupModalOpen: boolean;
  setIsBackupModalOpen: (open: boolean) => void;

  // User Account & Multi-device Cloud Sync
  currentUser: UserProfile | null;
  cloudSyncState: CloudSyncState;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithGoogle: () => Promise<boolean>;
  sendEmailVerificationCode: (email: string, name: string, role?: UserRole) => PendingEmailVerification;
  verifyEmailCode: (email: string, code: string, workshopName?: string) => { success: boolean; message: string; user?: UserProfile };
  logoutUser: () => void;
  syncWithCloud: (direction?: 'push' | 'pull' | 'auto') => Promise<{ success: boolean; message: string; restored?: boolean }>;

  // Database Stats & Storage Actions
  dbStats: DBStats;
  isSavingLocal: boolean;
  forceSaveLocalDatabase: () => Promise<boolean>;

  // Order Actions
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'statusHistory'>) => Order;
  updateOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => void;
  addOrderPayment: (orderId: string, amount: number, method: PaymentMethod, note?: string) => void;
  addOrderPhoto: (orderId: string, photo: Omit<DevicePhoto, 'id' | 'date'>) => void;
  deleteOrderPhoto: (orderId: string, photoId: string) => void;
  approveBudget: (orderId: string) => void;
  rejectBudget: (orderId: string) => void;
  deleteOrder: (orderId: string) => void;
  getDeviceHistory: (serialOrImei: string, currentOrderId?: string) => Order[];

  // Spare Parts on Order
  addSparePartToOrder: (orderId: string, item: InventoryItem, quantity: number, customUnitPrice?: number) => void;
  removeSparePartFromOrder: (orderId: string, sparePartId: string) => void;

  // Inventory Actions
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => InventoryItem;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (itemId: string) => void;
  adjustInventoryStock: (itemId: string, quantityChange: number, reason?: string) => void;

  // Cash Register Actions
  addCashMovement: (movement: Omit<CashMovement, 'id' | 'createdAt'>) => CashMovement;
  deleteCashMovement: (movementId: string) => void;

  // Client Actions
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'totalOrdersCount'>) => Client;
  batchAddClients: (newClientsList: Omit<Client, 'id' | 'createdAt' | 'totalOrdersCount'>[]) => number;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;

  // Catalog Actions
  addCatalogService: (service: Omit<CatalogService, 'id'>) => void;
  updateCatalogService: (service: CatalogService) => void;
  deleteCatalogService: (serviceId: string) => void;

  // Settings Actions
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  syncWithGoogleDrive: (customClientId?: string) => Promise<{ success: boolean; message: string; backup?: DriveBackupItem }>;
  fetchDriveBackupsList: () => Promise<DriveBackupItem[]>;
  restoreFromDriveFile: (fileId: string) => Promise<boolean>;
  disconnectGoogleDrive: () => void;
  isSyncingDrive: boolean;
  driveBackups: DriveBackupItem[];
  driveUserEmail: string | null;
  exportBackupData: () => void;
  importBackupData: (jsonString: string) => boolean;
  resetToDefaultData: () => void;

  // Helpers
  formatMoney: (amount: number) => string;
  generateWhatsAppLink: (order: Order, templateType?: WhatsAppTemplateType, customNotes?: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ordenes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [selectedDeviceForHistory, setSelectedDeviceForHistory] = useState<{ serialOrImei: string; model: string } | null>(null);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // User Account & Multi-device Cloud Sync state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return LocalDatabaseService.getUserProfile();
  });

  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncState>({
    isSyncing: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSyncDate: LocalDatabaseService.getUserProfile()?.lastSyncAt || null,
    lastSyncStatus: 'idle',
    nextAutoSyncInSeconds: 15 * 60,
    pendingLocalChanges: false,
  });

  const [driveBackups, setDriveBackups] = useState<DriveBackupItem[]>([]);
  const [driveUserEmail, setDriveUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('techfix_gdrive_user_email') || null;
  });

  // State initialized from LocalStorage (with async upgrade to IndexedDB)
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    try {
      const saved = localStorage.getItem('techfix_company_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialCompanySettings,
          ...parsed,
          userAccount: {
            ...initialCompanySettings.userAccount,
            ...(parsed.userAccount || {}),
          },
          security: {
            ...initialCompanySettings.security,
            ...(parsed.security || {}),
          },
          notifications: {
            ...initialCompanySettings.notifications,
            ...(parsed.notifications || {}),
          },
          orderConfig: {
            ...initialCompanySettings.orderConfig,
            ...(parsed.orderConfig || {}),
          },
          paymentDetails: {
            ...initialCompanySettings.paymentDetails,
            ...(parsed.paymentDetails || {}),
          },
          googleDrive: {
            ...initialCompanySettings.googleDrive,
            ...(parsed.googleDrive || {}),
          },
          donation: {
            ...initialCompanySettings.donation,
            ...(parsed.donation || {}),
            aliasCbu: 'informaticasurr',
            paypalEmail: 'paypal.me/ojovirtual',
            mercadoPagoLink: 'https://link.mercadopago.com.ar/informaticasurr',
          },
        };
      }
      return initialCompanySettings;
    } catch {
      return initialCompanySettings;
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('techfix_clients');
      return saved ? JSON.parse(saved) : initialClients;
    } catch {
      return initialClients;
    }
  });

  const [servicesCatalog, setServicesCatalog] = useState<CatalogService[]>(() => {
    try {
      const saved = localStorage.getItem('techfix_services_catalog');
      return saved ? JSON.parse(saved) : initialServicesCatalog;
    } catch {
      return initialServicesCatalog;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('techfix_orders');
      return saved ? JSON.parse(saved) : initialOrders;
    } catch {
      return initialOrders;
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('techfix_inventory');
      return saved ? JSON.parse(saved) : initialInventoryItems;
    } catch {
      return initialInventoryItems;
    }
  });

  const [cashMovements, setCashMovements] = useState<CashMovement[]>(() => {
    try {
      const saved = localStorage.getItem('techfix_cash_movements');
      return saved ? JSON.parse(saved) : initialCashMovements;
    } catch {
      return initialCashMovements;
    }
  });

  const [dbStats, setDbStats] = useState<DBStats>({
    ordersCount: orders.length,
    clientsCount: clients.length,
    servicesCount: servicesCatalog.length,
    inventoryCount: inventory.length,
    cashMovementsCount: cashMovements.length,
    photosCount: 0,
    estimatedBytes: 0,
    lastSavedAt: new Date().toISOString(),
    isIndexedDBAvailable: LocalDatabaseService.isIndexedDBSupported(),
  });

  // Load from IndexedDB on startup if available
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const initial = await LocalDatabaseService.loadInitialData();
        if (isMounted) {
          setOrders(initial.orders);
          setClients(initial.clients);
          setServicesCatalog(initial.servicesCatalog);
          setInventory(initial.inventory);
          setCashMovements(initial.cashMovements);
          setCompanySettings(initial.companySettings);
          setIsInitialized(true);

          const stats = await LocalDatabaseService.getStorageStats(
            initial.orders,
            initial.clients,
            initial.servicesCatalog,
            initial.inventory,
            initial.cashMovements
          );
          setDbStats(stats);
        }
      } catch (e) {
        console.warn('Error en carga inicial de base de datos:', e);
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate stats & perform double persistence whenever state changes (only once initialized)
  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(async () => {
      setIsSavingLocal(true);
      await LocalDatabaseService.persistAll({
        companySettings,
        clients,
        servicesCatalog,
        orders,
        inventory,
        cashMovements,
      });

      const stats = await LocalDatabaseService.getStorageStats(orders, clients, servicesCatalog, inventory, cashMovements);
      setDbStats(stats);
      setIsSavingLocal(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [isInitialized, companySettings, clients, servicesCatalog, orders, inventory, cashMovements]);

  // Synchronize Dark / Light mode with DOM
  useEffect(() => {
    const root = document.documentElement;
    const theme = companySettings.theme || 'light';

    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else if (theme === 'light') {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    } else if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    }
  }, [companySettings.theme]);

  // Network Connectivity (Online / Offline) Listeners
  useEffect(() => {
    const handleOnline = () => {
      setCloudSyncState((prev) => ({
        ...prev,
        isOnline: true,
        lastSyncStatus: prev.lastSyncStatus === 'offline' ? 'idle' : prev.lastSyncStatus,
      }));
    };

    const handleOffline = () => {
      setCloudSyncState((prev) => ({
        ...prev,
        isOnline: false,
        lastSyncStatus: 'offline',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 15-Minute Background Differential Sync Timer & Countdown Ticker
  useEffect(() => {
    if (!currentUser || !isInitialized) return;

    const ticker = setInterval(() => {
      setCloudSyncState((prev) => {
        const currentSec = prev.nextAutoSyncInSeconds ?? 15 * 60;
        if (currentSec <= 1) {
          // Trigger differential auto-sync when timer reaches zero and online
          if (navigator.onLine && !prev.isSyncing) {
            setTimeout(() => {
              syncWithCloud('auto').catch((e) => console.warn('15-min auto sync err:', e));
            }, 10);
          }
          return {
            ...prev,
            nextAutoSyncInSeconds: 15 * 60,
          };
        }
        return {
          ...prev,
          nextAutoSyncInSeconds: currentSec - 1,
        };
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [currentUser, isInitialized]);

  // Keep selected modal order synchronized
  useEffect(() => {
    if (selectedOrderForModal) {
      const updated = orders.find((o) => o.id === selectedOrderForModal.id);
      if (updated) {
        setSelectedOrderForModal(updated);
      }
    }
  }, [orders]);

  // Force manual local DB save
  const forceSaveLocalDatabase = useCallback(async (): Promise<boolean> => {
    setIsSavingLocal(true);
    const ok = await LocalDatabaseService.persistAll({
      companySettings,
      clients,
      servicesCatalog,
      orders,
      inventory,
      cashMovements,
    });
    const stats = await LocalDatabaseService.getStorageStats(orders, clients, servicesCatalog, inventory, cashMovements);
    setDbStats(stats);
    setIsSavingLocal(false);
    return ok;
  }, [companySettings, clients, servicesCatalog, orders, inventory, cashMovements]);

  // Money Formatter Helper
  const formatMoney = (amount: number) => {
    const symbol = companySettings.currencySymbol || '$';
    const formatted = Math.round(amount || 0).toLocaleString('es-AR');
    return `${symbol} ${formatted}`;
  };

  // WhatsApp link generator with template support
  const generateWhatsAppLink = (order: Order, templateType?: WhatsAppTemplateType, customNotes?: string) => {
    const cleanPhone = (order.client?.phone || '').replace(/[^0-9]/g, '');
    const clientFirstName = (order.client?.name || 'Cliente').split(' ')[0];
    const servicesList = (order.services || [])
      .map((s) => `• ${s.name} (${formatMoney(s.totalPrice || 0)})`)
      .join('\n');

    let statusText = 'En Diagnóstico';
    if (order.status === 'recibido') statusText = 'Recibido en taller';
    if (order.status === 'en_revision') statusText = 'En revisión técnica';
    if (order.status === 'presupuesto_pendiente') statusText = 'Presupuesto pendiente de aprobación';
    if (order.status === 'presupuesto_aprobado') statusText = 'Presupuesto aprobado';
    if (order.status === 'en_reparacion') statusText = 'En proceso de reparación';
    if (order.status === 'esperando_repuesto') statusText = 'A la espera de repuesto';
    if (order.status === 'listo_entrega') statusText = '¡LISTO PARA RETIRAR! 🎉';
    if (order.status === 'entregado') statusText = 'Finalizado y entregado';
    if (order.status === 'cancelado') statusText = 'Orden cancelada';

    const paymentInfo =
      companySettings.paymentDetails?.enabled && companySettings.paymentDetails?.alias
        ? `\n💳 *Alias de Pago / Transferencia:* ${companySettings.paymentDetails.alias}${
            companySettings.paymentDetails.bankName ? ` (${companySettings.paymentDetails.bankName})` : ''
          }`
        : '';

    let message = '';

    if (templateType === 'ingreso' || templateType === 'ingreso_taller') {
      message = `Hola *${clientFirstName}*, te confirmamos el ingreso de tu equipo a *${companySettings.name}*:\n\n📋 *Orden N°:* ${order.orderNumber}\n📱 *Equipo:* ${order.device?.brand || ''} ${order.device?.model || ''}\n🔍 *Falla declarada:* ${order.conditionNotes || 'Revisión general'}\n${order.depositPaid ? `💵 *Seña abonada:* ${formatMoney(order.depositPaid)}\n` : ''}\nTe notificaremos por este medio una vez realizado el diagnóstico técnico.\n\n📍 *Taller:* ${companySettings.address || ''}\n📞 *Tel:* ${companySettings.phone || ''}`;
    } else if (templateType === 'presupuesto' || templateType === 'presupuesto_pendiente') {
      message = `Hola *${clientFirstName}*, desde *${companySettings.name}* te enviamos el presupuesto para tu equipo (*${order.device?.brand} ${order.device?.model}* - ${order.orderNumber}):\n\n🛠️ *Trabajo / Repuestos a realizar:*\n${servicesList || '• Reparación integral'}\n\n💰 *Costo Total:* ${formatMoney(order.totalAmount || 0)}\n${order.depositPaid ? `💵 *Seña previa:* ${formatMoney(order.depositPaid)}\n💳 *Saldo a pagar al retirar:* ${formatMoney(order.balanceDue || 0)}\n` : ''}${paymentInfo}\n\n¿Nos confirmas si autorizas la reparación para avanzar? Muchas gracias.`;
    } else if (templateType === 'listo' || templateType === 'listo_entrega') {
      message = `¡Hola *${clientFirstName}*! Buenas noticias de *${companySettings.name}* 🎉\n\nTu equipo *${order.device?.brand} ${order.device?.model}* (Orden *${order.orderNumber}*) ya se encuentra **LISTO PARA RETIRAR** en nuestro taller.\n\n${order.balanceDue && order.balanceDue > 0 ? `💳 *Saldo pendiente al retirar:* ${formatMoney(order.balanceDue)}${paymentInfo}\n` : '✅ *Saldo:* ¡Abonado en su totalidad!\n'}\n📍 *Dirección:* ${companySettings.address || ''}, ${companySettings.city || ''}\n\n¡Te esperamos!`;
    } else if (templateType === 'esperando_repuesto') {
      message = `Hola *${clientFirstName}*, te actualizamos el estado de tu orden *${order.orderNumber}* (*${order.device?.brand} ${order.device?.model}*):\n\nEstamos aguardando el arribo del repuesto necesario para completar la reparación. En cuanto ingrese al taller comenzaremos con el montaje y te avisaremos de inmediato. Muchas gracias por tu paciencia.`;
    } else if (templateType === 'recordatorio' || templateType === 'recordatorio_retiro') {
      message = `Hola *${clientFirstName}*, te recordamos de *${companySettings.name}* que tu equipo *${order.device?.brand} ${order.device?.model}* (${order.orderNumber}) sigue listo para ser retirado.\n\n${order.balanceDue ? `Saldo pendiente: ${formatMoney(order.balanceDue)}\n` : ''}📍 Puedes pasar por ${companySettings.address || 'nuestro taller'}. ¡Muchas gracias!`;
    } else {
      // Default standard summary
      message = `Hola *${clientFirstName}*, te contactamos de *${companySettings.name}* sobre tu orden de servicio técnico:
📋 *Orden N°:* ${order.orderNumber}
📱 *Equipo:* ${order.device?.brand || ''} ${order.device?.model || ''} (${order.device?.serialOrImei || 'Sin S/N'})
🔄 *Estado actual:* ${statusText}

🛠️ *Servicios / Reparación:*
${servicesList || '• Diagnóstico técnico'}

💰 *Total:* ${formatMoney(order.totalAmount || 0)}
💵 *Seña abonada:* ${formatMoney(order.depositPaid || 0)}
💳 *Saldo pendiente:* ${formatMoney(order.balanceDue || 0)}${paymentInfo}
${customNotes ? `\n📝 *Nota:* ${customNotes}\n` : ''}
📍 *Dirección:* ${companySettings.address || ''}, ${companySettings.city || ''}
📞 *Teléfono:* ${companySettings.phone || ''}

_Para cualquier consulta, responde directamente a este mensaje._`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Add Order
  const addOrder = (newOrderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'statusHistory'>): Order => {
    const currentYear = new Date().getFullYear();
    const existingSeqNumbers = orders.map((o) => {
      const match = (o.orderNumber || '').match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 1000;
    });
    const maxSeq = Math.max(1000, ...existingSeqNumbers);
    const nextSeq = maxSeq + 1;
    const orderNumber = `OT-${currentYear}-${nextSeq}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      ...newOrderData,
      id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      orderNumber,
      createdAt: now,
      statusHistory: [
        {
          status: newOrderData.status || 'recibido',
          date: now,
          note: 'Orden creada e ingresada en el sistema',
          technician: newOrderData.technician || companySettings.defaultTechnician || 'Lucas Almada',
        },
      ],
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);

    // If deposit was paid upfront, automatically register cash movement
    let updatedCashMovements = cashMovements;
    if (newOrder.depositPaid && newOrder.depositPaid > 0) {
      const depositMovement: CashMovement = {
        id: `cash-${Date.now()}`,
        type: 'ingreso',
        concept: `Seña inicial por orden ${orderNumber}`,
        category: 'Seña de Orden de Trabajo',
        amount: newOrder.depositPaid,
        paymentMethod: newOrder.payments?.[0]?.method || 'efectivo',
        description: `Seña inicial por ingreso de orden ${orderNumber} (${newOrder.device?.brand} ${newOrder.device?.model})`,
        orderId: newOrder.id,
        orderNumber: orderNumber,
        recipientOrPayer: newOrder.client?.name,
        date: now,
        createdAt: now,
      };
      updatedCashMovements = [depositMovement, ...cashMovements];
      setCashMovements(updatedCashMovements);
    }

    // Update client order count
    let updatedClients = clients;
    if (newOrder.client?.id) {
      updatedClients = clients.map((c) =>
        c.id === newOrder.client.id
          ? { ...c, totalOrdersCount: (c.totalOrdersCount || 0) + 1 }
          : c
      );
      setClients(updatedClients);
    }

    // Direct synchronous persist to ensure zero data loss
    LocalDatabaseService.persistAll({
      companySettings,
      clients: updatedClients,
      servicesCatalog,
      orders: updatedOrders,
      inventory,
      cashMovements: updatedCashMovements,
    }).catch((err) => console.warn('Instant save on addOrder error:', err));

    return newOrder;
  };

  // Update Order
  const updateOrder = (updatedOrder: Order) => {
    const updatedOrders = orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
    setOrders(updatedOrders);
    LocalDatabaseService.persistAll({
      companySettings,
      clients,
      servicesCatalog,
      orders: updatedOrders,
      inventory,
      cashMovements,
    }).catch((err) => console.warn('Instant updateOrder persist error:', err));
  };

  // Update Order Status with audit log
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, note?: string) => {
    const now = new Date().toISOString();
    const updatedOrders = orders.map((ord) => {
      if (ord.id !== orderId) return ord;

      const updatedHistory = [
        {
          status: newStatus,
          date: now,
          note: note || `Estado cambiado a ${newStatus}`,
          technician: companySettings.defaultTechnician || 'Lucas Almada',
        },
        ...(ord.statusHistory || []),
      ];

      let deliveredAt = ord.deliveredAt;
      let budgetApprovedAt = ord.budgetApprovedAt;

      if (newStatus === 'entregado' && !deliveredAt) {
        deliveredAt = now;
      }
      if (newStatus === 'presupuesto_aprobado' && !budgetApprovedAt) {
        budgetApprovedAt = now;
      }

      return {
        ...ord,
        status: newStatus,
        statusHistory: updatedHistory,
        deliveredAt,
        budgetApprovedAt,
      };
    });

    setOrders(updatedOrders);
    LocalDatabaseService.persistAll({
      companySettings,
      clients,
      servicesCatalog,
      orders: updatedOrders,
      inventory,
      cashMovements,
    }).catch((err) => console.warn('Instant updateOrderStatus persist error:', err));
  };

  // Add Payment / Seña
  const addOrderPayment = (orderId: string, amount: number, method: PaymentMethod, note?: string) => {
    const now = new Date().toISOString();
    let targetOrderNumber = '';
    let targetClientName = '';
    let targetDevice = '';

    const updatedOrders = orders.map((ord) => {
      if (ord.id !== orderId) return ord;

      targetOrderNumber = ord.orderNumber;
      targetClientName = ord.client?.name || 'Cliente';
      targetDevice = `${ord.device?.brand || ''} ${ord.device?.model || ''}`.trim();

      const newPayment = {
        id: `pay-${Date.now()}`,
        amount,
        date: now,
        method,
        note: note || 'Pago registrado',
      };

      const updatedPayments = [...(ord.payments || []), newPayment];
      const newDeposit = (ord.depositPaid || 0) + amount;
      const newBalance = Math.max(0, (ord.totalAmount || 0) - newDeposit);

      let newPaymentStatus = ord.paymentStatus;
      if (newBalance <= 0) {
        newPaymentStatus = 'pagado';
      } else if (newDeposit > 0) {
        newPaymentStatus = 'seña_parcial';
      }

      return {
        ...ord,
        depositPaid: newDeposit,
        balanceDue: newBalance,
        paymentStatus: newPaymentStatus,
        payments: updatedPayments,
      };
    });

    setOrders(updatedOrders);

    // Automatically record payment in Cash Register
    const paymentMovement: CashMovement = {
      id: `cash-${Date.now()}`,
      type: 'ingreso',
      concept: `Cobro de orden ${targetOrderNumber}`,
      category: 'Cobro de Reparación',
      amount,
      paymentMethod: method,
      description: `Cobro de orden ${targetOrderNumber} (${targetDevice})${note ? ` - ${note}` : ''}`,
      orderId,
      orderNumber: targetOrderNumber,
      recipientOrPayer: targetClientName,
      date: now,
      createdAt: now,
    };
    const updatedCashMovements = [paymentMovement, ...cashMovements];
    setCashMovements(updatedCashMovements);

    LocalDatabaseService.persistAll({
      companySettings,
      clients,
      servicesCatalog,
      orders: updatedOrders,
      inventory,
      cashMovements: updatedCashMovements,
    }).catch((err) => console.warn('Instant addOrderPayment persist error:', err));
  };

  // Add Spare Part from Inventory to Order and deduct stock
  const addSparePartToOrder = (orderId: string, item: InventoryItem, quantity: number, customUnitPrice?: number) => {
    const unitPrice = customUnitPrice !== undefined ? customUnitPrice : (item.sellingPrice || item.salePrice || item.price || 0);
    const subtotal = unitPrice * quantity;
    const spareUsage: SparePartUsage = {
      id: `part-${Date.now()}`,
      inventoryItemId: item.id,
      name: item.name,
      sku: item.sku,
      quantity,
      unitCost: item.costPrice || item.cost || 0,
      unitPrice,
      totalPrice: subtotal,
      subtotal,
    };

    // Deduct stock from inventory
    const updatedInventory = inventory.map((inv) => {
      if (inv.id !== item.id) return inv;
      const currentStock = inv.quantity ?? inv.stock ?? 0;
      const newStock = Math.max(0, currentStock - quantity);
      return {
        ...inv,
        quantity: newStock,
        stock: newStock,
        updatedAt: new Date().toISOString(),
      };
    });
    setInventory(updatedInventory);

    // Update order with spare parts and recalculated totals
    const updatedOrders = orders.map((ord) => {
      if (ord.id !== orderId) return ord;
      const currentParts = ord.spareParts || [];
      const updatedParts = [...currentParts, spareUsage];
      const partsTotal = updatedParts.reduce((acc, p) => acc + (p.totalPrice || p.subtotal || 0), 0);
      const servicesTotal = (ord.services || []).reduce((acc, s) => acc + (s.totalPrice || 0), 0);
      const newTotal = servicesTotal + partsTotal;
      const newBalance = Math.max(0, newTotal - (ord.depositPaid || 0));

      return {
        ...ord,
        spareParts: updatedParts,
        totalAmount: newTotal,
        balanceDue: newBalance,
      };
    });

    setOrders(updatedOrders);
    LocalDatabaseService.persistAll({
      companySettings,
      clients,
      servicesCatalog,
      orders: updatedOrders,
      inventory: updatedInventory,
      cashMovements,
    }).catch((err) => console.warn('Instant addSparePartToOrder persist error:', err));
  };

  // Remove Spare Part from Order and restore inventory stock
  const removeSparePartFromOrder = (orderId: string, sparePartId: string) => {
    let partToRestore: SparePartUsage | undefined;

    const updatedOrders = orders.map((ord) => {
      if (ord.id !== orderId) return ord;
      const currentParts = ord.spareParts || [];
      partToRestore = currentParts.find((p) => p.id === sparePartId);
      const updatedParts = currentParts.filter((p) => p.id !== sparePartId);
      const partsTotal = updatedParts.reduce((acc, p) => acc + (p.totalPrice || p.subtotal || 0), 0);
      const servicesTotal = (ord.services || []).reduce((acc, s) => acc + (s.totalPrice || 0), 0);
      const newTotal = servicesTotal + partsTotal;
      const newBalance = Math.max(0, newTotal - (ord.depositPaid || 0));

      return {
        ...ord,
        spareParts: updatedParts,
        totalAmount: newTotal,
        balanceDue: newBalance,
      };
    });

    let updatedInventory = inventory;
    if (partToRestore && partToRestore.inventoryItemId) {
      const invId = partToRestore.inventoryItemId;
      const qty = partToRestore.quantity;
      updatedInventory = inventory.map((inv) => {
        if (inv.id !== invId) return inv;
        const currentStock = inv.quantity ?? inv.stock ?? 0;
        const newStock = currentStock + qty;
        return {
          ...inv,
          quantity: newStock,
          stock: newStock,
          updatedAt: new Date().toISOString(),
        };
      });
      setInventory(updatedInventory);
    }

    setOrders(updatedOrders);
    LocalDatabaseService.persistAll({
      companySettings,
      clients,
      servicesCatalog,
      orders: updatedOrders,
      inventory: updatedInventory,
      cashMovements,
    }).catch((err) => console.warn('Instant removeSparePartFromOrder persist error:', err));
  };

  // Inventory CRUD
  const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): InventoryItem => {
    const now = new Date().toISOString();
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: now,
      updatedAt: now,
    };

    const updatedInventory = [newItem, ...inventory];
    setInventory(updatedInventory);

    LocalDatabaseService.persistAll({
      companySettings,
      clients,
      servicesCatalog,
      orders,
      inventory: updatedInventory,
      cashMovements,
    }).catch((err) => console.warn('Instant addInventoryItem persist error:', err));

    return newItem;
  };

  const updateInventoryItem = (updatedItem: InventoryItem) => {
    const now = new Date().toISOString();
    const updatedInventory = inventory.map((item) =>
      item.id === updatedItem.id ? { ...updatedItem, updatedAt: now } : item
    );
    setInventory(updatedInventory);

    LocalDatabaseService.persistAll({
      companySettings,
      clients,
      servicesCatalog,
      orders,
      inventory: updatedInventory,
      cashMovements,
    }).catch((err) => console.warn('Instant updateInventoryItem persist error:', err));
  };

  const deleteInventoryItem = (itemId: string) => {
    LocalDatabaseService.trackDeletedEntity('inventory', itemId);
    const updatedInventory = inventory.filter((i) => i.id !== itemId);
    setInventory(updatedInventory);

    LocalDatabaseService.persistAllSync({
      companySettings,
      clients,
      servicesCatalog,
      orders,
      inventory: updatedInventory,
      cashMovements,
    });
    setCloudSyncState((prev) => ({ ...prev, pendingLocalChanges: true }));
  };

  const adjustInventoryStock = (itemId: string, quantityChange: number, reason?: string) => {
    const now = new Date().toISOString();
    let adjustedItemName = '';
    let adjustedItemCost = 0;

    const updatedInventory = inventory.map((item) => {
      if (item.id !== itemId) return item;
      adjustedItemName = item.name;
      adjustedItemCost = item.costPrice || item.cost || 0;
      const currentStock = item.quantity ?? item.stock ?? 0;
      const newStock = Math.max(0, currentStock + quantityChange);
      return { ...item, quantity: newStock, stock: newStock, updatedAt: now };
    });
    setInventory(updatedInventory);

    // If stock was purchased/added with positive quantity and has cost, we can log expense optionally
    let updatedCash = cashMovements;
    if (quantityChange > 0 && adjustedItemCost > 0 && reason?.includes('Compra')) {
      const expenseMovement: CashMovement = {
        id: `cash-${Date.now()}`,
        type: 'egreso',
        concept: `Compra de repuesto: ${adjustedItemName}`,
        category: 'Compra de Repuestos / Insumos',
        amount: adjustedItemCost * quantityChange,
        paymentMethod: 'efectivo',
        description: `Reposición de stock: ${quantityChange} un. de ${adjustedItemName}`,
        date: now,
        createdAt: now,
      };
      updatedCash = [expenseMovement, ...cashMovements];
      setCashMovements(updatedCash);
    }

    LocalDatabaseService.persistAll({
      companySettings,
      clients,
      servicesCatalog,
      orders,
      inventory: updatedInventory,
      cashMovements: updatedCash,
    }).catch((err) => console.warn('Instant adjustInventoryStock persist error:', err));
  };

  // Cash Movement Actions
  const addCashMovement = (movementData: Omit<CashMovement, 'id' | 'createdAt'>): CashMovement => {
    const now = new Date().toISOString();
    const newMovement: CashMovement = {
      ...movementData,
      id: `cash-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: now,
    };

    const updatedCash = [newMovement, ...cashMovements];
    setCashMovements(updatedCash);

    LocalDatabaseService.persistAll({
      companySettings,
      clients,
      servicesCatalog,
      orders,
      inventory,
      cashMovements: updatedCash,
    }).catch((err) => console.warn('Instant addCashMovement persist error:', err));

    return newMovement;
  };

  const deleteCashMovement = (movementId: string) => {
    LocalDatabaseService.trackDeletedEntity('cashMovements', movementId);
    const updatedCash = cashMovements.filter((m) => m.id !== movementId);
    setCashMovements(updatedCash);

    LocalDatabaseService.persistAllSync({
      companySettings,
      clients,
      servicesCatalog,
      orders,
      inventory,
      cashMovements: updatedCash,
    });
    setCloudSyncState((prev) => ({ ...prev, pendingLocalChanges: true }));
  };

  // Add Photo to order
  const addOrderPhoto = (orderId: string, photo: Omit<DevicePhoto, 'id' | 'date'>) => {
    const now = new Date().toISOString();
    const newPhoto: DevicePhoto = {
      ...photo,
      id: `img-${Date.now()}`,
      description: photo.description || 'Foto del equipo en recepción',
      date: now,
    };

    const updatedOrders = orders.map((ord) => {
      if (ord.id !== orderId) return ord;
      return {
        ...ord,
        photos: [...(ord.photos || []), newPhoto],
      };
    });

    setOrders(updatedOrders);
    LocalDatabaseService.persistAll({
      companySettings,
      clients,
      servicesCatalog,
      orders: updatedOrders,
      inventory,
      cashMovements,
    }).catch((err) => console.warn('Instant addOrderPhoto persist error:', err));
  };

  // Delete Photo from order
  const deleteOrderPhoto = (orderId: string, photoId: string) => {
    const updatedOrders = orders.map((ord) => {
      if (ord.id !== orderId) return ord;
      return {
        ...ord,
        photos: (ord.photos || []).filter((p) => p.id !== photoId),
      };
    });

    setOrders(updatedOrders);
    LocalDatabaseService.persistAll({
      companySettings,
      clients,
      servicesCatalog,
      orders: updatedOrders,
      inventory,
      cashMovements,
    }).catch((err) => console.warn('Instant deleteOrderPhoto persist error:', err));
  };

  // Approve / Reject budget
  const approveBudget = (orderId: string) => {
    updateOrderStatus(orderId, 'presupuesto_aprobado', 'Presupuesto aprobado por el cliente');
  };

  const rejectBudget = (orderId: string) => {
    updateOrderStatus(orderId, 'presupuesto_rechazado', 'Presupuesto rechazado por el cliente');
  };

  // Delete Order
  const deleteOrder = (orderId: string) => {
    LocalDatabaseService.trackDeletedEntity('orders', orderId);
    const updatedOrders = orders.filter((o) => o.id !== orderId);
    setOrders(updatedOrders);
    if (selectedOrderForModal?.id === orderId) {
      setSelectedOrderForModal(null);
    }
    LocalDatabaseService.persistAllSync({
      companySettings,
      clients,
      servicesCatalog,
      orders: updatedOrders,
      inventory,
      cashMovements,
    });
    setCloudSyncState((prev) => ({ ...prev, pendingLocalChanges: true }));
  };

  // Get Device History
  const getDeviceHistory = (serialOrImei: string, currentOrderId?: string) => {
    if (!serialOrImei || serialOrImei.trim().length < 3) return [];
    return orders.filter(
      (o) =>
        o.id !== currentOrderId &&
        (o.device?.serialOrImei || '').toLowerCase().trim() === serialOrImei.toLowerCase().trim()
    );
  };

  // Client CRUD
  const addClient = (newClientData: Omit<Client, 'id' | 'createdAt' | 'totalOrdersCount'>): Client => {
    const newClient: Client = {
      ...newClientData,
      id: `cli-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      totalOrdersCount: 0,
    };
    const updatedClients = [newClient, ...clients];
    setClients(updatedClients);

    LocalDatabaseService.persistAll({
      companySettings,
      clients: updatedClients,
      servicesCatalog,
      orders,
      inventory,
      cashMovements,
    }).catch((err) => console.warn('Instant addClient persist error:', err));

    return newClient;
  };

  const batchAddClients = (newClientsList: Omit<Client, 'id' | 'createdAt' | 'totalOrdersCount'>[]): number => {
    if (!newClientsList || newClientsList.length === 0) return 0;

    const timestamp = Date.now();
    const createdClients: Client[] = newClientsList.map((c, idx) => ({
      ...c,
      id: `cli-${timestamp}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date(timestamp + idx * 10).toISOString(),
      totalOrdersCount: 0,
    }));

    const updatedClients = [...createdClients, ...clients];
    setClients(updatedClients);

    LocalDatabaseService.persistAll({
      companySettings,
      clients: updatedClients,
      servicesCatalog,
      orders,
      inventory,
      cashMovements,
    }).catch((err) => console.warn('Instant batchAddClients persist error:', err));

    return createdClients.length;
  };

  const updateClient = (updatedClient: Client) => {
    const updatedClients = clients.map((c) => (c.id === updatedClient.id ? updatedClient : c));
    const updatedOrders = orders.map((ord) => {
      if (ord.client?.id === updatedClient.id) {
        return { ...ord, client: updatedClient };
      }
      return ord;
    });

    setClients(updatedClients);
    setOrders(updatedOrders);

    LocalDatabaseService.persistAll({
      companySettings,
      clients: updatedClients,
      servicesCatalog,
      orders: updatedOrders,
      inventory,
      cashMovements,
    }).catch((err) => console.warn('Instant updateClient persist error:', err));
  };

  const deleteClient = (clientId: string) => {
    LocalDatabaseService.trackDeletedEntity('clients', clientId);
    const updatedClients = clients.filter((c) => c.id !== clientId);
    setClients(updatedClients);
    LocalDatabaseService.persistAllSync({
      companySettings,
      clients: updatedClients,
      servicesCatalog,
      orders,
      inventory,
      cashMovements,
    });
    setCloudSyncState((prev) => ({ ...prev, pendingLocalChanges: true }));
  };

  // Catalog CRUD
  const addCatalogService = (service: Omit<CatalogService, 'id'>) => {
    const newService: CatalogService = {
      ...service,
      id: `srv-${Date.now()}`,
    };
    const updatedCatalog = [newService, ...servicesCatalog];
    setServicesCatalog(updatedCatalog);
    LocalDatabaseService.persistAllSync({
      companySettings,
      clients,
      servicesCatalog: updatedCatalog,
      orders,
      inventory,
      cashMovements,
    });
  };

  const updateCatalogService = (updatedService: CatalogService) => {
    const updatedCatalog = servicesCatalog.map((s) => (s.id === updatedService.id ? updatedService : s));
    setServicesCatalog(updatedCatalog);
    LocalDatabaseService.persistAllSync({
      companySettings,
      clients,
      servicesCatalog: updatedCatalog,
      orders,
      inventory,
      cashMovements,
    });
  };

  const deleteCatalogService = (serviceId: string) => {
    LocalDatabaseService.trackDeletedEntity('services', serviceId);
    const updatedCatalog = servicesCatalog.filter((s) => s.id !== serviceId);
    setServicesCatalog(updatedCatalog);
    LocalDatabaseService.persistAllSync({
      companySettings,
      clients,
      servicesCatalog: updatedCatalog,
      orders,
      inventory,
      cashMovements,
    });
    setCloudSyncState((prev) => ({ ...prev, pendingLocalChanges: true }));
  };

  // Company Settings
  const updateCompanySettings = (newSettings: Partial<CompanySettings>) => {
    setCompanySettings((prev) => ({
      ...prev,
      ...newSettings,
      userAccount: {
        ...prev.userAccount,
        ...(newSettings.userAccount || {}),
      },
      security: {
        ...prev.security,
        ...(newSettings.security || {}),
      },
      notifications: {
        ...prev.notifications,
        ...(newSettings.notifications || {}),
      },
      orderConfig: {
        ...prev.orderConfig,
        ...(newSettings.orderConfig || {}),
      },
      paymentDetails: {
        ...prev.paymentDetails,
        ...(newSettings.paymentDetails || {}),
      } as any,
      googleDrive: {
        ...prev.googleDrive,
        ...(newSettings.googleDrive || {}),
      },
      donation: {
        ...prev.donation,
        ...(newSettings.donation || {}),
      },
    }));
  };

  // Real Google Drive Sync & Backup upload
  const syncWithGoogleDrive = async (
    customClientId?: string
  ): Promise<{ success: boolean; message: string; backup?: DriveBackupItem }> => {
    setIsSyncingDrive(true);
    try {
      let authResult = await GoogleDriveService.requestGoogleAuth(customClientId);
      const token = authResult.token;

      if (authResult.user?.email) {
        setDriveUserEmail(authResult.user.email);
        localStorage.setItem('techfix_gdrive_user_email', authResult.user.email);
      }

      // Ensure Destination Folder exists in Drive
      const folderName = companySettings.googleDrive?.folderName || 'TechFix_Ordenes_Backups';
      const folderId = await GoogleDriveService.getOrCreateFolder(token, folderName);

      // Create backup payload
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `TechFix_Respaldo_Taller_${timestamp}.json`;

      const backupPayload = LocalDatabaseService.createBackupPayload(
        companySettings,
        orders,
        clients,
        servicesCatalog,
        inventory,
        cashMovements
      );

      const uploaded = await GoogleDriveService.uploadBackup(token, folderId, fileName, backupPayload);

      // Refresh backup list
      const updatedList = await GoogleDriveService.listBackups(token, folderId);
      setDriveBackups(updatedList);

      const nowIso = now.toISOString();
      updateCompanySettings({
        googleDrive: {
          ...companySettings.googleDrive,
          connected: true,
          lastBackupDate: nowIso,
          accountEmail: authResult.user?.email || driveUserEmail || companySettings.googleDrive?.accountEmail,
        },
      });

      return {
        success: true,
        message: `¡Copia de seguridad guardada con éxito en Google Drive! Archivo: ${uploaded.name}`,
        backup: uploaded,
      };
    } catch (error: any) {
      console.error('Google Drive Sync error:', error);
      return {
        success: false,
        message: error.message || 'Error al conectar con Google Drive',
      };
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Fetch list of backups from Drive
  const fetchDriveBackupsList = async (): Promise<DriveBackupItem[]> => {
    try {
      const token = GoogleDriveService.getStoredToken();
      if (!token) return [];
      const folderName = companySettings.googleDrive?.folderName || 'TechFix_Ordenes_Backups';
      const folderId = await GoogleDriveService.getOrCreateFolder(token, folderName);
      const list = await GoogleDriveService.listBackups(token, folderId);
      setDriveBackups(list);
      return list;
    } catch (e) {
      console.error('Error fetching drive backups list', e);
      return [];
    }
  };

  // Restore data from a Google Drive file
  const restoreFromDriveFile = async (fileId: string): Promise<boolean> => {
    try {
      const token = GoogleDriveService.getStoredToken();
      if (!token) throw new Error('No hay sesión activa de Google Drive');
      const backupData = await GoogleDriveService.downloadBackup(token, fileId);

      if (backupData.companySettings) setCompanySettings(backupData.companySettings);
      if (Array.isArray(backupData.clients)) setClients(backupData.clients);
      if (Array.isArray(backupData.servicesCatalog)) setServicesCatalog(backupData.servicesCatalog);
      if (Array.isArray(backupData.orders)) setOrders(backupData.orders);
      if (Array.isArray(backupData.inventory)) setInventory(backupData.inventory);
      if (Array.isArray(backupData.cashMovements)) setCashMovements(backupData.cashMovements);

      await LocalDatabaseService.persistAll({
        companySettings: backupData.companySettings || companySettings,
        clients: Array.isArray(backupData.clients) ? backupData.clients : clients,
        servicesCatalog: Array.isArray(backupData.servicesCatalog) ? backupData.servicesCatalog : servicesCatalog,
        orders: Array.isArray(backupData.orders) ? backupData.orders : orders,
        inventory: Array.isArray(backupData.inventory) ? backupData.inventory : inventory,
        cashMovements: Array.isArray(backupData.cashMovements) ? backupData.cashMovements : cashMovements,
      });

      return true;
    } catch (e) {
      console.error('Error restoring from Drive file', e);
      return false;
    }
  };

  // Disconnect Google Drive
  const disconnectGoogleDrive = () => {
    GoogleDriveService.clearStoredToken();
    setDriveUserEmail(null);
    setDriveBackups([]);
    localStorage.removeItem('techfix_gdrive_user_email');
    updateCompanySettings({
      googleDrive: {
        ...companySettings.googleDrive,
        connected: false,
        accountEmail: undefined,
      },
    });
  };

  // Export full JSON backup file
  const exportBackupData = () => {
    LocalDatabaseService.downloadBackupFile(
      companySettings,
      orders,
      clients,
      servicesCatalog,
      inventory,
      cashMovements
    );
  };

  // Import JSON backup file
  const importBackupData = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (!data) return false;

      if (data.companySettings) setCompanySettings(data.companySettings);
      if (Array.isArray(data.clients)) setClients(data.clients);
      if (Array.isArray(data.servicesCatalog)) setServicesCatalog(data.servicesCatalog);
      if (Array.isArray(data.orders)) setOrders(data.orders);
      if (Array.isArray(data.inventory)) setInventory(data.inventory);
      if (Array.isArray(data.cashMovements)) setCashMovements(data.cashMovements);

      LocalDatabaseService.persistAll({
        companySettings: data.companySettings || companySettings,
        clients: Array.isArray(data.clients) ? data.clients : clients,
        servicesCatalog: Array.isArray(data.servicesCatalog) ? data.servicesCatalog : servicesCatalog,
        orders: Array.isArray(data.orders) ? data.orders : orders,
        inventory: Array.isArray(data.inventory) ? data.inventory : inventory,
        cashMovements: Array.isArray(data.cashMovements) ? data.cashMovements : cashMovements,
      });

      return true;
    } catch (e) {
      console.error('Error importing backup JSON:', e);
      return false;
    }
  };

  // Reset to default data
  const resetToDefaultData = () => {
    setCompanySettings(initialCompanySettings);
    setClients(initialClients);
    setServicesCatalog(initialServicesCatalog);
    setOrders(initialOrders);
    setInventory(initialInventoryItems);
    setCashMovements(initialCashMovements);

    LocalDatabaseService.persistAll({
      companySettings: initialCompanySettings,
      clients: initialClients,
      servicesCatalog: initialServicesCatalog,
      orders: initialOrders,
      inventory: initialInventoryItems,
      cashMovements: initialCashMovements,
    });
  };

  // --- USER AUTHENTICATION & MULTI-DEVICE CLOUD SYNC METHODS ---
  const loginWithGoogle = async (): Promise<boolean> => {
    setCloudSyncState((prev) => ({ ...prev, isSyncing: true }));
    try {
      const auth = await CloudSyncService.authenticateWithGoogle();
      if (auth.success && auth.user) {
        setCurrentUser(auth.user);
        setDriveUserEmail(auth.user.email);
        updateCompanySettings({
          googleDrive: {
            ...companySettings.googleDrive,
            connected: true,
            accountEmail: auth.user.email,
          },
        });

        // Automatically perform differential synchronization upon login
        try {
          const folderName = companySettings.googleDrive?.folderName || 'Taller_OrdenesTrabajo_Sync';
          const localData = {
            companySettings,
            orders,
            clients,
            servicesCatalog,
            inventory,
            cashMovements,
          };
          const diffResult = await CloudSyncService.performDifferentialSync(localData, auth.user, folderName);
          if (diffResult.success && diffResult.mergedData) {
            const merged = diffResult.mergedData;
            if (merged.companySettings) setCompanySettings(merged.companySettings);
            if (Array.isArray(merged.clients)) setClients(merged.clients);
            if (Array.isArray(merged.servicesCatalog)) setServicesCatalog(merged.servicesCatalog);
            if (Array.isArray(merged.orders)) setOrders(merged.orders);
            if (Array.isArray(merged.inventory)) setInventory(merged.inventory);
            if (Array.isArray(merged.cashMovements)) setCashMovements(merged.cashMovements);

            LocalDatabaseService.persistAllSync({
              companySettings: merged.companySettings || companySettings,
              clients: Array.isArray(merged.clients) ? merged.clients : clients,
              servicesCatalog: Array.isArray(merged.servicesCatalog) ? merged.servicesCatalog : servicesCatalog,
              orders: Array.isArray(merged.orders) ? merged.orders : orders,
              inventory: Array.isArray(merged.inventory) ? merged.inventory : inventory,
              cashMovements: Array.isArray(merged.cashMovements) ? merged.cashMovements : cashMovements,
            });
          }
        } catch (syncErr) {
          console.warn('Auto differential cloud sync check notice:', syncErr);
        }

        const nowIso = new Date().toISOString();
        setCloudSyncState({
          isSyncing: false,
          isOnline: true,
          lastSyncDate: nowIso,
          lastSyncStatus: 'success',
          nextAutoSyncInSeconds: 15 * 60,
          pendingLocalChanges: false,
        });
        return true;
      }
      setCloudSyncState((prev) => ({ ...prev, isSyncing: false, lastSyncStatus: 'error' }));
      return false;
    } catch (e) {
      console.error('Google login error:', e);
      setCloudSyncState((prev) => ({ ...prev, isSyncing: false, lastSyncStatus: 'error' }));
      return false;
    }
  };

  const sendEmailVerificationCode = (email: string, name: string, role: UserRole = 'tecnico'): PendingEmailVerification => {
    return CloudSyncService.generateEmailVerificationCode(email, name, role);
  };

  const verifyEmailCode = (
    email: string,
    code: string,
    workshopName?: string
  ): { success: boolean; message: string; user?: UserProfile } => {
    const res = CloudSyncService.verifyEmailCode(email, code, workshopName);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      if (workshopName) {
        updateCompanySettings({ name: workshopName });
      }
    }
    return res;
  };

  const logoutUser = () => {
    LocalDatabaseService.clearUserProfile();
    setCurrentUser(null);
    disconnectGoogleDrive();
    setCloudSyncState({
      isSyncing: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      lastSyncDate: null,
      lastSyncStatus: 'idle',
      nextAutoSyncInSeconds: 15 * 60,
      pendingLocalChanges: false,
    });
  };

  const syncWithCloud = async (
    direction: 'push' | 'pull' | 'auto' = 'auto'
  ): Promise<{ success: boolean; message: string; restored?: boolean }> => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return {
        success: false,
        message: 'Por favor inicia sesión con tu cuenta para sincronizar tus dispositivos.',
      };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setCloudSyncState((prev) => ({ ...prev, isOnline: false, lastSyncStatus: 'offline' }));
      return {
        success: false,
        message: 'Dispositivo sin conexión a internet. Los datos están guardados localmente y se sincronizarán al restablecer la red.',
      };
    }

    setCloudSyncState((prev) => ({ ...prev, isSyncing: true }));
    const folderName = companySettings.googleDrive?.folderName || 'Taller_OrdenesTrabajo_Sync';

    try {
      const localData = {
        companySettings,
        orders,
        clients,
        servicesCatalog,
        inventory,
        cashMovements,
      };

      const diffResult = await CloudSyncService.performDifferentialSync(localData, currentUser, folderName);

      if (diffResult.success && diffResult.mergedData) {
        const merged = diffResult.mergedData;
        if (merged.companySettings) setCompanySettings(merged.companySettings);
        if (Array.isArray(merged.clients)) setClients(merged.clients);
        if (Array.isArray(merged.servicesCatalog)) setServicesCatalog(merged.servicesCatalog);
        if (Array.isArray(merged.orders)) setOrders(merged.orders);
        if (Array.isArray(merged.inventory)) setInventory(merged.inventory);
        if (Array.isArray(merged.cashMovements)) setCashMovements(merged.cashMovements);

        LocalDatabaseService.persistAllSync({
          companySettings: merged.companySettings || companySettings,
          clients: Array.isArray(merged.clients) ? merged.clients : clients,
          servicesCatalog: Array.isArray(merged.servicesCatalog) ? merged.servicesCatalog : servicesCatalog,
          orders: Array.isArray(merged.orders) ? merged.orders : orders,
          inventory: Array.isArray(merged.inventory) ? merged.inventory : inventory,
          cashMovements: Array.isArray(merged.cashMovements) ? merged.cashMovements : cashMovements,
        });

        const nowIso = new Date().toISOString();
        setCloudSyncState({
          isSyncing: false,
          isOnline: true,
          lastSyncDate: nowIso,
          lastSyncStatus: 'success',
          nextAutoSyncInSeconds: 15 * 60,
          pendingLocalChanges: false,
          lastSyncSummary: {
            addedCount: (diffResult.syncedStats?.ordersAdded || 0) + (diffResult.syncedStats?.clientsAdded || 0),
            updatedCount: (diffResult.syncedStats?.ordersUpdated || 0) + (diffResult.syncedStats?.inventoryUpdated || 0),
            deletedCount: diffResult.syncedStats?.tombstonesApplied || 0,
            syncedAt: nowIso,
          },
        });

        return {
          success: true,
          message: diffResult.message || '¡Sincronización diferencial completada exitosamente!',
          restored: direction === 'pull',
        };
      } else {
        setCloudSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncStatus: 'error',
          errorMessage: diffResult.message,
        }));
        return { success: false, message: diffResult.message };
      }
    } catch (e: any) {
      console.error('Cloud Sync general error:', e);
      setCloudSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncStatus: 'error',
        errorMessage: e.message,
      }));
      return { success: false, message: e.message || 'Error de sincronización diferencial con la nube.' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        orders,
        clients,
        servicesCatalog,
        inventory,
        cashMovements,
        companySettings,
        searchQuery,
        setSearchQuery,
        selectedOrderForModal,
        setSelectedOrderForModal,
        selectedOrderForPrint,
        setSelectedOrderForPrint,
        selectedDeviceForHistory,
        setSelectedDeviceForHistory,
        isDonateOpen,
        setIsDonateOpen,
        isGoogleDriveOpen,
        setIsGoogleDriveOpen,
        isBackupModalOpen,
        setIsBackupModalOpen,
        currentUser,
        cloudSyncState,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithGoogle,
        sendEmailVerificationCode,
        verifyEmailCode,
        logoutUser,
        syncWithCloud,
        dbStats,
        isSavingLocal,
        forceSaveLocalDatabase,
        addOrder,
        updateOrder,
        updateOrderStatus,
        addOrderPayment,
        addOrderPhoto,
        deleteOrderPhoto,
        approveBudget,
        rejectBudget,
        deleteOrder,
        getDeviceHistory,
        addSparePartToOrder,
        removeSparePartFromOrder,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        adjustInventoryStock,
        addCashMovement,
        deleteCashMovement,
        addClient,
        batchAddClients,
        updateClient,
        deleteClient,
        addCatalogService,
        updateCatalogService,
        deleteCatalogService,
        updateCompanySettings,
        syncWithGoogleDrive,
        fetchDriveBackupsList,
        restoreFromDriveFile,
        disconnectGoogleDrive,
        isSyncingDrive,
        driveBackups,
        driveUserEmail,
        exportBackupData,
        importBackupData,
        resetToDefaultData,
        formatMoney,
        generateWhatsAppLink,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
