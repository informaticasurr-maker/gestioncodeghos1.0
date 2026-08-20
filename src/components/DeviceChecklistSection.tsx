import React from 'react';
import { Check, X, Minus, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { DeviceChecklist } from '../types';

interface DeviceChecklistSectionProps {
  checklist: DeviceChecklist;
  onChange: (updated: DeviceChecklist) => void;
  readOnly?: boolean;
  title?: string;
  subtitle?: string;
}

const CHECKLIST_ITEMS: { key: keyof DeviceChecklist; label: string; icon: string }[] = [
  { key: 'turnsOn', label: 'Enciende correctamente', icon: '⚡' },
  { key: 'displayTouch', label: 'Pantalla y Táctil', icon: '📱' },
  { key: 'batteryCharging', label: 'Batería y Pin de Carga', icon: '🔋' },
  { key: 'frontCamera', label: 'Cámara Frontal', icon: '🤳' },
  { key: 'rearCamera', label: 'Cámara Trasera / Flash', icon: '📷' },
  { key: 'audioSpeaker', label: 'Parlante / Altavoz', icon: '🔊' },
  { key: 'microphone', label: 'Micrófono (Llamadas / Audio)', icon: '🎙️' },
  { key: 'wifiBluetooth', label: 'Wi-Fi / Bluetooth', icon: '📶' },
  { key: 'buttons', label: 'Botones físicos (Vol / Power)', icon: '🔘' },
  { key: 'biometrics', label: 'Huella / Face ID', icon: '🔒' },
  { key: 'simSignal', label: 'Lector SIM / Señal Móvil', icon: '📡' },
  { key: 'housingCondition', label: 'Tapa / Chasis sin roturas', icon: '🛡️' },
  { key: 'screwsPresent', label: 'Tornillos completos', icon: '🔩' },
];

export const DeviceChecklistSection: React.FC<DeviceChecklistSectionProps> = ({
  checklist,
  onChange,
  readOnly = false,
  title = 'Checklist de Inspección Técnica',
  subtitle = 'Verificación física y funcional del equipo al ingresar/entregar',
}) => {
  const handleToggle = (key: keyof DeviceChecklist) => {
    if (readOnly) return;
    const current = checklist[key];
    let next: boolean | undefined;

    // Cycle: undefined/true -> false -> undefined
    if (current === true) {
      next = false;
    } else if (current === false) {
      next = undefined;
    } else {
      next = true;
    }

    onChange({
      ...checklist,
      [key]: next,
    });
  };

  const setAll = (val: boolean | undefined) => {
    if (readOnly) return;
    const updated: DeviceChecklist = { ...checklist };
    CHECKLIST_ITEMS.forEach((item) => {
      (updated as any)[item.key] = val;
    });
    onChange(updated);
  };

  // Count states
  let okCount = 0;
  let failCount = 0;
  let naCount = 0;

  CHECKLIST_ITEMS.forEach((item) => {
    const val = checklist[item.key];
    if (val === true) okCount++;
    else if (val === false) failCount++;
    else naCount++;
  });

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>

        {/* Counter Pills & Quick Set */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> {okCount} OK
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-medium flex items-center gap-1">
              <X className="w-3 h-3" /> {failCount} Falla
            </span>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setAll(true)}
                className="text-[11px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 font-medium transition-colors"
                title="Marcar todos como OK"
              >
                Todos OK
              </button>
              <button
                type="button"
                onClick={() => setAll(undefined)}
                className="text-[11px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
                title="Limpiar checklist"
              >
                Reiniciar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Checklist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {CHECKLIST_ITEMS.map((item) => {
          const val = checklist[item.key];
          let statusStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400';
          let statusIcon = <Minus className="w-3.5 h-3.5 text-slate-400" />;
          let statusText = 'No verificado';

          if (val === true) {
            statusStyle = 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/20';
            statusIcon = <Check className="w-3.5 h-3.5 text-emerald-600" />;
            statusText = 'Funciona / OK';
          } else if (val === false) {
            statusStyle = 'border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500/20';
            statusIcon = <X className="w-3.5 h-3.5 text-rose-600" />;
            statusText = 'Falla detectada';
          }

          return (
            <div
              key={item.key}
              onClick={() => handleToggle(item.key)}
              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${statusStyle} ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:border-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-sm">{item.icon}</span>
                <span className="font-medium truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0 font-medium">
                {statusIcon}
                <span className="text-[11px]">{statusText}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Observations */}
      <div>
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
          Observaciones estéticas / detalles de inspección:
        </label>
        {readOnly ? (
          <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
            {checklist.notes || 'Sin notas adicionales registradas.'}
          </p>
        ) : (
          <input
            type="text"
            value={checklist.notes || ''}
            onChange={(e) => onChange({ ...checklist, notes: e.target.value })}
            placeholder="Ej: Rayón visible en esquina superior, falta protector de cámara..."
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        )}
      </div>
    </div>
  );
};
