import { useEffect } from 'react';

export const useTextSize = () => {
  useEffect(() => {
    // Cargar configuración de texto grande al iniciar la aplicación
    const savedLargeText = localStorage.getItem('stebe-large-text');
    
    if (savedLargeText === 'true') {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
  }, []);
};
