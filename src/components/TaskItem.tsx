
import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Timer, CheckCircle, Circle, Code, Book, Dumbbell, Coffee, Target, Star, Zap, Trophy, Trash2, FileText } from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  targetTime?: number; // en minutos
  actualTime?: number; // en minutos
  category?: 'work' | 'study' | 'exercise' | 'personal' | 'project'; // Nueva propiedad para categorías
  notes?: string; // Notas adicionales de la tarea
}

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onStartTimer: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

// Función para obtener el icono y colores según la categoría
const getTaskVisuals = (category?: string) => {
  switch (category) {
    case 'work':
      return {
        icon: Code,
        bgGradient: 'from-blue-500 to-white',
        bgLight: 'bg-blue-50',
        iconBg: 'bg-blue-500',
        textColor: 'text-blue-600'
      };
    case 'study':
      return {
        icon: Book,
        bgGradient: 'from-green-500 to-emerald-600',
        bgLight: 'bg-green-50',
        iconBg: 'bg-green-500',
        textColor: 'text-green-600'
      };
    case 'exercise':
      return {
        icon: Dumbbell,
        bgGradient: 'from-orange-500 to-red-600',
        bgLight: 'bg-orange-50',
        iconBg: 'bg-orange-500',
        textColor: 'text-orange-600'
      };
    case 'personal':
      return {
        icon: Coffee,
        bgGradient: 'from-pink-500 to-rose-600',
        bgLight: 'bg-pink-50',
        iconBg: 'bg-pink-500',
        textColor: 'text-pink-600'
      };
    case 'project':
      return {
        icon: Target,
        bgGradient: 'from-white to-gray-200',
        bgLight: 'bg-gray-50',
        iconBg: 'bg-white',
        textColor: 'text-gray-800'
      };
    default:
      return {
        icon: Star,
        bgGradient: 'from-gray-500 to-gray-600',
        bgLight: 'bg-gray-50',
        iconBg: 'bg-gray-500',
        textColor: 'text-gray-600'
      };
  }
};

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onComplete, 
  onStartTimer, 
  onDelete,
  className 
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);

  // Track Shiny theme to render special checkbox visuals only in Shiny
  const [isShiny, setIsShiny] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('shiny') : false
  );
  React.useEffect(() => {
    const el = document.documentElement;
    const update = () => setIsShiny(el.classList.contains('shiny'));
    update();
    const obs = new MutationObserver(update);
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const SWIPE_THRESHOLD = 80; // Distancia mínima para activar la eliminación
  const DELETE_THRESHOLD = 120; // Distancia para mostrar el botón de eliminar
  const LONG_PRESS_DURATION = 800; // Duración del long press en milisegundos

  const visuals = getTaskVisuals(task.category);
  const IconComponent = visuals.icon;

  const startLongPress = () => {
    if (task.notes) {
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
    cancelLongPress(); // Cancelar long press al terminar el toque
    
    if (swipeOffset > SWIPE_THRESHOLD && onDelete) {
      // Si el deslizamiento supera el umbral, eliminar la tarea
      onDelete(task.id);
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
    cancelLongPress(); // Cancelar long press al terminar el clic
    
    if (swipeOffset > SWIPE_THRESHOLD && onDelete) {
      onDelete(task.id);
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
    <div className={cn('relative mb-3', className)}>
      {/* Fondo rojo de eliminación */}
      <div 
        className={`absolute inset-0 bg-red-500 rounded-lg flex items-center justify-end pr-6 transition-opacity duration-200 ${
          showDeleteButton ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Trash2 size={24} className="text-white" />
      </div>

      {/* Tarjeta principal */}
      <Card 
        ref={cardRef}
        className={cn(
          'relative overflow-hidden p-0 transition-all border-2 hover:shadow-lg transform hover:scale-[1.02] dark:!border-white', 
          task.completed ? 'opacity-70 border-gray-300' : 'border-gray-200 hover:border-gray-300'
        )}
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          userSelect: isDragging ? 'none' : 'auto'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseEnd}
        onMouseLeave={handleMouseEnd}
      >
        {/* Barra de color lateral inspirada en Brawl Stars */}
        <div className={cn('absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b', visuals.bgGradient)} />
        
        <div className="p-4 pl-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Icono personalizado de la categoría */}
              <div
                className={cn(
                  'flex-shrink-0 mt-1 task-shape-border rounded-xl',
                  task.completed ? 'opacity-60' : ''
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    visuals.iconBg
                  )}
                >
                  <IconComponent size={20} className="text-white" />
                </div>
              </div>
              
              {/* Checkbox de completado */}
              <button 
                onClick={() => !isDragging && swipeOffset === 0 && onComplete(task.id)}
                className="mt-1 hover:scale-110 transition-transform task-check"
                aria-label={task.completed ? 'Marcar como no completada' : 'Marcar como completada'}
              >
                {task.completed ? (
                  isShiny ? (
                    <CheckCircle size={28} className="text-white" />
                  ) : (
                    <CheckCircle size={28} className="text-green-500" />
                  )
                ) : (
                  isShiny ? (
                    <Circle size={28} className="text-white" />
                  ) : (
                    <Circle size={28} className="text-gray-400 hover:text-gray-600" />
                  )
                )}
              </button>
              
              <div className={cn('transition-all flex-1', task.completed ? 'opacity-60 line-through' : '')}>
                <h3 className="font-semibold text-gray-800 mb-1 text-sm">{task.title}</h3>
                {task.description && (
                  <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                )}
                
                {/* Badge de categoría */}
                {task.category && (
                  <span className={cn(
                    'inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2',
                    visuals.bgLight,
                    visuals.textColor
                  )}>
                    {task.category.toUpperCase()}
                  </span>
                )}
                
                {/* Etiqueta de notas */}
                {task.notes && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-2 rounded-r">
                    <div className="flex items-center">
                      <FileText size={14} className="text-yellow-600 mr-2 flex-shrink-0" />
                      <p className="text-xs text-yellow-800 line-clamp-2">
                        {task.notes.length > 80 ? `${task.notes.substring(0, 80)}...` : task.notes}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Información de tiempo con iconos */}
                {task.targetTime && (
                  <div className="flex items-center text-xs text-gray-500 space-x-3">
                    <div className="flex items-center">
                      <Target size={12} className="mr-1" />
                      <span>Meta: {task.targetTime} min</span>
                    </div>
                    {task.actualTime && (
                      <div className="flex items-center">
                        {task.actualTime > task.targetTime ? (
                                                    <>
                             <Zap size={12} className="mr-1 text-orange-500" />
                             <span className="text-orange-600 inline-flex items-center">
                              +{task.actualTime - task.targetTime} min
                              <img src="/lovable-uploads/lightbulb-icon.svg" alt="Extra" className="w-3 h-3 mx-1" />
                              extra
                            </span>
                          </>
                        ) : (
                          <>
                            <Trophy size={12} className="mr-1 text-green-500" />
                            <span className="text-green-600">{task.actualTime} min</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Botón de iniciar con diseño mejorado */}
            {!task.completed && (
              <Button 
                size="sm" 
                className={cn(
                  'ml-3 font-medium shadow-md hover:shadow-lg transition-all',
                  'bg-gradient-to-r', visuals.bgGradient,
                  'text-white border-0 hover:scale-105'
                )}
                onClick={() => !isDragging && swipeOffset === 0 && onStartTimer(task.id)}
              >
                <Timer size={16} className="mr-1" />
                Iniciar
              </Button>
            )}
          </div>
        </div>
        
        {/* Efecto de brillo sutil cuando está completada */}
        {task.completed && (
          <div className="absolute top-2 right-2">
            <Trophy size={16} className="text-yellow-500" />
          </div>
        )}
        
        {/* Indicador de notas */}
        {task.notes && (
          <div className="absolute top-2 left-2">
            <FileText size={12} className="text-gray-400" />
          </div>
        )}
      </Card>
      
      {/* Modal de notas */}
      {showNotes && task.notes && (
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
              <h4 className="font-medium text-gray-700 mb-2">{task.title}</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{task.notes}</p>
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

export default TaskItem;
