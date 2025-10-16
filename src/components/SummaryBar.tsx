
import React from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';

interface SummaryBarProps {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

const SummaryBar: React.FC<SummaryBarProps> = ({ totalTasks, completedTasks, pendingTasks }) => {
  // Obtener fecha actual en español
  const today = new Date();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const dayName = dayNames[today.getDay()];
  const day = today.getDate();
  const monthName = monthNames[today.getMonth()];
  
  const dateString = `${dayName} ${day} de ${monthName}`;

  return (
    <div 
      className="mx-4 mb-6 bg-white border-3 border-black rounded-2xl p-4"
      style={{ 
        borderWidth: '3px',
        boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Fecha actual */}
      <div className="flex items-center justify-center mb-3">
        <Calendar size={20} className="text-black mr-2" />
        <h2 className="text-lg font-black text-black">{dateString}</h2>
      </div>
      
      {/* Resumen de tareas */}
      <div className="flex justify-around items-center">
        {/* Total de tareas */}
        <div className="text-center">
          <div className="w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto mb-1">
            <span className="text-sm font-black">{totalTasks}</span>
          </div>
          <p className="text-xs font-bold text-black">Total</p>
        </div>
        
        {/* Tareas completadas */}
        <div className="text-center">
          <div className="w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto mb-1">
            <CheckCircle size={16} className="text-green-600" />
          </div>
          <p className="text-xs font-bold text-black">{completedTasks} de {totalTasks}</p>
        </div>
        
        {/* Tareas pendientes */}
        <div className="text-center">
          <div className="w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto mb-1">
            <Clock size={16} className="text-orange-600" />
          </div>
          <p className="text-xs font-bold text-black">{pendingTasks} Pendientes</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryBar;
