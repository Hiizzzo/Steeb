import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserData {
  tipoUsuario: string;
  hasDarkVersion: boolean;
  categoria: string;
  email?: string;
  displayName?: string;
}

interface UserRole {
  role: 'free' | 'premium';
  permissions: string[];
  isPremium: boolean;
  tipoUsuario: string;
  userData: UserData | null;
}

/**
 * Hook unificado que lee DIRECTAMENTE de Firestore sin pasar por el backend
 * Reconoce tipoUsuario: "dark", "Dark", "Black", "Premium" como premium
 */
export const useUnifiedUserAccess = () => {
  const [userRole, setUserRole] = useState<UserRole>({
    role: 'free',
    permissions: [],
    isPremium: false,
    tipoUsuario: 'White',
    userData: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Mapear tipoUsuario de Firebase a role del sistema
  const mapTipoUsuarioToRole = (tipoUsuario: string): 'free' | 'premium' => {
    const premiumTypes = ['Black', 'Premium', 'black', 'premium', 'dark', 'Dark'];
    return premiumTypes.includes(tipoUsuario) ? 'premium' : 'free';
  };

  // Obtener permisos basados en tipoUsuario
  const getPermissions = (tipoUsuario: string, hasDarkVersion: boolean, userPermissions?: string[]): string[] => {
    // Si el usuario tiene permisos definidos en Firebase, usarlos
    if (userPermissions && userPermissions.length > 0) {
      return userPermissions;
    }

    // Sino, calcularlos basados en tipoUsuario
    const permissions: string[] = [];
    const premiumTypes = ['Black', 'Premium', 'black', 'premium', 'dark', 'Dark'];

    if (premiumTypes.includes(tipoUsuario) || hasDarkVersion) {
      permissions.push('dark_mode');
    }

    return permissions;
  };

  // Leer datos del usuario desde Firestore
  const loadUserData = async (userId: string) => {
    try {
      // console.log('🔍 Leyendo datos del usuario desde Firestore:', userId);

      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        // console.log('📊 Datos del usuario en Firestore:', userData);

        const tipoUsuario = userData.tipoUsuario || 'White';
        const hasDarkVersion = userData.hasDarkVersion || false;
        const userPermissions = (userData as any).permissions || [];
        const role = mapTipoUsuarioToRole(tipoUsuario);
        const permissions = getPermissions(tipoUsuario, hasDarkVersion, userPermissions);

        const roleData: UserRole = {
          role,
          permissions,
          isPremium: role === 'premium',
          tipoUsuario,
          userData
        };

        // console.log('✅ Rol calculado desde Firestore:', roleData);
        setUserRole(roleData);
        return roleData;
      } else {
        // console.log('⚠️ Usuario no existe en Firestore, usando valores por defecto');
        const defaultRole: UserRole = {
          role: 'free',
          permissions: [],
          isPremium: false,
          tipoUsuario: 'White',
          userData: null
        };
        setUserRole(defaultRole);
        return defaultRole;
      }
    } catch (error) {
      console.error('❌ Error leyendo datos del usuario desde Firestore:', error);
      const fallbackRole: UserRole = {
        role: 'free',
        permissions: [],
        isPremium: false,
        tipoUsuario: 'White',
        userData: null
      };
      setUserRole(fallbackRole);
      return fallbackRole;
    }
  };

  // Escuchar cambios en tiempo real
  useEffect(() => {
    const auth = getAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Cargar datos iniciales
        await loadUserData(currentUser.uid);

        // Escuchar cambios en tiempo real
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data() as UserData;
            // console.log('🔄 Cambio detectado en Firestore:', userData);

            const tipoUsuario = userData.tipoUsuario || 'White';
            const hasDarkVersion = userData.hasDarkVersion || false;
            const userPermissions = (userData as any).permissions || [];
            const role = mapTipoUsuarioToRole(tipoUsuario);
            const permissions = getPermissions(tipoUsuario, hasDarkVersion, userPermissions);

            const roleData: UserRole = {
              role,
              permissions,
              isPremium: role === 'premium',
              tipoUsuario,
              userData
            };

            // console.log('✅ Rol actualizado en tiempo real:', roleData);
            setUserRole(roleData);
          }
        });

        setIsLoading(false);

        // Cleanup del listener de Firestore
        return () => unsubscribeFirestore();
      } else {
        // Usuario no autenticado
        setUserRole({
          role: 'free',
          permissions: [],
          isPremium: false,
          tipoUsuario: 'White',
          userData: null
        });
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Refrescar datos manualmente
  const refreshUserData = async () => {
    if (user?.uid) {
      setIsLoading(true);
      await loadUserData(user.uid);
      setIsLoading(false);
    }
  };

  // Determinar acceso a modos
  const hasDarkAccess = userRole.isPremium || userRole.permissions.includes('dark_mode');
  const hasShinyAccess = userRole.permissions.includes('shiny_game');
  const currentRole = userRole.isPremium ? 'premium' : 'free';

  // Puede comprar el modo Dark?
  const canBuyDarkMode = !hasDarkAccess && currentRole === 'free';

  // Puede comprar tiradas Shiny?
  const canBuyShinyRolls = hasDarkAccess && !hasShinyAccess;

  return {
    // Usuario actual
    user,
    userData: userRole.userData,

    // Acceso a modos
    hasDarkAccess,
    hasShinyAccess,

    // Estado del rol
    currentRole,
    userRole,
    tipoUsuario: userRole.tipoUsuario,
    isLoading,

    // Permisos de compra
    canBuyDarkMode,
    canBuyShinyRolls,

    // Métodos
    refreshUserData,
    loadUserData,
  };
};
