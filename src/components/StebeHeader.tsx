import React from 'react';

interface StebeHeaderProps {
  pendingCount?: number;
}

const StebeHeader: React.FC<StebeHeaderProps> = ({ pendingCount }) => {
  // Obtener fecha actual en español
  const today = new Date();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = dayNames[today.getDay()];
  return <div className="bg-transparent dark:bg-black border-b border-gray-200 dark:border-gray-800 mb-2">
      <div className="flex items-center justify-center py-2">
        <div className="h-5 w-1.5 rounded-r mr-2" style={{ backgroundColor: 'var(--accent-color)' }}></div>
        <h1 className="text-black dark:text-white text-xl font-light tracking-wide" style={{
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>TAREAS</h1>
      </div>
    </div>;
};
export default StebeHeader;