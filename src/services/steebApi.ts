const API_ENDPOINT = 'https://v0-steeb-api-backend.vercel.app/api/steeb';
const SHINY_GAME_ENDPOINT = 'https://v0-steeb-api-backend.vercel.app/api/shiny-game';
const USER_ID_STORAGE_KEY = 'steeb-user-id';

type SteebApiSuccess = {
  reply: string;
  messageCount: number;
  remainingMessages: number;
};

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

  const reply: string = payload?.data?.reply ?? '';
  const messageCount: number = payload?.data?.user?.messageCount ?? 0;
  const remainingMessages: number = payload?.data?.user?.remainingMessages ?? 0;

  return {
    reply,
    messageCount,
    remainingMessages
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
