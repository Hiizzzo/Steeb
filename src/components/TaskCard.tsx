
import React from 'react';
import { Star, User, Smile, Zap } from 'lucide-react';

interface TaskCardProps {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
  onToggle: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ id, title, type, completed, onToggle }) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'personal':
        return <User size={20} className="text-black" />;
      case 'work':
        return <Zap size={20} className="text-black" />;
      case 'meditation':
        return <Smile size={20} className="text-black" />;
      default:
        return <Star size={20} className="text-black" />;
    }
  };

  const handleToggle = () => {
    onToggle(id);
  };

  return (
    <div 
      className={`bg-white border-3 border-black rounded-2xl p-4 mb-4 mx-4 shadow-lg transform transition-all duration-300 ease-in-out cursor-pointer ${
        completed 
          ? 'opacity-60 bg-gray-50 scale-95 translate-x-2' 
          : 'hover:scale-105 hover:shadow-xl'
      }`}
      onClick={handleToggle}
      style={{ 
        borderWidth: '3px',
        boxShadow: completed 
          ? '2px 2px 0px rgba(0, 0, 0, 0.2)' 
          : '4px 4px 0px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="flex items-center justify-between">
        {/* Estrella + Texto */}
        <div className="flex items-center space-x-4">
          {/* Nube con estrella */}
          <div className="relative">
            <div className={`w-12 h-8 bg-white border-3 border-black rounded-full relative transition-all duration-300 ${
              completed ? 'opacity-60' : ''
            }`}>
              {/* Mini nubes decorativas */}
              <div className="absolute -left-1 top-1 w-3 h-3 bg-white border-2 border-black rounded-full"></div>
              <div className="absolute -right-1 bottom-1 w-2 h-2 bg-white border-2 border-black rounded-full"></div>
            </div>
            {/* Estrella en el centro */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Star 
                size={16} 
                className={`transition-all duration-300 ${
                  completed 
                    ? 'text-green-500 fill-current scale-110' 
                    : 'text-black fill-current'
                }`} 
              />
            </div>
          </div>
          
          {/* Texto de la tarea con animación */}
          <span 
            className={`text-lg font-bold transition-all duration-300 ease-in-out ${
              completed 
                ? 'line-through text-gray-400 transform translate-x-1' 
                : 'text-black'
            }`}
          >
            {title}
          </span>
        </div>
        
        {/* Ícono del tipo con animación */}
        <div 
          className={`p-2 rounded-full border-2 border-black transition-all duration-300 ${
            completed 
              ? 'bg-gray-100 opacity-60 scale-90' 
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className={`transition-all duration-300 ${completed ? 'opacity-60' : ''}`}>
            {getTypeIcon()}
          </div>
        </div>
      </div>
      
      {/* Indicador visual de completado */}
      {completed && (
        <div className="absolute top-2 right-2 animate-bounce-light">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
