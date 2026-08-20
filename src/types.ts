export type DeviceType =
  | 'smartphone'
  | 'notebook'
  | 'tablet'
  | 'pc'
  | 'smartwatch'
  | 'console'
  | 'all_in_one'
  | 'other';

export type OrderStatus =
  | 'recibido'
  | 'en_revision'
  | 'presupuesto_pendiente'
  | 'presupuesto_aprobado'
  | 'presupuesto_rechazado'
  | 'en_reparacion'
  | 'esperando_repuesto'
  | 'listo_entrega'
  | 'entregado'
  | 'cancelado';

export type PaymentStatus = 'pendiente' | 'seña_parcial' | 'pagado' | 'reembolsado';

export type PaymentMethod =
  | 'efectivo'
  | 'transferencia'
  | 'tarjeta_debito'
  | 'tarjeta_credito'
  | 'mercadopago'
  | 'mercado_pago'
  | 'otro';

export interface DevicePhoto {
  id: string;
  url: string;
  description: string;
  date: string;
}

export interface OrderItemService {
  id: string;
  name: string;
  category?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  note?: string;
}

export interface StatusHistoryItem {
  status: OrderStatus;
  date: string;
  note?: string;
  technician?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  documentId: string; // DNI / CUIT / RUT / CI
  address: string;
  city: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  totalOrdersCount?: number;
}

export interface DeviceChecklist {
  turnsOn?: boolean | string;
  powersOn?: boolean | string;
  screenCondition?: string;
  touchWorks?: boolean | string;
  displayTouch?: boolean | string;
  batteryHealth?: string;
  batteryCharging?: boolean | string;
  chargingPort?: boolean | string;
  frontCamera?: boolean | string;
  rearCamera?: boolean | string;
  camerasWorking?: boolean | string;
  audioSpeaker?: boolean | string;
  speakersWorking?: boolean | string;
  microphone?: boolean | string;
  microphoneWorking?: boolean | string;
  wifiBluetooth?: boolean | string;
  buttons?: boolean | string;
  buttonsWorking?: boolean | string;
  biometrics?: boolean | string;
  simSignal?: boolean | string;
  housingCondition?: boolean | string;
  chassisCondition?: string;
  waterDamage?: boolean | string;
  screwsPresent?: boolean | string;
  cosmeticCondition?: string;
  [key: string]: any;
}

export interface SparePartUsage {
  id: string;
  inventoryItemId?: string;
  sku?: string;
  name: string;
  quantity: number;
  unitCost?: number;
  unitPrice: number;
  totalPrice?: number;
  subtotal?: number;
  warrantyDays?: number;
}

export interface OrderDevice {
  type: DeviceType;
  brand: string;
  model: string;
  serialOrImei: string;
  color?: string;
  lockType: 'pin' | 'pattern' | 'password' | 'none';
  lockCode?: string;
  accessories: string[];
  reportedFault?: string;
  diagnosis?: string;
  checklist?: DeviceChecklist;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  estimatedDeliveryDate?: string;
  client: Client;
  device: OrderDevice;
  services: OrderItemService[];
  spareParts?: SparePartUsage[];
  conditionNotes: string; // Estado de recepción del equipo (pantalla, rayas, etc.)
  reportedFault?: string;
  problemDescription?: string;
  diagnosis?: string;
  checklist?: DeviceChecklist;
  internalNotes?: string; // Notas internas técnicas
  photos: DevicePhoto[];
  status: OrderStatus;
  statusHistory: StatusHistoryItem[];
  technician: string;
  totalAmount: number;
  depositPaid: number; // Seña
  balanceDue: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  payments: PaymentRecord[];
  warrantyDays: number;
  budgetApprovedAt?: string;
  deliveredAt?: string;
  updatedAt?: string;
}

export interface CatalogService {
  id: string;
  name: string;
  category: string;
  defaultPrice: number;
  estimatedMinutes?: number;
  description: string;
  active: boolean;
  updatedAt?: string;
}

export interface CompanyPaymentDetails {
  enabled: boolean;
  alias: string;
  cbuCvu?: string;
  bankName?: string;
  accountHolder?: string;
  qrCodeUrl?: string; // Base64 data URL or image URL for Payment QR code
  instructions?: string;
  showInPdf: boolean;
}

export interface UserAccountSettings {
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  phone: string;
  specialty: string;
  technicianCode: string;
}

export interface SecuritySettings {
  requirePinForDelete: boolean;
  autoLockMinutes: number;
  maskClientSensitiveData: boolean;
  auditLogsEnabled: boolean;
  sessionTimeout: boolean;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  whatsappAutoOpen: boolean;
  notifyOverdueOrders: boolean;
  notifyReadyForPickup: boolean;
  dailyBackupReminder: boolean;
  emailAlerts: boolean;
  browserNotifications: boolean;
}

