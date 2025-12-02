// Firebase config adaptado para Expo/Hermes
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const fallbackConfig = {
  apiKey: 'AIzaSyBK5ZvLacIcP1PTKOJJZue1PoMyQrUtRLw',
  authDomain: 'steeboriginal.firebaseapp.com',
  projectId: 'steeboriginal',
  storageBucket: 'steeboriginal.appspot.com',
  messagingSenderId: '169523533903',
  appId: '1:169523533903:web:daa8f32c4e1c3b98aab23a',
};

// Función segura para obtener variables de entorno
const getEnvVar = (key, fallback) => {
  try {
    // Intentar con process.env (para compatibilidad)
    if (typeof process !== 'undefined' && process.env[key]) {
      return process.env[key];
    }
    // Fallback a import.meta solo si está disponible
    if (typeof import.meta !== 'undefined' && import.meta.env[key]) {
      return import.meta.env[key];
    }
    return fallback;
  } catch (error) {
    console.warn(`Error getting ${key}:`, error);
    return fallback;
  }
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', fallbackConfig.apiKey),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', fallbackConfig.authDomain),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', fallbackConfig.projectId),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', fallbackConfig.storageBucket),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', fallbackConfig.messagingSenderId),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', fallbackConfig.appId),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID', undefined),
};

let app;
let auth;
let db;
let googleProvider;

export const initializeFirebase = () => {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: true,
        useFetchStreams: false,
      });
      googleProvider = new GoogleAuthProvider();
    }
    return { app, auth, db, googleProvider };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return { app: null, auth: null, db: null, googleProvider: null };
  }
};

export const isFirebaseConfigured = () => {
  return !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
};

export { auth, db, googleProvider };