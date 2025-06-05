
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-8 animate-fade-in">
        <h1 className="text-white text-3xl font-bold mb-8">Después del Trabajo</h1>
        
        <div className="flex flex-col items-center space-y-4">
          <img 
            src="/lovable-uploads/4b6291dd-50ae-479e-a2d0-05130ab09040.png" 
            alt="Steve después del trabajo"
            className="w-64 h-64 object-contain animate-pulse"
          />
        </div>
        
        <h2 className="text-white text-2xl font-bold mt-8">Llega el descanso</h2>
        
        <div className="flex space-x-2 mt-4">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
