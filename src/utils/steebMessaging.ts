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

export const buildDarkWelcomeMessage = (clubNumber?: number | null) => {
  const numberText = clubNumber
    ? `Sos el BLACK #${clubNumber}.`
    : 'Te ganaste el pase BLACK.';
  return `Steeb aca. ${numberText} Ya tenes el modo oscuro clavado para siempre y te regale una tirada para SHINY. Cuando quieras quemarla escribime: jugar "shiny". Bienvenido y no aflojes.`;
};

export const dispatchDarkWelcomeMessage = (clubNumber?: number | null) => {
  dispatchSteebMessage({
    type: 'payment-success',
    content: buildDarkWelcomeMessage(clubNumber),
    timestamp: new Date()
  });
};
