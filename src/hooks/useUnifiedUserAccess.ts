import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { apiClient } from '@/api/client';

interface UserRole {
  role: 'free' | 'premium';
  permissions: string[];
  isPremium: boolean;
}

/**
 * Hook unificado que se conecta con Firebase y el backend
 * para determinar el acceso real del usuario a las funcionalidades
 */
export const useUnifiedUserAccess = () => {
  const [userRole, setUserRole] = useState<UserRole>({
    role: 'free',
    permissions: [],
    isPremium: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Verificar rol del usuario con el backend
  const checkUserRole = async (userId: string) => {
    try {
      const response = await apiClient.get(`/users/role?userId=${userId}`);

      if (response.success && response.data) {
        const roleData = {
          role: response.data.role || 'free',
          permissions: response.data.permissions || [],
          isPremium: response.data.role === 'premium'
        };
        setUserRole(roleData);
        return roleData;
      } else {
        // Fallback a free si hay error
        const fallbackRole = { role: 'free' as const, permissions: [], isPremium: false };
        setUserRole(fallbackRole);
        return fallbackRole;
      }
    } catch (error) {
      console.error('❌ Error verificando rol del usuario:', error);

      // Si el apiClient falla, intentar con fetch directo
      try {
        console.log('🔄 Intentando verificar rol con fetch directo...');
        const apiBaseUrl = 'https://v0-steeb-api-backend.vercel.app/api';

        const fetchResponse = await fetch(`${apiBaseUrl}/users/role?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors'
        });

        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
        }

        const data = await fetchResponse.json();

        if (data.success && data.data) {
          const roleData = {
            role: data.data.role || 'free',
            permissions: data.data.permissions || [],
            isPremium: data.data.role === 'premium'
          };
          setUserRole(roleData);
          console.log('✅ Rol verificado con fetch directo:', roleData);
          return roleData;
        }
      } catch (fetchError) {
        console.error('❌ Error con fetch directo al verificar rol:', fetchError);
      }

      // Fallback final
      const fallbackRole = { role: 'free' as const, permissions: [], isPremium: false };
      setUserRole(fallbackRole);
      return fallbackRole;
    }
  };

  // Esperar activación de premium (post-pago)
  const waitForActivation = async (userId: string, maxAttempts = 10) => {
    setIsLoading(true);

    for (let i = 0; i < maxAttempts; i++) {
      const roleData = await checkUserRole(userId);

      if (roleData.isPremium) {
        setIsLoading(false);
        return roleData; // ✅ Usuario ahora es premium
      }

      // Esperar 3 segundos entre intentos
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    setIsLoading(false);
    throw new Error('Tiempo de espera agotado para activación premium');
  };

  // Determinar acceso a modos basado en el rol
  const hasDarkAccess = userRole.isPremium || userRole.permissions.includes('dark_mode');
  const hasShinyAccess = userRole.permissions.includes('shiny_game');
  const currentRole = userRole.isPremium ? 'premium' : 'free';

  // Puede comprar el modo Dark?
  const canBuyDarkMode = !hasDarkAccess && currentRole === 'free';

  // Puede comprar tiradas Shiny?
  const canBuyShinyRolls = hasDarkAccess && !hasShinyAccess;

  // Verificar permisos específicos
  const canUseMode = (mode: string) => {
    return userRole.permissions.includes(mode) || (mode === 'dark' && hasDarkAccess);
  };

  // Efecto para escuchar cambios de autenticación
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        await checkUserRole(currentUser.uid);
      } else {
        // Usuario no autenticado
        setUserRole({ role: 'free', permissions: [], isPremium: false });
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    // Usuario actual
    user,

    // Acceso a modos
    hasDarkAccess,
    hasShinyAccess,

    // Estado del rol
    currentRole,
    userRole,
    isLoading,

    // Permisos de compra
    canBuyDarkMode,
    canBuyShinyRolls,

    // Métodos de verificación
    checkUserRole,
    waitForActivation,
    canUseMode,
  };
};