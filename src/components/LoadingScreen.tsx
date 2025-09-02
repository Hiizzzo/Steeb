
import React, { useEffect, useState } from 'react';

const LoadingScreen: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Inicializar como modo oscuro por defecto para que las pelotitas sean blancas
    setIsDark(true);
    
    const check = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      // Mantener consistencia con useTheme: clave 'stebe-theme'
      const savedTheme = localStorage.getItem('stebe-theme');
      
      console.log('LoadingScreen - hasDarkClass:', hasDarkClass);
      console.log('LoadingScreen - savedTheme:', savedTheme);
      
      // Considerar shiny como fondo negro también
      const isDarkMode = hasDarkClass || savedTheme === 'dark' || savedTheme === 'shiny' || !savedTheme;
      console.log('LoadingScreen - isDarkMode:', isDarkMode);
      setIsDark(isDarkMode);
    };
    
    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(check, 100);
    
    // Observar cambios en las clases del documento
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${isDark ? 'bg-black' : 'bg-white'}`}>
      <div className="text-center">
        <h1 
          className={`text-6xl font-bold animate-pulse ${isDark ? 'text-white' : 'text-black'}`}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          STEEB
        </h1>
        
        {/* Versión */}
        <div className={`text-lg font-medium mt-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}
             style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          0.96
        </div>
        
        {/* Puntos animados */}
        <div className="flex justify-center items-center space-x-3 mt-6">
          <div 
            className="animate-bounce [animation-delay:-0.3s]"
            style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '50%',
              backgroundColor: isDark ? '#ffffff' : '#000000',
              border: `2px solid ${isDark ? '#ffffff' : '#000000'}`,
              zIndex: 9999,
              position: 'relative'
            }}
          ></div>
          <div 
            className="animate-bounce [animation-delay:-0.15s]"
            style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '50%',
              backgroundColor: isDark ? '#ffffff' : '#000000',
              border: `2px solid ${isDark ? '#ffffff' : '#000000'}`,
              zIndex: 9999,
              position: 'relative'
            }}
          ></div>
          <div 
            className="animate-bounce"
            style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '50%',
              backgroundColor: isDark ? '#ffffff' : '#000000',
              border: `2px solid ${isDark ? '#ffffff' : '#000000'}`,
              zIndex: 9999,
              position: 'relative'
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