export interface CompanySettings {
  name: string;
  tradeName: string;
  logoUrl: string;
  taxId: string; // CUIT / RUT / RFC
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  defaultTechnician: string;
  currency: string;
  currencySymbol: string;
  language: string; // 'es' | 'en'
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  userAccount: UserAccountSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  paymentDetails?: CompanyPaymentDetails;
  orderConfig: {
    showPriceInClientPdf: boolean;
    showTechnicianName: boolean;
    defaultWarrantyDays: number;
    termsAndClauses: string;
    promoBannerText: string;
    promoBannerEnabled: boolean;
  };
  googleDrive: {
    connected: boolean;
    accountEmail?: string;
    folderName: string;
    lastBackupDate?: string;
    autoBackup: boolean;
  };
  donation: {
    enabled: boolean;
    aliasCbu?: string;
    paypalEmail?: string;
    mercadoPagoLink?: string;
    message: string;
  };
  geminiApiKey?: string;
  updatedAt?: string;
}

export interface DatosOrdenVoz {
  cliente: string | null;
  contacto: string | null;
  equipo: string | null;
  falla: string | null;
  presupuesto: number | null;
  garantia_dias: number | null;
}

export interface DriveBackupItem {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
  webViewLink?: string;
}

export interface DBStats {
  ordersCount: number;
  clientsCount: number;
  servicesCount: number;
  photosCount: number;
  inventoryCount?: number;
  cashMovementsCount?: number;
  estimatedBytes: number;
  lastSavedAt: string;
  isIndexedDBAvailable: boolean;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  compatibility?: string;
  compatibleModels?: string | string[];
  quantity: number;
  stock?: number;
  minQuantity: number;
  minStock?: number;
  costPrice: number;
  cost?: number;
  sellingPrice: number;
  salePrice?: number;
  price?: number;
  supplier?: string;
  location?: string;
  notes?: string;
  createdAt?: string;
  updatedAt: string;
}

export type CashMovementType =
  | 'ingreso'
  | 'egreso'
  | 'ingreso_orden'
  | 'ingreso_manual'
  | 'egreso_repuesto'
  | 'egreso_gasto'
  | 'apertura_caja'
  | 'cierre_caja';

export interface CashMovement {
  id: string;
  date: string;
  type: CashMovementType;
  concept?: string;
  category?: string;
  description?: string;
  recipientOrPayer?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  orderId?: string;
  orderNumber?: string;
  user?: string;
  technician?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyCashSummary {
  cashInHand: number;
  bankTransfers: number;
  cardPayments: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

export type WhatsAppTemplateType =
  | 'ingreso'
  | 'ingreso_taller'
  | 'presupuesto'
  | 'presupuesto_pendiente'
  | 'en_reparacion'
  | 'esperando_repuesto'
  | 'listo'
  | 'listo_entrega'
  | 'entregado_garantia'
  | 'recordatorio'
  | 'recordatorio_retiro'
  | 'garantia'
  | 'personalizado';

export type ActiveTab =
  | 'ordenes'
  | 'nueva_orden'
  | 'clientes'
  | 'servicios'
  | 'inventario'
  | 'caja'
  | 'facturacion'
  | 'reportes'
  | 'basedatos'
  | 'ajustes'
  | 'manual'
  | 'acerca_de';

export type UserRole = 'admin' | 'tecnico' | 'recepcion';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  authProvider: 'google' | 'email' | 'guest';
  phone?: string;
  workshopName?: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  lastSyncAt?: string;
  googleDriveConnected?: boolean;
  deviceId?: string;
}

export interface PendingEmailVerification {
  email: string;
  name: string;
  code: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
}

export interface DeletedEntitiesMap {
  orders: { id: string; deletedAt: string }[];
  clients: { id: string; deletedAt: string }[];
  services: { id: string; deletedAt: string }[];
  inventory: { id: string; deletedAt: string }[];
  cashMovements: { id: string; deletedAt: string }[];
}

export interface CloudSyncState {
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncDate: string | null;
  lastSyncStatus: 'idle' | 'success' | 'error' | 'offline';
  errorMessage?: string;
  syncDeviceCount?: number;
  nextAutoSyncInSeconds: number;
  pendingLocalChanges: boolean;
  lastSyncSummary?: {
    addedCount: number;
    updatedCount: number;
    deletedCount: number;
    syncedAt: string;
  };
  syncDetails?: {
    uploadedToCloud: boolean;
    pulledFromCloud: boolean;
    ordersSynced: number;
    clientsSynced: number;
    inventorySynced: number;
    timestamp: string;
  };
}


