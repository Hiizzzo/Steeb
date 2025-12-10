export type SteebEmotion = 'happy' | 'surprised' | 'sad' | 'angry';

export const STEEB_EMOTION_STORAGE_KEY = 'stebe-top-left-image';

const emotionToAssetMap: Record<SteebEmotion, string> = {
  happy: '/steeb-emotions/steeb-happy.svg',
  surprised: '/steeb-emotions/steeb-surprised.svg',
  sad: '/steeb-emotions/steeb-sad.svg',
  angry: '/steeb-emotions/steeb-angry.svg'
};

export const getSteebEmotionImagePath = (emotion: SteebEmotion): string => {
  return emotionToAssetMap[emotion] ?? emotionToAssetMap.happy;
};

export const setSteebEmotionImage = (emotion: SteebEmotion) => {
  if (typeof window === 'undefined') return;
  const path = getSteebEmotionImagePath(emotion);
  localStorage.setItem(STEEB_EMOTION_STORAGE_KEY, path);
};

export const getStoredSteebEmotionImage = (emotion: SteebEmotion = 'happy'): string => {
  if (typeof window === 'undefined') return getSteebEmotionImagePath(emotion);
  return localStorage.getItem(STEEB_EMOTION_STORAGE_KEY) || getSteebEmotionImagePath(emotion);
};
