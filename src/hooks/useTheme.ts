import { useEffect, useState, useCallback } from 'react';
import { themeDebugger } from '@/utils/themeDebugger';

// Themes supported, including 'shiny'
export type Theme = 'light' | 'dark' | 'shiny';

// Estado global para sincronización instantánea entre componentes
let globalThemeState: Theme = 'light';
const themeListeners = new Set<(theme: Theme) => void>();

export const useTheme = () => {
  // Función CRÍTICA: Determinar el tema inicial con validación DOM
  const getInitialTheme = useCallback((): Theme => {
    if (typeof window === 'undefined') return 'light';

    // 1. Verificar si hay clases de tema ya aplicadas en el DOM
    const root = document.documentElement;
    const hasDarkClass = root.classList.contains('dark');
    const hasShinyClass = root.classList.contains('shiny');

    // 2. Verificar localStorage
    const savedTheme = localStorage.getItem('stebe-theme') as Theme;

    // 3. Prioridades: clases DOM > localStorage > sistema > light
    if (hasShinyClass) return 'shiny';
    if (hasDarkClass) return 'dark';
    if (savedTheme && ['light', 'dark', 'shiny'].includes(savedTheme)) return savedTheme;

    // 4. Último recurso: preferencia del sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }, []);

  // Estado local sincronizado con estado global
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const theme = getInitialTheme();
    globalThemeState = theme;
    return theme;
  });

  // applyTheme REESCRITO - Máxima consistencia y limpieza
  const applyTheme = useCallback((theme: Theme) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;

    // SYNC STATE: Actualizar estado global primero
    globalThemeState = theme;

    // STEP 1: Prevenir FOUC con clase de transición
    root.classList.add('theme-transitioning');

    // STEP 2: Limpieza AGRESIVA de todo rastro del tema anterior
    root.classList.remove('dark', 'shiny');

    // STEP 3: Resetear PROPIEDADES CSS que causan contaminación
    // PROTECCIÓN: Preservar colores personalizados del usuario
    const elementsWithCustomColors = document.querySelectorAll('[data-custom-color="true"], [style*="border-color"], [style*="color"]');

    const contaminatingProperties = [
      'background', 'background-color', 'color', 'border-color',
      'box-shadow', 'text-shadow', 'filter', 'backdrop-filter',
      'background-image', 'border-image'
    ];

    contaminatingProperties.forEach(prop => {
      root.style.removeProperty(prop);
      body.style.removeProperty(prop);
    });

    // RESTAURAR: Colores personalizados después de la limpieza
    elementsWithCustomColors.forEach(el => {
      const savedBorderColor = (el as HTMLElement).style.borderColor;
      const savedColor = (el as HTMLElement).style.color;
      if (savedBorderColor) (el as HTMLElement).style.borderColor = savedBorderColor;
      if (savedColor) (el as HTMLElement).style.color = savedColor;
    });

    // STEP 4: Resetear variables CSS personalizadas
    const cssVariables = [
      '--background', '--foreground', '--card', '--card-foreground',
      '--popover', '--popover-foreground', '--primary', '--primary-foreground',
      '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
      '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
      '--border', '--input', '--ring', '--sidebar-background', '--sidebar-foreground',
      '--sidebar-primary', '--sidebar-primary-foreground', '--sidebar-accent',
      '--sidebar-accent-foreground', '--sidebar-border', '--sidebar-ring'
    ];

    cssVariables.forEach(prop => {
      root.style.removeProperty(prop);
    });

    // STEP 5: Forzar limpieza de estilos inline
    root.removeAttribute('style');
    body.removeAttribute('style');

    // STEP 6: Aplicar NUEVO tema con atomicidad garantizada
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'shiny') {
      root.classList.add('shiny');
    }
    // Para 'light', no se agrega clase (es el modo por defecto)

    // STEP 7: Forzar reflow del DOM para prevenir artefactos
    void root.offsetHeight;

    // STEP 8: Persistencia inmediata y síncrona
    localStorage.setItem('stebe-theme', theme);

    // STEP 9: Actualizar estado local y notificar listeners
    setCurrentTheme(theme);
    themeListeners.forEach(listener => listener(theme));

    // STEP 10: Limpiar estado de transición después de aplicar tema
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 50);

  }, []);

  // Efecto de montaje: Aplicar tema INMEDIATAMENTE y validar consistencia
  useEffect(() => {
    // Aplicar tema al montar el componente
    applyTheme(currentTheme);

    // VALIDACIÓN AVANZADA con debugger
    const validationTimeout = setTimeout(() => {
      const diagnostics = themeDebugger.runDiagnostics();

      if (diagnostics.inconsistencies.length > 0) {
        console.warn('⚠️ Theme inconsistency detected!', diagnostics.inconsistencies);

        // Intentar corrección automática
        const health = themeDebugger.checkSystemHealth();
        if (!health.isHealthy) {
                    themeDebugger.fixInconsistencies();
        }
      }
    }, 100);

    // Listener para cambios de tema del sistema
    const handleSystemThemeChange = () => {
      const savedTheme = localStorage.getItem('stebe-theme');
      if (!savedTheme || savedTheme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
      }
    };

    window.addEventListener('system-theme-change', handleSystemThemeChange);

    // Cleanup
    return () => {
      clearTimeout(validationTimeout);
      window.removeEventListener('system-theme-change', handleSystemThemeChange);
    };
  }, [currentTheme, applyTheme]);

  // toggleTheme Mejorado: Validación y error handling
  const toggleTheme = useCallback((theme: Theme) => {
    if (!['light', 'dark', 'shiny'].includes(theme)) {
      console.error('Invalid theme:', theme);
      return;
    }

        applyTheme(theme);
  }, [applyTheme]);

  // Suscribirse a cambios globales del tema
  useEffect(() => {
    const handleGlobalThemeChange = (theme: Theme) => {
      if (theme !== currentTheme) {
        setCurrentTheme(theme);
      }
    };

    themeListeners.add(handleGlobalThemeChange);

    return () => {
      themeListeners.delete(handleGlobalThemeChange);
    };
  }, [currentTheme]);

  return {
    currentTheme,
    toggleTheme,
    isDark: currentTheme === 'dark',
    isShiny: currentTheme === 'shiny',
    isLight: currentTheme === 'light',

    // Utilidades adicionales para depuración y validación
    validateTheme: () => {
      const root = document.documentElement;
      const stored = localStorage.getItem('stebe-theme');
      const hasDark = root.classList.contains('dark');
      const hasShiny = root.classList.contains('shiny');

      let actual: Theme = 'light';
      if (hasShiny) actual = 'shiny';
      else if (hasDark) actual = 'dark';

      return {
        stored: stored as Theme,
        actual,
        current: currentTheme,
        consistent: stored === actual && actual === currentTheme
      };
    },

    // Acceso al debugger avanzado
    getDiagnostics: () => themeDebugger.runDiagnostics(),
    fixInconsistencies: () => themeDebugger.fixInconsistencies(),
    getHealthScore: () => themeDebugger.checkSystemHealth(),
    exportReport: () => themeDebugger.exportReport()
  };
};

// Exportar utilidad global para depuración
export const getGlobalTheme = () => globalThemeState;
