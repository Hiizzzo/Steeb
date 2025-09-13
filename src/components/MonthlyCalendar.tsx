import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flame, CheckCircle, Calendar, Trophy, Plus, ArrowLeft, Clock, MapPin, Trash2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '@/store/useTaskStore';
import ShapeIcon from './ShapeIcon';
import TaskCreationCard from './TaskCreationCard';
// import CompactStats from './CompactStats';  // Component not found
import type { RecurrenceRule, Task, SubTask } from '@/types';


interface MonthlyCalendarProps {
  tasks?: Task[];
  onToggleTask?: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onAddTask?: () => void;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ 
  tasks = [], 
  onToggleTask,
  onToggleSubtask,
  onAddTask 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [backAnimating, setBackAnimating] = useState(false);
  const navigate = useNavigate();

  // Swipe-to-delete (lista principal) con Pointer Events (sin long-press)
  const { deleteTask, updateTask } = useTaskStore();
  const SWIPE_THRESHOLD = 60; // Reducido para hacer más fácil el swipe
  const MAX_SWIPE = 160;
  const [disableDayDrag, setDisableDayDrag] = useState(false);
  const [swipeOffsetById, setSwipeOffsetById] = useState<Record<string, number>>({});
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const activeIdRef = useRef<string | null>(null);
  const startXRef = useRef(0);
  const LONG_PRESS_MS = 600;
  const MOVE_CANCEL_PX = 8;
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const onPointerDownSwipe = (id: string) => (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    activeIdRef.current = id;
    startXRef.current = e.clientX;
    document.body.style.userSelect = 'none';
    longPressTriggeredRef.current = false;
    setDisableDayDrag(true);
    cancelLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      const t = tasks.find(t => t.id === id) || null;
      if (t) {
        setEditingTask(t);
        setShowEditModal(true);
      }
    }, LONG_PRESS_MS) as unknown as number;
  };

  const onPointerMoveSwipe = (id: string) => (e: React.PointerEvent) => {
    if (activeIdRef.current !== id) return;
    const deltaX = startXRef.current - e.clientX;
    if (Math.abs(deltaX) > MOVE_CANCEL_PX) cancelLongPress();
    if (deltaX > 0) {
      e.preventDefault();
      const next = Math.min(deltaX, MAX_SWIPE);
      setSwipeOffsetById(prev => ({ ...prev, [id]: next }));
    }
  };

  const finishRowSwipe = (id: string) => {
    const offset = swipeOffsetById[id] || 0;
    if (offset > SWIPE_THRESHOLD) deleteTask(id).catch(console.error);
    setSwipeOffsetById(prev => ({ ...prev, [id]: 0 }));
    activeIdRef.current = null;
    setDisableDayDrag(false);
    document.body.style.userSelect = '';
  };

  const onPointerUpSwipe = (id: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    cancelLongPress();
    finishRowSwipe(id);
  };

  const handleEditTask = (
    title: string,
    type: Task['type'],
    subtasks?: SubTask[],
    scheduledDate?: string,
    scheduledTime?: string,
    notes?: string,
    _isPrimary?: boolean,
    recurrence?: RecurrenceRule
  ) => {
    if (editingTask) {
      const updatedTask = {
        ...editingTask,
        title,
        type,
        subtasks,
        scheduledDate,
        scheduledTime,
        notes,
        recurrence
      };
      // Actualizar la tarea en el store
      updateTask(editingTask.id, updatedTask);
      setShowEditModal(false);
      setEditingTask(null);
    }
  };

  const renderTypeShape = (type: Task['type']) => {
    const isShiny = document.documentElement.classList.contains('shiny');
    
    // Función para obtener el color específico del icono
    const getIconColor = () => {
      if (isShiny) {
        switch (type) {
          case 'productividad':
            return '#FF0088'; // Rosa
          case 'salud':
            return '#8800FF'; // Violeta
          case 'social':
            return '#4444FF'; // Azul
          default:
            return '#FFFFFF';
        }
      }
      return '#000000'; // Negro puro para mejor contraste en modo claro
    };
    
    const iconColor = getIconColor();
    
    switch (type) {
      case 'productividad':
        return <ShapeIcon variant="square" className="w-4 h-4 mr-1" title="Trabajo" color={iconColor} />;
      case 'salud':
        return <ShapeIcon variant="heart" className="w-4 h-4 mr-1" title="Salud" color={iconColor} />;
      case 'social':
        return <ShapeIcon variant="triangle" className="w-4 h-4 mr-1" title="Social" color={iconColor} />;
      case 'organizacion':
        return <ShapeIcon variant="diamond" className="w-4 h-4 mr-1" title="Organización" color={iconColor} />;
      case 'aprendizaje':
      case 'creatividad':
      case 'entretenimiento':
        return <ShapeIcon variant="triangle" className="w-4 h-4 mr-1" title={type} color={iconColor} />;
      case 'extra':
        return <ShapeIcon variant="diamond" className="w-4 h-4 mr-1" title="Extra" color={iconColor} />;
      default:
        return <div className="w-4 h-4 mr-1 border" style={{ borderColor: iconColor }} />;
    }
  };

  // Helpers para fechas locales (evitar desfase por UTC)
  const toLocalDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const normalizeDateString = (input?: string): string | null => {
    if (!input) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input; // ya está normalizado
    const d = new Date(input);
    if (!isNaN(d.getTime())) return toLocalDateString(d);
    return null;
  };

  // Funciones para navegación del calendario
  const goToPreviousMonth = () => {
    setIsAnimating(true);
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const goToNextMonth = () => {
    setIsAnimating(true);
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const goToPreviousDay = () => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() - 1);
      setSelectedDate(newDate);
    }
  };

  const goToNextDay = () => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 1);
      setSelectedDate(newDate);
    }
  };

  // Obtener información del mes actual
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const monthName = monthNames[month];

  // Generar días del calendario
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Ajustar para que lunes sea 0, domingo sea 6
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    // Días del mes anterior
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        fullDate: new Date(year, month - 1, prevMonthDays - i)
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      
      days.push({
        day,
        isCurrentMonth: true,
        isToday,
        isSelected,
        fullDate: date
      });
    }

    // Días del mes siguiente
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        fullDate: new Date(year, month + 1, day)
      });
    }

    return days;
  };

  // Obtener tareas para una fecha específica
  const getTasksForDate = (date: Date) => {
    const dateString = toLocalDateString(date);
    const isToday = dateString === toLocalDateString(new Date());
    return tasks.filter(task => {
      const scheduledStr = normalizeDateString(task.scheduledDate);
      const completedStr = normalizeDateString(task.completedDate || undefined) || '';
      // Sin fecha se consideran para HOY (como en la vista de tareas)
      const noDateAsToday = !scheduledStr && isToday;
      const scheduledMatch = scheduledStr ? scheduledStr === dateString : noDateAsToday;
      const completedMatch = completedStr ? completedStr === dateString : false;
      return scheduledMatch || completedMatch;
    });
  };

  // Calcular progreso de tareas para un día específico
  const getTaskProgress = (date: Date) => {
    const dayTasks = getTasksForDate(date);
    
    if (dayTasks.length === 0) return 0;
    
    const completedTasks = dayTasks.filter(task => task.completed).length;
    return completedTasks / dayTasks.length;
  };

  // Obtener información detallada de tareas para tooltip
  const getTaskInfo = (date: Date) => {
    const dayTasks = getTasksForDate(date);
    
    if (dayTasks.length === 0) return { total: 0, completed: 0 };
    
    const completedTasks = dayTasks.filter(task => task.completed).length;
    return { total: dayTasks.length, completed: completedTasks };
  };

  // Obtener clase de color para la barra de progreso
  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200';
    if (progress <= 0.25) return 'bg-red-300';
    if (progress <= 0.5) return 'bg-yellow-400';
    if (progress <= 0.75) return 'bg-blue-400';
    return 'bg-green-500';
  };

  // Función para manejar clic en día
  const handleDayClick = (date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    
    setSelectedDate(date);
    setViewMode('day');
  };

  // Función para volver a la vista mensual
  const handleBackToMonth = () => {
    setViewMode('month');
    setSelectedDate(null);
  };

  // Función para agregar tarea en fecha específica
  const handleAddTaskOnDate = () => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      localStorage.setItem('steeb-selected-date', dateString);
      navigate('/');
    }
  };

  // Calcular estadísticas
  const stats = React.useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Calcular racha actual
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayTasks = tasks.filter(task => 
        task.completedDate && task.completedDate.split('T')[0] === dateStr
      );
      
      if (dayTasks.length > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const completedTasks = tasks.filter(task => task.completed).length;
    const uniqueActiveDays = new Set(
      tasks
        .filter(task => task.completedDate)
        .map(task => task.completedDate!.split('T')[0])
    ).size;

    return {
      streakDays: currentStreak,
      completedTasks,
      activeDays: uniqueActiveDays,
      bestStreak: currentStreak // Simplificado para este ejemplo
    };
  }, [tasks]);

  const calendarDays = generateCalendarDays();
  const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  // Vista de día
  if (viewMode === 'day' && selectedDate) {
    const selectedDateTasks = getTasksForDate(selectedDate);
    const formattedDate = selectedDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

      return (
         <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-md mx-auto">
          {/* Header de vista día */}
          <motion.div 
            className="sticky top-0 bg-white dark:bg-black z-20 px-2 sm:px-4 py-4 sm:py-6 border-b border-gray-100 dark:border-white/10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="relative rounded-full overflow-hidden">
                <motion.button
                  onClick={() => {
                    setBackAnimating(true);
                    setTimeout(() => {
                      handleBackToMonth();
                      setBackAnimating(false);
                    }, 220);
                  }}
                  className="relative z-20 p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${backAnimating ? 'text-white' : 'text-gray-700'}`} />
                </motion.button>
                <motion.span
                  className="absolute inset-0 z-10 bg-black pointer-events-none"
                  initial={{ x: '100%' }}
                  animate={{ x: backAnimating ? 0 : '100%' }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                />
              </div>
              
              <div className="flex space-x-1 sm:space-x-2">
                <motion.button
                  onClick={goToPreviousDay}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                </motion.button>
                
                <motion.button
                  onClick={goToNextDay}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                </motion.button>
              </div>
            </div>
            
            <div className="text-center px-2">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 capitalize">{formattedDate}</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'tarea' : 'tareas'}
              </p>
              <motion.div 
                className="flex justify-center mt-2"
                initial={{ opacity: 1 }}
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <ChevronLeft className="w-3 h-3" />
                    <span>Desliza para cambiar día</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-red-400">
                    <span>← Desliza tareas para eliminar</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Lista de tareas del día */}
          <motion.div 
            className="px-2 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4"
            drag={disableDayDrag ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) {
                goToPreviousDay();
              } else if (info.offset.x < -100) {
                goToNextDay();
              }
            }}
          >
            <AnimatePresence>
              {selectedDateTasks.length > 0 ? (
                selectedDateTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                                         className="relative bg-white dark:bg-black rounded-xl shadow-sm border border-gray-100 dark:border-white/20 p-4 hover:shadow-md transition-shadow text-black dark:text-white"
                    onPointerDown={onPointerDownSwipe(task.id)}
                    onPointerMove={onPointerMoveSwipe(task.id)}
                    onPointerUp={onPointerUpSwipe(task.id)}
                    onPointerCancel={onPointerUpSwipe(task.id)}
                    onTouchStart={(e) => {
                      const touch = e.touches[0];
                      if (touch) {
                        activeIdRef.current = task.id;
                        startXRef.current = touch.clientX;
                        setDisableDayDrag(true);
                      }
                    }}
                    onTouchMove={(e) => {
                      if (activeIdRef.current === task.id && e.touches[0]) {
                        const deltaX = startXRef.current - e.touches[0].clientX;
                        if (deltaX > 0) {
                          e.preventDefault();
                          const next = Math.min(deltaX, MAX_SWIPE);
                          setSwipeOffsetById(prev => ({ ...prev, [task.id]: next }));
                        }
                      }
                    }}
                    onTouchEnd={() => {
                      if (activeIdRef.current === task.id) {
                        finishRowSwipe(task.id);
                      }
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                                         style={{
                       transform: `translate3d(-${swipeOffsetById[task.id] || 0}px,0,0)`,
                       transition: 'transform 150ms ease-out',
                       touchAction: 'pan-y',
                       userSelect: (swipeOffsetById[task.id] || 0) > 0 ? 'none' : undefined,
                       willChange: 'transform',
                     }}
                  >
                    {/* Fondo de eliminación con tacho visible durante el swipe */}
                    <div className={`absolute inset-0 rounded-xl flex items-center justify-end pr-4 transition-all duration-150 ${ 
                      (swipeOffsetById[task.id] || 0) > 6 ? 'opacity-100 bg-black dark:bg-white' : 'opacity-0 bg-gray-300 dark:bg-gray-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium text-sm">Eliminar</span>
                        <Trash2 className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center">
                          {renderTypeShape(task.type)}
                          <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {task.title}
                          </h3>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-300">
                          <div className={`px-2 py-1 rounded-full text-xs bg-black text-white dark:bg-white ${
                            task.type === 'productividad' ? 'dark:text-[#FF0088]' :
                            task.type === 'salud' ? 'dark:text-[#8800FF]' :
                            task.type === 'social' ? 'dark:text-[#4444FF]' : 'dark:text-black'
                          }`}>
                            {task.type}
                          </div>
                          
                          {task.scheduledTime && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{task.scheduledTime}</span>
                            </div>
                          )}
                        </div>
                        
                        {task.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{task.notes}</p>
                        )}
                        
                        {/* Subtareas */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {task.subtasks.map(subtask => (
                              <div key={subtask.id} className="flex items-center space-x-2">
                                <button
                                  onClick={() => onToggleSubtask && onToggleSubtask(task.id, subtask.id)}
                                  className={`task-checkbox-button w-4 h-4 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all duration-200 ${subtask.completed ? 'bg-green-500 border-green-500 dark:!bg-white dark:!border-white shadow-lg scale-110' : 'border-black dark:border-white hover:border-green-400'}`}
                                  style={{ minWidth: '16px', minHeight: '16px', zIndex: 100 }}
                                >
                                  {subtask.completed && (
                                    <Check 
                                      size={10}
                                      className="text-white dark:text-black"
                                      strokeWidth={4}
                                    />
                                  )}
                                </button>
                                <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-white'}`}>
                                  {subtask.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Check fijo a la derecha */}
                      <div className="w-6 shrink-0 flex justify-end">
                        <button
                          onClick={() => onToggleTask && onToggleTask(task.id)}
                          className={`task-checkbox-button w-5 h-5 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all duration-200 ${task.completed ? 'bg-green-500 border-green-500 dark:!bg-white dark:!border-white shadow-lg scale-110' : 'border-black dark:border-white hover:border-green-400'}`}
                          style={{ minWidth: '20px', minHeight: '20px', zIndex: 100 }}
                        >
                          {task.completed && (
                            <Check 
                              size={12}
                              className="text-white dark:text-black"
                              strokeWidth={4}
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No hay tareas para este día</h3>
                  <p className="text-sm text-gray-400 mb-6">¡Perfecto momento para agregar una nueva tarea!</p>
                  <motion.button
                    onClick={handleAddTaskOnDate}
                    className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus size={18} />
                  </motion.button>
                </motion.div>
                             )}
             </AnimatePresence>
           </motion.div>

          {/* Botón flotante para agregar tarea */}
          {selectedDateTasks.length > 0 && (
            <motion.button
              onClick={handleAddTaskOnDate}
              className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center z-30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          )}

          {/* Modal de edición de tareas */}
          <AnimatePresence>
            {showEditModal && editingTask && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <TaskCreationCard
                    onCancel={() => {
                      setShowEditModal(false);
                      setEditingTask(null);
                    }}
                    onCreate={(title, type, subtasks, scheduledDate, scheduledTime, notes, _isPrimary, recurrence) =>
                      handleEditTask(title, type as any, subtasks, scheduledDate, scheduledTime, notes, false, recurrence)
                    }
                    editingTask={editingTask as any}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Vista mensual (código existente pero mejorado)
  return (
    <div className="min-h-screen bg-white dark:bg-black p-2 sm:p-4" style={{ fontFamily: 'Be Vietnam Pro, system-ui, -apple-system, sans-serif' }}>
      <div className="max-w-md mx-auto space-y-4 sm:space-y-8">
        
        {/* Espacio reservado en blanco para contenido futuro */}
        <div className="h-20" />

        {/* Calendario mensual */}
        <motion.div 
          className="bg-white dark:bg-black rounded-xl p-3 sm:p-6 mx-2 overflow-x-auto min-w-0 border-0 shadow-none shiny-calendar-card relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          {/* Etiqueta STEEB en modo Shiny */}
          
          <motion.div 
            className="flex items-center justify-between mb-3 sm:mb-6"
            animate={{ scale: isAnimating ? 0.95 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              onClick={goToPreviousMonth}
              className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </motion.button>
            
            <motion.div 
              className="text-center"
              key={`${monthName}-${year}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-xl sm:text-2xl font-semibold text-black" style={{ fontFamily: 'Varela Round, Be Vietnam Pro, system-ui, -apple-system, sans-serif' }}>
                {monthName} {year}
              </div>
            </motion.div>
            
            <motion.button
              onClick={goToNextMonth}
              className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </motion.button>
          </motion.div>

          {/* Días de la semana */}
          <motion.div 
            className="grid grid-cols-7 gap-1 mb-1 sm:mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs sm:text-sm font-medium text-black py-1 sm:py-2">
                {day}
              </div>
            ))}
          </motion.div>

          {/* Cuadrícula del calendario */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${monthName}-${year}`}
              className="grid grid-cols-7 gap-0.5 sm:gap-1 min-w-[280px]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {calendarDays.map((day, index) => {
                const progress = day.isCurrentMonth ? getTaskProgress(day.fullDate) : 0;
                const progressColor = getProgressColor(progress);
                const taskInfo = getTaskInfo(day.fullDate);
                const isToday = day.isToday;
                const tasksForDay = getTasksForDate(day.fullDate);
                
                return (
                  <motion.div
                    key={`${monthName}-${year}-${index}`}
                    onClick={() => handleDayClick(day.fullDate, day.isCurrentMonth)}
                    onMouseEnter={() => setHoveredDate(day.fullDate)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={`
                      aspect-square p-0.5 sm:p-1 cursor-pointer relative group rounded-lg transition-all duration-200
                      ${day.isCurrentMonth ? 'hover:bg-gray-50 hover:shadow-md' : 'opacity-50'}
                      ${day.isSelected ? 'ring-2 ring-black dark:ring-white' : ''}
                      ${isToday ? 'bg-black text-white font-bold' : ''}
                    `}
                    whileHover={{ scale: day.isCurrentMonth ? 1.05 : 1 }}
                    whileTap={{ scale: 0.95 }}
                    animate={day.isSelected ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="h-full flex flex-col items-center justify-center">
                      <motion.div 
                        className={`
                          text-base sm:text-lg font-semibold mb-0.5 sm:mb-1 relative
                          ${day.isCurrentMonth ? (isToday ? 'text-white' : 'text-black') : 'text-gray-400'}
                        `}
                      >
                        {day.day}
                      </motion.div>
                      
                      {/* Indicadores de tareas */}
                      {day.isCurrentMonth && tasksForDay.length > 0 && (
                        <div className="flex space-x-0.5 sm:space-x-1 mt-0.5 sm:mt-1">
                          {tasksForDay.slice(0, 3).map((_, idx) => (
                            <div key={idx} className={`w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full ${isToday ? 'bg-white' : 'bg-gray-400 dark:bg-white'}`} />
                          ))}
                          {tasksForDay.length > 3 && (
                            <div className={`text-xs ${isToday ? 'text-white' : 'text-gray-500 dark:text-white'}`}>
                              +{tasksForDay.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Barra de progreso pegada al número y solo si hay progreso */}
                      {day.isCurrentMonth && progress > 0 && (
                        <div className="w-full h-0.5 sm:h-1 bg-gray-200 rounded-full overflow-hidden mt-1">
                          <motion.div 
                            className={`h-full bg-black dark:!bg-white`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Vista previa de tareas mejorada */}
                    {day.isCurrentMonth && hoveredDate && hoveredDate.toDateString() === day.fullDate.toDateString() && tasksForDay.length > 0 && (
                      <motion.div 
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-xl shadow-lg p-3 z-50 min-w-64 max-w-80"
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-sm font-medium text-gray-900 mb-2">
                          {day.fullDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {tasksForDay.slice(0, 5).map((task) => (
                            <div 
                              key={task.id} 
                              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                              onClick={() => {
                                setEditingTask(task);
                                setShowEditModal(true);
                              }}
                            >
                              <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className={`text-xs ${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                {task.title}
                              </span>
                              {task.scheduledTime && (
                                <span className="text-xs text-gray-400">{task.scheduledTime}</span>
                              )}
                            </div>
                          ))}
                          {tasksForDay.length > 5 && (
                            <div className="text-xs text-gray-500">
                              y {tasksForDay.length - 5} más...
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                          Toca para ver más detalles
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-white"></div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-px border-7 border-transparent"></div>
                      </motion.div>
                    )}

                    {/* Tooltip básico para días sin tareas */}
                    {day.isCurrentMonth && taskInfo.total === 0 && hoveredDate && hoveredDate.toDateString() === day.fullDate.toDateString() && (
                      <motion.div 
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg z-50 whitespace-nowrap shadow-lg"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                      >
                        <div className="text-gray-300">Sin tareas programadas</div>
                        <div className="text-gray-400">Toca para agregar una tarea</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Se removió leyenda y fecha seleccionada para un diseño más limpio */}

        {/* Modal de edición de tareas (vista mensual) */}
        <AnimatePresence>
          {showEditModal && editingTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <TaskCreationCard
                  onCancel={() => {
                    setShowEditModal(false);
                    setEditingTask(null);
                  }}
                  onCreate={(title, type, subtasks, scheduledDate, scheduledTime, notes, _isPrimary, recurrence) =>
                    handleEditTask(title, type as any, subtasks, scheduledDate, scheduledTime, notes, false, recurrence)
                  }
                  editingTask={editingTask as any}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MonthlyCalendar;