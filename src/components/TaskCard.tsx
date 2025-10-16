
import React, { useState, useRef, useCallback } from 'react';
import { Pencil, Calendar, ShoppingCart, CheckCircle, Heart, Trash2, Clock, FileText, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { TaskType } from '@/types';
import ShapeIcon from './ShapeIcon';
import { useTheme } from '@/hooks/useTheme';

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
  scheduledTime, 
  subtasks, 
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
  const [isDeleting, setIsDeleting] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const longPressTimer = useRef<number | null>(null);
  
  // const { playTaskDeleteSound } = useSoundEffects(); // Ya no se usa
  const { isDark, isShiny } = useTheme();
  const { triggerVibration, playTaskCompleteSound } = useSoundEffects();
  const shapeColor = isShiny ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000');

  const SWIPE_THRESHOLD = 80; // Distancia mínima para activar la eliminación
  const DELETE_THRESHOLD = 120; // Distancia para mostrar el botón de eliminar
  const LONG_PRESS_DURATION = 800; // Duración del long press en milisegundos

  const getTypeIcon = () => {
    switch (type) {
      case 'productividad':
        return <ShapeIcon variant="square" className="w-8 h-8" title="Trabajo" color={shapeColor} />;
      case 'creatividad':
        return <ShapeIcon variant="triangle" className="w-8 h-8" title="Creatividad" color={shapeColor} />;
      case 'salud':
        return <ShapeIcon variant="heart" className="w-8 h-8" title="Salud" color={shapeColor} />;
      case 'organizacion':
        return <ShapeIcon variant="diamond" className="w-8 h-8" title="Organización" color={shapeColor} />;
      case 'social':
        return <ShapeIcon variant="triangle" className="w-8 h-8" title="Social" color={shapeColor} />;
      case 'aprendizaje':
        return <ShapeIcon variant="triangle" className="w-8 h-8" title="Aprendizaje" color={shapeColor} />;
      case 'entretenimiento':
        return <ShapeIcon variant="triangle" className="w-8 h-8" title="Entretenimiento" color={shapeColor} />;
      case 'extra':
        return <ShapeIcon variant="diamond" className="w-8 h-8" title="Extra" color={shapeColor} />;
      default:
        return <div className="w-5 h-5 border" style={{ borderColor: shapeColor }} />;
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

  const handleCheckboxToggle = () => {
    if (!completed) {
      triggerVibration();
      playTaskCompleteSound();
    }
    onToggle(id);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // No iniciar drag si se hace touch en el checkbox
    if ((e.target as HTMLElement).closest('.task-checkbox-button')) {
      return;
    }
    
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsDragging(false);
    startLongPress();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX.current) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = startX.current - currentX.current;
    
    if (Math.abs(deltaX) > 10) {
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

  const handleTouchEnd = () => {
    // Cancelar long press siempre cuando se suelta el input
    cancelLongPress();
    
    if (swipeOffset > SWIPE_THRESHOLD && onDelete) {
      // Iniciar animación de eliminación
      setIsDeleting(true);
      // Sin sonido al eliminar - solo animación
      
      // Esperar a que termine la animación antes de eliminar
      setTimeout(() => {
        onDelete(id);
      }, 600);
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
    // No iniciar drag si se hace click en el checkbox
    if ((e.target as HTMLElement).closest('.task-checkbox-button')) {
      return;
    }
    
    startX.current = e.clientX;
    currentX.current = e.clientX;
    setIsDragging(false);
    startLongPress();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!startX.current || e.buttons !== 1) return;
    
    currentX.current = e.clientX;
    const deltaX = startX.current - currentX.current;
    
    if (Math.abs(deltaX) > 10) {
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
      // Iniciar animación de eliminación
      setIsDeleting(true);
      // Sin sonido al eliminar - solo animación
      
      // Esperar a que termine la animación antes de eliminar
      setTimeout(() => {
        onDelete(id);
      }, 600);
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
      {/* Fondo de eliminación - color blanco con icono negro */}
      <div 
        className={`absolute inset-0 bg-white rounded-lg flex items-center justify-end pr-6 transition-opacity duration-200 ${
          showDeleteButton ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Trash2 size={24} className="text-black" />
      </div>
      
      {/* Tarjeta principal */}
      <div 
        ref={cardRef}
        className={`border border-gray-200 dark:border-white rounded-lg p-4 transition-all duration-600 ease-out transform dark:hover:border-white ${
          completed ? 'opacity-40' : 'hover:border-black'
        } ${onShowDetail && !isDragging ? 'cursor-pointer' : ''} ${
          isDeleting 
            ? 'bg-black border-black animate-pulse' 
            : 'bg-white dark:bg-black'
        }`}
        style={{
          transform: `translateX(-${swipeOffset}px) ${isDeleting ? 'scale(0.95)' : 'scale(1)'}`,
          userSelect: isDragging ? 'none' : 'auto',
          transition: isDeleting 
            ? 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' 
            : 'all 0.2s ease-out'
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
              <div className="task-shape-border rounded-xl">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  {getTypeIcon()}
                </div>
              </div>
            </div>
            
            {/* Texto de la tarea y hora */}
            <div className="flex-1 mr-4 ml-6">
              <span 
                className={`text-lg font-normal transition-all duration-300 ${
                  isDeleting
                    ? 'text-white'
                    : completed 
                      ? 'line-through text-gray-400' 
                      : 'text-black dark:text-white'
                }`} style={{ fontFamily: 'Poppins, ui-sans-serif, system-ui, -apple-system, sans-serif' }}
              >
                {title.trim() || 'Tarea sin título'}
              </span>
              
              {/* Mostrar hora si está disponible */}
              {scheduledTime && (
                <div className="flex items-center mt-1 space-x-1">
                  <Clock size={14} className={`${
                    isDeleting 
                      ? 'text-white' 
                      : completed 
                        ? 'text-gray-400' 
                        : 'text-gray-500'
                  }`} />
                  <span 
                    className={`text-sm font-varela ${
                      isDeleting 
                        ? 'text-white' 
                        : completed 
                          ? 'text-gray-400' 
                          : 'text-gray-500'
                    }`}
                  >
                    {scheduledTime}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Checkbox - solo mostrar si no hay subtareas */}
          {(!subtasks || subtasks.length === 0) && (
            <div 
              className="ml-3 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={handleCheckboxToggle}
            >
              {completed ? (
                <div className="task-checkbox-button completed w-6 h-6 rounded-full cursor-pointer transition-all duration-200"></div>
              ) : (
                <div className="task-checkbox-button w-6 h-6 rounded-full cursor-pointer transition-all duration-200"></div>
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
                    } font-varela`}
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
          <div className="bg-gray-200 dark:bg-gray-300 border-l-4 border-gray-300 dark:border-gray-400 p-2 mt-3 rounded-r">
            <div className="flex items-center">
              <FileText
                size={14}
                className="mr-2 flex-shrink-0 !text-black dark:!text-black"
              />
              <p
                className="text-xs line-clamp-2 !text-black dark:!text-black"
                style={{ color: '#000' }}
              >
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
