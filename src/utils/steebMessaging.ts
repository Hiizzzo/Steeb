export type SteebMessageChannel = 'steeb-message' | 'steeb-message-with-button' | 'steeb-message-with-options';

interface QueuedSteebMessage {
  channel: SteebMessageChannel;
  detail: any;
}

const QUEUE_KEY = '__steebPendingMessages';

const getGlobalWindow = (): any | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window as any;
};

export const dispatchSteebMessage = (detail: any, channel: SteebMessageChannel = 'steeb-message') => {
  if (typeof window === 'undefined') return;

  try {
    const globalWindow = getGlobalWindow();
    if (globalWindow) {
      if (!Array.isArray(globalWindow[QUEUE_KEY])) {
        globalWindow[QUEUE_KEY] = [];
      }
      globalWindow[QUEUE_KEY].push({ channel, detail });
    }
  } catch {
    // ignore queue errors
  }

  window.dispatchEvent(new CustomEvent(channel, { detail }));
};

export const flushPendingSteebMessages = (
  handler: (detail: any, channel: SteebMessageChannel) => void
) => {
  const globalWindow = getGlobalWindow();
  if (!globalWindow || !Array.isArray(globalWindow[QUEUE_KEY]) || !globalWindow[QUEUE_KEY].length) {
    return;
  }

  try {
    const pending: QueuedSteebMessage[] = [...globalWindow[QUEUE_KEY]];
    globalWindow[QUEUE_KEY].length = 0;
    pending.forEach(({ channel, detail }) => handler(detail, channel));
  } catch {
    // ignore
  }
};

export const welcomeKeyForUser = (userId?: string) =>
  userId ? `steeb-dark-welcome-${userId}` : 'steeb-dark-welcome';

export const buildDarkWelcomeMessage = (clubNumber?: number | null, nickname?: string | null) => {
  const safeNick = nickname?.trim().length ? nickname.trim() : 'Che';
  const numberText = clubNumber
    ? `sos el usuario BLACK #${clubNumber}`
    : 'ya sos usuario BLACK';
  return `${safeNick}, ${numberText}. Bienvenido al club: el botón de Dark Mode está arriba a la derecha para que no te quemes los ojos. Además te regalo una tirada SHINY; cuando quieras usarla escribime jugar "shiny".`;
};

export const dispatchDarkWelcomeMessage = (clubNumber?: number | null, nickname?: string | null) => {
  dispatchSteebMessage({
    type: 'payment-success',
    content: buildDarkWelcomeMessage(clubNumber, nickname),
    timestamp: new Date()
  });
};
