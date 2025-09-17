import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { handleFirebaseOperation } from './firebaseErrorHandler';

const fallbackCfg = {
  apiKey: 'AIzaSyBVP5QdGUTyas4Pqh5_HSktQx91iDn3G4E',
  authDomain: 'steeb-b3489.firebaseapp.com',
  projectId: 'steeb-b3489',
  storageBucket: 'steeb-b3489.firebasestorage.app',
  messagingSenderId: '293062715609',
  appId: '1:293062715609:web:25e679164f01e6f10b36c8',
  measurementId: 'G-FH663ZE04Y',
};

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackCfg.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackCfg.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackCfg.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackCfg.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackCfg.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackCfg.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || fallbackCfg.measurementId,
};

// FIREBASE ENABLED FOR PRODUCTION
export const isFirebaseConfigured = Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);

let app: any;
let auth: any;
let db: any;
let googleProvider: any;

// Initialize Firebase (HMR-safe)
const initializeFirebase = async () => {
  return handleFirebaseOperation(async () => {
    app = isFirebaseConfigured ? (getApps().length ? getApps()[0] : initializeApp(cfg)) : undefined;

    auth = isFirebaseConfigured ? getAuth(app) : undefined;

    // Prefer initializeFirestore with robust transport settings to avoid ERR_ABORTED on some networks/devices
    if (isFirebaseConfigured) {
      try {
        db = initializeFirestore(app, {
          experimentalAutoDetectLongPolling: true,
          experimentalForceLongPolling: true,
          useFetchStreams: false,
          ignoreUndefinedProperties: true,
        } as any);
      } catch (e) {
        // Fallback if Firestore was already initialized elsewhere
        db = getFirestore(app);
      }
    } else {
      db = undefined;
    }

    googleProvider = isFirebaseConfigured ? new GoogleAuthProvider() : undefined;

    // Debug: log resolved projectId to detect mismatches across environments
    try {
      console.log('[Firebase] Initialized with projectId:', cfg.projectId);
    } catch {}

    return { app, auth, db, googleProvider };
  }, 'Firebase initialization');
};

// Initialize Firebase once
initializeFirebase().catch(() => {
  app = undefined;
  auth = undefined;
  db = undefined;
  googleProvider = undefined;
});

export { auth, db, googleProvider };
