
import React from 'react';

const StebeHeader: React.FC = () => {
  // Obtener fecha actual en inglés
  const today = new Date();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = dayNames[today.getDay()];

  return (
    <div className="pt-8 pb-4 bg-white">
      {/* Logo de Steve y fecha en la misma línea */}
      <div className="flex items-center justify-between mb-4 px-4">
        {/* Logo de Steve - esquina superior izquierda */}
        <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
          <img 
            src="/lovable-uploads/steve-pointing.svg" 
            alt="Steve Jobs" 
            className="w-16 h-16 object-contain"
          />
        </div>
        
        {/* Fecha del día - centrada */}
        <div className="flex-1 flex justify-center">
          <h2 className="text-3xl font-light text-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {dayName}
          </h2>
        </div>
        
        {/* Espacio para balancear el layout */}
        <div className="w-24 flex-shrink-0"></div>
      </div>
      
      {/* Título centrado en bloque negro */}
      <div className="w-full">
        <div className="bg-black py-2 px-4">
          <h1 className="text-center text-white text-2xl font-light tracking-wide" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            ORGANIZACIÓN
          </h1>
        </div>
      </div>
    </div>
  );
};

export default StebeHeader;
