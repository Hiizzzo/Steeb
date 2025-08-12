import React from 'react';

interface StebeHeaderProps {
  pendingCount?: number;
}

const StebeHeader: React.FC<StebeHeaderProps> = ({ pendingCount }) => {
  // Obtener fecha actual en español
  const today = new Date();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = dayNames[today.getDay()];
  return <div className="pt-2 pb-4 bg-white relative">
      {/* Fecha del día */}
      <div className="relative mb-6 px-2 pt-2">
        <h2 className="text-4xl font-normal text-black text-center flex items-center justify-center h-20 w-full" style={{
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
          {dayName}
        </h2>
      </div>
      
      {/* Título centrado en bloque negro sin imagen */}
      <div className="w-full">
        <div className="bg-black py-2 px-4">
          <div className="relative">
            <div className="flex items-center justify-center">
              <h1 className="text-white text-2xl font-light tracking-wide" style={{
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>TAREAS
            </h1>
            </div>
            {typeof pendingCount === 'number' && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <span className="inline-flex items-center justify-center min-w-12 px-2 py-1 text-xs font-medium bg-white text-black rounded-full border border-gray-300">
                  {pendingCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>;
};
export default StebeHeader;