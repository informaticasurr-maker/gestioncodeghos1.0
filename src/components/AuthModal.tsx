import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Smartphone,
  Laptop,
  Cloud,
  KeyRound,
  Lock,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Building,
  HelpCircle,
  X,
  ExternalLink,
  ChevronRight,
  LogOut,
  FolderSync,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, PendingEmailVerification } from '../types';

export const AuthModal: React.FC = () => {
  const {
    currentUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithGoogle,
    sendEmailVerificationCode,
    verifyEmailCode,
    logoutUser,
    syncWithCloud,
    cloudSyncState,
    companySettings,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'cloud_info'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [workshopName, setWorkshopName] = useState(companySettings.name || '');
  const [role, setRole] = useState<UserRole>('tecnico');
  const [verificationDigits, setVerificationDigits] = useState(['', '', '', '', '', '']);
  const [pendingVerification, setPendingVerification] = useState<PendingEmailVerification | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync state when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      if (currentUser) {
        setMode('cloud_info');
      } else {
        setMode('login');
      }
    }
  }, [isAuthModalOpen, currentUser]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isAuthModalOpen) return null;

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const success = await loginWithGoogle();
      if (success) {
        setSuccessMessage('¡Identificación con Google y sincronización de Drive completada con éxito!');
        setTimeout(() => {
          setIsAuthModalOpen(false);
        }, 1200);
      } else {
        setErrorMessage('No se pudo completar el inicio de sesión con Google.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error durante la autenticación de Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Request Verification Code (Email login or register)
  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const pending = sendEmailVerificationCode(
        email.trim(),
        name.trim() || email.split('@')[0],
        role
      );
      setPendingVerification(pending);
      setMode('verify');
      setResendCooldown(30);
      setVerificationDigits(['', '', '', '', '', '']);
      setSuccessMessage(`Hemos generado tu código de seguridad para: ${email.trim()}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al generar código de verificación.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Digit Change
  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const nextDigits = [...verificationDigits];
      nextDigits[index] = '';
      setVerificationDigits(nextDigits);
      return;
    }

    if (clean.length > 1) {
      // Pasted full 6-digit code
      const chars = clean.slice(0, 6).split('');
      const nextDigits = [...verificationDigits];
      chars.forEach((ch, idx) => {
        if (idx < 6) nextDigits[idx] = ch;
      });
      setVerificationDigits(nextDigits);
      const nextInput = document.getElementById(`digit-${Math.min(chars.length, 5)}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
      return;
    }

    const nextDigits = [...verificationDigits];
    nextDigits[index] = clean[0];
    setVerificationDigits(nextDigits);

    // Auto focus next input
    if (index < 5 && clean[0]) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
  };

  // Handle Verify Code Submit
  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = verificationDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Por favor completa los 6 dígitos numéricos del código.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const targetEmail = pendingVerification?.email || email;
    const result = verifyEmailCode(targetEmail, fullCode, workshopName);

    if (result.success) {
      setSuccessMessage('¡Código verificado con éxito! Cuenta activada.');
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 1000);
    } else {
      setErrorMessage(result.message);
    }
    setIsLoading(false);
  };

  // Quick Copy of verification code
  const handleCopyCode = () => {
    if (pendingVerification?.code) {
      navigator.clipboard.writeText(pendingVerification.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Auto-fill code from preview
  const handleAutoFillCode = () => {
    if (pendingVerification?.code) {
      const chars = pendingVerification.code.split('');
      setVerificationDigits(chars);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col transition-all">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 rounded">
                  Cuenta de Técnico & Multi-Dispositivo
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                {currentUser ? 'Perfil de Usuario & Nube' : 'Identificación del Técnico'}
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Inicia sesión para sincronizar tus clientes, órdenes de trabajo, inventario y configuraciones en tu celular, tablet o PC.
          </p>
        </div>

        {/* Navigation Tabs if not already in verify step */}
        {mode !== 'verify' && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-center transition ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-center transition ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Crear Cuenta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('cloud_info');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-center transition ${
                mode === 'cloud_info'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sincronización Nube
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1">{successMessage}</div>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-4">
              
              {/* Option 1: One-Click Google Sign-in */}
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                    <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Recomendado: Ingreso Rápido y Respaldo Automático</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs border border-slate-300 shadow-sm transition disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoading ? 'Conectando con Google...' : 'Continuar con Cuenta de Google'}</span>
                </button>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                  Crea tu usuario y conecta tu Google Drive en un solo paso para sincronizar varios dispositivos.
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  O con Correo y Código de Seguridad
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* Option 2: Email + 6-digit OTP */}
              <form onSubmit={handleSendCode} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico del Técnico o Taller
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tecnico@gmail.com o taller@dominio.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Enviar Código Numérico de 6 Dígitos</span>
                </button>
              </form>

              {/* Guest / Offline Mode */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                >
                  Continuar en Modo Local Offline (sin cuenta por ahora)
                </button>
              </div>
            </div>
          )}

          {/* VIEW: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleSendCode} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo del Técnico
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Marcelo García"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Taller / Negocio
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                    placeholder="Ej: TechFix Laboratorio Electrónico"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico (Para recibir el código)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="micorreo@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rol en el Sistema
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="tecnico">Técnico Reparador</option>
                  <option value="admin">Administrador / Dueño</option>
                  <option value="recepcion">Recepción / Atención al Cliente</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition mt-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Registrar y Enviar Código Numérico</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  ¿Ya tienes cuenta o código? Inicia sesión aquí
                </button>
              </div>
            </form>
          )}

          {/* VIEW: VERIFY 6-DIGIT CODE */}
          {mode === 'verify' && (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex p-3 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Ingresa el Código de 6 Dígitos
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generado para <span className="font-semibold text-slate-800 dark:text-slate-200">{pendingVerification?.email || email}</span>
                </p>
              </div>

              {/* Interactive Code Preview Box for quick access */}
              {pendingVerification?.code && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                      <Sparkles className="w-4 h-4" />
                      <span>Código de Validación Generado:</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded text-[11px] font-semibold flex items-center gap-1 hover:bg-amber-300 transition"
                    >
                      {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-extrabold tracking-widest text-amber-900 dark:text-amber-200">
                      {pendingVerification.code}
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoFillCode}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Completar Casillas Automáticamente →
                    </button>
                  </div>
                </div>
              )}

              {/* 6 Digit Input Grid */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                {verificationDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`digit-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && idx > 0) {
                        const prev = document.getElementById(`digit-${idx - 1}`);
                        if (prev) (prev as HTMLInputElement).focus();
                      }
                    }}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-2xl font-bold rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Validar y Acceder al Sistema</span>
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="hover:text-slate-800 dark:hover:text-slate-200"
                >
                  ← Cambiar Correo
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleSendCode}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar Código'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: CLOUD INFO & MULTI-DEVICE STATUS */}
          {mode === 'cloud_info' && (
            <div className="space-y-4 text-xs">
              {currentUser ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {currentUser.name}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs">
                          {currentUser.email} • {currentUser.role === 'admin' ? 'Administrador' : 'Técnico'}
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Cuenta Activa
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Tipo de Ingreso:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                        {currentUser.authProvider === 'google' ? 'Cuenta Google' : 'Correo Verificado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Google Drive:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {currentUser.googleDriveConnected || companySettings.googleDrive.connected ? 'Conectado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  Actualmente estás usando la aplicación en <strong>Modo Local Invitado</strong>.
                </div>
              )}

              {/* Multi-Device Explanation Banner */}
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderSync className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Sincronización Inteligente Multi-Dispositivo</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold">
                    Cada 15 min
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  • <strong>100% Offline-First:</strong> Todos los cambios se guardan al instante en la memoria local de tu dispositivo. Puedes usar la app sin internet.
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  • <strong>Sincronización Diferencial:</strong> Cada 15 minutos (y al iniciar sesión), la app compara marcas de tiempo y traslada únicamente lo nuevo o modificado a tu Google Drive, evitando sobrecargar la API.
                </p>
                {cloudSyncState.nextAutoSyncInSeconds !== undefined && (
                  <div className="mt-1 pt-2 border-t border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-between text-[11px] text-indigo-900 dark:text-indigo-200">
                    <span>Próxima sincronización automática:</span>
                    <span className="font-mono font-bold">
                      {Math.floor((cloudSyncState.nextAutoSyncInSeconds || 0) / 60)}m {(cloudSyncState.nextAutoSyncInSeconds || 0) % 60}s
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    const res = await syncWithCloud('auto');
                    if (res.success) {
                      setSuccessMessage(res.message);
                    } else {
                      setErrorMessage(res.message);
                    }
                    setIsLoading(false);
                  }}
                  disabled={isLoading || cloudSyncState.isSyncing}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${cloudSyncState.isSyncing ? 'animate-spin' : ''}`} />
                  <span>{cloudSyncState.isSyncing ? 'Sincronizando...' : 'Sincronizar Diferencial Ahora'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    const res = await syncWithCloud('pull');
                    if (res.success) {
                      setSuccessMessage(res.message);
                    } else {
                      setErrorMessage(res.message);
                    }
                    setIsLoading(false);
                  }}
                  disabled={isLoading || cloudSyncState.isSyncing}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs transition"
                >
                  <Cloud className="w-4 h-4 text-indigo-600" />
                  <span>Forzar Descarga de Drive</span>
                </button>
              </div>

              {currentUser && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      logoutUser();
                      setMode('login');
                      setSuccessMessage('Sesión cerrada correctamente.');
                    }}
                    className="text-rose-600 hover:text-rose-700 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión en este dispositivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(false)}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    Listo
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
