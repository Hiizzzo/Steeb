import React, { useState, useEffect, createContext, useContext } from 'react';
import { auth, db, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import { useTaskStore } from '@/store/useTaskStore';
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
  linkWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
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
import { UserRole } from '@/types/user';

export interface User {
  id: string;
  email: string;
  name: string;
  nickname: string;
  avatar?: string;
  provider: 'google' | 'manual';
  createdAt: string;
  emailVerified: boolean;
  role: UserRole;
  shinyRolls?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (forceAccountPicker?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, nickname: string) => Promise<void>;
  hasPasswordProvider: () => boolean;
  linkEmailPassword: (password: string) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapFirebaseUserToUser = async (fbUser: FirebaseUser): Promise<User> => {
  const ref = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() as any : {};

  // Si el usuario es nuevo, asignar rol WHITE por defecto
  const userRole: UserRole = data.role || 'white';

  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: data.name || '',
    nickname: data.nickname || '',
    avatar: fbUser.photoURL || data.avatar,
    provider: (fbUser.providerData?.some(p => (p?.providerId || '').includes('google')) ? 'google' : 'manual'),
    createdAt: (data.createdAt?.toDate?.() || new Date()).toISOString(),
    emailVerified: !!fbUser.emailVerified,
    role: userRole,
    shinyRolls: data.shinyRolls || 0,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setupRealtimeListener, loadTasks } = useTaskStore();

  // Configurar persistencia local al iniciar
  useEffect(() => {
    const configurePersistence = async () => {
      if (!isFirebaseConfigured) return;
      
      try {
        await setPersistence(auth, browserLocalPersistence);
        ('🔄 Persistencia local configurada correctamente');
      } catch (error) {
        console.warn('⚠️ Error configurando persistencia:', error);
      }
    };

    configurePersistence();
  }, []);

  useEffect(() => {
    let unsubscribeTaskListener: (() => void) | null = null;
    
    if (!isFirebaseConfigured) {
      ('🔄 Firebase no configurado');
      setUser(null);
      setIsLoading(false);
      return;
    }
    
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setIsLoading(false);
        // Limpiar listener de tareas si existe
        if (unsubscribeTaskListener) {
          unsubscribeTaskListener();
          unsubscribeTaskListener = null;
        }
        return;
      }
      
      // Set estado rápido con datos mínimos para no bloquear el primer render
      setUser({
        id: fbUser.uid,
        email: fbUser.email || '',
        name: '',
        nickname: '',
        avatar: fbUser.photoURL || undefined,
        provider: (fbUser.providerData?.some(p => (p?.providerId || '').includes('google')) ? 'google' : 'manual'),
        createdAt: new Date().toISOString(),
        emailVerified: !!fbUser.emailVerified,
      });
      setIsLoading(false);
      
      // Configurar listener de tareas en tiempo real
      ('🔄 Configurando listener de tareas para usuario:', fbUser.uid);
      unsubscribeTaskListener = setupRealtimeListener(fbUser.uid);
      
      // Cargar tareas iniciales
      try {
        await loadTasks();
      } catch (error) {
        console.error('❌ Error cargando tareas iniciales:', error);
      }
      
      // Completar datos desde Firestore en segundo plano
      try {
        const mapped = await mapFirebaseUserToUser(fbUser);
        setUser(mapped);
      } catch {
        // si falla Firestore, dejamos el estado rápido ya mostrado
      }
    });
    
    return () => {
      unsub();
      if (unsubscribeTaskListener) {
        unsubscribeTaskListener();
      }
    };
  }, [setupRealtimeListener, loadTasks]);

  // Manejar resultado de Google Sign-In por redirect (para móvil nativo)
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    // Solo intentamos resolver redirect una vez al inicio
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          // Asegurar documento de usuario en Firestore solo si hay permisos
          const uid = result.user.uid;
          try {
            const ref = doc(db, 'users', uid);
            const snap = await getDoc(ref);
            if (!snap.exists()) {
              await setDoc(ref, {
                email: result.user.email,
                name: '',
                nickname: '',
                avatar: result.user.photoURL,
                provider: 'google',
                ownerUid: uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          } catch (firestoreError) {
            console.warn('⚠️ Error creando documento de usuario, continuando offline:', firestoreError);
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

  const loginWithGoogle = async (forceAccountPicker: boolean = false) => {
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
          const uid = resCred.user.uid;
          const ref = doc(db, 'users', uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              email: resCred.user.email,
              name: '',
              nickname: '',
              avatar: resCred.user.photoURL,
              provider: 'google',
              ownerUid: uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          return;
        }
        
        // Para iOS, si el plugin no está disponible, usar redirect con configuración específica
        if (Capacitor.getPlatform() === 'ios') {
          ('🍎 iOS: Usando signInWithRedirect para Google Auth');
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        
        // Para Android, intentar redirect como fallback
        ('🤖 Android: Usando signInWithRedirect como fallback');
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch (error) {
        console.error('❌ Error en autenticación nativa:', error);
        
        // Para iOS, mostrar error específico y sugerir solución
        if (Capacitor.getPlatform() === 'ios') {
          throw new Error('Para usar Google Sign-In en iOS, instala el plugin de Google Sign-In nativo. Mientras tanto, usa Email/Contraseña.');
        }
        
        // Último recurso: intentar redirect
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          throw new Error('No se pudo autenticar con Google. Por favor, usa Email/Contraseña.');
        }
      }
    }
    
    // En web, usar popup
    // Si forceAccountPicker es true, crear un nuevo provider para forzar el selector
    const provider = forceAccountPicker ? new GoogleAuthProvider() : googleProvider;

    // Forzar que muestre el selector de cuentas si se solicita
    if (forceAccountPicker) {
      provider.setCustomParameters({
        prompt: 'select_account'
      });
    }

    const res = await signInWithPopup(auth, provider);
    // Ensure user doc exists
    const uid = res.user.uid;
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        email: res.user.email,
        name: '',
        nickname: '',
        avatar: res.user.photoURL,
        provider: 'google',
        ownerUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const register = async (email: string, password: string, name: string, nickname: string) => {
    ensureConfigured();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    const ref = doc(db, 'users', uid);
    try {
      await setDoc(ref, {
        email,
        name,
        nickname,
        avatar: cred.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        provider: 'manual',
        ownerUid: uid,
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
        // No permitir modificar ownerUid en actualizaciones
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

  const linkGoogleAccount = async () => {
    ensureConfigured();
    const current = auth.currentUser;
    if (!current) throw new Error('No hay usuario autenticado');
    // Si ya está vinculado Google, no hacer nada
    const already = current.providerData?.some(p => (p?.providerId || '').includes('google'));
    if (already) return;

    // Nativo: intentar plugin; Web: popup
    if (Capacitor.isNativePlatform()) {
      try {
        const Google: any = (globalThis as any)?.Capacitor?.Plugins?.GoogleAuth || (globalThis as any)?.Capacitor?.Plugins?.Google;
        if (Google?.signIn) {
          try { await Google.initialize?.(); } catch {}
          const gRes = await Google.signIn();
          const idToken = gRes?.authentication?.idToken || gRes?.idToken;
          if (!idToken) throw new Error('No se obtuvo idToken de Google');
          const credential = GoogleAuthProvider.credential(idToken);
          await linkWithCredential(current, credential);
        } else {
          throw new Error('Plugin de Google no disponible');
        }
      } catch (e) {
        // Si falla nativo, no forzar redirect aquí para no romper la sesión; el usuario puede probar en web
        throw e as any;
      }
    } else {
      await linkWithPopup(current, googleProvider);
    }

    // Refrescar estado de usuario y asegurar doc en Firestore
    const refreshed = auth.currentUser as FirebaseUser;
    const uid = refreshed.uid;
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        email: refreshed.email,
        name: '',
        nickname: '',
        avatar: refreshed.photoURL,
        provider: 'google',
        ownerUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    // Actualizar provider en estado local
    setUser(prev => prev ? { ...prev, provider: 'google' } : prev);
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
    linkGoogleAccount,
  };

  return React.createElement(AuthContext.Provider, { value }, children as any);
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export { AuthContext };
