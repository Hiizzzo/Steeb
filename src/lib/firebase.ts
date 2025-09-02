import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { handleFirebaseOperation } from './firebaseErrorHandler';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId
);

// Firebase error handling is now managed by firebaseErrorHandler

// Initialize only once (Vite HMR safe) when configured
let app: any;
let auth: any;
let db: any;
let googleProvider: any;

// Initialize Firebase with enhanced error handling
const initializeFirebase = async () => {
  return handleFirebaseOperation(async () => {
    app = isFirebaseConfigured
      ? (getApps().length ? getApps()[0] : initializeApp(cfg))
      : undefined;

    auth = isFirebaseConfigured ? getAuth(app) : undefined;
    db = isFirebaseConfigured ? getFirestore(app) : undefined;
    googleProvider = isFirebaseConfigured ? new GoogleAuthProvider() : undefined;

    // Enable offline persistence for better local development experience
    if (db && import.meta.env.DEV) {
      // This will help with offline functionality during development
      const { enableNetwork, disableNetwork } = await import('firebase/firestore');
      
      // Handle network state changes gracefully
      window.addEventListener('online', () => {
        handleFirebaseOperation(() => enableNetwork(db), 'Enable Firestore network');
      });
      
      window.addEventListener('offline', () => {
        handleFirebaseOperation(() => disableNetwork(db), 'Disable Firestore network');
      });
    }

    return { app, auth, db, googleProvider };
  }, 'Firebase initialization');
};

// Initialize Firebase
initializeFirebase().catch(() => {
  // Fallback to undefined values if initialization fails
  app = undefined;
  auth = undefined;
  db = undefined;
  googleProvider = undefined;
});

export { auth, db, googleProvider };
