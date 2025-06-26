
import React from 'react';
import { Plus, CheckSquare } from 'lucide-react';

interface FloatingButtonsProps {
  onAddTask: () => void;
  onShowTasks: () => void;
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({ onAddTask, onShowTasks }) => {
  return (
    <div className="fixed bottom-6 right-6 flex space-x-3">
      {/* Botón de lista de tareas */}
      <button
        onClick={onShowTasks}
        className="w-14 h-14 bg-white border-3 border-black rounded-full flex items-center justify-center shadow-lg transform transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ 
          borderWidth: '3px',
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="grid grid-cols-2 gap-1">
          <div className="w-1 h-1 bg-black rounded-full"></div>
          <div className="w-2 h-0.5 bg-black"></div>
          <div className="w-1 h-1 bg-black rounded-full"></div>
          <div className="w-2 h-0.5 bg-black"></div>
          <div className="w-1 h-1 bg-black rounded-full"></div>
          <div className="w-2 h-0.5 bg-black"></div>
        </div>
      </button>
      
      {/* Botón principal de agregar */}
      <button
        onClick={onAddTask}
        className="w-16 h-16 bg-white border-3 border-black rounded-full flex items-center justify-center shadow-lg transform transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ 
          borderWidth: '3px',
          boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)'
        }}
      >
        <Plus size={28} className="text-black font-bold" />
      </button>
    </div>
  );
};

export default FloatingButtons;
