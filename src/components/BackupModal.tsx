import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Calendar,
  Cloud,
  ShieldCheck,
  History,
  Trash2,
  X,
  Database,
  Smartphone,
  Laptop,
  Flame,
  Settings2,
  Unlink,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LocalDatabaseService, LocalSnapshotItem, WorkshopBackupPayload } from '../services/localDatabase';
import { FirebaseFirestoreService } from '../services/firebaseFirestoreService';
import {
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  disconnectFirebase,
  resetFirebaseConnection,
  testFirestoreConnection,
  CustomFirebaseConfig,
} from '../firebase/config';

export const BackupModal: React.FC = () => {
  const {
    isBackupModalOpen,
    setIsBackupModalOpen,
    setIsGoogleDriveOpen,
    companySettings,
    orders,
    clients,
    servicesCatalog,
    exportBackupData,
    importBackupData,
    dbStats,
    formatMoney,
  } = useApp();

  const [snapshots, setSnapshots] = useState<LocalSnapshotItem[]>([]);
  const [selectedFileContent, setSelectedFileContent] = useState<WorkshopBackupPayload | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Firebase state
  const [activeFirebase, setActiveFirebase] = useState<CustomFirebaseConfig | null>(null);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);
  const [showFirebaseConfig, setShowFirebaseConfig] = useState(false);
  const [showVercelGuide, setShowVercelGuide] = useState(false);
  const [copiedVercelEnv, setCopiedVercelEnv] = useState(false);

  // Form state for custom Firebase
  const [fbApiKey, setFbApiKey] = useState('');
  const [fbProjectId, setFbProjectId] = useState('');
  const [fbAuthDomain, setFbAuthDomain] = useState('');
  const [fbAppId, setFbAppId] = useState('');
  const [fbStorageBucket, setFbStorageBucket] = useState('');
  const [fbDatabaseId, setFbDatabaseId] = useState('');
  const [fbJsonInput, setFbJsonInput] = useState('');

  useEffect(() => {
    if (isBackupModalOpen) {
      loadSnapshots();
      setSelectedFileContent(null);
      setSelectedFileName(null);
      setSuccessMessage(null);
      setErrorMessage(null);
      refreshFirebaseStatus();
    }
  }, [isBackupModalOpen]);

  const refreshFirebaseStatus = () => {
    const cfg = getActiveFirebaseConfig();
    setActiveFirebase(cfg);
    if (cfg) {
      setFbApiKey(cfg.apiKey || '');
      setFbProjectId(cfg.projectId || '');
      setFbAuthDomain(cfg.authDomain || '');
      setFbAppId(cfg.appId || '');
      setFbStorageBucket(cfg.storageBucket || '');
      setFbDatabaseId(cfg.firestoreDatabaseId || '');
    }
  };

  const loadSnapshots = () => {
    const list = LocalDatabaseService.getAutoSnapshots();
    setSnapshots(list);
  };

  const handleDisconnectFirebase = () => {
    disconnectFirebase();
    setActiveFirebase(null);
    setShowFirebaseConfig(false);
    setSuccessMessage('🔌 Se ha desconectado y limpiado la conexión de Firebase. Ahora estás en modo local seguro.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleSaveFirebaseConfig = async () => {
    try {
      let configToSave: CustomFirebaseConfig;

      if (fbJsonInput.trim()) {
        // Try parsing JSON or JS object
        let raw = fbJsonInput.trim();
        // Remove const firebaseConfig = or similar if pasted directly
        if (raw.includes('{')) {
          raw = raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
        }
        // Replace unquoted keys if necessary
        try {
          configToSave = JSON.parse(raw);
        } catch {
          // If JSON parse fails, try regex extraction
          const apiKeyMatch = raw.match(/apiKey:\s*["']([^"']+)["']/);
          const projectIdMatch = raw.match(/projectId:\s*["']([^"']+)["']/);
          const authDomainMatch = raw.match(/authDomain:\s*["']([^"']+)["']/);
          const appIdMatch = raw.match(/appId:\s*["']([^"']+)["']/);
          const storageBucketMatch = raw.match(/storageBucket:\s*["']([^"']+)["']/);
          const databaseIdMatch = raw.match(/firestoreDatabaseId:\s*["']([^"']+)["']/);

          if (!projectIdMatch || !apiKeyMatch) {
            throw new Error('No se pudo extraer apiKey o projectId del texto pegado.');
          }

          configToSave = {
            apiKey: apiKeyMatch[1],
            projectId: projectIdMatch[1],
            authDomain: authDomainMatch ? authDomainMatch[1] : `${projectIdMatch[1]}.firebaseapp.com`,
            appId: appIdMatch ? appIdMatch[1] : '',
            storageBucket: storageBucketMatch ? storageBucketMatch[1] : `${projectIdMatch[1]}.firebasestorage.app`,
            firestoreDatabaseId: databaseIdMatch ? databaseIdMatch[1] : '(default)',
          };
        }
      } else {
        if (!fbProjectId.trim() || !fbApiKey.trim()) {
          setErrorMessage('El Project ID y la API Key son obligatorios para conectar Firebase.');
          return;
        }
        configToSave = {
          apiKey: fbApiKey.trim(),
          projectId: fbProjectId.trim(),
          authDomain: fbAuthDomain.trim() || `${fbProjectId.trim()}.firebaseapp.com`,
          appId: fbAppId.trim(),
          storageBucket: fbStorageBucket.trim() || `${fbProjectId.trim()}.firebasestorage.app`,
          firestoreDatabaseId: fbDatabaseId.trim() || '(default)',
        };
      }

      saveCustomFirebaseConfig(configToSave);
      refreshFirebaseStatus();
      setShowFirebaseConfig(false);
      setSuccessMessage(`✅ ¡Configuración de Firebase guardada para el proyecto "${configToSave.projectId}"!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage('Error al guardar configuración de Firebase: ' + (err.message || 'Formato no válido'));
    }
  };

  const handleUploadToFirestore = async () => {
    if (!activeFirebase) {
      setErrorMessage('Firebase no está conectado. Haz clic en "Conectar Proyecto" para vincularlo.');
      return;
    }

    try {
      setIsFirebaseSyncing(true);
      const payload: WorkshopBackupPayload = {
        appName: 'TechFix Pro',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        companySettings,
        orders,
        clients,
        servicesCatalog,
        inventory: (dbStats as any).inventory || [],
        cashMovements: (dbStats as any).cashMovements || [],
        metadata: {
          totalOrders: orders.length,
          totalClients: clients.length,
          totalRevenueEstimated: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
          totalInventoryItems: 0,
        },
      };

      const res = await FirebaseFirestoreService.uploadFullBackupToFirestore(payload);
      if (res.success) {
        setSuccessMessage(`✅ ¡${res.count} registros subidos y sincronizados exitosamente con Firebase Firestore (${activeFirebase.projectId})!`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage('Error al sincronizar con Firebase Firestore.');
      }
    } catch (e: any) {
      setErrorMessage('Error en Firebase Firestore: ' + e.message);
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  const handleDownloadFromFirestore = async () => {
    if (!activeFirebase) {
      setErrorMessage('Firebase no está conectado.');
      return;
    }

    try {
      setIsFirebaseSyncing(true);
      const data = await FirebaseFirestoreService.fetchAllFromFirestore();
      if (data && (data.orders.length > 0 || data.clients.length > 0)) {
        const ok = importBackupData(JSON.stringify(data));
        if (ok) {
          setSuccessMessage(`✅ ¡Datos descargados y aplicados desde Firebase Firestore (${data.orders.length} órdenes, ${data.clients.length} clientes)!`);
          setTimeout(() => setSuccessMessage(null), 4000);
        } else {
          setErrorMessage('No se pudieron aplicar los datos recibidos de Firebase Firestore.');
        }
      } else {
        setErrorMessage('No se encontraron datos previos en tu base de datos de Firebase Firestore.');
      }
    } catch (e: any) {
      setErrorMessage('Error descargando de Firebase: ' + e.message);
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  const handleCopyVercelEnv = () => {
    const envString = activeFirebase
      ? `VITE_FIREBASE_API_KEY=${activeFirebase.apiKey}\nVITE_FIREBASE_AUTH_DOMAIN=${activeFirebase.authDomain}\nVITE_FIREBASE_PROJECT_ID=${activeFirebase.projectId}\nVITE_FIREBASE_STORAGE_BUCKET=${activeFirebase.storageBucket || ''}\nVITE_FIREBASE_APP_ID=${activeFirebase.appId || ''}\nVITE_FIREBASE_DATABASE_ID=${activeFirebase.firestoreDatabaseId || '(default)'}`
      : `# Configuración de variables de entorno para Vercel\nVITE_FIREBASE_API_KEY=tu_api_key\nVITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com\nVITE_FIREBASE_PROJECT_ID=tu_proyecto_id\nVITE_FIREBASE_APP_ID=tu_app_id`;

    navigator.clipboard.writeText(envString);
    setCopiedVercelEnv(true);
    setTimeout(() => setCopiedVercelEnv(false), 3000);
  };

  if (!isBackupModalOpen) return null;

  const handleDownload = () => {
    try {
      exportBackupData();
      setSuccessMessage('¡Archivo de copia de seguridad descargado correctamente a tu dispositivo!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch {
      setErrorMessage('Error al generar la descarga del archivo.');
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      setIsProcessing(true);
      await LocalDatabaseService.createAutoSnapshot(
        `Respaldo manual (${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })})`,
        companySettings,
        orders,
        clients,
        servicesCatalog
      );
      loadSnapshots();
      setSuccessMessage('¡Punto de restauración local creado exitosamente!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      setErrorMessage('Error al crear punto de restauración: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreSnapshot = (snapshot: LocalSnapshotItem) => {
    const confirmRestore = window.confirm(
      `¿Deseas restaurar la copia del ${new Date(snapshot.createdAt).toLocaleString('es-AR')}?\nContiene ${snapshot.ordersCount} órdenes y ${snapshot.clientsCount} clientes.`
    );

    if (confirmRestore) {
      const ok = importBackupData(JSON.stringify(snapshot.payload));
      if (ok) {
        setSuccessMessage('✅ ¡Datos restaurados exitosamente desde la copia local!');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage('Error al restaurar los datos de la copia local.');
      }
    }
  };

  const handleDeleteSnapshot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    LocalDatabaseService.deleteSnapshot(id);
    loadSnapshots();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setErrorMessage(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || (!parsed.orders && !parsed.clients && !parsed.companySettings)) {
          throw new Error('El archivo no parece ser un respaldo válido de TechFix.');
        }

        setSelectedFileContent(parsed);
      } catch (err: any) {
        setSelectedFileContent(null);
        setErrorMessage('Archivo no válido: ' + (err.message || 'Error de lectura'));
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmFileRestore = () => {
    if (!selectedFileContent) return;

    const ok = importBackupData(JSON.stringify(selectedFileContent));
    if (ok) {
      setSuccessMessage('🎉 ¡Copia de seguridad restaurada exitosamente!');
      setSelectedFileContent(null);
      setSelectedFileName(null);
      setTimeout(() => {
        setSuccessMessage(null);
        setIsBackupModalOpen(false);
      }, 2000);
    } else {
      setErrorMessage('No se pudieron aplicar los datos del archivo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Base de Datos, Copias y Conexiones Cloud
                </h2>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Local Seguro
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestiona copias locales, sincronización con Firebase y despliegue a Vercel
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBackupModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-sm">

          {/* Feedback messages */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section: Firebase Cloud Sync & Reset */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/70 border border-amber-500/30 text-white p-4.5 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-amber-100">
                      Firebase Firestore (Base de Datos en la Nube)
                    </h4>
                    {activeFirebase ? (
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Conectado: {activeFirebase.projectId}
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Desconectado / Modo Local
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {activeFirebase
                      ? `Sincronización activa con Firestore en el proyecto "${activeFirebase.projectId}".`
                      : 'Sin conexión activa a Firebase. Todos los datos se almacenan en tu dispositivo local.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowFirebaseConfig(!showFirebaseConfig)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showFirebaseConfig ? 'Ocultar Configuración' : 'Configurar / Cambiar Proyecto'}</span>
                </button>

                {activeFirebase && (
                  <button
                    type="button"
                    onClick={handleDisconnectFirebase}
                    className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                    title="Desconectar y borrar credenciales de este proyecto"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Desconectar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sync actions when connected */}
            {activeFirebase && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-300">
                  Sincroniza tus {orders.length} órdenes y {clients.length} clientes con Firestore:
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleUploadToFirestore}
                    disabled={isFirebaseSyncing}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
                  >
                    <Upload className={`w-3.5 h-3.5 ${isFirebaseSyncing ? 'animate-bounce' : ''}`} />
                    <span>{isFirebaseSyncing ? 'Sincronizando...' : 'Subir Todo a Firebase'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadFromFirestore}
                    disabled={isFirebaseSyncing}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-semibold shadow transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Restaurar de Firebase</span>
                  </button>
                </div>
              </div>
            )}

            {/* Form to configure new Firebase */}
            {showFirebaseConfig && (
              <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h5 className="font-bold text-xs text-amber-300 uppercase tracking-wider">
                    Vincular Nuevo Proyecto de Firebase
                  </h5>
                  <button
                    type="button"
                    onClick={() => setShowFirebaseConfig(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Opción Rápida: Pegar objeto de configuración de Firebase (JSON o código de Firebase Console)
                    </label>
                    <textarea
                      value={fbJsonInput}
                      onChange={(e) => setFbJsonInput(e.target.value)}
                      placeholder='const firebaseConfig = { apiKey: "...", projectId: "...", ... };'
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="text-[11px] text-slate-400 text-center font-bold">— O ingresar datos manualmente —</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Project ID *
                      </label>
                      <input
                        type="text"
                        value={fbProjectId}
                        onChange={(e) => setFbProjectId(e.target.value)}
                        placeholder="mi-proyecto-12345"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        API Key *
                      </label>
                      <input
                        type="text"
                        value={fbApiKey}
                        onChange={(e) => setFbApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Auth Domain
                      </label>
                      <input
                        type="text"
                        value={fbAuthDomain}
                        onChange={(e) => setFbAuthDomain(e.target.value)}
                        placeholder="mi-proyecto.firebaseapp.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        App ID
                      </label>
                      <input
                        type="text"
                        value={fbAppId}
                        onChange={(e) => setFbAppId(e.target.value)}
                        placeholder="1:123456789:web:abcdef"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowFirebaseConfig(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveFirebaseConfig}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Guardar y Conectar</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Vercel Deploy Helper */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0 font-black text-sm">
                  ▲
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">
                    Despliegue a Vercel (Producción Web)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Sube tu aplicación a Vercel para acceder desde cualquier PC, tablet o celular.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyVercelEnv}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                  title="Copiar variables de entorno para Vercel"
                >
                  {copiedVercelEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{copiedVercelEnv ? '¡Copiado!' : 'Copiar Variables (.env)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowVercelGuide(!showVercelGuide)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <span>{showVercelGuide ? 'Ocultar Guía' : 'Ver Pasos'}</span>
                </button>
              </div>
            </div>

            {showVercelGuide && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs text-slate-300 animate-in fade-in">
                <h5 className="font-bold text-slate-100 text-xs">Pasos para conectar y publicar en Vercel desde 0:</h5>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-xs leading-relaxed">
                  <li>
                    Descarga el proyecto desde el menú superior (<strong>Export to GitHub</strong> o <strong>Download ZIP</strong>).
                  </li>
                  <li>
                    Entra en <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-semibold">vercel.com</a> y haz clic en <strong>Add New Project</strong>.
                  </li>
                  <li>
                    Selecciona tu repositorio. Vercel detectará <strong>Vite</strong> automáticamente.
                  </li>
                  <li>
                    Haz clic en <strong>Environment Variables</strong> y pega las variables copiadas con el botón superior.
                  </li>
                  <li>
                    Haz clic en <strong>Deploy</strong>. ¡En 1 minuto tu app estará publicada y funcionando!
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Live Data Storage Status */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-700" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Estado de la Base de Datos Local</h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Último guardado: {new Date(dbStats.lastSavedAt).toLocaleTimeString('es-AR')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Órdenes de Trabajo</span>
                <span className="text-base font-black text-slate-900 font-mono">{orders.length}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Clientes</span>
                <span className="text-base font-black text-slate-900 font-mono">{clients.length}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Servicios Catálogo</span>
                <span className="text-base font-black text-slate-900 font-mono">{servicesCatalog.length}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tamaño Estimado</span>
                <span className="text-base font-black text-indigo-700 font-mono">
                  {(dbStats.estimatedBytes / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
          </div>

          {/* Action Cards: Download and Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Download to PC/Phone */}
            <div className="bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-xl p-4.5 flex flex-col justify-between transition group shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Descargar Copia a la PC / Celular</h4>
                    <span className="text-[11px] text-slate-500">Archivo descargable .JSON</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Genera un archivo completo con todas las órdenes, clientes, servicios y parámetros de configuración para guardar en tu carpeta de Descargas, Pendrive o enviar por correo.
                </p>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Compatible con todo equipo</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Respaldo</span>
                </button>
              </div>
            </div>

            {/* Card 2: Restore from file */}
            <div className="bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-xl p-4.5 flex flex-col justify-between transition group shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Restaurar desde Archivo</h4>
                    <span className="text-[11px] text-slate-500">Cargar archivo .JSON</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Restaura tu información en un nuevo dispositivo o navegador seleccionando un archivo de respaldo previo.
                </p>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100">
                <label className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95">
                  <FileJson className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Seleccionar Archivo de Respaldo (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          </div>

          {/* If file is selected for restore, preview it */}
          {selectedFileContent && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-amber-700" />
                  <h4 className="font-bold text-xs text-amber-950">
                    Archivo seleccionado: <span className="font-mono text-amber-900">{selectedFileName}</span>
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedFileContent(null)}
                  className="text-xs text-amber-700 hover:text-amber-900 font-bold"
                >
                  ✕ Cancelar
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white/80 p-2 rounded border border-amber-200">
                  <span className="text-[10px] text-slate-500 block">Taller</span>
                  <span className="font-bold text-slate-900">{selectedFileContent.companySettings?.name || 'TechFix'}</span>
                </div>
                <div className="bg-white/80 p-2 rounded border border-amber-200">
                  <span className="text-[10px] text-slate-500 block">Fecha Exportación</span>
                  <span className="font-bold text-slate-900">
                    {selectedFileContent.exportedAt ? new Date(selectedFileContent.exportedAt).toLocaleDateString('es-AR') : 'Reciente'}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded border border-amber-200">
                  <span className="text-[10px] text-slate-500 block">Órdenes a Restaurar</span>
                  <span className="font-bold text-slate-900">{selectedFileContent.orders?.length || 0}</span>
                </div>
                <div className="bg-white/80 p-2 rounded border border-amber-200">
                  <span className="text-[10px] text-slate-500 block">Clientes a Restaurar</span>
                  <span className="font-bold text-slate-900">{selectedFileContent.clients?.length || 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedFileContent(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-amber-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFileRestore}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar y Restaurar Datos</span>
                </button>
              </div>
            </div>
          )}

          {/* Section: Automatic Local Snapshots */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-700" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Puntos de Restauración Automáticos (Memoria Local)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCreateSnapshot}
                disabled={isProcessing}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Crear Punto Ahora</span>
              </button>
            </div>

            {snapshots.length === 0 ? (
              <div className="bg-white p-4 rounded-lg border border-slate-200 text-center text-xs text-slate-500 space-y-1">
                <p>No hay puntos de restauración locales manuales aún.</p>
                <p className="text-[11px] text-slate-400">
                  El sistema guarda automáticamente en tiempo real tus cambios en IndexedDB.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between hover:border-indigo-300 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{snap.label}</span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(snap.createdAt).toLocaleString('es-AR')}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {snap.ordersCount} órdenes • {snap.clientsCount} clientes • {formatMoney(snap.totalRevenue)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestoreSnapshot(snap)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold transition"
                      >
                        Restaurar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                        title="Eliminar este punto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Google Drive Cloud Backup link */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-100">
                  Copia de Seguridad en la Nube con Google Drive
                </h4>
                <p className="text-xs text-slate-400">
                  {companySettings.googleDrive?.connected
                    ? `Conectado a ${companySettings.googleDrive.accountEmail || 'Google Drive'}. Sincronización disponible.`
                    : 'Conecta tu cuenta de Google Drive para respaldar automáticamente tus órdenes y fotos en la nube.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsBackupModalOpen(false);
                setIsGoogleDriveOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow transition shrink-0"
            >
              Abrir Google Drive ↗
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            TechFix Pro • Motor de Almacenamiento y Conectividad
          </span>
          <button
            type="button"
            onClick={() => setIsBackupModalOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
