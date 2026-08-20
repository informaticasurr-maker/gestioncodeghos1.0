import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  query,
  where,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Order,
  Client,
  InventoryItem,
  CashMovement,
  CatalogService,
  CompanySettings,
} from '../types';
import { WorkshopBackupPayload } from './localDatabase';

export class FirebaseFirestoreService {
  /**
   * Save or update a single Order in Firestore
   */
  static async saveOrder(order: Order, userId?: string): Promise<boolean> {
    try {
      const orderRef = doc(db, 'orders', order.id);
      const payload = {
        ...order,
        userId: userId || (order as any).userId || 'guest',
        updatedAt: order.updatedAt || new Date().toISOString(),
      };
      await setDoc(orderRef, payload, { merge: true });
      return true;
    } catch (err) {
      console.error('[Firestore] Error saving order:', err);
      return false;
    }
  }

  /**
   * Delete an Order from Firestore
   */
  static async deleteOrder(orderId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      return true;
    } catch (err) {
      console.error('[Firestore] Error deleting order:', err);
      return false;
    }
  }

  /**
   * Save or update a Client in Firestore
   */
  static async saveClient(client: Client, userId?: string): Promise<boolean> {
    try {
      const clientRef = doc(db, 'clients', client.id);
      const payload = {
        ...client,
        userId: userId || (client as any).userId || 'guest',
        updatedAt: client.updatedAt || new Date().toISOString(),
      };
      await setDoc(clientRef, payload, { merge: true });
      return true;
    } catch (err) {
      console.error('[Firestore] Error saving client:', err);
      return false;
    }
  }

  /**
   * Delete a Client from Firestore
   */
  static async deleteClient(clientId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'clients', clientId));
      return true;
    } catch (err) {
      console.error('[Firestore] Error deleting client:', err);
      return false;
    }
  }

  /**
   * Save or update an Inventory Item in Firestore
   */
  static async saveInventoryItem(item: InventoryItem, userId?: string): Promise<boolean> {
    try {
      const itemRef = doc(db, 'inventory', item.id);
      const payload = {
        ...item,
        userId: userId || (item as any).userId || 'guest',
        updatedAt: item.updatedAt || new Date().toISOString(),
      };
      await setDoc(itemRef, payload, { merge: true });
      return true;
    } catch (err) {
      console.error('[Firestore] Error saving inventory item:', err);
      return false;
    }
  }

  /**
   * Delete an Inventory Item from Firestore
   */
  static async deleteInventoryItem(itemId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'inventory', itemId));
      return true;
    } catch (err) {
      console.error('[Firestore] Error deleting inventory item:', err);
      return false;
    }
  }

  /**
   * Save or update a Cash Movement in Firestore
   */
  static async saveCashMovement(movement: CashMovement, userId?: string): Promise<boolean> {
    try {
      const movementRef = doc(db, 'cashMovements', movement.id);
      const payload = {
        ...movement,
        userId: userId || (movement as any).userId || 'guest',
      };
      await setDoc(movementRef, payload, { merge: true });
      return true;
    } catch (err) {
      console.error('[Firestore] Error saving cash movement:', err);
      return false;
    }
  }

  /**
   * Delete a Cash Movement from Firestore
   */
  static async deleteCashMovement(movementId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'cashMovements', movementId));
      return true;
    } catch (err) {
      console.error('[Firestore] Error deleting cash movement:', err);
      return false;
    }
  }

  /**
   * Save or update a Catalog Service in Firestore
   */
  static async saveCatalogService(service: CatalogService, userId?: string): Promise<boolean> {
    try {
      const serviceRef = doc(db, 'services', service.id);
      const payload = {
        ...service,
        userId: userId || (service as any).userId || 'guest',
      };
      await setDoc(serviceRef, payload, { merge: true });
      return true;
    } catch (err) {
      console.error('[Firestore] Error saving catalog service:', err);
      return false;
    }
  }

  /**
   * Delete a Catalog Service from Firestore
   */
  static async deleteCatalogService(serviceId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'services', serviceId));
      return true;
    } catch (err) {
      console.error('[Firestore] Error deleting service:', err);
      return false;
    }
  }

  /**
   * Save Company Settings in Firestore
   */
  static async saveCompanySettings(settings: CompanySettings, userId?: string): Promise<boolean> {
    try {
      const docId = userId || 'global';
      const settingsRef = doc(db, 'companySettings', docId);
      await setDoc(settingsRef, { ...settings, userId: docId, updatedAt: new Date().toISOString() }, { merge: true });
      return true;
    } catch (err) {
      console.error('[Firestore] Error saving company settings:', err);
      return false;
    }
  }

  /**
   * Fetch company settings from Firestore
   */
  static async fetchCompanySettings(userId?: string): Promise<CompanySettings | null> {
    try {
      const docId = userId || 'global';
      const docSnap = await getDoc(doc(db, 'companySettings', docId));
      if (docSnap.exists()) {
        return docSnap.data() as CompanySettings;
      }
      return null;
    } catch (err) {
      console.error('[Firestore] Error fetching settings:', err);
      return null;
    }
  }

  /**
   * Sync complete database export to Firestore (Batch write)
   */
  static async uploadFullBackupToFirestore(data: WorkshopBackupPayload, userId?: string): Promise<{ success: boolean; count: number }> {
    try {
      let totalCount = 0;
      const batch = writeBatch(db);

      // Orders
      (data.orders || []).forEach((order) => {
        const ref = doc(db, 'orders', order.id);
        batch.set(ref, { ...order, userId: userId || 'guest' }, { merge: true });
        totalCount++;
      });

      // Clients
      (data.clients || []).forEach((client) => {
        const ref = doc(db, 'clients', client.id);
        batch.set(ref, { ...client, userId: userId || 'guest' }, { merge: true });
        totalCount++;
      });

      // Inventory
      (data.inventory || []).forEach((item) => {
        const ref = doc(db, 'inventory', item.id);
        batch.set(ref, { ...item, userId: userId || 'guest' }, { merge: true });
        totalCount++;
      });

      // Cash Movements
      (data.cashMovements || []).forEach((movement) => {
        const ref = doc(db, 'cashMovements', movement.id);
        batch.set(ref, { ...movement, userId: userId || 'guest' }, { merge: true });
        totalCount++;
      });

      // Services
      (data.servicesCatalog || []).forEach((service) => {
        const ref = doc(db, 'services', service.id);
        batch.set(ref, { ...service, userId: userId || 'guest' }, { merge: true });
        totalCount++;
      });

      // Company Settings
      if (data.companySettings) {
        const docId = userId || 'global';
        const ref = doc(db, 'companySettings', docId);
        batch.set(ref, { ...data.companySettings, userId: docId }, { merge: true });
        totalCount++;
      }

      await batch.commit();
      return { success: true, count: totalCount };
    } catch (err) {
      console.error('[Firestore] Error in batch sync:', err);
      return { success: false, count: 0 };
    }
  }

  /**
   * Pull all records from Firestore to restore or synchronize locally
   */
  static async fetchAllFromFirestore(userId?: string): Promise<WorkshopBackupPayload | null> {
    try {
      const ordersSnap = await getDocs(
        userId ? query(collection(db, 'orders'), where('userId', '==', userId)) : collection(db, 'orders')
      );
      const clientsSnap = await getDocs(
        userId ? query(collection(db, 'clients'), where('userId', '==', userId)) : collection(db, 'clients')
      );
      const inventorySnap = await getDocs(
        userId ? query(collection(db, 'inventory'), where('userId', '==', userId)) : collection(db, 'inventory')
      );
      const cashSnap = await getDocs(
        userId ? query(collection(db, 'cashMovements'), where('userId', '==', userId)) : collection(db, 'cashMovements')
      );
      const servicesSnap = await getDocs(
        userId ? query(collection(db, 'services'), where('userId', '==', userId)) : collection(db, 'services')
      );

      const orders: Order[] = [];
      ordersSnap.forEach((d) => orders.push(d.data() as Order));

      const clients: Client[] = [];
      clientsSnap.forEach((d) => clients.push(d.data() as Client));

      const inventory: InventoryItem[] = [];
      inventorySnap.forEach((d) => inventory.push(d.data() as InventoryItem));

      const cashMovements: CashMovement[] = [];
      cashSnap.forEach((d) => cashMovements.push(d.data() as CashMovement));

      const servicesCatalog: CatalogService[] = [];
      servicesSnap.forEach((d) => servicesCatalog.push(d.data() as CatalogService));

      const settings = await this.fetchCompanySettings(userId);

      return {
        appName: 'TechFix Pro',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        companySettings: settings || ({} as CompanySettings),
        orders,
        clients,
        inventory,
        cashMovements,
        servicesCatalog,
        metadata: {
          totalOrders: orders.length,
          totalClients: clients.length,
          totalRevenueEstimated: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
          totalInventoryItems: inventory.length,
        },
      };
    } catch (err) {
      console.error('[Firestore] Error fetching all data:', err);
      return null;
    }
  }
}
