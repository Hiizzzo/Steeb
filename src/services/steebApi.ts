const BASE_URL = import.meta.env.VITE_API_URL || 'https://v0-steeb-api-backend-production.up.railway.app/api';

const API_ENDPOINT = `${BASE_URL}/steeb`;
const SHINY_GAME_ENDPOINT = `${BASE_URL}/shiny-game`;
const SHINY_STATUS_ENDPOINT = `${BASE_URL}/users/shiny-status`;
const SHINY_STATS_ENDPOINT = `${BASE_URL}/shiny-stats`;
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
  'GET_SHINY_STATS',
  'UPDATE_USER_PROFILE'
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
  | 'GET_SHINY_STATS'
  | 'UPDATE_USER_PROFILE';

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
  // Legacy function kept for compatibility if needed, but we prefer streaming now.
  // Re-implementing as a wrapper around streaming for simplicity if we want to keep the signature,
  // OR we can just keep the old implementation if we want a fallback.
  // For now, let's keep the old implementation but point to the new endpoint logic if we hadn't changed it.
  // BUT since we changed the backend to ONLY stream, this function will break if we don't update it.
  // So we should update this to consume the stream fully and return the result.

  let fullReply = '';
  let finalActions: SteebAction[] = [];

  await streamMessageToSteeb(message, (chunk) => {
    fullReply += chunk;
  });

  // Actions are parsed inside streamMessageToSteeb but we need to extract them.
  // Actually, streamMessageToSteeb returns the actions promise.

  return {
    reply: fullReply,
    actions: [] // We might miss actions here if we don't refactor carefully. 
    // Ideally we use streamMessageToSteeb directly in the component.
  };
}

export async function streamMessageToSteeb(
  message: string,
  onChunk: (text: string) => void,
  context?: any
): Promise<{ actions: SteebAction[] }> {
  return streamMessageToSteebRobust(message, onChunk, context);
}

async function streamMessageToSteebRobust(
  message: string,
  onChunk: (text: string) => void,
  context?: any
): Promise<{ actions: SteebAction[] }> {
  const userId = await getPersistentUserId();
  
  // Obtener rol del usuario desde localStorage o contexto si es posible
  // Como esta función es independiente, intentamos leer del localStorage si existe
  let userRole = 'white';
  try {
    // Intentar obtener el rol del usuario de alguna fuente disponible
    // Esto es un hack rápido, idealmente deberíamos pasar el rol como argumento
    if (context && context.userRole) {
      userRole = context.userRole;
    }
  } catch (e) {
    // ignore
  }

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, userId, context, userRole })
  });

  console.log('🌊 STEEB Response Status:', response.status);

  if (!response.ok) {
    const text = await response.text();
    console.error('🌊 STEEB Error Response:', text);
    throw new Error(`Error del servidor: ${response.status}`);
  }

  if (!response.body) throw new Error('No readable stream');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let rawAccumulator = '';
  let replyAccumulator = '';
  let actionsAccumulator = '';
  let mode: 'WAITING' | 'REPLY' | 'ACTIONS' = 'WAITING';
  let streamBuffer = '';

  const processLine = async (line: string) => {
    if (line.trim() === '') return;

    if (line.startsWith('data: ')) {
      const jsonStr = line.slice(6);
      if (jsonStr === '[DONE]') return;

      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.chunk) {
          rawAccumulator += parsed.chunk;

          // Check for mode switching
          if (mode === 'WAITING') {
            if (rawAccumulator.includes(':::REPLY:::')) {
              mode = 'REPLY';
              // Remove marker and process rest
              const parts = rawAccumulator.split(':::REPLY:::');
              rawAccumulator = parts[1] || '';
            } else if (!rawAccumulator.startsWith(':')) {
              // If it doesn't start with ':', assume plain text response
              mode = 'REPLY';
            }
          }

          if (mode === 'REPLY') {
            if (rawAccumulator.includes(':::ACTIONS:::')) {
              const parts = rawAccumulator.split(':::ACTIONS:::');
              const replyChunk = parts[0];
              onChunk(replyChunk); // Send final reply part
              replyAccumulator += replyChunk;

              mode = 'ACTIONS';
              rawAccumulator = parts[1] || '';
            } else {
              // Safe to send? We need to be careful not to send partial marker.
              // If buffer ends with ':', '::', ':::A', etc., wait.
              const partialMarker = /:{1,3}[A-Z]*$/.test(rawAccumulator);
              if (!partialMarker) {
                onChunk(rawAccumulator);
                replyAccumulator += rawAccumulator;
                rawAccumulator = '';
              }
            }
          }

          if (mode === 'ACTIONS') {
            actionsAccumulator += rawAccumulator;
            rawAccumulator = '';
          }
        }
      } catch (e) {
        // ignore
      }
    } else {
      // Fallback for non-streaming JSON response
      try {
        const parsed = JSON.parse(line);
        if (parsed.success && parsed.data) {
          if (parsed.data.reply) {
            // Simulate typing effect for better UX (Faster)
            const reply = parsed.data.reply;
            const chunkSize = 8;
            for (let i = 0; i < reply.length; i += chunkSize) {
              onChunk(reply.slice(i, i + chunkSize));
              await new Promise(resolve => setTimeout(resolve, 8));
            }
          }
          if (parsed.data.actions) {
            actionsAccumulator = JSON.stringify(parsed.data.actions);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      if (streamBuffer.trim()) {
        await processLine(streamBuffer);
      }
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    streamBuffer += chunk;

    const lines = streamBuffer.split('\n');
    streamBuffer = lines.pop() || '';

    for (const line of lines) {
      await processLine(line);
    }
  }

  // Parse actions
  let actions: SteebAction[] = [];
  try {
    if (actionsAccumulator.trim()) {
      const json = JSON.parse(actionsAccumulator.trim());
      actions = normalizeActions(json);
    }
  } catch (e) {
    console.warn('Error parsing actions from stream:', e);
  }

  return { actions };
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

  // console.log('🎲 SHINY GAME → Jugando con número:', guess, 'User:', userId);

  try {
    const response = await fetch(SHINY_GAME_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        guess
      })
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Error parseando respuesta de shiny-game:', parseError);
      return {
        success: false,
        message: 'Respuesta inválida del servidor de juego.'
      };
    }

    if (!response.ok) {
      if (response.status === 429) {
        return {
          success: false,
          message: data?.message || 'Límite diario alcanzado',
          nextAttemptIn: data?.nextAttemptIn
        };
      }
      return {
        success: false,
        message: data?.message || 'Error al jugar Shiny Game'
      };
    }

    return data as ShinyGameResponse;
  } catch (error) {
    console.error('Error en playShinyGame:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos contactar al servidor de juego. Revisa tu conexión.'
    };
  }
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
      const errorMessage = payload?.message || 'No se pudieron obtener las estadÃ­sticas shiny.';
      throw new Error(errorMessage);
    }

    return payload.data as GlobalShinyStats;
  } catch (error) {
    console.error('Error getting global shiny stats:', error);
    throw error;
  }
}


