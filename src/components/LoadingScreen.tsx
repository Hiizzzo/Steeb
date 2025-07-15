
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50 loading-critical">
      <div className="text-center">
        <h1 
          className="text-6xl font-bold text-black animate-pulse"
          style={{ 
            fontFamily: 'system-ui, -apple-system, "Varela Round", sans-serif',
            willChange: 'opacity' // Optimización para animaciones
          }}
        >
          Steve
        </h1>
        
        {/* Puntos animados optimizados */}
        <div className="flex justify-center items-center space-x-1 mt-6">
          <div 
            className="w-2 h-2 bg-black rounded-full animate-bounce" 
            style={{ animationDelay: '-0.3s', willChange: 'transform' }}
          ></div>
          <div 
            className="w-2 h-2 bg-black rounded-full animate-bounce" 
            style={{ animationDelay: '-0.15s', willChange: 'transform' }}
          ></div>
          <div 
            className="w-2 h-2 bg-black rounded-full animate-bounce"
            style={{ willChange: 'transform' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
