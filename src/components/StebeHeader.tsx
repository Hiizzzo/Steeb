
import React from 'react';

const StebeHeader: React.FC = () => {
  // Obtener fecha actual en inglés
  const today = new Date();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = dayNames[today.getDay()];

  return (
    <div className="pt-2 pb-4 bg-white">
      {/* Logo de Steve y fecha en la misma línea */}
      <div className="flex items-start justify-between mb-4 px-2">
        {/* Logo de Steve - esquina superior izquierda */}
        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-start">
          <img 
            src="/profile-icon.svg" 
            alt="Profile Icon" 
            className="w-14 h-14 object-contain"
          />
        </div>
        
        {/* Fecha del día - centrada */}
        <div className="flex-1 flex justify-center items-center pt-2">
          <h2 className="text-3xl font-light text-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {dayName}
          </h2>
        </div>
        
        {/* Espacio para balancear el layout */}
        <div className="w-16 flex-shrink-0"></div>
      </div>
      
      {/* Título centrado en bloque negro con imagen */}
      <div className="w-full">
        <div className="bg-black py-2 px-4">
          <div className="flex items-center justify-center">
            <img 
              src="/lovable-uploads/steve-thumbs-up-icon.png" 
              alt="Steve Jobs Icon" 
              className="w-8 h-8 object-contain mr-3"
            />
            <h1 className="text-white text-2xl font-light tracking-wide" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              ORGANIZACIÓN
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StebeHeader;
