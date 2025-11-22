import { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useFirebaseRoleCheck = () => {
  const [userRole, setUserRole] = useState<'free' | 'premium'>('free');
  const [tipoUsuario, setTipoUsuario] = useState<'white' | 'black' | 'shiny'>('white');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Verificar rol del usuario directamente desde Firebase
  const checkUserRole = useCallback(async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log('❌ No hay usuario autenticado');
      setUserRole('free');
      return 'free';
    }

    console.log('🔍 Verificando rol en Firebase para usuario:', currentUser.uid);
    setIsLoading(true);
    setError(null);

    try {
      // Referencia al documento del usuario en Firebase
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData?.role || 'free';
        const userTheme = userData?.tipoUsuario || 'white';

        console.log('📋 Rol encontrado en Firebase:', role);
        console.log('🎨 Tipo de usuario encontrado:', userTheme);
        console.log('📧 Email usuario:', userData.email);
        console.log('👤 UID usuario:', currentUser.uid);
        console.log('📄 Datos completos:', JSON.stringify(userData, null, 2));

        setUserRole(role);
        setTipoUsuario(userTheme);
        setIsLoading(false);
        return role;
      } else {
        console.log('⚠️ Usuario no existe en Firebase');
        // Solo lectura - no crear documentos automáticamente
        setUserRole('free');
        setTipoUsuario('white');
        setIsLoading(false);
        return 'free';
      }
    } catch (error) {
      console.error('❌ Error verificando rol en Firebase:', error);
      setError('Error al verificar el rol del usuario');
      setUserRole('free');
      setTipoUsuario('white');
      setIsLoading(false);
      return 'free';
    }
  }, []);

  // Escuchar cambios en tiempo real del rol del usuario
  useEffect(() => {
    const auth = getAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        console.log('👤 Usuario autenticado:', currentUser.uid);

        // Escuchar cambios en el documento del usuario
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            const newRole = userData?.role || 'free';
            const newTipoUsuario = userData?.tipoUsuario || 'white';

            if (newRole !== userRole) {
              console.log('🔄 Cambio de rol detectado:', userRole, '→', newRole);
              setUserRole(newRole);

              // Enviar evento de cambio de rol
              window.dispatchEvent(new CustomEvent('role-changed', {
                detail: {
                  userId: currentUser.uid,
                  oldRole: userRole,
                  newRole: newRole,
                  timestamp: new Date()
                }
              }));
            }

            if (newTipoUsuario !== tipoUsuario) {
              console.log('🎨 Cambio de tipo de usuario detectado:', tipoUsuario, '→', newTipoUsuario);
              setTipoUsuario(newTipoUsuario);
            }
          }
        }, (error) => {
          console.error('❌ Error escuchando cambios de rol:', error);
        });

        return () => {
          unsubscribeUser();
        };
      } else {
        console.log('❌ No hay usuario autenticado');
        setUserRole('free');
        setTipoUsuario('white');
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [userRole, tipoUsuario]);

  // Verificar manualmente
  const forceCheck = useCallback(() => {
    console.log('🔄 Forzando verificación manual...');
    return checkUserRole();
  }, [checkUserRole]);

  return {
    userRole,
    tipoUsuario,
    isLoading,
    error,
    user,
    isPremium: userRole === 'premium',
    checkUserRole,
    forceCheck
  };
};