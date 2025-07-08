import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, BarChart3, Check } from 'lucide-react';

interface BottomNavigationProps {
  onAddTask: () => void;
  onToggleView?: () => void;
  viewMode?: 'tasks' | 'calendar';
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ onAddTask, onToggleView, viewMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const handleTasksClick = () => {
    if (!isHome) {
      navigate('/');
    } else if (onToggleView) {
      onToggleView();
    }
  };

  const handleStatsClick = () => {
    navigate('/stats');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white safe-area-inset-bottom">
      <div className="flex items-center justify-center py-6 px-8">
        <div className="flex items-center justify-between w-full max-w-xs">
          
          {/* Botón de Tareas (Check) - Izquierda */}
          <button
            onClick={handleTasksClick}
            className="w-14 h-14 bg-black rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            aria-label="Ver tareas"
          >
            <Check size={20} className="text-white" strokeWidth={2.5} />
          </button>

          {/* Botón de Agregar Tarea (Plus) - Centro - 30% más grande */}
          <button
            onClick={onAddTask}
            className="bg-black rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl"
            style={{ width: '72px', height: '72px' }}
            aria-label="Agregar tarea"
          >
            <Plus size={28} className="text-white" strokeWidth={2.5} />
          </button>

          {/* Botón de Estadísticas (BarChart) - Derecha */}
          <button
            onClick={handleStatsClick}
            className="w-14 h-14 bg-black rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            aria-label="Ver estadísticas"
          >
            <BarChart3 size={20} className="text-white" strokeWidth={2.5} />
          </button>

        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;