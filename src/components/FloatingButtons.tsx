
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
      <div className="flex items-end justify-center relative">
        
        {/* Botón de Ver Calendario (izquierda) */}
        <button
          onClick={handleCalendarClick}
          className={`absolute bottom-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 transform ${
            (isHome && viewMode === 'calendar') 
              ? 'bg-black shadow-2xl scale-110' 
              : 'bg-black shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1'
          }`}
          style={{ left: 'calc(50% - 120px)' }}
        >
          <Check size={20} className="text-white" strokeWidth={2.5} />
        </button>

        {/* Botón Principal de Crear Tarea (centro) */}
        <button
          onClick={onAddTask}
          className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 hover:-translate-y-2 -translate-y-2"
        >
          <Plus size={32} className="text-white sm:w-10 sm:h-10" strokeWidth={3} />
        </button>

        {/* Botón de Estadísticas Original (derecha) */}
        <button
          onClick={handleStatsClick}
          className={`absolute bottom-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 transform ${
            isStats 
              ? 'bg-black shadow-2xl scale-110' 
              : 'bg-black shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1'
          }`}
          style={{ right: 'calc(50% - 120px)' }}
        >
          <BarChart3 size={18} className="text-white" strokeWidth={2.5} />
        </button>

      </div>
    </div>
  );
};

export default FloatingButtons;
