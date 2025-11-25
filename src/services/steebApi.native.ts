import * as SecureStore from 'expo-secure-store';

const API_ENDPOINT = 'https://v0-steeb-api-backend-production.up.railway.app/api/steeb';
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
  console.log(' STEEB → Raw:', rawText.slice(0, 200));

  let payload: any;
  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error(
      `STEEB devolvió una respuesta inválida. (status ${response.status})`
    );
  }

  if (!response.ok || payload?.success === false) {
    const backendError =
      payload?.error ?? `Error del servidor de STEEB (${response.status})`;
    throw new Error(
      typeof backendError === 'string'
        ? backendError
        : 'Hubo un problema hablando con STEEB.'
    );
  }

  const reply: string =
    typeof payload?.data?.reply === 'string' && payload.data.reply.trim().length > 0
      ? payload.data.reply.trim()
      : (typeof payload?.message === 'string' ? payload.message : 'Listo, hacelo ahora.');

  const actions = normalizeActions(payload?.data?.actions);

  return {
    reply,
    actions,
  };
}
