import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://v0-steeb-api-backend-production.up.railway.app/api';
const API_ENDPOINT = `${BASE_URL}/steeb`;
const USER_ID_STORAGE_KEY = 'steeb-user-id';

const ACTION_TYPES: SteebActionType[] = [
  'OPEN_CALENDAR',
  'OPEN_TASKS',
  'OPEN_PROGRESS',
  'CREATE_TASK',
  'BUY_DARK_MODE',
  'BUY_SHINY_ROLLS',
  'PLAY_SHINY_GAME',
  'SHOW_MOTIVATION',
  'GET_SHINY_STATS'
];

const normalizeActions = (raw: any): SteebAction[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((action) => {
      if (!action || typeof action !== 'object') return null;
      const typeValue = typeof action.type === 'string' ? action.type.toUpperCase() : '';
      const matched = ACTION_TYPES.find((allowed) => allowed === typeValue);
      if (!matched) return null;
      const payload = action.payload && typeof action.payload === 'object' ? action.payload : {};
      return { type: matched, payload };
    })
    .filter(Boolean) as SteebAction[];
};

let cachedUserId: string | null = null;
let secureStoreAvailable: boolean | null = null;

export type SteebActionType =
  | 'OPEN_CALENDAR'
  | 'OPEN_TASKS'
  | 'OPEN_PROGRESS'
  | 'CREATE_TASK'
  | 'BUY_DARK_MODE'
  | 'BUY_SHINY_ROLLS'
  | 'PLAY_SHINY_GAME'
  | 'SHOW_MOTIVATION'
  | 'GET_SHINY_STATS';

export interface SteebAction {
  type: SteebActionType;
  payload?: Record<string, any>;
}

type SteebApiSuccess = {
  reply: string;
  actions: SteebAction[];
};

const generateUserId = () =>
  `steeb-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

const hasLocalStorage = () => {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    );
  } catch {
    return false;
  }
};

const ensureSecureStoreAvailability = async () => {
  if (secureStoreAvailable !== null) return secureStoreAvailable;
  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch {
    secureStoreAvailable = false;
  }
  return secureStoreAvailable;
};

const readStoredUserId = async (): Promise<string | null> => {
  try {
    if (await ensureSecureStoreAvailability()) {
      const value = await SecureStore.getItemAsync(USER_ID_STORAGE_KEY);
      if (value) return value;
    }
  } catch {
    // ignore secure store errors
  }

  if (hasLocalStorage()) {
    try {
      return window.localStorage.getItem(USER_ID_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  return null;
};

const persistUserId = async (userId: string) => {
  try {
    if (await ensureSecureStoreAvailability()) {
      await SecureStore.setItemAsync(USER_ID_STORAGE_KEY, userId);
      return;
    }
  } catch {
    // ignore secure store errors and fallback to local storage
  }

  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(USER_ID_STORAGE_KEY, userId);
    } catch {
      // ignore
    }
  }
};

const getPersistentUserId = async (): Promise<string> => {
  if (cachedUserId) return cachedUserId;

  let stored = await readStoredUserId();
  if (!stored) {
    stored = generateUserId();
    await persistUserId(stored);
  }

  cachedUserId = stored;
  return stored;
};

const parseSSEResponse = (rawText: string): { reply: string; actions: any[] } => {
  // 1. Try parsing as standard JSON first (for error responses or legacy format)
  if (rawText.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawText);
      if (parsed.success === false || parsed.error) {
        throw new Error(parsed.error || parsed.message || 'Error del servidor');
      }
      // If it looks like a standard success response
      if (parsed.data || parsed.message) {
        return {
          reply: parsed.data?.reply || parsed.message || '',
          actions: parsed.data?.actions || []
        };
      }
    } catch (e: any) {
      // If we identified a server error, rethrow it
      if (e.message && (e.message.includes('Error del servidor') || e.message.includes('Error'))) {
        throw e;
      }
      // Otherwise, ignore JSON parse errors and try SSE
    }
  }

  // 2. Parse SSE stream
  const lines = rawText.split('\n');
  let fullContent = '';
  let foundSSE = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('data: ')) {
      foundSSE = true;
      const jsonStr = trimmed.slice(6);
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.chunk) {
          fullContent += parsed.chunk;
        }
      } catch (e) {
        // ignore invalid lines
      }
    }
  }

  if (!foundSSE && !fullContent) {
    // If it wasn't JSON and we found no SSE data, return empty (or could throw)
    return { reply: '', actions: [] };
  }

  // 3. Process markers in accumulated content
  let reply = '';
  let actionsRaw = '';
  let contentToProcess = fullContent;

  // Handle optional REPLY marker
  if (contentToProcess.includes(':::REPLY:::')) {
    const parts = contentToProcess.split(':::REPLY:::');
    contentToProcess = parts[1] || '';
  }

  // Handle ACTIONS marker
  if (contentToProcess.includes(':::ACTIONS:::')) {
    const parts = contentToProcess.split(':::ACTIONS:::');
    reply = parts[0];
    actionsRaw = parts[1] || '';
  } else {
    reply = contentToProcess;
  }

  let actions: any[] = [];
  if (actionsRaw.trim()) {
    try {
      actions = JSON.parse(actionsRaw.trim());
    } catch (e) {
      console.warn('Error parsing actions JSON from stream:', e);
    }
  }

  return { reply, actions };
};

export async function sendMessageToSteeb(
  message: string
): Promise<SteebApiSuccess> {
  const userId = await getPersistentUserId();

  console.log(' STEEB → Endpoint usado:', API_ENDPOINT);
  console.log(' STEEB → Enviando mensaje:', message);

  let response: Response;

  try {
    response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId,
      }),
    });
  } catch {
    throw new Error(
      'No pudimos contactar al servidor de STEEB. Revisá tu conexión e intentá de nuevo.'
    );
  }

  const rawText = await response.text();
  console.log(' STEEB → Status:', response.status);
  // console.log(' STEEB → Raw:', rawText.slice(0, 200));

  if (!response.ok) {
    // Try to parse error from JSON if possible
    try {
      const json = JSON.parse(rawText);
      throw new Error(json.error || json.message || `Error del servidor (${response.status})`);
    } catch (e: any) {
      if (e.message && !e.message.includes('Unexpected token')) throw e;
      throw new Error(`Error del servidor (${response.status})`);
    }
  }

  let parsed: { reply: string; actions: any[] };
  try {
    parsed = parseSSEResponse(rawText);
  } catch (e: any) {
    throw new Error(e.message || `STEEB devolvió una respuesta inválida. (status ${response.status})`);
  }

  if (!parsed.reply && parsed.actions.length === 0) {
     // If we got nothing, it might be an issue
     // But sometimes reply is empty? Unlikely for AI.
     // Let's assume if both are empty and status was 200, it's a parsing failure or empty stream
     if (rawText.length > 0) {
         // If we have text but parsed nothing, maybe the format changed unexpectedly
         console.warn('STEEB → Warning: Parsed empty response from non-empty body');
     }
  }

  const actions = normalizeActions(parsed.actions);

  return {
    reply: parsed.reply,
    actions,
  };
}
