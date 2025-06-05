
import React, { useState, useEffect } from 'react';

const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30); // 30ms * 100 = 3000ms (3 segundos)

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-8 animate-fade-in">
        <h1 className="text-white text-4xl font-bold mb-8">Después del Trabajo</h1>
        
        <div className="flex flex-col items-center space-y-8">
          <img 
            src="/lovable-uploads/4b6291dd-50ae-479e-a2d0-05130ab09040.png" 
            alt="Steve después del trabajo"
            className="w-80 h-80 object-contain"
          />
        </div>
        
        <h2 className="text-white text-2xl font-bold">Llega el descanso</h2>
        
        {/* Barra de progreso */}
        <div className="w-64 bg-gray-800 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-white text-sm opacity-75">{progress}%</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
