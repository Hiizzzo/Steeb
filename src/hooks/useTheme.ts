import { useEffect, useState } from 'react';

// Themes supported, including 'shiny'
export type Theme = 'light' | 'dark' | 'shiny';

export const useTheme = () => {
  // Initialize with saved theme immediately to prevent flash
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('stebe-theme') as Theme) || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    // Apply the theme on mount
    applyTheme(currentTheme);
  }, []);

  const applyTheme = (theme: Theme) => {
    // Reset classes first
    document.documentElement.classList.remove('dark', 'shiny');

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'shiny') {
      document.documentElement.classList.add('shiny');
    }

    // Persist chosen theme exactly
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
    isLight: currentTheme === 'light',
  };
};
