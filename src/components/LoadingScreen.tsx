
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center">
        <h1 
          className="text-6xl font-bold text-black animate-pulse"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          STEBE
        </h1>
        <div className="mt-2 text-sm text-black/70">v0.12</div>
        
        {/* Puntos animados debajo del texto */}
        <div className="flex justify-center items-center space-x-1 mt-6">
          <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
