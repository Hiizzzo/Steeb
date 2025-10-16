import { useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useTaskStore } from '@/store/useTaskStore';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setupRealtimeListener, loadTasks } = useTaskStore();

  useEffect(() => {
    let unsubscribeListener: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        setError(null);

        if (user) {
          console.log('✅ Usuario autenticado:', user.uid);
          setUser(user);
          
          // Configurar listener en tiempo real para las tareas del usuario
          unsubscribeListener = setupRealtimeListener(user.uid);
          
          // Cargar tareas iniciales
          await loadTasks();
        } else {
          console.log('⚠️ Usuario no autenticado, iniciando sesión anónima...');
          
          // Iniciar sesión anónima automáticamente
          const userCredential = await signInAnonymously(auth);
          console.log('✅ Sesión anónima iniciada:', userCredential.user.uid);
          
          setUser(userCredential.user);
          
          // Configurar listener para el usuario anónimo
          unsubscribeListener = setupRealtimeListener(userCredential.user.uid);
          
          // Cargar tareas iniciales
          await loadTasks();
        }
      } catch (error) {
        console.error('❌ Error en autenticación:', error);
        setError(error instanceof Error ? error.message : 'Error de autenticación');
      } finally {
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      unsubscribeAuth();
      if (unsubscribeListener) {
        unsubscribeListener();
      }
    };
  }, [setupRealtimeListener, loadTasks]);

  const signOut = async () => {
    try {
      await auth.signOut();
      console.log('✅ Sesión cerrada exitosamente');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      setError(error instanceof Error ? error.message : 'Error al cerrar sesión');
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
    isAuthenticated: !!user
  };
};