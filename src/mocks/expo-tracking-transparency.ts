// Mock for expo-tracking-transparency (web only)
export const requestTrackingPermissionsAsync = async () => {
    return { status: 'granted' };
};

export const getTrackingPermissionsAsync = async () => {
    return { status: 'granted' };
};
