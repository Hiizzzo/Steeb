// ============================================================================
// FIREBASE ERROR HANDLER - SPECIFIC ERROR MANAGEMENT
// ============================================================================

import { FirebaseError } from 'firebase/app';

/**
 * Firebase error codes that are safe to ignore in development
 */
const DEVELOPMENT_SAFE_ERRORS = [
  'auth/network-request-failed',
  'firestore/unavailable',
  'firestore/deadline-exceeded',
  'firestore/cancelled',
  'storage/retry-limit-exceeded',
];

/**
 * Network-related error patterns to suppress in development
 */
const NETWORK_ERROR_PATTERNS = [
  'net::ERR_ABORTED',
  'net::ERR_NETWORK_CHANGED',
  'net::ERR_INTERNET_DISCONNECTED',
  'Failed to fetch',
  'NetworkError',
  'fetch is not defined',
];

/**
 * Enhanced Firebase error handler
 */
export class FirebaseErrorHandler {
  private static instance: FirebaseErrorHandler;
  private isDevelopment: boolean;
  private suppressedErrors: Set<string> = new Set();

  private constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.setupGlobalErrorHandling();
  }

  public static getInstance(): FirebaseErrorHandler {
    if (!FirebaseErrorHandler.instance) {
      FirebaseErrorHandler.instance = new FirebaseErrorHandler();
    }
    return FirebaseErrorHandler.instance;
  }

  /**
   * Setup global error handling for Firebase
   */
  private setupGlobalErrorHandling() {
    if (!this.isDevelopment) return;

    // Override window.addEventListener for unhandled promise rejections
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type: string, listener: any, options?: any) {
      if (type === 'unhandledrejection') {
        const wrappedListener = (event: PromiseRejectionEvent) => {
          if (FirebaseErrorHandler.getInstance().shouldSuppressError(event.reason)) {
            event.preventDefault();
            console.warn('🔥 Firebase error suppressed:', event.reason?.message || event.reason);
            return;
          }
          return listener(event);
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };

    // Setup console error filtering
    this.setupConsoleFiltering();
  }

  /**
   * Setup console error filtering
   */
  private setupConsoleFiltering() {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      const message = args.join(' ');
      
      if (this.shouldSuppressConsoleError(message)) {
        console.warn('🔥 Firebase connection issue (normal in development):', 
          this.truncateMessage(message));
        return;
      }

      originalError.apply(console, args);
    };
  }

  /**
   * Check if an error should be suppressed
   */
  public shouldSuppressError(error: any): boolean {
    if (!this.isDevelopment) return false;

    // Handle Firebase errors
    if (error instanceof FirebaseError) {
      return DEVELOPMENT_SAFE_ERRORS.includes(error.code);
    }

    // Handle network errors
    const errorMessage = error?.message || String(error);
    return NETWORK_ERROR_PATTERNS.some(pattern => 
      errorMessage.includes(pattern)
    );
  }

  /**
   * Check if a console error should be suppressed
   */
  private shouldSuppressConsoleError(message: string): boolean {
    if (!this.isDevelopment) return false;

    return NETWORK_ERROR_PATTERNS.some(pattern => 
      message.includes(pattern)
    ) || message.includes('firestore.googleapis.com');
  }

  /**
   * Truncate long error messages for cleaner console output
   */
  private truncateMessage(message: string, maxLength: number = 150): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  }

  /**
   * Handle Firebase operation with error suppression
   */
  public async handleFirebaseOperation<T>(
    operation: () => Promise<T>,
    context: string = 'Firebase operation'
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      if (this.shouldSuppressError(error)) {
        if (this.isDevelopment) {
          console.warn(`⚠️ ${context} failed (offline mode):`, 
            error instanceof FirebaseError ? error.code : error);
        }
        return null;
      }
      
      // Re-throw non-suppressed errors
      throw error;
    }
  }

  /**
   * Log development info
   */
  public logDevelopmentInfo() {
    if (!this.isDevelopment) return;

    console.info('🚀 Firebase Error Handler initialized');
    console.info('💡 Network errors are suppressed in development');
    console.info('🌐 App works offline with local storage');
  }
}

// Initialize the error handler
export const firebaseErrorHandler = FirebaseErrorHandler.getInstance();

// Export convenience functions
export const handleFirebaseOperation = firebaseErrorHandler.handleFirebaseOperation.bind(firebaseErrorHandler);
export const shouldSuppressError = firebaseErrorHandler.shouldSuppressError.bind(firebaseErrorHandler);