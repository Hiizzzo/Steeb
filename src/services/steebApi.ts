const API_ENDPOINT = 'https://v0-steeb-api-backend.vercel.app/api/steeb';
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
