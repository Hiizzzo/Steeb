
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, BarChart3, Calendar, TrendingUp, Check } from 'lucide-react';

interface FloatingButtonsProps {
  onAddTask: () => void;
  onShowTasks: () => void;
  onToggleView: () => void;
  viewMode: 'tasks' | 'calendar';
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({ onAddTask, onToggleView, viewMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isStats = location.pathname === '/estadisticas';

  const handleCalendarClick = () => {
    if (!isHome) {
      navigate('/');
    }
    // Si estamos en home pero no en vista calendario, cambiamos a calendario
    if (isHome && viewMode === 'tasks') {
      onToggleView();
    }
  };

  const handleStatsClick = () => {
    navigate('/estadisticas');
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50">
      <div className="flex items-center justify-center px-8">
        
        {/* Botón de Ver Calendario */}
        <button
          onClick={handleCalendarClick}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 transform mr-6 ${
            (isHome && viewMode === 'calendar') 
              ? 'bg-black shadow-2xl scale-110' 
              : 'bg-black shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1'
          }`}
        >
          <Check size={20} className="text-white" strokeWidth={2.5} />
        </button>

        {/* Botón Principal de Crear Tarea */}
        <button
          onClick={onAddTask}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 hover:-translate-y-1 mx-6"
        >
          <Plus size={28} className="text-white sm:w-8 sm:h-8" strokeWidth={3} />
        </button>

        {/* Botón de Estadísticas */}
        <button
          onClick={handleStatsClick}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 transform ml-6 ${
            isStats 
              ? 'bg-black shadow-2xl scale-110' 
              : 'bg-black shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1'
          }`}
        >
          <BarChart3 size={18} className="text-white" strokeWidth={2.5} />
        </button>

      </div>
    </div>
  );
};

export default FloatingButtons;
