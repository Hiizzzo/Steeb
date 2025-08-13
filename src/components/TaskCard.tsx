
import React, { useState, useRef } from 'react';
import { Pencil, Calendar, ShoppingCart, CheckCircle, Circle, Trash2, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskType } from '@/types';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskCardProps {
  id: string;
  title: string;
  type: TaskType;
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  notes?: string;
  onToggle: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onDelete?: (id: string) => void;
  onShowDetail?: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  id, 
  title, 
  type, 
  completed, 
  subtasks, 
  scheduledDate,
  scheduledTime,
  notes,
  onToggle, 
  onToggleSubtask, 
  onDelete,
  onShowDetail 
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);

  const SWIPE_THRESHOLD = 80; // Distancia mínima para activar la eliminación
  const DELETE_THRESHOLD = 120; // Distancia para mostrar el botón de eliminar
  const LONG_PRESS_DURATION = 800; // Duración del long press en milisegundos

  const getTypeIcon = () => {
    switch (type) {
      case 'productividad':
        return <div className="w-5 h-5 border border-black" />;
      case 'creatividad':
        return <img src="/lovable-uploads/creatividad-icon.svg" alt="Creatividad" className="w-18 h-18" />;
      case 'aprendizaje':
        return <div className="w-5 h-5 border border-black rounded" />;
      case 'organizacion':
        return <div className="w-5 h-5 border-black border-l-4" />;
      case 'salud':
        return <div className="w-5 h-5 border-black border-b-4" />;
      case 'social':
        return <div className="w-5 h-5 border border-black rounded-full" />;
      case 'entretenimiento':
        return <div className="w-5 h-5 border border-black border-dashed" />;
      case 'extra':
        return <div className="w-5 h-5 bg-black" />;
      default:
        return <div className="w-5 h-5 border border-black" />;
    }
  };

  const startLongPress = () => {
    if (notes) {
      longPressTimer.current = window.setTimeout(() => {
        setShowNotes(true);
      }, LONG_PRESS_DURATION);
    }
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleToggle = () => {
    if (!isDragging && swipeOffset === 0) {
      if (onShowDetail) {
        onShowDetail(id);
      } else {
        onToggle(id);
      }
    }
  };

  const handleCheckboxToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging && swipeOffset === 0) {
      onToggle(id);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsDragging(false);
    startLongPress();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX.current) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = startX.current - currentX.current;
    
    if (deltaX > 10) {
      setIsDragging(true);
      e.preventDefault();
      cancelLongPress(); // Cancelar long press si se está deslizando
      
      // Solo permitir deslizamiento hacia la izquierda
      if (deltaX > 0) {
        const newOffset = Math.min(deltaX, 150);
        setSwipeOffset(newOffset);
        setShowDeleteButton(newOffset > DELETE_THRESHOLD);
      }
    }
  };

  const handleTouchEnd = () => {
    // Cancelar long press siempre cuando se suelta el input
    cancelLongPress();
    
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
    startLongPress();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!startX.current || e.buttons !== 1) return;
    
    currentX.current = e.clientX;
    const deltaX = startX.current - currentX.current;
    
    if (deltaX > 10) {
      setIsDragging(true);
      e.preventDefault();
      cancelLongPress(); // Cancelar long press si se está deslizando
      
      if (deltaX > 0) {
        const newOffset = Math.min(deltaX, 150);
        setSwipeOffset(newOffset);
        setShowDeleteButton(newOffset > DELETE_THRESHOLD);
      }
    }
  };

  const handleMouseEnd = () => {
    // Cancelar long press siempre cuando se suelta el input
    cancelLongPress();
    
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
    <div className="relative mb-3">
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
        } ${onShowDetail && !isDragging ? 'cursor-pointer' : ''}`}
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          userSelect: isDragging ? 'none' : 'auto'
        }}
        onClick={onShowDetail ? handleToggle : undefined}
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
                {title.trim() || 'Tarea sin título'}
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
            <div className="ml-3" onClick={handleCheckboxToggle}>
              {completed ? (
                <div className="w-6 h-6 bg-black border-2 border-black rounded-full flex items-center justify-center cursor-pointer">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              ) : (
                <Circle size={24} className="text-gray-300 hover:text-black transition-colors cursor-pointer" />
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
        
        {/* Etiqueta de notas */}
        {notes && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mt-3 rounded-r">
            <div className="flex items-center">
              <FileText size={14} className="text-yellow-600 mr-2 flex-shrink-0" />
              <p className="text-xs text-yellow-800 line-clamp-2">
                {notes.length > 80 ? `${notes.substring(0, 80)}...` : notes}
              </p>
            </div>
          </div>
        )}
        
        {/* Indicador de notas */}
        {notes && (
          <div 
            className="absolute top-2 right-2 cursor-pointer hover:text-gray-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowNotes(true);
            }}
          >
            <FileText size={12} className="text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Modal de notas */}
      {showNotes && notes && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowNotes(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 mx-4 max-w-md w-full shadow-xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Notas de la tarea</h3>
              <button
                onClick={() => setShowNotes(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">{title}</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{notes}</p>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setShowNotes(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
