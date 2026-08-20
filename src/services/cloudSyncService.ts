import {
  UserProfile,
  UserRole,
  PendingEmailVerification,
  DriveBackupItem,
  Order,
  Client,
  CatalogService,
  InventoryItem,
  CashMovement,
  CompanySettings,
  DeletedEntitiesMap,
} from '../types';
import { GoogleDriveService } from './googleDriveService';
import { LocalDatabaseService, WorkshopBackupPayload } from './localDatabase';

const PENDING_VERIFICATION_KEY = 'techfix_pending_verification';
const CLOUD_MASTER_FILENAME = 'OrdenDeTrabajo_Taller_CloudData.json';
export const AUTO_SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

export interface DifferentialSyncResult {
  success: boolean;
  isOffline?: boolean;
  notAuthenticated?: boolean;
  message: string;
  mergedData?: {
    companySettings: CompanySettings;
    orders: Order[];
    clients: Client[];
    servicesCatalog: CatalogService[];
    inventory: InventoryItem[];
    cashMovements: CashMovement[];
  };
  stats?: {
    uploadedToCloud: boolean;
    pulledFromCloud: boolean;
    ordersSynced: number;
    clientsSynced: number;
    inventorySynced: number;
    timestamp: string;
  };
  syncedStats?: {
    ordersAdded: number;
    ordersUpdated: number;
    clientsAdded: number;
    inventoryUpdated: number;
    tombstonesApplied: number;
  };
}

export class CloudSyncService {
  /**
   * Generates a 6-digit numeric verification code for email registration/login
   */
  public static generateEmailVerificationCode(
    email: string,
    name: string,
    role: UserRole = 'tecnico'
  ): PendingEmailVerification {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || 'Técnico de Taller';

    // Generate a 6-digit numeric security code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes validity

    const pending: PendingEmailVerification = {
      email: cleanEmail,
      name: cleanName,
      code,
      role,
      createdAt: now,
      expiresAt,
    };

    localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(pending));

    console.info(`[ORDEN DE TRABAJO IA] Código de verificación enviado a ${cleanEmail}: ${code}`);

