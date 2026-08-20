import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

// Declaraciones de tipos para la Web Speech API
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: any) => any) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: any) => any) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    lang = 'es-419', // Español latinoamericano por defecto
    continuous = true,
    interimResults = true,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isManuallyStoppedRef = useRef(false);

  useEffect(() => {
    const SpeechRecognitionClass =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalStr += res[0].transcript;
          } else {
            interimStr += res[0].transcript;
          }
        }

        if (finalStr) {
          setTranscript((prev) => {
            const next = prev ? `${prev} ${finalStr}` : finalStr;
            return next.trim();
          });
        }
        setInterimTranscript(interimStr);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'no-speech') {
          // Ignorar error transitorio de silencio
          return;
        }
        if (event.error === 'not-allowed') {
          setError('Permiso de micrófono denegado. Habilita el acceso en tu navegador o móvil.');
        } else if (event.error === 'network') {
          setError('Error de conexión con el servicio de voz nativo.');
        } else {
          setError(`Error de reconocimiento: ${event.error || 'Desconocido'}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        if (!isManuallyStoppedRef.current && isListening) {
          // Reinicio suave si continuous se cortó por timeout de silencio
          try {
            recognition.start();
            return;
          } catch {
            // Ignorar error al reiniciar
          }
        }
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error('Error inicializando SpeechRecognition:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // cleanup
        }
      }
    };
  }, [lang, continuous, interimResults]);

  const startListening = useCallback(() => {
    setError(null);
    setInterimTranscript('');
    isManuallyStoppedRef.current = false;

    if (!recognitionRef.current) {
      const SpeechRecognitionClass =
        typeof window !== 'undefined'
          ? window.SpeechRecognition || window.webkitSpeechRecognition
          : null;
      if (!SpeechRecognitionClass) {
        setError('Tu navegador o dispositivo no soporta Speech Recognition nativo.');
        return;
      }
    }

    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (err: any) {
      // Si ya estaba corriendo
      if (err.name === 'InvalidStateError') {
        try {
          recognitionRef.current?.stop();
          setTimeout(() => recognitionRef.current?.start(), 100);
        } catch {
          // ignore
        }
      } else {
        setError('No se pudo iniciar el micrófono: ' + (err?.message || 'Revisa permisos'));
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}
