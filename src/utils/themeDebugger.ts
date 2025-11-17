// ============================================================================
// THEME DEBUGGER - Herramienta de diagnóstico para problemas de consistencia
// ============================================================================

import { Theme } from '@/hooks/useTheme';

interface ThemeDiagnostics {
  timestamp: string;
  localStorage: Theme | null;
  domClasses: {
    hasDark: boolean;
    hasShiny: boolean;
    className: string;
  };
  cssVariables: Record<string, string>;
  computedStyles: {
    backgroundColor: string;
    color: string;
    background: string;
  };
  inconsistencies: string[];
  recommendations: string[];
}

export class ThemeDebugger {
  private static instance: ThemeDebugger;
  private diagnostics: ThemeDiagnostics[] = [];
  private maxDiagnostics = 10;

  static getInstance(): ThemeDebugger {
    if (!ThemeDebugger.instance) {
      ThemeDebugger.instance = new ThemeDebugger();
    }
    return ThemeDebugger.instance;
  }

  // Realizar diagnóstico completo del estado actual del tema
  runDiagnostics(): ThemeDiagnostics {
    const root = document.documentElement;
    const body = document.body;

    // 1. Verificar localStorage
    const localStorageTheme = localStorage.getItem('stebe-theme') as Theme;

    // 2. Verificar clases del DOM
    const hasDark = root.classList.contains('dark');
    const hasShiny = root.classList.contains('shiny');

    // 3. Determinar tema actual real
    let actualTheme: Theme = 'light';
    if (hasShiny) actualTheme = 'shiny';
    else if (hasDark) actualTheme = 'dark';

    // 4. Verificar variables CSS
    const cssVariables: Record<string, string> = {};
    const importantVars = [
      '--background', '--foreground', '--card', '--primary',
      '--secondary', '--muted', '--accent', '--border'
    ];

    importantVars.forEach(varName => {
      cssVariables[varName] = getComputedStyle(root).getPropertyValue(varName).trim();
    });

    // 5. Verificar estilos computados
    const computedRoot = getComputedStyle(root);
    const computedBody = getComputedStyle(body);

    const diagnostics: ThemeDiagnostics = {
      timestamp: new Date().toISOString(),
      localStorage: localStorageTheme,
      domClasses: {
        hasDark,
        hasShiny,
        className: root.className
      },
      cssVariables,
      computedStyles: {
        backgroundColor: computedRoot.backgroundColor,
        color: computedRoot.color,
        background: computedRoot.background
      },
      inconsistencies: [],
      recommendations: []
    };

    // 6. Detectar inconsistencias
    if (localStorageTheme && localStorageTheme !== actualTheme) {
      diagnostics.inconsistencies.push(
        `localStorage theme (${localStorageTheme}) ≠ DOM theme (${actualTheme})`
      );
    }

    // Detectar múltiples temas activos (error grave)
    if (hasDark && hasShiny) {
      diagnostics.inconsistencies.push(
        'CRITICAL: Both dark and shiny classes are present simultaneously!'
      );
    }

    // Detectar variables CSS vacías o inválidas
    Object.entries(cssVariables).forEach(([varName, value]) => {
      if (!value || value === '') {
        diagnostics.inconsistencies.push(`CSS variable ${varName} is empty or invalid`);
      }
    });

    // 7. Generar recomendaciones
    if (diagnostics.inconsistencies.length > 0) {
      diagnostics.recommendations.push(
        'Run theme correction: themeDebugger.fixInconsistencies()'
      );
    }

    if (!localStorageTheme) {
      diagnostics.recommendations.push(
        'Consider setting a default theme in localStorage'
      );
    }

    // Guardar diagnóstico
    this.diagnostics.push(diagnostics);
    if (this.diagnostics.length > this.maxDiagnostics) {
      this.diagnostics.shift();
    }

    return diagnostics;
  }

