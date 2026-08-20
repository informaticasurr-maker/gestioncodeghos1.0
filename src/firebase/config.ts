import { initializeApp, getApps, getApp, FirebaseApp, deleteApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

export interface CustomFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  firestoreDatabaseId?: string;
}

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

// Function to resolve current active Firebase config
export function getActiveFirebaseConfig(): CustomFirebaseConfig | null {
  try {
    const isDisconnected = localStorage.getItem('techfix_firebase_disconnected') === 'true';
    if (isDisconnected) {
      return null;
    }

    const savedCustom = localStorage.getItem('techfix_custom_firebase_config');
    if (savedCustom) {
      const parsed = JSON.parse(savedCustom);
      if (parsed && parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch {
    // localStorage not available or parse error
  }

  // Fallback to environment variables or JSON config
  const apiKey = metaEnv.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey;
  const projectId = metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId;

  if (apiKey && projectId) {
    return {
      apiKey,
      authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || `${projectId}.firebasestorage.app`,
      messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || '',
      appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || '',
      firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || '(default)',
    };
  }

  return null;
}

export const firebaseConfig = getActiveFirebaseConfig() || {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  firestoreDatabaseId: '(default)',
};

// Initialize Firebase App instance safely
let appInstance: FirebaseApp;
if (!getApps().length) {
  appInstance = initializeApp(firebaseConfig.projectId ? firebaseConfig : {
    apiKey: 'placeholder-key',
    projectId: 'placeholder-project',
    appId: 'placeholder-app',
  });
} else {
  appInstance = getApp();
}

export const app: FirebaseApp = appInstance;

// Initialize Firestore
export const db: Firestore =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection validation test
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  const currentConfig = getActiveFirebaseConfig();
  if (!currentConfig || !currentConfig.projectId) {
    return { success: false, message: 'Firebase no está configurado o ha sido desconectado.' };
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { success: true, message: `Conexión exitosa a Firestore (${currentConfig.projectId})` };
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return { success: false, message: 'Cliente sin conexión o Firestore no alcanzable.' };
    }
    // A permission-denied or document-not-found means we reached Firestore successfully
    if (error?.code === 'permission-denied' || error?.code === 'not-found' || !error?.code) {
      return { success: true, message: `Conectado a Firestore (${currentConfig.projectId})` };
    }
    return { success: false, message: error?.message || 'Error de conexión a Firestore' };
  }
}

// Function to save new custom config
export function saveCustomFirebaseConfig(config: CustomFirebaseConfig): void {
  localStorage.removeItem('techfix_firebase_disconnected');
  localStorage.setItem('techfix_custom_firebase_config', JSON.stringify(config));
}

// Function to clear / disconnect Firebase
export function disconnectFirebase(): void {
  localStorage.setItem('techfix_firebase_disconnected', 'true');
  localStorage.removeItem('techfix_custom_firebase_config');
}

// Function to reset all connection flags
export function resetFirebaseConnection(): void {
  localStorage.removeItem('techfix_firebase_disconnected');
  localStorage.removeItem('techfix_custom_firebase_config');
}
