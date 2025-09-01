import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

export const isFirebaseConfigured = Boolean(
  cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId
);

// Initialize only once (Vite HMR safe) when configured
const app = isFirebaseConfigured
  ? (getApps().length ? getApps()[0] : initializeApp(cfg))
  : undefined as any;

export const auth = isFirebaseConfigured ? getAuth(app) : undefined as any;
export const db = isFirebaseConfigured ? getFirestore(app) : undefined as any;
export const googleProvider = isFirebaseConfigured ? new GoogleAuthProvider() : undefined as any;
