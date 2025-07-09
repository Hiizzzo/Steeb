
import React, { useState, useRef } from 'react';
import { Pencil, Calendar, ShoppingCart, CheckCircle, Circle, Trash2, Clock } from 'lucide-react';

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
  scheduledDate?: string;
  scheduledTime?: string;
  onToggle: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onDelete?: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  id, 
  title, 
  type, 
  completed, 
  subtasks, 
  scheduledDate,
  scheduledTime,
  onToggle, 
  onToggleSubtask, 
  onDelete 
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 80; // Distancia mínima para activar la eliminación
  const DELETE_THRESHOLD = 120; // Distancia para mostrar el botón de eliminar

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
    if (!isDragging && swipeOffset === 0) {
      onToggle(id);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX.current) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = startX.current - currentX.current;
    
    if (deltaX > 10) {
      setIsDragging(true);
      e.preventDefault();
      
      // Solo permitir deslizamiento hacia la izquierda
      if (deltaX > 0) {
        const newOffset = Math.min(deltaX, 150);
        setSwipeOffset(newOffset);
        setShowDeleteButton(newOffset > DELETE_THRESHOLD);
      }
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > SWIPE_THRESHOLD && onDelete) {
      // Si el deslizamiento supera el umbral, eliminar la tarea
      onDelete(id);
    } else {
      // Si no, volver a la posición original
      setSwipeOffset(0);
      setShowDeleteButton(false);
    }
    
    setTimeout(() => {
      setIsDragging(false);
    }, 100);
    
    startX.current = 0;
    currentX.current = 0;
  };

  const handleMouseStart = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    currentX.current = e.clientX;
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!startX.current || e.buttons !== 1) return;
    
    currentX.current = e.clientX;
    const deltaX = startX.current - currentX.current;
    
    if (deltaX > 10) {
      setIsDragging(true);
      e.preventDefault();
      
      if (deltaX > 0) {
        const newOffset = Math.min(deltaX, 150);
        setSwipeOffset(newOffset);
        setShowDeleteButton(newOffset > DELETE_THRESHOLD);
      }
    }
  };

  const handleMouseEnd = () => {
    if (swipeOffset > SWIPE_THRESHOLD && onDelete) {
      onDelete(id);
    } else {
      setSwipeOffset(0);
      setShowDeleteButton(false);
    }
    
    setTimeout(() => {
      setIsDragging(false);
    }, 100);
    
    startX.current = 0;
    currentX.current = 0;
  };

  return (
    <div className="relative mx-4 mb-3">
      {/* Fondo negro de eliminación */}
      <div 
        className={`absolute inset-0 bg-black rounded-lg flex items-center justify-end pr-6 transition-opacity duration-200 ${
          showDeleteButton ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Trash2 size={24} className="text-white" />
      </div>
      
      {/* Tarjeta principal */}
      <div 
        ref={cardRef}
        className={`bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200 ease-out transform ${
          completed ? 'opacity-40' : 'hover:border-black'
        } ${(!subtasks || subtasks.length === 0) && !isDragging ? 'cursor-pointer' : ''}`}
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          userSelect: isDragging ? 'none' : 'auto'
        }}
        onClick={(!subtasks || subtasks.length === 0) ? handleToggle : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseEnd}
        onMouseLeave={handleMouseEnd}
      >
        <div className="flex items-center justify-between">
          {/* Icono + Texto */}
          <div className="flex items-center space-x-3 flex-1">
            {/* Icono del tipo */}
            <div className={`transition-all duration-300 ${completed ? 'opacity-60' : ''}`}>
              {getTypeIcon()}
            </div>
            
            {/* Texto de la tarea y hora */}
            <div className="flex-1">
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
              
              {/* Mostrar hora si está disponible */}
              {scheduledTime && (
                <div className="flex items-center mt-1 space-x-1">
                  <Clock size={14} className={`${completed ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span 
                    className={`text-sm ${completed ? 'text-gray-400' : 'text-gray-500'}`}
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  >
                    {scheduledTime}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Checkbox - solo mostrar si no hay subtareas */}
          {(!subtasks || subtasks.length === 0) && (
            <div className="ml-3">
              {completed ? (
                <div className="w-6 h-6 bg-black border-2 border-black rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              ) : (
                <Circle size={24} className="text-gray-300 hover:text-black transition-colors" />
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
                  if (!isDragging && swipeOffset === 0) {
                    e.stopPropagation();
                    onToggleSubtask?.(id, subtask.id);
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  {subtask.completed ? (
                    <div className="w-3 h-3 bg-black border border-black rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  ) : (
                    <div className="w-3 h-3 border border-gray-300 rounded-full"></div>
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
    </div>
  );
};

export default TaskCard;
