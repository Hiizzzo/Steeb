
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

  return (
    <div 
      className={`bg-white border-3 border-black rounded-2xl p-4 mb-4 mx-4 shadow-lg transform transition-all duration-200 hover:scale-105 cursor-pointer ${
        completed ? 'opacity-60 bg-gray-50' : ''
      }`}
      onClick={() => onToggle(id)}
      style={{ 
        borderWidth: '3px',
        boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="flex items-center justify-between">
        {/* Estrella + Texto */}
        <div className="flex items-center space-x-4">
          {/* Nube con estrella */}
          <div className="relative">
            <div className="w-12 h-8 bg-white border-3 border-black rounded-full relative">
              {/* Mini nubes decorativas */}
              <div className="absolute -left-1 top-1 w-3 h-3 bg-white border-2 border-black rounded-full"></div>
              <div className="absolute -right-1 bottom-1 w-2 h-2 bg-white border-2 border-black rounded-full"></div>
            </div>
            {/* Estrella en el centro */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Star size={16} className={`${completed ? 'text-gray-400' : 'text-black'} fill-current`} />
            </div>
          </div>
          
          {/* Texto de la tarea */}
          <span className={`text-lg font-bold ${completed ? 'line-through text-gray-400' : 'text-black'}`}>
            {title}
          </span>
        </div>
        
        {/* Ícono del tipo */}
        <div className={`p-2 rounded-full border-2 border-black ${completed ? 'bg-gray-100' : 'bg-white'}`}>
          {getTypeIcon()}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
