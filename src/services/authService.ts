import { auth } from "@/lib/firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  setPersistence, 
  browserLocalPersistence,
  User as FirebaseUser
} from "firebase/auth";

/**
 * Inicia sesión con Google usando popup
 * @returns Promise<FirebaseUser> - Usuario autenticado
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    // Configurar persistencia local para mantener la sesión
    await setPersistence(auth, browserLocalPersistence);
    
    const provider = new GoogleAuthProvider();
    // Agregar scopes adicionales si es necesario
    provider.addScope('email');
    provider.addScope('profile');
    
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Error en signInWithGoogle:', error);
    throw error;
  }
}

/**
 * Cierra la sesión del usuario actual
 * @returns Promise<void>
 */
export async function signOutApp(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error en signOutApp:', error);
    throw error;
  }
}

/**
 * Escucha cambios en el estado de autenticación
 * @param cb - Callback que se ejecuta cuando cambia el estado de autenticación
 * @returns Function - Función para cancelar la suscripción
 */
export function onAuth(cb: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

/**
 * Verifica si hay un usuario autenticado actualmente
 * @returns FirebaseUser | null - Usuario actual o null si no está autenticado
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Espera a que el estado de autenticación se resuelva
 * @returns Promise<FirebaseUser | null> - Usuario actual o null
 */
export function waitForAuthState(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Obtiene el token ID del usuario actual (útil para APIs backend)
 * @param forceRefresh - Forzar la renovación del token
 * @returns Promise<string | null> - Token ID o null si no hay usuario
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error('Error obteniendo ID token:', error);
    return null;
  }
}