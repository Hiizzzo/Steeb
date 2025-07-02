
import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingButtonsProps {
  onAddTask: () => void;
  onShowTasks: () => void;
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({ onAddTask }) => {
  return (
    <div className="fixed bottom-6 left-4 right-4">
      {/* Botón "+ Add Task" que ocupa todo el ancho */}
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
