import { useUserCredits } from './useUserCredits';
import { useUserRole } from './useUserRole';

/**
 * Hook unificado que combina el sistema de créditos y roles
 * para determinar el acceso real del usuario a las funcionalidades
 */
export const useUnifiedUserAccess = () => {
  const { userCredits } = useUserCredits();
  const { userProfile, canUseMode } = useUserRole();

  // Determinar acceso real al modo Dark
  // Prioridad: 1) Rol real, 2) Sistema de créditos (fallback)
  const hasDarkAccess = canUseMode('dark') || userProfile?.role === 'dark' || userCredits.hasDarkVersion;

  // Determinar acceso real al modo Shiny
  const hasShinyAccess = canUseMode('shiny') || userProfile?.role === 'shiny';

  // Rol actual del usuario
  const currentRole = userProfile?.role || 'white';

  // Puede comprar el modo Dark?
  const canBuyDarkMode = !hasDarkAccess && currentRole === 'white';

  // Puede comprar tiradas Shiny?
  const canBuyShinyRolls = hasDarkAccess && !hasShinyAccess;

  return {
    // Acceso a modos
    hasDarkAccess,
    hasShinyAccess,

    // Estado del rol
    currentRole,
    userProfile,

    // Permisos de compra
    canBuyDarkMode,
    canBuyShinyRolls,

    // Sistema de créditos (para compatibilidad)
    userCredits,

    // Métodos de verificación unificados
    canUseMode,
  };
};