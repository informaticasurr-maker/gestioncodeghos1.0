import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Key,
  RotateCcw,
  Volume2,
  HelpCircle,
} from 'lucide-react';
import { useSpeechRecognition } from '../utils/useSpeechRecognition';
import { parseOrderVoiceTranscription } from '../services/geminiVoiceService';
import { DatosOrdenVoz } from '../types';

interface VoiceOrderAssistantProps {
  apiKey?: string;
  onOrderDataExtracted: (data: DatosOrdenVoz, transcript: string) => void;
  onSaveApiKey?: (newKey: string) => void;
}

export const VoiceOrderAssistant: React.FC<VoiceOrderAssistantProps> = ({
  apiKey,
  onOrderDataExtracted,
  onSaveApiKey,
}) => {
  const [localApiKey, setLocalApiKey] = useState<string>(() => {
    return apiKey || localStorage.getItem('techfix_gemini_api_key') || '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastExtracted, setLastExtracted] = useState<DatosOrdenVoz | null>(null);

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechRecognition({
    lang: 'es-419',
    continuous: true,
  });

  // Sync prop key if changes
  useEffect(() => {
    if (apiKey && apiKey !== localApiKey) {
      setLocalApiKey(apiKey);
    }
  }, [apiKey]);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = localApiKey.trim();
    localStorage.setItem('techfix_gemini_api_key', cleanKey);
    if (onSaveApiKey) {
      onSaveApiKey(cleanKey);
    }
    setShowKeyInput(false);
    setAiError(null);
  };

  const handleProcessAudioWithGemini = async (textToProcess?: string) => {
    const speechText = textToProcess || transcript;
    if (!speechText.trim()) {
      setAiError('No se ha detectado ninguna transcripción de voz para procesar.');
      return;
    }

    if (!localApiKey.trim()) {
      setShowKeyInput(true);
      setAiError('Por favor ingresa tu API Key de Google Gemini para procesar con IA.');
      return;
    }

    // Detener escucha si sigue activa
    if (isListening) {
      stopListening();
    }

    setIsProcessingAi(true);
    setAiError(null);
    setSuccessMessage(null);

    try {
      const extracted = await parseOrderVoiceTranscription(speechText, localApiKey);
      setLastExtracted(extracted);
      onOrderDataExtracted(extracted, speechText);
      setSuccessMessage('¡Orden completada y mapeada exitosamente desde tu voz!');
      
      // Auto-limpieza de mensaje tras unos segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 6000);
    } catch (err: any) {
      console.error('Error procesando audio con Gemini:', err);
      setAiError(err?.message || 'Error al comunicarse con la API de Gemini');
    } finally {
      setIsProcessingAi(false);
    }
  };

  const handleToggleListening = () => {
    setAiError(null);
    setSuccessMessage(null);
    if (isListening) {
      stopListening();
      // Si ya hay texto acumulado, sugerir o procesar
    } else {
      startListening();
    }
  };

  return (
    <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-800 shadow-sm space-y-4">
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <span>Carga de Orden por Voz con Inteligencia Artificial</span>
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
                Gemini AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Habla libremente describiendo el cliente, teléfono, equipo, falla y precio.
            </p>
          </div>
        </div>

        {/* API Key BYOK button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              localApiKey
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
                : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-900/40 animate-pulse'
            }`}
            title="Configurar API Key de Gemini"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{localApiKey ? 'API Key Configurada' : 'Ingresar API Key'}</span>
          </button>
        </div>
      </div>

      {/* API Key Modal / Dropdown Box */}
      {showKeyInput && (
        <form
          onSubmit={handleSaveApiKey}
          className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-700 text-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Gemini API Key (Bring Your Own Key):</span>
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-400 hover:underline"
            >
              Obtener clave gratis en Google AI Studio ↗
            </a>
          </div>

          <div className="flex gap-2">
            <input
              type="password"
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition text-xs"
            >
              Guardar Clave
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            La clave se almacena de forma segura en tu navegador y se envía directamente a la API de Gemini.
          </p>
        </form>
      )}

      {/* Visual Status Indicator: Escuchando... / Procesando... / Completado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        
        {/* Status 1: Speech state */}
        <div
          className={`p-3 rounded-xl border flex items-center gap-3 transition ${
            isListening
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full ${
              isListening ? 'bg-rose-500 animate-ping' : 'bg-slate-600'
            }`}
          />
          <div className="text-xs">
            <span className="font-semibold block">
              {isListening ? '🎙️ Escuchando audio...' : 'Micrófono Inactivo'}
            </span>
            <span className="text-[10px] opacity-75">
              {isListening ? 'Habla claramente al micrófono' : 'Presiona Grabar para hablar'}
            </span>
          </div>
        </div>

        {/* Status 2: AI Processing state */}
        <div
          className={`p-3 rounded-xl border flex items-center gap-3 transition ${
            isProcessingAi
              ? 'bg-blue-950/60 border-blue-400 text-blue-200 shadow-lg shadow-blue-950/50'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
        >
          {isProcessingAi ? (
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-slate-600" />
          )}
          <div className="text-xs">
            <span className="font-semibold block">
              {isProcessingAi ? '⚡ Procesando con IA...' : 'Analizador Gemini'}
            </span>
            <span className="text-[10px] opacity-75">
              {isProcessingAi ? 'Extrayendo campos y JSON' : 'Listo para estructurar'}
            </span>
          </div>
        </div>

        {/* Status 3: Completion */}
        <div
          className={`p-3 rounded-xl border flex items-center gap-3 transition ${
            successMessage
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
        >
          <CheckCircle2
            className={`w-4 h-4 ${
              successMessage ? 'text-emerald-400' : 'text-slate-600'
            }`}
          />
          <div className="text-xs">
            <span className="font-semibold block">
              {successMessage ? '✨ ¡Completado!' : 'Campos Mapeados'}
            </span>
            <span className="text-[10px] opacity-75">
              {successMessage ? 'Inputs actualizados' : 'Esperando transcripción'}
            </span>
          </div>
        </div>

      </div>

      {/* Main Interaction Area: Microphone Button & Transcription Box */}
      <div className="space-y-3">
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Record / Stop Button */}
          <button
            type="button"
            onClick={handleToggleListening}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition-all transform active:scale-95 ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white ring-4 ring-rose-500/30 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/25'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5" />
                <span>Detener Grabación</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>Grabar Voz (Speech-to-Text)</span>
              </>
            )}
          </button>

          {/* Process with Gemini Button */}
          <button
            type="button"
            onClick={() => handleProcessAudioWithGemini()}
            disabled={isProcessingAi || !transcript.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm transition-all transform active:scale-95"
          >
            {isProcessingAi ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                <span>Procesando con IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span>Analizar y Rellenar Formulario</span>
              </>
            )}
          </button>

          {/* Reset / Clear Button */}
          {transcript && (
            <button
              type="button"
              onClick={resetTranscript}
              disabled={isListening || isProcessingAi}
              className="p-3 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-xl transition"
              title="Borrar transcripción"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Voice sample guidance */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
            <Volume2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Ej: <em>"Cliente Carlos Gómez, teléfono 1123456789, Motorola G84 pantalla rota no enciende, presupuesto 38000"</em></span>
          </div>
        </div>

        {/* Live Transcript View */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Texto Transcrito en Tiempo Real:</span>
            {transcript && (
              <span className="font-mono text-blue-400">{transcript.length} caracteres</span>
            )}
          </div>

          <div className="min-h-[60px] max-h-36 overflow-y-auto text-xs sm:text-sm text-slate-200 leading-relaxed font-sans bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
            {transcript || interimTranscript ? (
              <p>
                {transcript}
                {interimTranscript && (
                  <span className="text-blue-400 italic"> {interimTranscript}...</span>
                )}
              </p>
            ) : (
              <p className="text-slate-500 italic">
                Presiona "Grabar Voz", permite el acceso al micrófono y habla con normalidad. La transcripción aparecerá aquí...
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Errors & Alerts */}
      {speechError && (
        <div className="p-3 bg-amber-950/50 border border-amber-500/40 text-amber-200 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{speechError}</span>
        </div>
      )}

      {aiError && (
        <div className="p-3 bg-rose-950/50 border border-rose-500/40 text-rose-200 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{aiError}</span>
          </div>
          {!localApiKey && (
            <button
              type="button"
              onClick={() => setShowKeyInput(true)}
              className="text-xs underline font-semibold text-rose-300 hover:text-white"
            >
              Configurar Clave
            </button>
          )}
        </div>
      )}

      {/* Success Notification Banner */}
      {successMessage && lastExtracted && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 rounded-xl text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
            <div className="bg-emerald-900/30 p-1.5 rounded border border-emerald-700/30">
              <span className="text-emerald-400 block font-semibold">Cliente:</span>
              <span className="truncate">{lastExtracted.cliente || 'No detectado'}</span>
            </div>
            <div className="bg-emerald-900/30 p-1.5 rounded border border-emerald-700/30">
              <span className="text-emerald-400 block font-semibold">Contacto:</span>
              <span className="truncate">{lastExtracted.contacto || 'No detectado'}</span>
            </div>
            <div className="bg-emerald-900/30 p-1.5 rounded border border-emerald-700/30">
              <span className="text-emerald-400 block font-semibold">Equipo:</span>
              <span className="truncate">{lastExtracted.equipo || 'No detectado'}</span>
            </div>
            <div className="bg-emerald-900/30 p-1.5 rounded border border-emerald-700/30">
              <span className="text-emerald-400 block font-semibold">Falla:</span>
              <span className="truncate">{lastExtracted.falla || 'No detectada'}</span>
            </div>
            <div className="bg-emerald-900/30 p-1.5 rounded border border-emerald-700/30">
              <span className="text-emerald-400 block font-semibold">Presupuesto:</span>
              <span>{lastExtracted.presupuesto ? `$ ${lastExtracted.presupuesto}` : 'No fijado'}</span>
            </div>
            <div className="bg-emerald-900/30 p-1.5 rounded border border-emerald-700/30">
              <span className="text-emerald-400 block font-semibold">Garantía:</span>
              <span>{lastExtracted.garantia_dias ? `${lastExtracted.garantia_dias} días` : 'Estándar'}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
