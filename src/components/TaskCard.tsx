
import React from 'react';
import { Pencil, Calendar, ShoppingCart, CheckCircle, Circle } from 'lucide-react';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskCardProps {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
  subtasks?: SubTask[];
  onToggle: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ id, title, type, completed, subtasks, onToggle, onToggleSubtask }) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'personal':
        return <ShoppingCart size={20} className="text-black" />;
      case 'work':
        return <Pencil size={20} className="text-black" />;
      case 'meditation':
        return <Calendar size={20} className="text-black" />;
      default:
        return <Pencil size={20} className="text-black" />;
    }
  };

  const handleToggle = () => {
    onToggle(id);
  };

  return (
    <div 
      className={`bg-white border border-gray-300 rounded-xl p-4 mx-4 mb-3 transition-all duration-300 ${
        completed ? 'opacity-60' : 'hover:border-gray-400'
      } ${(!subtasks || subtasks.length === 0) ? 'cursor-pointer' : ''}`}
      onClick={(!subtasks || subtasks.length === 0) ? handleToggle : undefined}
    >
      <div className="flex items-center justify-between">
        {/* Icono + Texto */}
        <div className="flex items-center space-x-3 flex-1">
          {/* Icono del tipo */}
          <div className={`transition-all duration-300 ${completed ? 'opacity-60' : ''}`}>
            {getTypeIcon()}
          </div>
          
          {/* Texto de la tarea */}
          <span 
            className={`text-lg font-medium transition-all duration-300 ${
              completed 
                ? 'line-through text-gray-400' 
                : 'text-black'
            }`}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {title}
          </span>
        </div>
        
        {/* Checkbox - solo mostrar si no hay subtareas */}
        {(!subtasks || subtasks.length === 0) && (
          <div className="ml-3">
            {completed ? (
              <div className="w-6 h-6 bg-green-100 border-2 border-black rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            ) : (
              <Circle size={24} className="text-gray-400 hover:text-black transition-colors" />
            )}
          </div>
        )}
      </div>
      
      {/* Subtareas */}
      {subtasks && subtasks.length > 0 && (
        <div className="mt-3 ml-8">
          {subtasks.map((subtask) => (
            <div 
              key={subtask.id} 
              className="flex items-center space-x-2 mb-1 cursor-pointer hover:bg-gray-50 rounded p-1 -ml-1"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSubtask?.(id, subtask.id);
              }}
            >
              <div className="flex items-center space-x-2">
                {subtask.completed ? (
                  <div className="w-3 h-3 bg-green-100 border border-green-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-3 h-3 border border-gray-400 rounded-full"></div>
                )}
                <span 
                  className={`text-sm transition-all duration-300 ${
                    subtask.completed 
                      ? 'line-through text-gray-400' 
                      : 'text-black'
                  }`}
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  {subtask.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
