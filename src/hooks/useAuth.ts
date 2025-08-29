import React, { useState, useEffect, createContext, useContext } from 'react';
import { auth, db, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';

export interface User {
  id: string;
  email: string;
  name: string;
  nickname: string;
  avatar?: string;
  provider: 'google' | 'manual';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, nickname: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapFirebaseUserToUser = async (fbUser: FirebaseUser): Promise<User> => {
  const ref = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() as any : {};
  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: data.name || '',
    nickname: data.nickname || '',
    avatar: fbUser.photoURL || data.avatar,
    provider: (fbUser.providerData?.[0]?.providerId?.includes('google') ? 'google' : 'manual'),
    createdAt: (data.createdAt?.toDate?.() || new Date()).toISOString(),
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Sin configuración: no intentes suscribirte a Auth
      setUser(null);
      setIsLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          const mapped = await mapFirebaseUserToUser(fbUser);
          setUser(mapped);
        } else {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Manejar resultado de Google Sign-In por redirect (para móvil nativo)
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    // Solo intentamos resolver redirect una vez al inicio
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          // Asegurar documento de usuario en Firestore
          const ref = doc(db, 'users', result.user.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              email: result.user.email,
              name: '',
              nickname: '',
              avatar: result.user.photoURL,
              provider: 'google',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (e) {
        // Silencioso: si no hay redirect pendiente, Firebase lanza null
      }
    })();
  }, []);

  const ensureConfigured = () => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase no está configurado. Completa .env y reinicia el servidor.');
    }
  };

  const login = async (email: string, password: string) => {
    ensureConfigured();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    ensureConfigured();
    // En plataformas nativas (Capacitor Android/iOS), usar redirect
    if (Capacitor.isNativePlatform()) {
      await signInWithRedirect(auth, googleProvider);
      return; // El flujo continúa tras el redirect y se maneja en useEffect
    }
    // En web, usar popup
    const res = await signInWithPopup(auth, googleProvider);
    // Ensure user doc exists
    const ref = doc(db, 'users', res.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        email: res.user.email,
        name: '',
        nickname: '',
        avatar: res.user.photoURL,
        provider: 'google',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const register = async (email: string, password: string, name: string, nickname: string) => {
    ensureConfigured();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const ref = doc(db, 'users', cred.user.uid);
    await setDoc(ref, {
      email,
      name,
      nickname,
      avatar: cred.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      provider: 'manual',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const logout = async () => {
    ensureConfigured();
    await signOut(auth);
  };

  const updateProfile = async (name: string, nickname: string) => {
    ensureConfigured();
    if (!auth.currentUser) return;
    const ref = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(ref, { name, nickname, updatedAt: serverTimestamp() });
    // Refresh local user state
    const mapped = await mapFirebaseUserToUser(auth.currentUser);
    setUser(mapped);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
  };

  return React.createElement(AuthContext.Provider, { value }, children as any);
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export { AuthContext };
