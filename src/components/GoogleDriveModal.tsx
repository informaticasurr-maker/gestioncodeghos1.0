import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  UploadCloud,
  X,
  Shield,
  Folder,
  Key,
  ExternalLink,
  HardDrive,
  Clock,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GoogleDriveService } from '../services/googleDriveService';
import { DriveBackupItem } from '../types';

export const GoogleDriveModal: React.FC = () => {
  const {
    isGoogleDriveOpen,
    setIsGoogleDriveOpen,
    companySettings,
    updateCompanySettings,
    syncWithGoogleDrive,
    fetchDriveBackupsList,
    restoreFromDriveFile,
    disconnectGoogleDrive,
    isSyncingDrive,
    driveBackups,
    driveUserEmail,
    orders,
    clients,
  } = useApp();

  const [customClientId, setCustomClientId] = useState('');
  const [folderName, setFolderName] = useState('TechFix_Ordenes_Backups');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    link?: string;
  } | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const isConnected = !!(driveUserEmail || companySettings.googleDrive?.connected);

  useEffect(() => {
    if (isGoogleDriveOpen) {
      const savedClientId = localStorage.getItem('techfix_custom_client_id') || '';
      setCustomClientId(savedClientId);
      setFolderName(companySettings.googleDrive?.folderName || 'TechFix_Ordenes_Backups');
      if (isConnected) {
        loadFiles();
      }
    }
  }, [isGoogleDriveOpen, isConnected]);

  const loadFiles = async () => {
    setIsLoadingList(true);
    try {
      await fetchDriveBackupsList();
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoadingList(false);
    }
  };

  if (!isGoogleDriveOpen) return null;

  const handleConnectAndSync = async () => {
    setStatusMessage(null);
    if (customClientId.trim()) {
      localStorage.setItem('techfix_custom_client_id', customClientId.trim());
    }

    const result = await syncWithGoogleDrive(customClientId.trim() || undefined);
    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: result.message || 'Copia de seguridad subida exitosamente a Google Drive.',
        link: result.backup?.webViewLink,
      });
      loadFiles();
    } else {
      setStatusMessage({
        type: 'error',
        text: result.message || 'Error al conectar con Google Drive. Revisa los permisos y vuelve a intentar.',
      });
    }
  };

  const handleRestore = async (file: DriveBackupItem) => {
    const confirmRestore = window.confirm(
      `¿Estás seguro de restaurar el respaldo "${file.name}"?\n\nLos datos actuales serán reemplazados con los datos contenidos en esta copia de seguridad.`
    );
    if (!confirmRestore) return;

    setIsRestoring(file.id);
    setStatusMessage(null);
    try {
      const ok = await restoreFromDriveFile(file.id);
      if (ok) {
        setStatusMessage({
          type: 'success',
          text: `Base de datos restaurada correctamente desde "${file.name}".`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'No se pudo restaurar la copia de seguridad. El archivo podría estar corrupto.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Error al restaurar: ${err.message || 'Fallo desconocido'}`,
      });
    } finally {
      setIsRestoring(null);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('¿Deseas desconectar la sesión de Google Drive en este taller?')) {
      disconnectGoogleDrive();
      setStatusMessage({
        type: 'info',
        text: 'Sesión de Google Drive cerrada correctamente.',
      });
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (customClientId.trim()) {
      localStorage.setItem('techfix_custom_client_id', customClientId.trim());
    } else {
      localStorage.removeItem('techfix_custom_client_id');
    }

    updateCompanySettings({
      googleDrive: {
        ...companySettings.googleDrive,
        folderName: folderName.trim() || 'TechFix_Ordenes_Backups',
      },
    });

    setStatusMessage({
      type: 'success',
      text: 'Configuración de Google Drive actualizada.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <span>Google Drive Cloud Backup</span>
                {isConnected && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Conectado
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Respaldo en la nube y restauración de base de datos en tu Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsGoogleDriveOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Status Feedback Message */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl border flex flex-col gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                {statusMessage.type === 'info' && <Cloud className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />}
                <span className="font-semibold text-xs leading-relaxed">{statusMessage.text}</span>
              </div>

              {statusMessage.link && (
                <div className="pt-1 pl-7">
                  <a
                    href={statusMessage.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow transition"
                  >
                    <span>Ver archivo en mi Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Account and Summary Status Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {driveUserEmail ? driveUserEmail.charAt(0).toUpperCase() : <HardDrive className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">Cuenta de Google:</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">
                    {driveUserEmail || companySettings.googleDrive?.accountEmail || 'No conectado'}
                  </span>
                </div>
              </div>

              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 font-semibold self-start sm:self-center transition"
                >
                  Desconectar
                </button>
              ) : (
                <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full font-bold self-start sm:self-center">
                  Listo para vincular
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-[11px]">
              <div>
                <span className="text-slate-500 block">Carpeta en Drive:</span>
                <span className="font-semibold text-slate-700 font-mono flex items-center gap-1 mt-0.5">
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                  {companySettings.googleDrive?.folderName || folderName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Último respaldo:</span>
                <span className="font-semibold text-slate-700 mt-0.5 block">
                  {companySettings.googleDrive?.lastBackupDate
                    ? new Date(companySettings.googleDrive.lastBackupDate).toLocaleString('es-AR')
                    : 'Aún no realizado'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Base de Datos Local:</span>
                <span className="font-semibold text-slate-700 mt-0.5 block">
                  {orders.length} órdenes • {clients.length} clientes
                </span>
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Subir Copia a Google Drive</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Crea o actualiza la carpeta <span className="font-mono font-semibold text-indigo-700">{folderName}</span> en tu Google Drive y sube el archivo JSON de respaldo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleConnectAndSync}
              disabled={isSyncingDrive}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition active:scale-95 shrink-0"
            >
              {isSyncingDrive ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Conectando con Google Drive...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Probar Conexión & Subir Respaldo</span>
                </>
              )}
            </button>
          </div>

          {/* List of Backups in Google Drive */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 p-3 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-slate-700" />
                <h4 className="font-bold text-slate-800 text-xs">
                  Archivos de Respaldo en tu Carpeta de Google Drive
                </h4>
              </div>
              <button
                type="button"
                onClick={loadFiles}
                disabled={isLoadingList || !isConnected}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingList ? 'animate-spin' : ''}`} />
                <span>Actualizar lista</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
              {isLoadingList ? (
                <div className="p-6 text-center text-slate-500 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                  <span>Consultando archivos en Google Drive...</span>
                </div>
              ) : driveBackups.length > 0 ? (
                driveBackups.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 hover:bg-slate-50 flex items-center justify-between gap-2 transition"
                  >
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      <HardDrive className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div className="overflow-hidden">
                        <p className="font-semibold text-slate-800 truncate text-xs">{file.name}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(file.createdTime).toLocaleString('es-AR')}
                          </span>
                          {file.size && <span>• {file.size}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold rounded-lg border border-slate-200 flex items-center gap-1 transition"
                          title="Abrir en Google Drive"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Ver en Drive</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRestore(file)}
                        disabled={isRestoring === file.id}
                        className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg flex items-center gap-1 transition"
                      >
                        {isRestoring === file.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        <span>Restaurar</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400">
                  <Cloud className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium text-slate-600">No hay respaldos guardados aún en Drive</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Presiona el botón "Probar Conexión & Subir Respaldo" para crear la carpeta y tu primera copia en Google Drive.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Advanced / Folder Configuration Toggle */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="w-full p-3 text-left font-semibold text-slate-700 flex items-center justify-between hover:bg-slate-100 transition text-xs"
            >
              <div className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>Configuración avanzada (Nombre de Carpeta y Client ID)</span>
              </div>
              <span className="text-slate-400">{showConfig ? '▲ Ocultar' : '▼ Mostrar'}</span>
            </button>

            {showConfig && (
              <form onSubmit={handleSaveSettings} className="p-4 pt-1 space-y-3 border-t border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1 text-[11px]">
                    <Folder className="w-3 h-3 text-slate-500" />
                    <span>Nombre de la carpeta en Google Drive:</span>
                  </label>
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="TechFix_Ordenes_Backups"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1 text-[11px]">
                    <Key className="w-3 h-3 text-slate-500" />
                    <span>Google OAuth Client ID personalizado (Opcional):</span>
                  </label>
                  <input
                    type="text"
                    value={customClientId}
                    onChange={(e) => setCustomClientId(e.target.value)}
                    placeholder="xxxx-xxxx.apps.googleusercontent.com"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Déjalo en blanco para usar la configuración OAuth vinculada a la aplicación.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs shadow"
                  >
                    Guardar ajustes
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Encriptación y seguridad de Google Drive</span>
          </div>
          <button
            type="button"
            onClick={() => setIsGoogleDriveOpen(false)}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition shadow-sm"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
