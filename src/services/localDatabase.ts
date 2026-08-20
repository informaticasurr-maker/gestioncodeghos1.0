import { Order, Client, CatalogService, CompanySettings, InventoryItem, CashMovement, DeletedEntitiesMap } from '../types';
import {
  initialClients,
  initialCompanySettings,
  initialOrders,
  initialServicesCatalog,
  initialInventoryItems,
  initialCashMovements,
} from '../data/initialData';

const DB_NAME = 'TechFix_Workshop_DB';
const DB_VERSION = 3;
const DB_INITIALIZED_KEY = 'techfix_db_initialized';
const DELETED_ENTITIES_KEY = 'techfix_deleted_entities';

export interface DBStats {
  ordersCount: number;
  clientsCount: number;
  servicesCount: number;
  inventoryCount: number;
  cashMovementsCount: number;
  photosCount: number;
  estimatedBytes: number;
  lastSavedAt: string;
  isIndexedDBAvailable: boolean;
}

export interface WorkshopBackupPayload {
  version: string;
  exportedAt: string;
  appName: string;
  companySettings: CompanySettings;
  orders: Order[];
  clients: Client[];
  servicesCatalog: CatalogService[];
  inventory?: InventoryItem[];
  cashMovements?: CashMovement[];
  deletedEntities?: DeletedEntitiesMap;
  metadata: {
    totalOrders: number;
    totalClients: number;
    totalRevenueEstimated: number;
    totalInventoryItems?: number;
    userEmail?: string;
    userName?: string;
    deviceId?: string;
    devicePlatform?: string;
  };
}

export interface LocalSnapshotItem {
  id: string;
  createdAt: string;
  label: string;
  ordersCount: number;
  clientsCount: number;
  totalRevenue: number;
  payload: WorkshopBackupPayload;
}

export class LocalDatabaseService {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  public static isInitialized = false;

