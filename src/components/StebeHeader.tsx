
import React from 'react';

const StebeHeader: React.FC = () => {
  // Obtener fecha actual en inglés
  const today = new Date();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = dayNames[today.getDay()];

  return (
    <div className="pt-2 pb-4 bg-white">
      {/* Logo de Steve y fecha en la misma línea */}
      <div className="flex items-center justify-between mb-4 px-2">
        {/* Logo de Steve - esquina superior izquierda */}
        <div className="flex items-center justify-start">
          <img 
            src="/lovable-uploads/f3695274-590c-4838-b4b4-f6e21b194eef.png" 
            alt="Steve Logo" 
            className="object-contain bg-white"
            style={{ 
              maxWidth: '10vw',
              height: 'auto',
              margin: '12px',
              border: 'none',
              boxShadow: 'none'
            }}
          />
        </div>
        
        {/* Fecha del día - centrada */}
        <div className="flex-1 flex justify-center items-center">
          <h2 className="text-3xl font-light text-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {dayName}
          </h2>
        </div>
        
        {/* Espacio para balancear el layout */}
        <div className="w-24 flex-shrink-0"></div>
      </div>
      
      {/* Título centrado en bloque negro sin imagen */}
      <div className="w-full">
        <div className="bg-black py-2 px-4">
          <div className="flex items-center justify-center">
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
