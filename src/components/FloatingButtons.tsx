
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, BarChart3, Check, TrendingUp } from 'lucide-react';

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
  const isStats = location.pathname === '/estadisticas';
  const isStatsNew = location.pathname === '/stats';

  const handleTasksClick = () => {
    if (!isHome) {
      navigate('/');
    }
  };

  const handleStatsClick = () => {
    navigate('/estadisticas');
  };

  const handleStatsNewClick = () => {
    navigate('/stats');
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50">
      <div className="flex items-end justify-center relative">
        
        {/* Botón de Ver Tareas (izquierda) */}
        <button
          onClick={handleTasksClick}
          className={`absolute -left-2 bottom-3 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 transform ${
            isHome 
              ? 'bg-black shadow-2xl scale-110' 
              : 'bg-black shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1'
          }`}
          style={{ left: 'calc(50% - 140px)' }}
        >
          <Check size={20} className="text-white" strokeWidth={3} />
        </button>

        {/* Botón Principal de Crear Tarea (centro) */}
        <button
          onClick={onAddTask}
          className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 hover:-translate-y-2"
        >
          <Plus size={28} className="text-white sm:w-8 sm:h-8" strokeWidth={3} />
        </button>

        {/* Botón de Estadísticas Original (derecha) */}
        <button
          onClick={handleStatsClick}
          className={`absolute bottom-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 transform ${
            isStats 
              ? 'bg-black shadow-2xl scale-110' 
              : 'bg-black shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1'
          }`}
          style={{ right: 'calc(50% - 90px)' }}
        >
          <BarChart3 size={16} className="text-white" strokeWidth={2.5} />
        </button>

        {/* Botón de Nueva Página de Estadísticas (más a la derecha) */}
        <button
          onClick={handleStatsNewClick}
          className={`absolute bottom-3 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 transform ${
            isStatsNew 
              ? 'bg-green-600 shadow-2xl scale-110' 
              : 'bg-green-600 shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1'
          }`}
          style={{ right: 'calc(50% - 140px)' }}
        >
          <TrendingUp size={18} className="text-white" strokeWidth={2.5} />
        </button>

      </div>
    </div>
  );
};

export default FloatingButtons;
