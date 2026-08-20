import React, { useState } from 'react';
import { Heart, X, Copy, Check, ExternalLink, Coffee, CreditCard, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DonateModal: React.FC = () => {
  const { isDonateOpen, setIsDonateOpen, companySettings } = useApp();
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedPaypal, setCopiedPaypal] = useState(false);

  if (!isDonateOpen) return null;

  const alias = companySettings.donation?.aliasCbu || 'informaticasurr';
  const rawPaypal = companySettings.donation?.paypalEmail || 'paypal.me/ojovirtual';
  const paypalUrl = rawPaypal.startsWith('http')
    ? rawPaypal
    : rawPaypal.includes('paypal.me')
    ? `https://${rawPaypal}`
    : `https://paypal.me/${rawPaypal}`;

  const handleCopy = (text: string, type: 'alias' | 'paypal') => {
    navigator.clipboard.writeText(text);
    if (type === 'alias') {
      setCopiedAlias(true);
      setTimeout(() => setCopiedAlias(false), 2000);
    } else {
      setCopiedPaypal(true);
      setTimeout(() => setCopiedPaypal(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white p-5 text-center relative">
          <button
            onClick={() => setIsDonateOpen(false)}
            className="absolute top-3.5 right-3.5 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center mb-2 shadow-inner">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <h3 className="font-bold text-lg text-white">Apoyar el Desarrollo del Sistema</h3>
          <p className="text-xs text-amber-100 mt-1 max-w-sm mx-auto">
            Tu colaboración voluntaria nos permite seguir manteniendo y sumando nuevas herramientas para talleres técnicos.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed text-center">
            {companySettings.donation?.message ||
              'Si este sistema te ha sido de utilidad para gestionar tu taller, emitir órdenes y organizar tus reparaciones, puedes colaborar voluntariamente con el proyecto.'}
          </p>

          {/* Option 1: Mercado Pago (Argentina) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <CreditCard className="w-4 h-4 text-sky-600" />
                <span>Mercado Pago / Transferencia (Argentina)</span>
              </span>
              <span className="text-[10px] font-semibold uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                Alias MP
              </span>
            </div>

            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-300 shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Alias de Mercado Pago:</span>
                <span className="font-mono font-bold text-sm text-slate-900 selection:bg-amber-200">
                  {alias}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(alias, 'alias')}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
              >
                {copiedAlias ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAlias ? '¡Copiado!' : 'Copiar Alias'}</span>
              </button>
            </div>
          </div>

          {/* Option 2: PayPal (Internacional) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>PayPal (Donación Internacional / USD / EUR)</span>
              </span>
              <span className="text-[10px] font-semibold uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                PayPal.Me
              </span>
            </div>

            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-300 shadow-sm">
              <div className="space-y-0.5 overflow-hidden">
                <span className="text-[10px] text-slate-400 font-medium block">Enlace de PayPal:</span>
                <span className="font-mono font-bold text-xs text-slate-900 truncate block">
                  {rawPaypal}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => handleCopy(paypalUrl, 'paypal')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  title="Copiar enlace"
                >
                  {copiedPaypal ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPaypal ? '¡Copiado!' : 'Copiar'}</span>
                </button>
                <a
                  href={paypalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-sm"
                >
                  <span>Abrir PayPal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Direct Donation Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <a
              href={`https://link.mercadopago.com.ar/${alias}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm text-xs"
            >
              <CreditCard className="w-4 h-4" />
              <span>Donar vía Mercado Pago</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href={paypalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm text-xs"
            >
              <Coffee className="w-4 h-4" />
              <span>Donar vía PayPal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Feedback & Observations Link for Programmer */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-indigo-950 block">¿Tienes sugerencias u observaciones?</span>
              <span className="text-[11px] text-indigo-700">Mails del proyecto: informaticasurr@gmail.com</span>
            </div>
            <a
              href="mailto:informaticasurr@gmail.com?subject=Observaciones%20Sistema%20Gestion%20Talleres"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shrink-0 transition"
            >
              Escribir al autor
            </a>
          </div>

          {/* Creator Credit */}
          <div className="text-center pt-3 border-t border-slate-200 text-[11px] text-slate-400">
            Sistema desarrollado por <strong>codeghos/sistemas</strong> • Contacto: <span className="font-mono text-slate-600">informaticasurr@gmail.com</span> •{' '}
            <a
              href="https://www.codeghos.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline font-semibold"
            >
              www.codeghos.com
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