    return pending;
  }

  public static getPendingVerification(): PendingEmailVerification | null {
    try {
      const data = localStorage.getItem(PENDING_VERIFICATION_KEY);
      if (!data) return null;
      const parsed: PendingEmailVerification = JSON.parse(data);
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(PENDING_VERIFICATION_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  public static clearPendingVerification(): void {
    localStorage.removeItem(PENDING_VERIFICATION_KEY);
  }

  /**
   * Verifies the 6-digit code and creates/updates the UserProfile
   */
  public static verifyEmailCode(
    email: string,
    enteredCode: string,
    workshopName?: string
  ): { success: boolean; message: string; user?: UserProfile } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = enteredCode.trim().replace(/\D/g, '');
    const pending = this.getPendingVerification();

    if (!pending || pending.email !== cleanEmail) {
      return {
        success: false,
        message: 'No hay un código pendiente para este correo o ya ha expirado. Por favor solicita uno nuevo.',
      };
    }

    if (Date.now() > pending.expiresAt) {
      this.clearPendingVerification();
      return {
        success: false,
        message: 'El código de verificación ha expirado (validez de 15 minutos). Por favor solicita uno nuevo.',
      };
    }

    if (pending.code !== cleanCode) {
      return {
        success: false,
        message: 'El código de verificación ingresado no es correcto. Verifica los 6 números.',
      };
    }

    const existingUsers = LocalDatabaseService.getRegisteredUsers();
    const existing = existingUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    const nowIso = new Date().toISOString();
    const user: UserProfile = {
      id: existing?.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      name: pending.name || existing?.name || 'Técnico de Taller',
      avatarUrl: existing?.avatarUrl || undefined,
      authProvider: 'email',
      workshopName: workshopName || existing?.workshopName || 'Laboratorio Técnico',
      role: pending.role || existing?.role || 'tecnico',
      isEmailVerified: true,
      createdAt: existing?.createdAt || nowIso,
      lastLoginAt: nowIso,
      lastSyncAt: existing?.lastSyncAt || undefined,
      googleDriveConnected: existing?.googleDriveConnected || false,
      deviceId: LocalDatabaseService.getDeviceId(),
    };

    LocalDatabaseService.saveUserProfile(user);
    this.clearPendingVerification();

    return {
      success: true,
      message: '¡Cuenta verificada e iniciada con éxito!',
      user,
    };
  }

  /**
   * Signs in or registers user via Google OAuth & connects Google Drive automatically
   */
  public static async authenticateWithGoogle(): Promise<{
    success: boolean;
    user?: UserProfile;
    token?: string;
    message?: string;
  }> {
    try {
      const authResult = await GoogleDriveService.requestGoogleAuth();
      const token = authResult.token;
      const googleUser = authResult.user;

      if (!token) {
        return {
          success: false,
          message: 'No se obtuvo token de autorización de Google.',
        };
      }

      const email = googleUser?.email || localStorage.getItem('techfix_gdrive_user_email') || 'tecnico@google.com';
      const name = googleUser?.name || localStorage.getItem('techfix_gdrive_user_name') || 'Técnico Google';
      const avatarUrl = googleUser?.picture;

      const existingUsers = LocalDatabaseService.getRegisteredUsers();
      const existing = existingUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

      const nowIso = new Date().toISOString();
      const user: UserProfile = {
        id: existing?.id || `usr-g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        email: email.toLowerCase(),
        name,
        avatarUrl,
        authProvider: 'google',
        role: existing?.role || 'admin',
        workshopName: existing?.workshopName || 'Laboratorio Técnico',
        isEmailVerified: true,
        createdAt: existing?.createdAt || nowIso,
        lastLoginAt: nowIso,
        lastSyncAt: existing?.lastSyncAt || undefined,
        googleDriveConnected: true,
        deviceId: LocalDatabaseService.getDeviceId(),
      };

      LocalDatabaseService.saveUserProfile(user);

      return {
        success: true,
        user,
        token,
        message: 'Sesión iniciada con Google y Drive conectado correctamente.',
      };
    } catch (err: any) {
      console.error('Error autenticando con Google:', err);
      return {
        success: false,
        message: err.message || 'Error al conectar con la cuenta de Google.',
      };
    }
  }

  /**
   * Performs an Intelligent 15-Minute Differential Bi-directional Synchronization
   * Merges strictly new/modified entities between this device and Google Drive master copy.
   */
  public static async performDifferentialSync(
    localData: {
      companySettings: CompanySettings;
      orders: Order[];
      clients: Client[];
      servicesCatalog: CatalogService[];
      inventory: InventoryItem[];
      cashMovements: CashMovement[];
    },
    user: UserProfile | null,
    folderName: string = 'Taller_OrdenesTrabajo_Sync'
  ): Promise<DifferentialSyncResult> {
    // 1. Offline Check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        success: false,
        isOffline: true,
        message: 'Dispositivo sin conexión a internet. Los datos continúan guardados localmente.',
      };
    }

    const token = GoogleDriveService.getStoredToken();
    if (!token) {
      return {
        success: false,
        notAuthenticated: true,
        message: 'Google Drive no está conectado. Conéctate para sincronizar.',
      };
    }

    try {
      const folderId = await GoogleDriveService.getOrCreateFolder(token, folderName);
      const files = await GoogleDriveService.listBackups(token, folderId);
      const masterFile = files.find((f) => f.name === CLOUD_MASTER_FILENAME);

      const localTombstones = LocalDatabaseService.getDeletedEntities();
      const deviceId = LocalDatabaseService.getDeviceId();

      // Case A: Cloud master doesn't exist yet -> Push current local as initial cloud master
      if (!masterFile) {
        const payload = LocalDatabaseService.createBackupPayload(
          localData.companySettings,
          localData.orders,
          localData.clients,
          localData.servicesCatalog,
          localData.inventory,
          localData.cashMovements
        );

        await GoogleDriveService.uploadBackup(token, folderId, CLOUD_MASTER_FILENAME, payload);

        const nowIso = new Date().toISOString();
        if (user) {
          LocalDatabaseService.saveUserProfile({
            ...user,
            lastSyncAt: nowIso,
            googleDriveConnected: true,
          });
        }

        return {
          success: true,
          message: 'Copia maestra creada exitosamente en Google Drive.',
          stats: {
            uploadedToCloud: true,
            pulledFromCloud: false,
            ordersSynced: localData.orders.length,
            clientsSynced: localData.clients.length,
            inventorySynced: localData.inventory.length,
            timestamp: nowIso,
          },
        };
      }

      // Case B: Cloud master exists -> Download and perform differential merge
      const cloudPayload: WorkshopBackupPayload = await GoogleDriveService.downloadBackup(token, masterFile.id);

      if (!cloudPayload || !cloudPayload.orders) {
        throw new Error('Estructura de datos en la nube inválida');
      }

      let localChanged = false;
      let cloudNeedsUpdate = false;

      // 1. Merge Deleted Entities (Tombstones)
      const cloudTombstones: DeletedEntitiesMap = cloudPayload.deletedEntities || {
        orders: [],
        clients: [],
        services: [],
        inventory: [],
        cashMovements: [],
      };

      const mergedDeletedOrders = new Set([
        ...localTombstones.orders.map((o) => o.id),
        ...cloudTombstones.orders.map((o) => o.id),
      ]);
      const mergedDeletedClients = new Set([
        ...localTombstones.clients.map((c) => c.id),
        ...cloudTombstones.clients.map((c) => c.id),
      ]);
      const mergedDeletedInventory = new Set([
        ...localTombstones.inventory.map((i) => i.id),
        ...cloudTombstones.inventory.map((i) => i.id),
      ]);
      const mergedDeletedServices = new Set([
        ...localTombstones.services.map((s) => s.id),
        ...cloudTombstones.services.map((s) => s.id),
      ]);
      const mergedDeletedCash = new Set([
        ...localTombstones.cashMovements.map((cm) => cm.id),
        ...cloudTombstones.cashMovements.map((cm) => cm.id),
      ]);

      // 2. Differential Merge: Company Settings
      let mergedSettings: CompanySettings = { ...localData.companySettings };
      const localSettingsTime = new Date(localData.companySettings.updatedAt || 0).getTime();
      const cloudSettingsTime = new Date(cloudPayload.companySettings?.updatedAt || 0).getTime();

      if (cloudSettingsTime > localSettingsTime) {
        mergedSettings = LocalDatabaseService.sanitizeCompanySettings(cloudPayload.companySettings);
        localChanged = true;
      } else if (localSettingsTime > cloudSettingsTime) {
        cloudNeedsUpdate = true;
      }

      // 3. Differential Merge: Orders (by ID with latest update)
      const orderMap = new Map<string, Order>();

      // Populate cloud orders (excluding deleted)
      (cloudPayload.orders || []).forEach((cOrder) => {
        if (!mergedDeletedOrders.has(cOrder.id)) {
          orderMap.set(cOrder.id, cOrder);
        }
      });

      // Compare with local orders
      localData.orders.forEach((lOrder) => {
        if (mergedDeletedOrders.has(lOrder.id)) {
          // If local order is marked deleted, ensure cloud removes it
          if (orderMap.has(lOrder.id)) {
            orderMap.delete(lOrder.id);
            cloudNeedsUpdate = true;
          }
          return;
        }

        const existingCloudOrder = orderMap.get(lOrder.id);
        if (!existingCloudOrder) {
          // New local order not in cloud -> add and flag upload
          orderMap.set(lOrder.id, lOrder);
          cloudNeedsUpdate = true;
        } else {
          // Exists in both -> resolve conflict using latest modification timestamp
          const localTime = new Date(lOrder.updatedAt || lOrder.createdAt || 0).getTime();
          const cloudTime = new Date(existingCloudOrder.updatedAt || existingCloudOrder.createdAt || 0).getTime();

          if (localTime > cloudTime) {
            orderMap.set(lOrder.id, lOrder);
            cloudNeedsUpdate = true;
          } else if (cloudTime > localTime) {
            orderMap.set(lOrder.id, existingCloudOrder);
            localChanged = true;
          }
        }
      });

      // Check if cloud had orders not present in local
      const mergedOrders = Array.from(orderMap.values());
      if (mergedOrders.length !== localData.orders.length || localChanged) {
        localChanged = true;
      }

      // 4. Differential Merge: Clients
      const clientMap = new Map<string, Client>();
      (cloudPayload.clients || []).forEach((cClient) => {
        if (!mergedDeletedClients.has(cClient.id)) {
          clientMap.set(cClient.id, cClient);
        }
      });

      localData.clients.forEach((lClient) => {
        if (mergedDeletedClients.has(lClient.id)) {
          if (clientMap.has(lClient.id)) {
            clientMap.delete(lClient.id);
            cloudNeedsUpdate = true;
          }
          return;
        }

        const existingCloud = clientMap.get(lClient.id);
        if (!existingCloud) {
          clientMap.set(lClient.id, lClient);
          cloudNeedsUpdate = true;
        } else {
          const lTime = new Date(lClient.updatedAt || lClient.createdAt || 0).getTime();
          const cTime = new Date(existingCloud.updatedAt || existingCloud.createdAt || 0).getTime();
          if (lTime > cTime) {
            clientMap.set(lClient.id, lClient);
            cloudNeedsUpdate = true;
          } else if (cTime > lTime) {
            clientMap.set(lClient.id, existingCloud);
            localChanged = true;
          }
        }
      });

      const mergedClients = Array.from(clientMap.values());
      if (mergedClients.length !== localData.clients.length) {
        localChanged = true;
      }

      // 5. Differential Merge: Inventory
      const invMap = new Map<string, InventoryItem>();
      (cloudPayload.inventory || []).forEach((cInv) => {
        if (!mergedDeletedInventory.has(cInv.id)) {
          invMap.set(cInv.id, cInv);
        }
      });

      localData.inventory.forEach((lInv) => {
        if (mergedDeletedInventory.has(lInv.id)) {
          if (invMap.has(lInv.id)) {
            invMap.delete(lInv.id);
            cloudNeedsUpdate = true;
          }
          return;
        }

        const existingCloud = invMap.get(lInv.id);
        if (!existingCloud) {
          invMap.set(lInv.id, lInv);
          cloudNeedsUpdate = true;
        } else {
          const lTime = new Date(lInv.updatedAt || lInv.createdAt || 0).getTime();
          const cTime = new Date(existingCloud.updatedAt || existingCloud.createdAt || 0).getTime();
          if (lTime > cTime) {
            invMap.set(lInv.id, lInv);
            cloudNeedsUpdate = true;
          } else if (cTime > lTime) {
            invMap.set(lInv.id, existingCloud);
            localChanged = true;
          }
        }
      });

      const mergedInventory = Array.from(invMap.values());

      // 6. Differential Merge: Cash Movements (Union by ID)
      const cashMap = new Map<string, CashMovement>();
      (cloudPayload.cashMovements || []).forEach((c) => {
        if (!mergedDeletedCash.has(c.id)) {
          cashMap.set(c.id, c);
        }
      });

      localData.cashMovements.forEach((l) => {
        if (!mergedDeletedCash.has(l.id)) {
          if (!cashMap.has(l.id)) {
            cloudNeedsUpdate = true;
          }
          cashMap.set(l.id, l);
        }
      });

      const mergedCash = Array.from(cashMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // 7. Differential Merge: Services Catalog
      const srvMap = new Map<string, CatalogService>();
      (cloudPayload.servicesCatalog || []).forEach((s) => {
        if (!mergedDeletedServices.has(s.id)) {
          srvMap.set(s.id, s);
        }
      });

      localData.servicesCatalog.forEach((l) => {
        if (!mergedDeletedServices.has(l.id)) {
          if (!srvMap.has(l.id)) {
            cloudNeedsUpdate = true;
          }
          srvMap.set(l.id, l);
        }
      });

      const mergedServices = Array.from(srvMap.values());

      const mergedPayloadResult = {
        companySettings: mergedSettings,
        orders: mergedOrders,
        clients: mergedClients,
        servicesCatalog: mergedServices,
        inventory: mergedInventory,
        cashMovements: mergedCash,
      };

      const nowIso = new Date().toISOString();

      // If cloud needs updating, push merged master file
      if (cloudNeedsUpdate) {
        const payloadToUpload: WorkshopBackupPayload = {
          version: '3.0.0',
          exportedAt: nowIso,
          appName: 'TechFix Pro - Sistema de Gestión de Reparaciones',
          companySettings: mergedSettings,
          orders: mergedOrders,
          clients: mergedClients,
          servicesCatalog: mergedServices,
          inventory: mergedInventory,
          cashMovements: mergedCash,
          deletedEntities: {
            orders: Array.from(mergedDeletedOrders).map((id) => ({ id, deletedAt: nowIso })),
            clients: Array.from(mergedDeletedClients).map((id) => ({ id, deletedAt: nowIso })),
            services: Array.from(mergedDeletedServices).map((id) => ({ id, deletedAt: nowIso })),
            inventory: Array.from(mergedDeletedInventory).map((id) => ({ id, deletedAt: nowIso })),
            cashMovements: Array.from(mergedDeletedCash).map((id) => ({ id, deletedAt: nowIso })),
          },
          metadata: {
            totalOrders: mergedOrders.length,
            totalClients: mergedClients.length,
            totalRevenueEstimated: mergedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
            totalInventoryItems: mergedInventory.length,
            userEmail: user?.email,
            userName: user?.name,
            deviceId,
            devicePlatform: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
          },
        };

        await GoogleDriveService.uploadBackup(token, folderId, CLOUD_MASTER_FILENAME, payloadToUpload);
      }

      // If local data was updated from cloud, persist locally immediately
      if (localChanged) {
        LocalDatabaseService.persistAllSync(mergedPayloadResult);
        LocalDatabaseService.persistAll(mergedPayloadResult).catch(() => {});
      }

      // Update user sync timestamp
      if (user) {
        LocalDatabaseService.saveUserProfile({
          ...user,
          lastSyncAt: nowIso,
          googleDriveConnected: true,
        });
      }

      return {
        success: true,
        message: localChanged || cloudNeedsUpdate
          ? 'Sincronización diferencial completada exitosamente.'
          : 'Todos los dispositivos están sincronizados al día.',
        mergedData: localChanged ? mergedPayloadResult : undefined,
        stats: {
          uploadedToCloud: cloudNeedsUpdate,
          pulledFromCloud: localChanged,
          ordersSynced: mergedOrders.length,
          clientsSynced: mergedClients.length,
          inventorySynced: mergedInventory.length,
          timestamp: nowIso,
        },
      };
    } catch (err: any) {
      console.error('Error en sincronización diferencial:', err);
      return {
        success: false,
        message: `Error al sincronizar con Google Drive: ${err.message || 'Fallo de red'}`,
      };
    }
  }

  /**
   * Uploads current application state to user's Google Drive manually
   */
  public static async pushDataToCloudDrive(
    payload: WorkshopBackupPayload,
    user: UserProfile,
    folderName: string = 'Taller_OrdenesTrabajo_Sync'
  ): Promise<{ success: boolean; message: string; backupItem?: DriveBackupItem }> {
    const token = GoogleDriveService.getStoredToken();
    if (!token) {
      const auth = await this.authenticateWithGoogle();
      if (!auth.success || !auth.token) {
        return {
          success: false,
          message: 'Se requiere conectar con Google Drive para sincronizar en la nube.',
        };
      }
    }

    const activeToken = GoogleDriveService.getStoredToken()!;

    try {
      const folderId = await GoogleDriveService.getOrCreateFolder(activeToken, folderName);

      const enrichedPayload: WorkshopBackupPayload = {
        ...payload,
        exportedAt: new Date().toISOString(),
        metadata: {
          ...payload.metadata,
          userEmail: user.email,
          userName: user.name,
          deviceId: LocalDatabaseService.getDeviceId(),
          devicePlatform: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        },
      };

      const backupItem = await GoogleDriveService.uploadBackup(
        activeToken,
        folderId,
        CLOUD_MASTER_FILENAME,
        enrichedPayload
      );

      const updatedUser: UserProfile = {
        ...user,
        lastSyncAt: new Date().toISOString(),
        googleDriveConnected: true,
      };
      LocalDatabaseService.saveUserProfile(updatedUser);

      return {
        success: true,
        message: '¡Datos sincronizados con éxito en Google Drive!',
        backupItem,
      };
    } catch (err: any) {
      console.error('Error al sincronizar datos a Google Drive:', err);
      return {
        success: false,
        message: `Error al subir datos a la nube: ${err.message || 'Fallo de red'}`,
      };
    }
  }

  /**
   * Checks if cloud data exists in Google Drive for this user and downloads full payload
   */
  public static async pullDataFromCloudDrive(
    folderName: string = 'Taller_OrdenesTrabajo_Sync'
  ): Promise<{
    success: boolean;
    data?: WorkshopBackupPayload;
    message: string;
    isNewer?: boolean;
    cloudDate?: string;
  }> {
    const token = GoogleDriveService.getStoredToken();
    if (!token) {
      return {
        success: false,
        message: 'Conecta tu cuenta de Google Drive para descargar tus datos.',
      };
    }

    try {
      const folderId = await GoogleDriveService.getOrCreateFolder(token, folderName);
      const files = await GoogleDriveService.listBackups(token, folderId);

      if (!files || files.length === 0) {
        return {
          success: false,
          message: 'No se encontraron respaldos previos en tu carpeta de Google Drive.',
        };
      }

      const masterFile = files.find((f) => f.name === CLOUD_MASTER_FILENAME) || files[0];
      const cloudPayload = await GoogleDriveService.downloadBackup(token, masterFile.id);

      if (!cloudPayload || (!cloudPayload.orders && !cloudPayload.companySettings)) {
        return {
          success: false,
          message: 'El archivo descargado de Google Drive no contiene una estructura válida.',
        };
      }

      return {
        success: true,
        data: cloudPayload,
        cloudDate: masterFile.createdTime || cloudPayload.exportedAt,
        message: 'Datos descargados correctamente desde Google Drive.',
      };
    } catch (err: any) {
      console.error('Error al descargar datos de Google Drive:', err);
      return {
        success: false,
        message: `Error al obtener datos de Google Drive: ${err.message || 'Error de conexión'}`,
      };
    }
  }
}
