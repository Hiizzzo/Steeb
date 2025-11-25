const API_ENDPOINT = 'https://v0-steeb-api-backend-production.up.railway.app/api/steeb';
const SHINY_GAME_ENDPOINT = 'https://v0-steeb-api-backend-production.up.railway.app/api/shiny-game';
const SHINY_STATUS_ENDPOINT = 'https://v0-steeb-api-backend-production.up.railway.app/api/users/shiny-status';
const SHINY_STATS_ENDPOINT = 'https://v0-steeb-api-backend-production.up.railway.app/api/shiny-stats';
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

export interface GlobalShinyStats {
  totalShinyUsers: number;
  isExclusive: boolean;
  recentlyJoined: Array<{
    userId: string;
    userName: string;
    userAvatar?: string | null;
    unlockedAt?: string;
  }>;
  totalUsersWithAvatars: number;
  userStats?: {
    position: number;
    isShiny: boolean;
    unlockedAt?: string;
    percentile?: string;
  };
}

export interface ShinyWinStats {
  position: number;
  totalShinyUsers: number;
  isExclusive?: boolean;
  isNewShiny?: boolean;
}

const generateUserId = () => `steeb-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

const getPersistentUserId = async (): Promise<string> => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return generateUserId();
  }

  let userId = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (!userId) {
    userId = generateUserId();
    try {
      window.localStorage.setItem(USER_ID_STORAGE_KEY, userId);
    } catch {
      // ignore storage errors
    }
  }
  return userId;
};

export async function sendMessageToSteeb(message: string): Promise<SteebApiSuccess> {
  const userId = await getPersistentUserId();

  console.log(' STEEB → Endpoint usado:', API_ENDPOINT);
  console.log(' STEEB → Enviando mensaje:', message);

  let response: Response;

  try {
    response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        userId
      })
    });
  } catch {
    throw new Error('No pudimos contactar al servidor de STEEB. Revisa tu conexión e intenta nuevamente.');
  }

  const rawText = await response.text();
  console.log(' STEEB → Status:', response.status);
  console.log(' STEEB → Raw:', rawText.slice(0, 200));

  let payload: any;
  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error(`STEEB devolvió una respuesta inválida. (status ${response.status})`);
  }

  if (!response.ok || payload?.success === false) {
    const backendError = payload?.error ?? `Error ${response.status}`;
    throw new Error(typeof backendError === 'string' ? backendError : 'Hubo un problema hablando con STEEB.');
  }

  const reply: string =
    typeof payload?.data?.reply === 'string' && payload.data.reply.trim().length > 0
      ? payload.data.reply.trim()
      : (typeof payload?.message === 'string' ? payload.message : 'Listo, hacelo ahora.');

  const actions = normalizeActions(payload?.data?.actions);

  return {
    reply,
    actions
  };
}

export type ShinyGameResponse = {
  success: boolean;
  won?: boolean;
  secret?: number;
  message: string;
  remainingRolls?: number;
  nextAttemptIn?: number;
  alreadyWon?: boolean;
  shinyStats?: ShinyWinStats;
};

export async function playShinyGame(guess: number, userIdOverride?: string): Promise<ShinyGameResponse> {
  const userId = userIdOverride || await getPersistentUserId();

  console.log('🎲 SHINY GAME → Jugando con número:', guess, 'User:', userId);

  let response: Response;

  try {
    response = await fetch(SHINY_GAME_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        guess
      })
    });
  } catch {
    throw new Error('No pudimos contactar al servidor de juego. Revisa tu conexión.');
  }

  const data = await response.json();

  if (!response.ok) {
    // Si es error 429 (límite diario), devolvemos la data para manejar el tiempo restante
    if (response.status === 429) {
      return {
        success: false,
        message: data.message || 'Límite diario alcanzado',
        nextAttemptIn: data.nextAttemptIn
      };
    }
    throw new Error(data.message || 'Error al jugar Shiny Game');
  }

  return data as ShinyGameResponse;
}

export type ShinyStatusResponse = {
  success: boolean;
  dailyAttemptAvailable: boolean;
  extraRolls: number;
  totalAvailable: number;
  isShiny: boolean;
};

export async function getShinyStatus(userIdOverride?: string): Promise<ShinyStatusResponse> {
  const userId = userIdOverride || await getPersistentUserId();

  try {
    const response = await fetch(`${SHINY_STATUS_ENDPOINT}?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Error fetching shiny status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting shiny status:', error);
    throw error;
  }
}

export async function getGlobalShinyStats(userId?: string): Promise<GlobalShinyStats> {
  try {
    const url = userId ? `${SHINY_STATS_ENDPOINT}?userId=${encodeURIComponent(userId)}` : SHINY_STATS_ENDPOINT;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const payload = await response.json();

    if (!response.ok || payload?.success === false) {
      const errorMessage = payload?.message || 'No se pudieron obtener las estadísticas shiny.';
      throw new Error(errorMessage);
    }

    return payload.data as GlobalShinyStats;
  } catch (error) {
    console.error('Error getting global shiny stats:', error);
    throw error;
  }
}