  public static isIndexedDBSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  public static async getDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDBSupported()) {
      throw new Error('IndexedDB no está soportado en este entorno');
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        try {
          const request = window.indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains('orders')) {
              const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
              orderStore.createIndex('orderNumber', 'orderNumber', { unique: false });
              orderStore.createIndex('status', 'status', { unique: false });
              orderStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            if (!db.objectStoreNames.contains('clients')) {
              const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
              clientStore.createIndex('name', 'name', { unique: false });
              clientStore.createIndex('phone', 'phone', { unique: false });
            }

            if (!db.objectStoreNames.contains('servicesCatalog')) {
              db.createObjectStore('servicesCatalog', { keyPath: 'id' });
            }

            if (!db.objectStoreNames.contains('inventory')) {
              const invStore = db.createObjectStore('inventory', { keyPath: 'id' });
              invStore.createIndex('sku', 'sku', { unique: false });
              invStore.createIndex('category', 'category', { unique: false });
            }

            if (!db.objectStoreNames.contains('cashMovements')) {
              const cashStore = db.createObjectStore('cashMovements', { keyPath: 'id' });
              cashStore.createIndex('date', 'date', { unique: false });
              cashStore.createIndex('type', 'type', { unique: false });
            }

            if (!db.objectStoreNames.contains('settings')) {
              db.createObjectStore('settings', { keyPath: 'key' });
            }
          };

          request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            db.onversionchange = () => {
              db.close();
              this.dbPromise = null;
            };
            resolve(db);
          };

          request.onerror = (event) => {
            console.error('Error abriendo IndexedDB:', (event.target as IDBOpenDBRequest).error);
            this.dbPromise = null;
            reject((event.target as IDBOpenDBRequest).error);
          };

          request.onblocked = () => {
            console.warn('IndexedDB database upgrade was blocked');
          };
        } catch (e) {
          this.dbPromise = null;
          reject(e);
        }
      });
    }

    return this.dbPromise;
  }

  /**
   * Helper to deeply and safely merge CompanySettings without losing user customizations
   */
  public static sanitizeCompanySettings(raw: any): CompanySettings {
    if (!raw || typeof raw !== 'object') {
      return { ...initialCompanySettings };
    }

    return {
      ...initialCompanySettings,
      ...raw,
      userAccount: {
        ...initialCompanySettings.userAccount,
        ...(raw.userAccount || {}),
      },
      security: {
        ...initialCompanySettings.security,
        ...(raw.security || {}),
      },
      notifications: {
        ...initialCompanySettings.notifications,
        ...(raw.notifications || {}),
      },
      orderConfig: {
        ...initialCompanySettings.orderConfig,
        ...(raw.orderConfig || {}),
      },
      paymentDetails: {
        ...initialCompanySettings.paymentDetails,
        ...(raw.paymentDetails || {}),
      },
      googleDrive: {
        ...initialCompanySettings.googleDrive,
        ...(raw.googleDrive || {}),
      },
      donation: {
        ...initialCompanySettings.donation,
        ...(raw.donation || {}),
        aliasCbu: raw.donation?.aliasCbu || 'informaticasurr',
        paypalEmail: raw.donation?.paypalEmail || 'paypal.me/ojovirtual',
        mercadoPagoLink: raw.donation?.mercadoPagoLink || 'https://link.mercadopago.com.ar/informaticasurr',
      },
    };
  }

  /**
   * Loads initial state reliably. Never wipes out empty or customized user lists if already initialized.
   */
  public static async loadInitialData(): Promise<{
    companySettings: CompanySettings;
    clients: Client[];
    servicesCatalog: CatalogService[];
    orders: Order[];
    inventory: InventoryItem[];
    cashMovements: CashMovement[];
  }> {
    const isAlreadyInitialized = localStorage.getItem(DB_INITIALIZED_KEY) === 'true';

    // 1. Try loading from LocalStorage synchronously first
    const localSettingsRaw = this.getLocalStorageItem<any | null>('techfix_company_settings', null);
    const localOrders = this.getLocalStorageItem<Order[] | null>('techfix_orders', null);
    const localClients = this.getLocalStorageItem<Client[] | null>('techfix_clients', null);
    const localServices = this.getLocalStorageItem<CatalogService[] | null>('techfix_services_catalog', null);
    const localInventory = this.getLocalStorageItem<InventoryItem[] | null>('techfix_inventory', null);
    const localCash = this.getLocalStorageItem<CashMovement[] | null>('techfix_cash_movements', null);

    // If local storage has already been initialized previously, respect whatever user has
    if (isAlreadyInitialized || localSettingsRaw !== null || localOrders !== null || localClients !== null) {
      let finalOrders = localOrders || [];
      let finalClients = localClients || [];
      let finalServices = localServices || initialServicesCatalog;
      let finalInventory = localInventory || [];
      let finalCash = localCash || [];
      let finalSettings = this.sanitizeCompanySettings(localSettingsRaw);

      // Attempt to load rich data (e.g. photos) from IndexedDB if available
      try {
        if (this.isIndexedDBSupported()) {
          const db = await this.getDB();
          const [idbOrders, idbClients, idbServices, idbInventory, idbCash, idbSettings] = await Promise.all([
            this.getAllFromStore<Order>(db, 'orders'),
            this.getAllFromStore<Client>(db, 'clients'),
            this.getAllFromStore<CatalogService>(db, 'servicesCatalog'),
            this.getAllFromStore<InventoryItem>(db, 'inventory'),
            this.getAllFromStore<CashMovement>(db, 'cashMovements'),
            this.getByKeyFromStore<{ key: string; value: any }>(db, 'settings', 'companySettings'),
          ]);

          if (idbOrders && idbOrders.length > 0) {
            // Merge photos from IDB into local orders if local had truncated photos
            finalOrders = idbOrders;
          }
          if (idbClients && idbClients.length > 0) finalClients = idbClients;
          if (idbServices && idbServices.length > 0) finalServices = idbServices;
          if (idbInventory && idbInventory.length > 0) finalInventory = idbInventory;
          if (idbCash && idbCash.length > 0) finalCash = idbCash;
          if (idbSettings?.value) {
            finalSettings = this.sanitizeCompanySettings(idbSettings.value);
          }
        }
      } catch (e) {
        console.warn('Cargando con respaldo de LocalStorage:', e);
      }

      this.isInitialized = true;
      localStorage.setItem(DB_INITIALIZED_KEY, 'true');

      return {
        companySettings: finalSettings,
        clients: finalClients,
        servicesCatalog: finalServices,
        orders: finalOrders,
        inventory: finalInventory,
        cashMovements: finalCash,
      };
    }

    // 2. Fresh Installation: Seed with sample workshop data
    const freshData = {
      companySettings: { ...initialCompanySettings },
      clients: [...initialClients],
      servicesCatalog: [...initialServicesCatalog],
      orders: [...initialOrders],
      inventory: [...initialInventoryItems],
      cashMovements: [...initialCashMovements],
    };

    // Mark as initialized so future reloads NEVER overwrite user's modifications
    localStorage.setItem(DB_INITIALIZED_KEY, 'true');
    this.persistAllSync(freshData);
    this.persistAll(freshData).catch((err) => console.warn('Background IDB seed error:', err));

    this.isInitialized = true;
    return freshData;
  }

  /**
   * Synchronous LocalStorage save: Guarantees 0-latency persistence on page refresh or mobile close
   */
  public static persistAllSync(data: {
    companySettings: CompanySettings;
    clients: Client[];
    servicesCatalog: CatalogService[];
    orders: Order[];
    inventory?: InventoryItem[];
    cashMovements?: CashMovement[];
  }): void {
    try {
      localStorage.setItem(DB_INITIALIZED_KEY, 'true');
      localStorage.setItem('techfix_company_settings', JSON.stringify(data.companySettings));
      localStorage.setItem('techfix_clients', JSON.stringify(data.clients));
      localStorage.setItem('techfix_services_catalog', JSON.stringify(data.servicesCatalog));
      localStorage.setItem('techfix_inventory', JSON.stringify(data.inventory || []));
      localStorage.setItem('techfix_cash_movements', JSON.stringify(data.cashMovements || []));
      localStorage.setItem('techfix_last_saved', new Date().toISOString());

      try {
        localStorage.setItem('techfix_orders', JSON.stringify(data.orders));
      } catch (quotaErr) {
        console.warn('LocalStorage quota limit reached; caching lightweight orders for speed');
        const lightweightOrders = data.orders.map((o) => ({
          ...o,
          photos: (o.photos || []).map((p) => ({
            id: p.id,
            url: p.url && p.url.startsWith('data:') ? '' : p.url,
            description: p.description,
            date: p.date,
          })),
        }));
        localStorage.setItem('techfix_orders', JSON.stringify(lightweightOrders));
      }
    } catch (e) {
      console.warn('LocalStorage write warning:', e);
    }
  }

  /**
   * Complete persistence across IndexedDB (unlimited capacity) and LocalStorage
   */
  public static async persistAll(data: {
    companySettings: CompanySettings;
    clients: Client[];
    servicesCatalog: CatalogService[];
    orders: Order[];
    inventory: InventoryItem[];
    cashMovements: CashMovement[];
  }): Promise<boolean> {
    // 1. Immediate synchronous write
    this.persistAllSync(data);

    // 2. Persist to IndexedDB
    try {
      if (this.isIndexedDBSupported()) {
        const db = await this.getDB();
        const tx = db.transaction(
          ['orders', 'clients', 'servicesCatalog', 'inventory', 'cashMovements', 'settings'],
          'readwrite'
        );

        const orderStore = tx.objectStore('orders');
        orderStore.clear();
        data.orders.forEach((o) => orderStore.put(o));

        const clientStore = tx.objectStore('clients');
        clientStore.clear();
        data.clients.forEach((c) => clientStore.put(c));

        const srvStore = tx.objectStore('servicesCatalog');
        srvStore.clear();
        data.servicesCatalog.forEach((s) => srvStore.put(s));

        const invStore = tx.objectStore('inventory');
        invStore.clear();
        (data.inventory || []).forEach((inv) => invStore.put(inv));

        const cashStore = tx.objectStore('cashMovements');
        cashStore.clear();
        (data.cashMovements || []).forEach((cm) => cashStore.put(cm));

        const settingsStore = tx.objectStore('settings');
        settingsStore.put({ key: 'companySettings', value: data.companySettings });
        settingsStore.put({ key: 'isSeeded', value: true });

        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(new Error('Transaction aborted'));
        });

        return true;
      }
    } catch (err) {
      console.error('Error guardando en IndexedDB:', err);
    }

    return true;
  }

  /**
   * Tracks entity deletions (tombstones) so 15-minute differential cloud sync propagates deletions across devices
   */
  public static trackDeletedEntity(
    type: 'orders' | 'clients' | 'services' | 'inventory' | 'cashMovements',
    id: string
  ): void {
    try {
      const current = this.getDeletedEntities();
      const nowIso = new Date().toISOString();
      if (!current[type].some((item) => item.id === id)) {
        current[type].push({ id, deletedAt: nowIso });
        // Keep last 200 tombstones per category
        if (current[type].length > 200) {
          current[type] = current[type].slice(-200);
        }
        localStorage.setItem(DELETED_ENTITIES_KEY, JSON.stringify(current));
      }
    } catch (e) {
      console.warn('Error tracking deleted entity:', e);
    }
  }

  public static getDeletedEntities(): DeletedEntitiesMap {
    try {
      const saved = localStorage.getItem(DELETED_ENTITIES_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}

    return {
      orders: [],
      clients: [],
      services: [],
      inventory: [],
      cashMovements: [],
    };
  }

  /**
   * Calculates storage stats and bytes used
   */
  public static async getStorageStats(
    orders: Order[],
    clients: Client[],
    servicesCatalog: CatalogService[],
    inventory: InventoryItem[] = [],
    cashMovements: CashMovement[] = []
  ): Promise<DBStats> {
    const totalPhotos = orders.reduce((sum, o) => sum + (o.photos ? o.photos.length : 0), 0);

    let bytes = 0;
    try {
      bytes += JSON.stringify(orders).length * 2;
      bytes += JSON.stringify(clients).length * 2;
      bytes += JSON.stringify(servicesCatalog).length * 2;
      bytes += JSON.stringify(inventory).length * 2;
      bytes += JSON.stringify(cashMovements).length * 2;
    } catch {
      bytes = 1024 * 50;
    }

    return {
      ordersCount: orders.length,
      clientsCount: clients.length,
      servicesCount: servicesCatalog.length,
      inventoryCount: inventory.length,
      cashMovementsCount: cashMovements.length,
      photosCount: totalPhotos,
      estimatedBytes: bytes,
      lastSavedAt: new Date().toISOString(),
      isIndexedDBAvailable: this.isIndexedDBSupported(),
    };
  }

  /**
   * Bundles full application database into a backup payload
   */
  public static createBackupPayload(
    companySettings: CompanySettings,
    orders: Order[],
    clients: Client[],
    servicesCatalog: CatalogService[],
    inventory: InventoryItem[] = [],
    cashMovements: CashMovement[] = []
  ): WorkshopBackupPayload {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const user = this.getUserProfile();

    return {
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'TechFix Pro - Sistema de Gestión de Reparaciones',
      companySettings,
      orders,
      clients,
      servicesCatalog,
      inventory,
      cashMovements,
      deletedEntities: this.getDeletedEntities(),
      metadata: {
        totalOrders: orders.length,
        totalClients: clients.length,
        totalRevenueEstimated: totalRevenue,
        totalInventoryItems: inventory.length,
        userEmail: user?.email,
        userName: user?.name,
        deviceId: this.getDeviceId(),
        devicePlatform: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
      },
    };
  }

  /**
   * Generates and saves an auto snapshot locally (retaining the last 5 snapshots)
   */
  public static async createAutoSnapshot(
    label: string,
    companySettings: CompanySettings,
    orders: Order[],
    clients: Client[],
    servicesCatalog: CatalogService[],
    inventory: InventoryItem[] = [],
    cashMovements: CashMovement[] = []
  ): Promise<LocalSnapshotItem> {
    const payload = this.createBackupPayload(companySettings, orders, clients, servicesCatalog, inventory, cashMovements);
    const snapshot: LocalSnapshotItem = {
      id: `snap_${Date.now()}`,
      createdAt: new Date().toISOString(),
      label,
      ordersCount: orders.length,
      clientsCount: clients.length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      payload,
    };

    try {
      const existing = this.getAutoSnapshots();
      const updated = [snapshot, ...existing.filter((s) => s.id !== snapshot.id)].slice(0, 5);
      localStorage.setItem('techfix_auto_snapshots', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save full snapshot to localStorage quota:', e);
    }

    return snapshot;
  }

  public static getAutoSnapshots(): LocalSnapshotItem[] {
    try {
      const raw = localStorage.getItem('techfix_auto_snapshots');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static deleteSnapshot(snapshotId: string): void {
    try {
      const existing = this.getAutoSnapshots();
      const updated = existing.filter((s) => s.id !== snapshotId);
      localStorage.setItem('techfix_auto_snapshots', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error deleting snapshot:', e);
    }
  }

  public static downloadBackupFile(
    companySettings: CompanySettings,
    orders: Order[],
    clients: Client[],
    servicesCatalog: CatalogService[],
    inventory: InventoryItem[] = [],
    cashMovements: CashMovement[] = []
  ): void {
    const payload = this.createBackupPayload(companySettings, orders, clients, servicesCatalog, inventory, cashMovements);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Backup_Taller_${(companySettings.name || 'TechFix').replace(/\s+/g, '_')}_${dateStr}.json`;

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  private static getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve((request.result as T[]) || []);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  private static getByKeyFromStore<T>(db: IDBDatabase, storeName: string, key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve((request.result as T) || null);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  private static getLocalStorageItem<T>(key: string, defaultValue: T): T {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  // --- User Profile & Device Identification ---
  public static getDeviceId(): string {
    let deviceId = localStorage.getItem('techfix_device_id');
    if (!deviceId) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      deviceId = `${isMobile ? 'mobile' : 'pc'}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('techfix_device_id', deviceId);
    }
    return deviceId;
  }

  public static getUserProfile(): any | null {
    try {
      const saved = localStorage.getItem('techfix_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  public static saveUserProfile(user: any): void {
    try {
      localStorage.setItem('techfix_current_user', JSON.stringify(user));
      const registered = this.getRegisteredUsers();
      const existingIdx = registered.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
      if (existingIdx >= 0) {
        registered[existingIdx] = user;
      } else {
        registered.push(user);
      }
      localStorage.setItem('techfix_registered_users', JSON.stringify(registered));
    } catch (err) {
      console.warn('Error guardando perfil de usuario:', err);
    }
  }

  public static clearUserProfile(): void {
    try {
      localStorage.removeItem('techfix_current_user');
    } catch (err) {
      console.warn('Error limpiando perfil de usuario:', err);
    }
  }

  public static getRegisteredUsers(): any[] {
    try {
      const saved = localStorage.getItem('techfix_registered_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
}
