
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
        {/* Figura de Steve Jobs - minimalista y angular */}
        <div className="w-16 h-16 flex-shrink-0">
          <div className="w-full h-full border border-black rounded-lg bg-white relative overflow-hidden">
            {/* Cara de Steve - estilo minimalista angular */}
            <div className="absolute inset-2">
              {/* Cabeza calva */}
              <div className="w-full h-3/5 bg-white border border-black rounded-t-full relative">
                {/* Lentes redondos */}
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 border border-black rounded-full bg-white"></div>
                    <div className="w-1.5 h-1.5 border border-black rounded-full bg-white"></div>
                  </div>
                  {/* Puente de lentes */}
                  <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-0.5 bg-black"></div>
                </div>
              </div>
              {/* Cuello/cuerpo */}
              <div className="w-full h-2/5 bg-black"></div>
            </div>
          </div>
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