  // Corregir automáticamente inconsistencias detectadas
  fixInconsistencies(): boolean {
    const diagnostics = this.runDiagnostics();
    const root = document.documentElement;

    if (diagnostics.inconsistencies.length === 0) {
      console.log('✅ No inconsistencies detected');
      return true;
    }

    
    // PROTECCIÓN: Guardar elementos con colores personalizados ANTES de limpiar
    const elementsWithCustomColors = document.querySelectorAll('[data-custom-color="true"], [style*="border-color"]:not([style*="auto"]), [style*="color"]:not([style*="auto"])');
    const customStyles: Array<{element: Element, borderColor: string, color: string}> = [];

    elementsWithCustomColors.forEach(el => {
      const htmlEl = el as HTMLElement;
      customStyles.push({
        element: el,
        borderColor: htmlEl.style.borderColor,
        color: htmlEl.style.color
      });
    });

    // 1. Limpiar clases conflictivas
    root.classList.remove('dark', 'shiny');

    // 2. Determinar tema correcto y aplicarlo
    const correctTheme = diagnostics.localStorage || 'light';

    if (correctTheme === 'dark') {
      root.classList.add('dark');
    } else if (correctTheme === 'shiny') {
      root.classList.add('shiny');
    }

    // 3. RESTAURAR: Colores personalizados después de la corrección
    setTimeout(() => {
      customStyles.forEach(({element, borderColor, color}) => {
        const htmlEl = element as HTMLElement;
        if (borderColor) htmlEl.style.borderColor = borderColor;
        if (color) htmlEl.style.color = color;
      });

      // 4. Verificar corrección
      const postFixDiagnostics = this.runDiagnostics();
      if (postFixDiagnostics.inconsistencies.length === 0) {
              } else {
        console.error('❌ Some inconsistencies could not be fixed:', postFixDiagnostics.inconsistencies);
      }
    }, 100);

    return true;
  }

  // Obtener historial de diagnósticos
  getDiagnosticsHistory(): ThemeDiagnostics[] {
    return [...this.diagnostics];
  }

  // Limpiar historial
  clearHistory(): void {
    this.diagnostics = [];
  }

  // Verificar salud del sistema de temas
  checkSystemHealth(): {
    isHealthy: boolean;
    score: number;
    issues: string[];
  } {
    const latest = this.runDiagnostics();
    const issues = latest.inconsistencies;

    // Calcular score (0-100)
    let score = 100;

    // Penalizar inconsistencias graves
    if (issues.includes('CRITICAL: Both dark and shiny classes are present simultaneously!')) {
      score -= 50;
    }

    // Penalizar otras inconsistencias
    score -= issues.length * 10;

    score = Math.max(0, Math.min(100, score));

    return {
      isHealthy: score >= 80 && issues.length === 0,
      score,
      issues
    };
  }

  // Exportar reporte completo
  exportReport(): string {
    const health = this.checkSystemHealth();
    const latest = this.diagnostics[this.diagnostics.length - 1];

    const report = `
THEME SYSTEM HEALTH REPORT
Generated: ${new Date().toISOString()}
Health Score: ${health.score}/100
System Healthy: ${health.isHealthy ? 'YES' : 'NO'}

CURRENT STATE:
- localStorage Theme: ${latest?.localStorage || 'NOT SET'}
- DOM Classes: ${latest?.domClasses.className || 'EMPTY'}
- Dark Class Present: ${latest?.domClasses.hasDark ? 'YES' : 'NO'}
- Shiny Class Present: ${latest?.domClasses.hasShiny ? 'YES' : 'NO'}

INCONSISTENCIES DETECTED:
${health.issues.length > 0 ? health.issues.map(issue => `- ${issue}`).join('\n') : 'NONE'}

RECOMMENDATIONS:
${latest?.recommendations.length > 0 ? latest.recommendations.map(rec => `- ${rec}`).join('\n') : 'NONE'}

CSS VARIABLES:
${latest ? Object.entries(latest.cssVariables).map(([key, value]) => `- ${key}: ${value || 'EMPTY'}`).join('\n') : 'NO DATA'}

RECENT DIAGNOSTICS:
${this.diagnostics.slice(-3).map((diag, i) => `
${i + 1}. ${diag.timestamp}
   Inconsistencies: ${diag.inconsistencies.length}
   Theme: ${diag.localStorage || 'NOT SET'}
`).join('\n')}
    `.trim();

    return report;
  }
}

// Instancia global para fácil acceso
export const themeDebugger = ThemeDebugger.getInstance();

// Funciones de conveniencia para debugging en la consola
export const debugTheme = () => themeDebugger.runDiagnostics();
export const fixTheme = () => themeDebugger.fixInconsistencies();
export const themeHealth = () => themeDebugger.checkSystemHealth();
export const exportThemeReport = () => {
  console.log(themeDebugger.exportReport());
  return themeDebugger.exportReport();
};

// Exponer globalmente para debugging en el navegador
if (typeof window !== 'undefined') {
  (window as any).__themeDebugger = themeDebugger;
  (window as any).__debugTheme = debugTheme;
  (window as any).__fixTheme = fixTheme;
  (window as any).__themeHealth = themeHealth;
  (window as any).__exportThemeReport = exportThemeReport;

  console.log('🎨 Theme debugging tools available globally:');
  console.log('- __debugTheme() - Run theme diagnostics');
  console.log('- __fixTheme() - Fix detected inconsistencies');
  console.log('- __themeHealth() - Check system health');
  console.log('- __exportThemeReport() - Generate full report');
}