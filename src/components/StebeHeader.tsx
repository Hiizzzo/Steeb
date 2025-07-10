
import React from 'react';

const StebeHeader: React.FC = () => {
  // Obtener fecha actual en inglés
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[today.getDay()];

  return (
    <div className="pt-8 pb-4 bg-white">
      {/* Steve Jobs figura y fecha en la misma línea */}
      <div className="flex items-center justify-between mb-4 px-4">
        {/* Logo de Steve Jobs */}
        <div className="w-16 h-16 flex-shrink-0">
          <img 
            src="/steve-logo.svg" 
            alt="Steve Jobs" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Fecha del día - centrada y más grande */}
        <div className="flex-1 flex justify-center">
          <h2 className="text-3xl font-light text-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {dayName}
          </h2>
        </div>
        
        {/* Espacio para balancear */}
        <div className="w-16"></div>
      </div>
      
      {/* Título "Tasks" centrado en bloque negro */}
      <div className="w-full">
        <div className="bg-black py-2 px-4">
          <h1 className="text-center text-white text-2xl font-light tracking-wide" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            TASKS
          </h1>
        </div>
      </div>
    </div>
  );
};

export default StebeHeader;
