
import React from 'react';

const StebeHeader: React.FC = () => {
  return (
    <div className="text-center py-8 bg-white">
      {/* Steve Avatar - Estilo caricatura */}
      <div className="mb-4 flex justify-center">
        <div className="relative">
          {/* Cara de Steve */}
          <div className="w-20 h-20 rounded-full border-4 border-black bg-gray-100 relative">
            {/* Anteojos */}
            <div className="absolute top-3 left-2 w-4 h-4 rounded-full border-2 border-black"></div>
            <div className="absolute top-3 right-2 w-4 h-4 rounded-full border-2 border-black"></div>
            <div className="absolute top-4 left-6 w-2 h-1 border-t-2 border-black"></div>
            
            {/* Cejas enojadas */}
            <div className="absolute top-2 left-3 w-3 h-1 border-t-2 border-black transform rotate-12"></div>
            <div className="absolute top-2 right-3 w-3 h-1 border-t-2 border-black transform -rotate-12"></div>
            
            {/* Boca seria */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-4 h-1 border-t-2 border-black"></div>
          </div>
          
          {/* Brazo señalando */}
          <div className="absolute -right-8 top-6 w-6 h-2 border-2 border-black bg-gray-100 rounded transform rotate-12"></div>
          <div className="absolute -right-12 top-4 w-3 h-3 rounded-full border-2 border-black bg-gray-100"></div>
          
          {/* Botón de pausa que está señalando */}
          <div className="absolute -right-20 top-2 w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center">
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-black"></div>
              <div className="w-1 h-4 bg-black"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Título STEBE */}
      <h1 className="text-4xl font-black tracking-wider text-black mb-2" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
        STEBE
      </h1>
      
      {/* Subtítulo */}
      <p className="text-lg text-gray-600 font-medium">Tareas</p>
    </div>
  );
};

export default StebeHeader;
