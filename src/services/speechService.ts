const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined' && !('ReactNativeWebView' in window);

let ExpoSpeech: any = null;

type SpeakOptions = {
  pitch?: number;
  rate?: number;
  lang?: string;
};

const PREFERRED_VOICE_NAMES = [
  'Google español', // Chrome/Android
  'Microsoft Sabina', // Edge/Windows
  'Microsoft Helena', // Edge/Windows
  'Lucia', 'Paulina', 'Camila', 'Lola', 'Helena', 'Ines', 'Mia'
];

const state = {
  enabled: false,
  preferredVoice: null as SpeechSynthesisVoice | null,
};

const pickWebVoice = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices?.length) return null;

  const esVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('es'));
  const preferredByName =
    esVoices.find((v) => PREFERRED_VOICE_NAMES.some((p) => v.name.toLowerCase().includes(p.toLowerCase()))) ||
    voices.find((v) => PREFERRED_VOICE_NAMES.some((p) => v.name.toLowerCase().includes(p.toLowerCase())));
  const childVoice =
    preferredByName ||
    esVoices.find((v) => /child|niñ|kid|boy|girl/i.test(v.name)) ||
    esVoices[0] ||
    voices[0];

  return childVoice || null;
};

const ensureExpoSpeech = async () => {
  if (ExpoSpeech || isWeb) return;
  try {
    const module = await import('expo-speech');
    ExpoSpeech = module;
  } catch (error) {
    console.warn('expo-speech no disponible:', error);
  }
};

export const speechService = {
  isWeb,
  isEnabled() {
    return state.enabled;
  },
  async enable() {
    state.enabled = true;

    if (isWeb && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const pickVoice = () => {
        state.preferredVoice = pickWebVoice();
      };
      pickVoice();
      window.speechSynthesis.onvoiceschanged = pickVoice;
    } else {
      await ensureExpoSpeech();
    }
  },
  disable() {
    state.enabled = false;
  },
  async speak(text: string, options: SpeakOptions = {}) {
    if (!state.enabled) return false;
    if (!text || !text.trim()) return false;

    if (isWeb) {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = state.preferredVoice || pickWebVoice();
      if (voice) utterance.voice = voice;
      utterance.lang = options.lang || voice?.lang || 'es-ES';
      utterance.pitch = options.pitch ?? 1.6; // más agudo
      utterance.rate = options.rate ?? 1.12;  // más ágil

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      return true;
    }

    await ensureExpoSpeech();
    if (!ExpoSpeech?.speak) return false;
    ExpoSpeech.speak(text, {
      language: options.lang || 'es-ES',
      pitch: options.pitch ?? 1.6,
      rate: options.rate ?? 1.12,
    });
    return true;
  },
};
