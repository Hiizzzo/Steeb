
import React from 'react';

const StebeHeader: React.FC = () => {
  // Obtener fecha actual en inglés
  const today = new Date();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = dayNames[today.getDay()];

  return (
    <div className="pt-2 pb-4 bg-white relative">
      {/* Logo de Steve - posición fija en esquina superior izquierda */}
      <img 
        src="/lovable-uploads/steve-bearded-avatar.png" 
        alt="Steve Logo" 
        className="fixed top-2 left-2 object-contain bg-white z-50"
        style={{ 
          width: '60px',
          height: '60px',
          border: 'none',
          boxShadow: 'none'
        }}
      />
      
      {/* Fecha del día - centrada */}
      <div className="flex justify-center items-center mb-4 px-2 pt-2">
        <h2 className="text-3xl font-light text-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          {dayName}
        </h2>
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
