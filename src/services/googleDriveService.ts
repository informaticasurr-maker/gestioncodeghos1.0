import { DriveBackupItem } from '../types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: any; expires_in?: number }) => void;
            error_callback?: (error: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
          hasGrantedAllScopes: (tokenResponse: any, firstScope: string, ...restScopes: string[]) => boolean;
        };
      };
    };
    __GOOGLE_CLIENT_ID__?: string;
  }
}

const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const USERINFO_EMAIL_SCOPE = 'https://www.googleapis.com/auth/userinfo.email';
const USERINFO_PROFILE_SCOPE = 'https://www.googleapis.com/auth/userinfo.profile';

// Initialize Firebase App
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const firebaseAuth = getAuth(firebaseApp);

export interface UserDriveProfile {
  email: string;
  name: string;
  picture?: string;
}

export class GoogleDriveService {
  private static token: string | null = null;
  private static tokenExpiresAt: number = 0;
  private static cachedFolderId: string | null = null;

  public static getStoredToken(): string | null {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }
    const localToken = localStorage.getItem('techfix_gdrive_token');
    const localExpiry = localStorage.getItem('techfix_gdrive_token_exp');
    if (localToken && localExpiry && Date.now() < Number(localExpiry)) {
      this.token = localToken;
      this.tokenExpiresAt = Number(localExpiry);
      return this.token;
    }
    return null;
  }

  public static setStoredToken(token: string, expiresInSeconds: number = 3600) {
    this.token = token;
    this.tokenExpiresAt = Date.now() + (expiresInSeconds - 60) * 1000;
    localStorage.setItem('techfix_gdrive_token', token);
    localStorage.setItem('techfix_gdrive_token_exp', this.tokenExpiresAt.toString());
  }

  public static clearStoredToken() {
    this.token = null;
    this.tokenExpiresAt = 0;
    this.cachedFolderId = null;
    localStorage.removeItem('techfix_gdrive_token');
    localStorage.removeItem('techfix_gdrive_token_exp');
    localStorage.removeItem('techfix_gdrive_user_email');
    localStorage.removeItem('techfix_gdrive_user_name');
    try {
      signOut(firebaseAuth);
    } catch {
      // Ignore
    }
  }

  /**
   * Resolves Google OAuth Client ID
   */
  public static getClientId(): string {
    const fromConfig = (firebaseConfig as any)?.oAuthClientId;
    const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    const windowClientId = window.__GOOGLE_CLIENT_ID__;
    const localClientId = localStorage.getItem('techfix_custom_client_id');
    return localClientId || fromConfig || envClientId || windowClientId || '';
  }

  /**
   * Requests OAuth token using Firebase Auth or Google Identity Services
   */
  public static async requestGoogleAuth(customClientId?: string): Promise<{ token: string; user?: UserDriveProfile }> {
    const existingToken = this.getStoredToken();
    if (existingToken) {
      try {
        const profile = await this.getUserProfile(existingToken);
        return { token: existingToken, user: profile };
      } catch {
        this.clearStoredToken();
      }
    }

    // Try Firebase Auth Popup first
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope(DRIVE_FILE_SCOPE);
      provider.addScope(USERINFO_EMAIL_SCOPE);
      provider.addScope(USERINFO_PROFILE_SCOPE);
      provider.setCustomParameters({
        prompt: 'consent',
        access_type: 'offline',
      });

      const result = await signInWithPopup(firebaseAuth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (accessToken) {
        this.setStoredToken(accessToken, 3600);
        const profile: UserDriveProfile = {
          email: result.user.email || 'Usuario Google',
          name: result.user.displayName || 'Usuario Taller',
          picture: result.user.photoURL || undefined,
        };
        localStorage.setItem('techfix_gdrive_user_email', profile.email);
        if (profile.name) localStorage.setItem('techfix_gdrive_user_name', profile.name);
        return { token: accessToken, user: profile };
      }
    } catch (fbErr: any) {
      console.warn('Intento de autenticación Firebase con popup secundario:', fbErr);
    }

    // Fallback to Google Identity Services (GSI)
    return new Promise((resolve, reject) => {
      const clientId = customClientId || this.getClientId();

      if (!window.google?.accounts?.oauth2) {
        return reject(
          new Error('La librería Google Identity Services no ha cargado aún. Por favor espera 3 segundos y vuelve a presionar el botón.')
        );
      }

      if (!clientId) {
        return reject(
          new Error('No se encontró el Client ID de Google OAuth. Configúralo en los ajustes o en el archivo de configuración.')
        );
      }

      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: `${DRIVE_FILE_SCOPE} ${USERINFO_EMAIL_SCOPE} ${USERINFO_PROFILE_SCOPE}`,
          callback: async (response) => {
            if (response.error) {
              return reject(new Error(response.error.message || `Error de autenticación Google: ${response.error}`));
            }
            if (response.access_token) {
              this.setStoredToken(response.access_token, response.expires_in || 3500);
              try {
                const profile = await this.getUserProfile(response.access_token);
                localStorage.setItem('techfix_gdrive_user_email', profile.email);
                if (profile.name) localStorage.setItem('techfix_gdrive_user_name', profile.name);
                resolve({ token: response.access_token, user: profile });
              } catch {
                resolve({ token: response.access_token });
              }
            } else {
              reject(new Error('No se recibió token de acceso de Google.'));
            }
          },
          error_callback: (err) => {
            reject(new Error(err.message || 'La ventana de inicio de sesión de Google fue cerrada o cancelada.'));
          },
        });

        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        reject(new Error(err.message || 'Fallo al iniciar el cliente de autenticación de Google.'));
      }
    });
  }

  /**
   * Fetches user information (Email, Name, Avatar)
   */
  public static async getUserProfile(token: string): Promise<UserDriveProfile> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Error al obtener perfil de Google (${res.status})`);
    }

    const data = await res.json();
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  }

  /**
   * Locates or creates the dedicated workshop backup folder in Google Drive
   */
  public static async getOrCreateFolder(token: string, folderName: string): Promise<string> {
    if (this.cachedFolderId) return this.cachedFolderId;

    // Search for folder by name
    const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name)`;

    const res = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Error al consultar carpetas en Google Drive (${res.status})`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      this.cachedFolderId = data.files[0].id;
      return data.files[0].id;
    }

    // Create folder
    const createUrl = 'https://www.googleapis.com/drive/v3/files';
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createRes.ok) {
      throw new Error(`Error al crear la carpeta en Google Drive (${createRes.status})`);
    }

    const folderData = await createRes.json();
    this.cachedFolderId = folderData.id;
    return folderData.id;
  }

  /**
   * Uploads real JSON backup directly to user's Google Drive
   */
  public static async uploadBackup(
    token: string,
    folderId: string,
    fileName: string,
    backupPayload: any
  ): Promise<DriveBackupItem> {
    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType: 'application/json',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(backupPayload, null, 2) +
      closeDelimiter;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error subiendo respaldo a Google Drive: ${errText}`);
    }

    const uploaded = await res.json();
    return {
      id: uploaded.id,
      name: uploaded.name,
      createdTime: uploaded.createdTime,
      size: uploaded.size ? `${(Number(uploaded.size) / 1024).toFixed(1)} KB` : '1 KB',
      webViewLink: uploaded.webViewLink,
    };
  }

  /**
   * Lists all backup files in the Google Drive folder
   */
  public static async listBackups(token: string, folderId: string): Promise<DriveBackupItem[]> {
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name,createdTime,size,webViewLink,mimeType)&orderBy=createdTime desc`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Error al listar archivos de Google Drive (${res.status})`);
    }

    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      createdTime: f.createdTime,
      size: f.size ? `${(Number(f.size) / 1024).toFixed(1)} KB` : '1 KB',
      webViewLink: f.webViewLink,
    }));
  }

  /**
   * Downloads and parses a backup file content from Google Drive
   */
  public static async downloadBackup(token: string, fileId: string): Promise<any> {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Error al descargar respaldo de Google Drive (${res.status})`);
    }

    return await res.json();
  }
}
