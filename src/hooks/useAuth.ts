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
  linkWithCredential,
  EmailAuthProvider,
  signInWithCredential,
  GoogleAuthProvider,
  sendEmailVerification,
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
  emailVerified: boolean;
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
  hasPasswordProvider: () => boolean;
  linkEmailPassword: (password: string) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
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
    emailVerified: !!fbUser.emailVerified,
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
      if (!fbUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      // Set estado rápido con datos mínimos para no bloquear el primer render
      setUser({
        id: fbUser.uid,
        email: fbUser.email || '',
        name: '',
        nickname: '',
        avatar: fbUser.photoURL || undefined,
        provider: (fbUser.providerData?.[0]?.providerId?.includes('google') ? 'google' : 'manual'),
        createdAt: new Date().toISOString(),
        emailVerified: !!fbUser.emailVerified,
      });
      setIsLoading(false);
      // Completar datos desde Firestore en segundo plano
      try {
        const mapped = await mapFirebaseUserToUser(fbUser);
        setUser(mapped);
      } catch {
        // si falla Firestore, dejamos el estado rápido ya mostrado
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
    // En plataformas nativas (Capacitor Android/iOS), intentar flujo nativo
    if (Capacitor.isNativePlatform()) {
      try {
        // Intentar usar el plugin nativo si está registrado en Capacitor
        const Google: any = (globalThis as any)?.Capacitor?.Plugins?.GoogleAuth || (globalThis as any)?.Capacitor?.Plugins?.Google;
        if (Google?.signIn) {
          // Inicialización opcional (no falla si no es necesaria)
          try {
            await Google.initialize();
          } catch {}
          const gRes = await Google.signIn();
          const idToken = gRes?.authentication?.idToken || gRes?.idToken;
          if (!idToken) throw new Error('No se obtuvo idToken de Google');
          const credential = GoogleAuthProvider.credential(idToken);
          const resCred = await signInWithCredential(auth, credential);
          // Ensure user doc exists
          const ref = doc(db, 'users', resCred.user.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              email: resCred.user.email,
              name: '',
              nickname: '',
              avatar: resCred.user.photoURL,
              provider: 'google',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          return;
        }
        // Si el plugin no está disponible, caemos a redirect (puede fallar en iOS WebView)
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch (e) {
        // Último recurso en nativo: intentar redirect
        await signInWithRedirect(auth, googleProvider);
        return;
      }
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
    try {
      await setDoc(ref, {
        email,
        name,
        nickname,
        avatar: cred.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        provider: 'manual',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      // No bloquear el registro si falla Firestore (p.ej., reglas). El onboarding podrá completar el perfil.
      console.warn('No se pudo crear el perfil en Firestore, pero el usuario fue creado en Auth.', e);
    }
    // Enviar correo de verificación al nuevo usuario
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn('No se pudo enviar el email de verificación.', e);
    }
  };

  const logout = async () => {
    ensureConfigured();
    await signOut(auth);
  };

  const updateProfile = async (name: string, nickname: string) => {
    ensureConfigured();
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    // Optimistic update: reflejar cambios al instante
    setUser(prev => prev ? { ...prev, name, nickname } : prev);
    // Persistir en background sin bloquear
    (async () => {
      try {
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, { name, nickname, updatedAt: serverTimestamp() });
      } catch (e) {
        // Si falla, mantén el estado local; se puede reintentar luego
        console.warn('No se pudo guardar el perfil en Firestore ahora mismo.', e);
      }
    })();
  };

  const hasPasswordProvider = () => {
    const providers = auth.currentUser?.providerData || [];
    return providers.some(p => p.providerId === 'password');
  };

  const linkEmailPassword = async (password: string) => {
    ensureConfigured();
    const current = auth.currentUser;
    if (!current) throw new Error('No hay usuario autenticado');
    const email = current.email;
    if (!email) throw new Error('Tu cuenta de Google no tiene email disponible');
    if (hasPasswordProvider()) return; // ya vinculado, no hacer nada
    const cred = EmailAuthProvider.credential(email, password);
    await linkWithCredential(current, cred);
  };

  const resendEmailVerification = async () => {
    ensureConfigured();
    if (!auth.currentUser) throw new Error('No hay usuario autenticado');
    await sendEmailVerification(auth.currentUser);
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
    hasPasswordProvider,
    linkEmailPassword,
    resendEmailVerification,
  };

  return React.createElement(AuthContext.Provider, { value }, children as any);
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export { AuthContext };
