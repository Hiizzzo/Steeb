// Mock for @capacitor/core (web only)
export const Capacitor = {
    getPlatform: () => 'web',
    isNativePlatform: () => false,
    isPluginAvailable: () => false,
    convertFileSrc: (path: string) => path,
};

export default Capacitor;
