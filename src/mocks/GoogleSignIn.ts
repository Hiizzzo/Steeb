// Mock for @react-native-google-signin/google-signin (web only)
// This prevents the native module from being loaded in web builds

export const GoogleSignin = {
    configure: () => { },
    hasPlayServices: async () => false,
    signIn: async () => {
        throw new Error('Google Sign-In is not available on web. Use Firebase Auth instead.');
    },
    signOut: async () => { },
    isSignedIn: async () => false,
    getCurrentUser: async () => null,
};

export const statusCodes = {
    SIGN_IN_CANCELLED: '12501',
    IN_PROGRESS: '12502',
    PLAY_SERVICES_NOT_AVAILABLE: '12503',
};

export default GoogleSignin;
