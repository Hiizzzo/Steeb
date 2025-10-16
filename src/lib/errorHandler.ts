// ============================================================================
// ERROR HANDLER - DEVELOPMENT ERROR SUPPRESSION
// ============================================================================

/**
 * Configures error handling for development environment
 * Suppresses common Firebase connection errors that are normal in local development
 */
export const setupDevelopmentErrorHandling = () => {
  if (!import.meta.env.DEV) return;

  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;

  // List of error patterns to suppress in development
  const suppressedErrorPatterns = [
    'net::ERR_ABORTED',
    'firestore.googleapis.com',
    'Failed to fetch',
    'NetworkError',
    'Firebase: Error (auth/network-request-failed)',
    'Firebase: Error (firestore/unavailable)',
  ];

  // Override console.error
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Check if this error should be suppressed
    const shouldSuppress = suppressedErrorPatterns.some(pattern => 
      message.includes(pattern)
    );

    if (shouldSuppress) {
      // Convert to a less intrusive warning
      console.warn('🔥 Firebase connection issue (normal in local development):', 
        message.substring(0, 100) + '...');
      return;
    }

    // Allow other errors through
    originalError.apply(console, args);
  };

  // Add helpful development messages
  console.info('🚀 Development mode: Firebase connection errors are suppressed');
  console.info('💡 Tip: The app works offline with local storage');
};

/**
 * Restores original console methods (for testing or cleanup)
 */
export const restoreConsole = () => {
  // This would need to store references to original methods
  // Implementation depends on specific needs
};

/**
 * Handles Firebase-specific errors gracefully
 */
export const handleFirebaseError = (error: any, context: string = 'Firebase operation') => {
  if (import.meta.env.DEV) {
    console.warn(`⚠️ ${context} failed (running in offline mode):`, error.code || error.message);
    return;
  }

  // In production, you might want to log to an error service
  console.error(`${context} failed:`, error);
};

/**
 * Network status utilities
 */
export const networkUtils = {
  isOnline: () => navigator.onLine,
  
  onNetworkChange: (callback: (isOnline: boolean) => void) => {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
  
  showNetworkStatus: () => {
    if (import.meta.env.DEV) {
      console.info(`🌐 Network status: ${navigator.onLine ? 'Online' : 'Offline'}`);
    }
  }
};