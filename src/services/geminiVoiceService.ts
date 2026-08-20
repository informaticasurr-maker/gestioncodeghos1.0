import { DatosOrdenVoz } from '../types';

export interface ParseOrderVoiceResult {
  data: DatosOrdenVoz;
  rawText: string;
}

/**
 * Parses transcribed speech text into structured DatosOrdenVoz using Google Gemini API.
 * Supports Bring Your Own Key (BYOK) passed directly or retrieved from localStorage.
 */
export async function parseOrderVoiceTranscription(
  transcription: string,
  apiKey?: string
): Promise<DatosOrdenVoz> {
  const effectiveKey =
    apiKey?.trim() ||
    localStorage.getItem('techfix_gemini_api_key') ||
    '';

  if (!effectiveKey) {
    throw new Error(
      'No se encontró una API Key de Google Gemini. Ingrésala en la barra de entrada por voz o en Ajustes.'
    );
  }

  if (!transcription || !transcription.trim()) {
    throw new Error('La transcripción de audio está vacía.');
  }

  const systemInstruction = `Eres un asistente experto para talleres de servicio técnico y reparación de dispositivos electrónicos (celulares, notebooks, tablets, consolas, PC).
Tu objetivo es analizar la transcripción de voz del técnico o recepcionista y extraer los datos de la nueva orden de trabajo en formato JSON estricto.

Debes responder ÚNICAMENTE con un objeto JSON válido con los siguientes campos y tipos exactos:
{
  "cliente": string | null (Nombre completo o nombre del cliente. Si no se menciona, null),
  "contacto": string | null (Número de teléfono, WhatsApp o email del cliente. Si no se menciona, null),
  "equipo": string | null (Marca y modelo del dispositivo, ej: "Samsung Galaxy A54", "iPhone 13 Pro", "Lenovo ThinkPad E14", "PlayStation 5". Si no se menciona, null),
  "falla": string | null (Descripción detallada de la falla o motivo de ingreso, ej: "Pantalla rota, no da imagen y no enciende", "Cambio de pin de carga y batería hinchada". Si no se menciona, null),
  "presupuesto": number | null (Monto numérico estimado o acordado para la reparación en pesos/moneda local sin símbolos ni letras, ej: 45000. Si no se menciona precio o presupuesto, null),
  "garantia_dias": number | null (Días de garantía mencionados, ej: 30, 60, 90. Si no se especifica, null)
}

Reglas:
1. No incluyas texto explicativo, solo el bloque JSON.
2. Si un dato no se menciona en la transcripción, asigna null.
3. El campo presupuesto debe ser un número entero o flotante, o null.
4. Normaliza los nombres de marcas y modelos conocidos (ej: "a 54 samsung" -> "Samsung Galaxy A54", "iphone trece" -> "iPhone 13").`;

  // Modelos soportados en orden de preferencia (gemini-2.5-flash y gemini-3.7-flash)
  const candidateModels = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Transcripción de voz a procesar:\n"""${transcription.trim()}"""`,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [
        {
          text: systemInstruction,
        },
      ],
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  };

  let lastError: any = null;
  let textOutput = '';

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        effectiveKey
      )}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const resultJson = await response.json();
        textOutput =
          resultJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (textOutput) {
          lastError = null;
          break; // Éxito con este modelo
        }
      } else {
        let errorDetail = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorJson = await response.json();
          if (errorJson?.error?.message) {
            errorDetail = errorJson.error.message;
          }
        } catch {
          // Fallback
        }

        if (response.status === 400 || response.status === 403) {
          throw new Error(`API Key de Gemini inválida o sin permisos: ${errorDetail}`);
        }

        // Si es 404 (modelo no encontrado en esta versión) intentamos con el siguiente modelo
        lastError = new Error(`Error con modelo ${model}: ${errorDetail}`);
      }
    } catch (err: any) {
      lastError = err;
      if (err.message && err.message.includes('API Key de Gemini inválida')) {
        throw err;
      }
    }
  }

  if (lastError && !textOutput) {
    throw lastError;
  }

  if (!textOutput) {
    throw new Error('Gemini no devolvió texto de respuesta.');
  }

  try {
    // Limpiar posibles delimitadores markdown
    const cleanedText = textOutput
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed: DatosOrdenVoz = JSON.parse(cleanedText);

    return {
      cliente: typeof parsed.cliente === 'string' ? parsed.cliente : null,
      contacto: typeof parsed.contacto === 'string' ? parsed.contacto : null,
      equipo: typeof parsed.equipo === 'string' ? parsed.equipo : null,
      falla: typeof parsed.falla === 'string' ? parsed.falla : null,
      presupuesto: typeof parsed.presupuesto === 'number' ? parsed.presupuesto : (parsed.presupuesto ? Number(parsed.presupuesto) || null : null),
      garantia_dias: typeof parsed.garantia_dias === 'number' ? parsed.garantia_dias : (parsed.garantia_dias ? Number(parsed.garantia_dias) || null : null),
    };
  } catch (parseErr) {
    console.error('Error parsing JSON from Gemini response:', textOutput, parseErr);
    throw new Error('La respuesta de Gemini no tiene el formato JSON esperado.');
  }
}
