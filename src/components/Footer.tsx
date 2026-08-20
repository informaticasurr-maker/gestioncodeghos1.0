import React from 'react';
import { Heart, Cloud, ShieldCheck, Wrench } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { setIsDonateOpen, setIsGoogleDriveOpen, companySettings } = useApp();

  return (
    <footer className="mt-8 border-t border-slate-200 bg-white py-4 px-4 sm:px-6 no-print">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        
        {/* Left Creator Brand */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Sistema:</span>
          <span className="font-bold text-slate-900">codeghos/sistemas</span>
          <span>•</span>
          <a
            href="https://www.codeghos.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-blue-600 font-mono transition"
          >
            www.codeghos.com
          </a>
        </div>

        {/* Center Quick status */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsGoogleDriveOpen(true)}
            className="flex items-center gap-1.5 hover:text-slate-900 transition"
          >
            <Cloud className={`w-3.5 h-3.5 ${companySettings.googleDrive.connected ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="font-medium">{companySettings.googleDrive.connected ? 'Drive Conectado' : 'Conectar Drive'}</span>
          </button>

          <span>•</span>

          <button
            onClick={() => setIsDonateOpen(true)}
            className="flex items-center gap-1.5 text-slate-600 hover:text-amber-600 font-medium transition"
          >
            <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>Donar al Proyecto</span>
          </button>
        </div>

        {/* Right Workshop Version */}
        <div className="text-[11px] text-slate-500 font-medium">
          v2.4 Pro • Panel de Reparaciones & Laboratorio
        </div>

      </div>
    </footer>
  );
};

