import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// Initialize only once (Vite HMR safe) when configured
const app = isFirebaseConfigured
  ? (getApps().length ? getApps()[0] : initializeApp(cfg))
  : undefined as any;

export const auth = isFirebaseConfigured ? getAuth(app) : undefined as any;
export const db = isFirebaseConfigured ? getFirestore(app) : undefined as any;
export const googleProvider = isFirebaseConfigured ? new GoogleAuthProvider() : undefined as any;
