
import React, { useEffect, useState } from 'react';

const LoadingScreen: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const check = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      setIsDark(hasDarkClass || mql.matches);
    };
    check();
    mql.addEventListener('change', check);
    return () => mql.removeEventListener('change', check);
  }, []);

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${isDark ? 'bg-black' : 'bg-white'}`}>
      <div className="text-center">
        <h1 
          className={`text-6xl font-bold animate-pulse ${isDark ? 'text-white' : 'text-black'}`}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          STEBE
        </h1>
        <div className={`mt-2 text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>v0.14</div>
        
        {/* Puntos animados debajo del texto */}
        <div className="flex justify-center items-center space-x-3 mt-6">
          <div className={`w-4 h-4 rounded-full animate-bounce [animation-delay:-0.3s] ${isDark ? 'bg-white border border-white/80' : 'bg-black border border-black/80'}`}></div>
          <div className={`w-4 h-4 rounded-full animate-bounce [animation-delay:-0.15s] ${isDark ? 'bg-white border border-white/80' : 'bg-black border border-black/80'}`}></div>
          <div className={`w-4 h-4 rounded-full animate-bounce ${isDark ? 'bg-white border border-white/80' : 'bg-black border border-black/80'}`}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
