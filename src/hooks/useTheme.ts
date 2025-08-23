import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'shiny';

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');

  useEffect(() => {
    // Cargar tema guardado al iniciar
    const savedTheme = localStorage.getItem('stebe-theme') as Theme;
    if (savedTheme && ['light', 'dark', 'shiny'].includes(savedTheme)) {
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (theme: Theme) => {
    // Remover todos los temas
    document.documentElement.classList.remove('dark', 'shiny');
    
    // Aplicar tema seleccionado
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'shiny') {
      document.documentElement.classList.add('shiny');
    }
    
    // Guardar en localStorage
    localStorage.setItem('stebe-theme', theme);
    setCurrentTheme(theme);
  };

  const toggleTheme = (theme: Theme) => {
    applyTheme(theme);
  };

  return {
    currentTheme,
    toggleTheme,
    isDark: currentTheme === 'dark',
    isShiny: currentTheme === 'shiny',
    isLight: currentTheme === 'light'
  };
};
