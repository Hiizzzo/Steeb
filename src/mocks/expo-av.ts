// Mock expo-av for web build (avoids JSX parsing issues in Rollup)
// This is a stub that provides empty implementations for web

export const Audio = {
    Sound: {
        createAsync: async () => ({ sound: null, status: {} }),
    },
    setAudioModeAsync: async () => { },
    INTERRUPTION_MODE_IOS_DO_NOT_MIX: 0,
    INTERRUPTION_MODE_IOS_DUCK_OTHERS: 1,
    INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS: 2,
    INTERRUPTION_MODE_ANDROID_DO_NOT_MIX: 0,
    INTERRUPTION_MODE_ANDROID_DUCK_OTHERS: 1,
};

export const Video = () => null;

export const ResizeMode = {
    CONTAIN: 'contain',
    COVER: 'cover',
    STRETCH: 'stretch',
};

export default { Audio, Video, ResizeMode };
