
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, BarChart3, Check } from 'lucide-react';

interface FloatingButtonsProps {
  onAddTask: () => void;
  onShowTasks: () => void;
  onToggleView: () => void;
  viewMode: 'tasks' | 'calendar';
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({ onAddTask }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isStats = location.pathname === '/stats';

  const handleTasksClick = () => {
    if (!isHome) {
      navigate('/');
    }
  };

  const handleStatsClick = () => {
    navigate('/stats');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black">
      <div className="flex items-center justify-around py-2 px-4">
        
        {/* Botón de Tareas (Check) */}
        <button
          onClick={handleTasksClick}
          className={`flex flex-col items-center justify-center py-3 px-6 rounded-xl transition-all duration-200 ${
            isHome 
              ? 'bg-black text-white' 
              : 'bg-transparent text-gray-600 hover:bg-gray-100'
          }`}
          style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            minWidth: '80px'
          }}
        >
          <div className={`p-2 rounded-full ${isHome ? 'bg-white/20' : 'bg-gray-100'}`}>
            <Check size={24} className={isHome ? 'text-white' : 'text-gray-600'} />
          </div>
          <span className={`text-xs font-bold mt-1 ${isHome ? 'text-white' : 'text-gray-600'}`}>
            TAREAS
          </span>
        </button>

        {/* Botón de Agregar Tarea (Plus) - Siempre destacado */}
        <button
          onClick={onAddTask}
          className="flex flex-col items-center justify-center py-3 px-6 rounded-xl bg-black text-white transition-all duration-200 hover:bg-gray-800 active:scale-95"
          style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            minWidth: '80px'
          }}
        >
          <div className="p-2 rounded-full bg-white/20">
            <Plus size={24} className="text-white" />
          </div>
          <span className="text-xs font-bold mt-1 text-white">
            AGREGAR
          </span>
        </button>

        {/* Botón de Estadísticas (BarChart) */}
        <button
          onClick={handleStatsClick}
          className={`flex flex-col items-center justify-center py-3 px-6 rounded-xl transition-all duration-200 ${
            isStats 
              ? 'bg-black text-white' 
              : 'bg-transparent text-gray-600 hover:bg-gray-100'
          }`}
          style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            minWidth: '80px'
          }}
        >
          <div className={`p-2 rounded-full ${isStats ? 'bg-white/20' : 'bg-gray-100'}`}>
            <BarChart3 size={24} className={isStats ? 'text-white' : 'text-gray-600'} />
          </div>
          <span className={`text-xs font-bold mt-1 ${isStats ? 'text-white' : 'text-gray-600'}`}>
            PROGRESO
          </span>
        </button>

      </div>
    </div>
  );
};

export default FloatingButtons;
