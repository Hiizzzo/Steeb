// @ts-nocheck
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';
import { ROLE_PERMISSIONS } from '@/types/user';

export type Theme = 'light' | 'dark' | 'shiny';

export const useThemeWithPermissions = () => {
  const { user } = useAuth();
  const { canUseMode, getRoleInfo } = useUserRole();
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Obtener tema inicial según permisos del usuario
  const getInitialTheme = useCallback((): Theme => {
    if (typeof window === 'undefined') return 'light';

    const savedTheme = localStorage.getItem('stebe-theme') as Theme;
    const root = document.documentElement;

    // Verificar qué tema está actualmente aplicado
    const hasDarkClass = root.classList.contains('dark');
    const hasShinyClass = root.classList.contains('shiny');

    if (hasShinyClass && canUseMode('shiny')) return 'shiny';
    if (hasDarkClass && canUseMode('dark')) return 'dark';
    if (hasShinyClass && !canUseMode('shiny')) {
      // Usuario no puede usar shiny, cambiar a dark si puede, sino a light
      return canUseMode('dark') ? 'dark' : 'light';
    }
    if (hasDarkClass && !canUseMode('dark')) {
      // Usuario no puede usar dark, cambiar a light
      return 'light';
    }

    // Verificar tema guardado
    if (savedTheme && canUseMode(savedTheme)) {
      return savedTheme;
    }

    // Si el tema guardado no está permitido, usar el mejor permitido
    if (canUseMode('dark')) return 'dark';
    return 'light';
  }, [canUseMode]);

  // Cambiar tema con validación de permisos
  const changeTheme = useCallback((theme: Theme) => {
    if (!canUseMode(theme)) {
      const roleInfo = getRoleInfo();
      let errorMessage = '';

      switch (theme) {
        case 'dark':
          errorMessage = 'Para usar el modo Dark, necesitas ser usuario Dark o Shiny. ¡Hacé upgrade tu cuenta!';
          break;
        case 'shiny':
          if (roleInfo?.shinyRollsAvailable && roleInfo.shinyRollsAvailable > 0) {
            errorMessage = 'Tenés tiradas shiny disponibles! ¡Usá una para activar este modo por tiempo limitado!';
          } else {
            errorMessage = 'Para usar el modo Shiny, comprá tiradas o hacé upgrade a usuario Shiny. ¡Activá el modo Shiny temporal!';
          }
          break;
        default:
          errorMessage = 'Modo no disponible para tu tipo de usuario.';
      }

      throw new Error(errorMessage);
    }

    setIsTransitioning(true);
    const root = document.documentElement;

    // Aplicar transición suave
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease';

    // Remover todas las clases de tema
    root.classList.remove('light', 'dark', 'shiny');

    // Aplicar nueva clase
    root.classList.add(theme);

    // Guardar en localStorage
    localStorage.setItem('stebe-theme', theme);

    // Actualizar estado
    setCurrentTheme(theme);

    setTimeout(() => {
      setIsTransitioning(false);
      root.style.transition = '';
    }, 300);
  }, [canUseMode, getRoleInfo]);

  // Usar tirada shiny (consumir una tirada)
  const useShinyRoll = useCallback(async () => {
    const { useShinyRoll: consumeShinyRoll } = useUserRole();

    try {
      await consumeShinyRoll();

      // Activar modo shiny por tiempo limitado (ej: 1 hora)
      const shinyUntil = Date.now() + (60 * 60 * 1000); // 1 hora
      localStorage.setItem('shinyUntil', shinyUntil.toString());

      changeTheme('shiny');

      return true;
    } catch (error) {
      throw error;
    }
  }, [changeTheme]);

  // Verificar si el modo shiny está activo temporalmente por tirada
  const isTemporaryShinyActive = useCallback(() => {
    const shinyUntil = localStorage.getItem('shinyUntil');
    return shinyUntil ? parseInt(shinyUntil) > Date.now() : false;
  }, []);

  // Verificar si el modo shiny está disponible permanentemente
  const isShinyPermanentlyAvailable = useCallback(() => {
    return canUseMode('shiny');
  }, [canUseMode]);

  // Inicializar tema al montar
  useEffect(() => {
    if (user) {
      const initialTheme = getInitialTheme();
      changeTheme(initialTheme);
    }
  }, [user, getInitialTheme, changeTheme]);

  // Verificar periódicamente si la tirada shiny expiró
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTemporaryShinyActive() && !isShinyPermanentlyAvailable()) {
        const shinyUntil = localStorage.getItem('shinyUntil');
        if (shinyUntil && parseInt(shinyUntil) <= Date.now()) {
          // La tirada shiny expiró, volver al mejor modo disponible
          localStorage.removeItem('shinyUntil');
          changeTheme(canUseMode('dark') ? 'dark' : 'light');
        }
      }
    }, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, [isTemporaryShinyActive, isShinyPermanentlyAvailable, canUseMode, changeTheme]);

  // Obtener información de acceso
  const getAccessInfo = useCallback(() => {
    const roleInfo = getRoleInfo();
    if (!roleInfo) return null;

    return {
      currentRole: roleInfo.role,
      permissions: roleInfo.permissions,
      canUpgradeToDark: roleInfo.canUpgradeToDark,
      canUpgradeToShiny: roleInfo.canUpgradeToShiny,
      shinyRollsAvailable: roleInfo.shinyRollsAvailable,
      isShinyActive: currentTheme === 'shiny',
      isShinyTemporary: isTemporaryShinyActive() && !isShinyPermanentlyAvailable(),
      shinyTimeRemaining: isTemporaryShinyActive() ?
        Math.max(0, parseInt(localStorage.getItem('shinyUntil') || '0') - Date.now()) : 0
    };
  }, [currentTheme, getRoleInfo, isTemporaryShinyActive]);

  return {
    currentTheme,
    changeTheme,
    canUseMode,
    isTransitioning,
    useShinyRoll,
    isTemporaryShinyActive,
    isShinyPermanentlyAvailable,
    getAccessInfo
  };
};
