
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BarChart3, Calendar, List } from 'lucide-react';

interface FloatingButtonsProps {
  onAddTask: () => void;
  onShowTasks: () => void;
  onToggleView: () => void;
  viewMode: 'tasks' | 'calendar';
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({ onAddTask, onToggleView, viewMode }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 left-4 right-4 space-y-3">
      {/* Botón de Estadísticas */}
      <button
        onClick={() => navigate('/stats')}
        className="w-full bg-white border-2 border-black text-black py-3 px-4 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-200 hover:bg-gray-50 active:scale-98"
        style={{ 
          height: '48px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '0.5px'
        }}
      >
        <BarChart3 size={24} className="mr-2" />
        ESTADÍSTICAS
      </button>

      {/* Botón para cambiar vista */}
      <button
        onClick={onToggleView}
        className="w-full bg-gray-100 border-2 border-black text-black py-3 px-4 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-200 hover:bg-gray-200 active:scale-98"
        style={{ 
          height: '48px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '0.5px'
        }}
      >
        {viewMode === 'tasks' ? (
          <>
            <Calendar size={24} className="mr-2" />
            CALENDARIO
          </>
        ) : (
          <>
            <List size={24} className="mr-2" />
            TAREAS
          </>
        )}
      </button>
      
      {/* Botón "+ Add Task" */}
      <button
        onClick={onAddTask}
        className="w-full bg-black text-white py-3 px-4 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-200 hover:bg-gray-800 active:scale-98"
        style={{ 
          height: '48px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '0.5px'
        }}
      >
        <Plus size={24} className="mr-2" />
        ADD TASK
      </button>
    </div>
  );
};

export default FloatingButtons;
