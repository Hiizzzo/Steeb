import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flame, CheckCircle, Calendar, Trophy, Plus, X, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  type?: 'personal' | 'work' | 'meditation';
  notes?: string;
  subtasks?: SubTask[];
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface MonthlyCalendarProps {
  tasks?: Task[];
  onAddTask?: (title: string, date: string) => void;
  onToggleTask?: (taskId: string) => void;
}

type ViewMode = 'compact' | 'intermediate' | 'detailed';
type CalendarView = 'monthly' | 'daily';

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ tasks = [], onAddTask, onToggleTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('intermediate');
  const [calendarView, setCalendarView] = useState<CalendarView>('monthly');
  const [scale, setScale] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number>(0);
  const navigate = useNavigate();

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
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 1);
      return newDate;
    });
  };

  const goToNextDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 1);
      return newDate;
    });
  };

  // Manejar pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistance.current = distance;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      const scaleChange = distance / lastTouchDistance.current;
      const newScale = Math.max(0.5, Math.min(2, scale * scaleChange));
      
      setScale(newScale);
      
      // Cambiar modo de vista basado en el zoom
      if (newScale < 0.8) {
        setViewMode('compact');
      } else if (newScale < 1.3) {
        setViewMode('intermediate');
      } else {
        setViewMode('detailed');
        if (newScale > 1.8) {
          setCalendarView('daily');
        }
      }
      
      lastTouchDistance.current = distance;
    }
  }, [scale]);

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
      const prevDate = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        day: prevMonthDays - i,
        date: prevDate,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        progress: getTaskProgress(prevDate),
        taskCount: getTaskCount(prevDate)
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      
      days.push({
        day,
        date,
        isCurrentMonth: true,
        isToday,
        isSelected,
        progress: getTaskProgress(date),
        taskCount: getTaskCount(date)
      });
    }

    // Días del mes siguiente
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({
        day,
        date: nextDate,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        progress: getTaskProgress(nextDate),
        taskCount: getTaskCount(nextDate)
      });
    }

    return days;
  };

  // Calcular progreso de tareas para un día específico
  const getTaskProgress = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter(task => task.date === dateString);
    
    if (dayTasks.length === 0) return 0;
    
    const completedTasks = dayTasks.filter(task => task.completed).length;
    return completedTasks / dayTasks.length;
  };

  // Obtener cantidad de tareas para un día
  const getTaskCount = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(task => task.date === dateString).length;
  };

  // Obtener tareas para una fecha específica
  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(task => task.date === dateString);
  };

  // Obtener información detallada de tareas para tooltip
  const getTaskInfo = (day: number) => {
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter(task => task.date === dateString);
    
    if (dayTasks.length === 0) return { total: 0, completed: 0 };
    
    const completedTasks = dayTasks.filter(task => task.completed).length;
    return { total: dayTasks.length, completed: completedTasks };
  };

  // Obtener clase de color para la barra de progreso
  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200';
    if (progress <= 0.25) return 'bg-gray-300';
    if (progress <= 0.5) return 'bg-gray-400';
    if (progress <= 0.75) return 'bg-gray-600';
    return 'bg-gray-800';
  };

  // Función para manejar clic en día
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    
    if (scale > 1.5) {
      setCalendarView('daily');
    } else {
      // Abrir modal para agregar tarea en la fecha seleccionada
      setShowAddModal(true);
    }
    
    // Guardar la fecha seleccionada en localStorage para que la app principal la use
    const dateString = date.toISOString().split('T')[0];
    localStorage.setItem('stebe-selected-date', dateString);
  };

  // Renderizar indicador de tareas basado en el modo
  const renderTaskIndicator = (day: any) => {
    if (day.taskCount === 0) return null;
    
    switch (viewMode) {
      case 'compact':
        return (
          <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
            <div className="w-1 h-1 bg-black rounded-full" />
          </div>
        );
      
      case 'intermediate':
        return (
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${getProgressColor(day.progress)}`}
              initial={{ width: 0 }}
              animate={{ width: `${day.progress * 100}%` }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            />
          </div>
        );
      
      case 'detailed':
        return (
          <div className="text-[8px] text-gray-600 font-medium bg-white px-1 rounded">
            {day.taskCount}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Mock de funciones para agregar tarea (en implementación real vendría de props)
  const handleAddTask = () => {
    if (newTaskTitle.trim() && onAddTask) {
      const dateString = selectedDate.toISOString().split('T')[0];
      onAddTask(newTaskTitle, dateString);
      setNewTaskTitle('');
      setShowAddModal(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    if (onToggleTask) {
      onToggleTask(taskId);
    }
  };

  // Estadísticas calculadas
  const stats = {
    streakDays: tasks.filter(task => task.completed).length > 0 ? 3 : 0, // Mock
    completedTasks: tasks.filter(task => task.completed).length,
    activeDays: new Set(tasks.map(task => task.scheduledDate).filter(Boolean)).size,
    bestStreak: 5 // Mock
  };

  const calendarDays = generateCalendarDays();
  const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  // Renderizar vista diaria
  const renderDailyView = () => {
    const dayTasks = getTasksForDate(selectedDate);
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="min-h-screen bg-white"
      >
        {/* Header del día */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPreviousDay}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={20} className="text-black" />
              </button>
              
              <div className="text-center flex-1">
                <h2 className="text-xl font-semibold text-black">
                  {selectedDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {dayTasks.length} tarea{dayTasks.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <button
                onClick={goToNextDay}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronRight size={20} className="text-black" />
              </button>
            </div>
            
            <button
              onClick={() => setCalendarView('monthly')}
              className="mt-2 text-sm text-gray-500 hover:text-black transition-colors"
            >
              ← Volver al calendario
            </button>
          </div>
        </div>

        {/* Lista de tareas */}
        <div className="px-4 py-4">
          {dayTasks.length > 0 ? (
            <div className="space-y-3">
              {dayTasks.map(task => (
                <motion.div
                  key={task.id}
                  className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-1 hover:scale-110 transition-transform"
                    >
                      {task.completed ? (
                        <CheckCircle size={20} className="text-black" />
                      ) : (
                        <Circle size={20} className="text-gray-400" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className={`
                        font-medium text-black
                        ${task.completed ? 'line-through text-gray-500' : ''}
                      `}>
                        {task.title}
                      </h3>
                      
                      {task.notes && (
                        <p className="text-sm text-gray-500 mt-1">{task.notes}</p>
                      )}
                      
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {task.subtasks.map(subtask => (
                            <div key={subtask.id} className="flex items-center space-x-2">
                              <button
                                className="hover:scale-110 transition-transform"
                              >
                                {subtask.completed ? (
                                  <CheckCircle size={14} className="text-black" />
                                ) : (
                                  <Circle size={14} className="text-gray-400" />
                                )}
                              </button>
                              <span className={`
                                text-sm
                                ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}
                              `}>
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay tareas para este día</p>
            </div>
          )}
        </div>

        {/* Botón agregar tarea fijo */}
        <div className="fixed bottom-8 left-4 right-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-black text-white py-4 rounded-2xl font-medium hover:bg-gray-800 transition-colors shadow-lg"
          >
            <Plus size={20} className="inline mr-2" />
            Agregar tarea para este día
          </button>
        </div>
      </motion.div>
    );
  };

  if (calendarView === 'daily') {
    return renderDailyView();
  }

  return (
    <div className="min-h-screen bg-white p-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="max-w-md mx-auto space-y-8">
        
        {/* Frase motivacional */}
        <motion.div 
          className="text-center pt-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-2xl font-bold text-black leading-tight">
            Hoy es un gran día para tachar pendientes
          </h1>
        </motion.div>

        {/* Tarjetas de estadísticas */}
        <motion.div 
          className="grid grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-4 text-center cursor-pointer"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
            transition={{ duration: 0.2 }}
          >
            <Flame className="w-6 h-6 mx-auto mb-2 text-gray-600" />
            <div className="text-lg font-semibold text-black">{stats.streakDays}</div>
            <div className="text-xs text-gray-500">días de racha</div>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-4 text-center cursor-pointer"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
            transition={{ duration: 0.2 }}
          >
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-gray-600" />
            <div className="text-lg font-semibold text-black">{stats.completedTasks}</div>
            <div className="text-xs text-gray-500">tareas tachadas</div>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-4 text-center cursor-pointer"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
            transition={{ duration: 0.2 }}
          >
            <Calendar className="w-6 h-6 mx-auto mb-2 text-gray-600" />
            <div className="text-lg font-semibold text-black">{stats.activeDays}</div>
            <div className="text-xs text-gray-500">Días activos</div>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-4 text-center cursor-pointer"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
            transition={{ duration: 0.2 }}
          >
            <Trophy className="w-6 h-6 mx-auto mb-2 text-gray-600" />
            <div className="text-lg font-semibold text-black">{stats.bestStreak}</div>
            <div className="text-xs text-gray-500">Mejor racha</div>
          </motion.div>
        </motion.div>

        {/* Calendario mensual */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          {/* Navegación del mes */}
          <motion.div 
            className="flex items-center justify-between mb-6"
            animate={{ scale: isAnimating ? 0.95 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5 text-black" />
            </motion.button>
            
            <motion.div 
              className="text-center"
              key={`${monthName}-${year}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-xl font-bold text-black">{monthName} {year}</div>
              <div className="text-sm text-gray-500 lowercase">
                Zoom: {viewMode} | Pellizca para cambiar vista
              </div>
            </motion.div>
            
            <motion.button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-5 h-5 text-black" />
            </motion.button>
          </motion.div>

          {/* Días de la semana */}
          <motion.div 
            className="grid grid-cols-7 gap-1 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-black py-2">
                {day.slice(0, 1)}
              </div>
            ))}
          </motion.div>

          {/* Cuadrícula del calendario con zoom */}
          <AnimatePresence mode="wait">
            <motion.div 
              ref={containerRef}
              key={`${monthName}-${year}`}
              className="grid grid-cols-7 gap-1"
              style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {calendarDays.map((day, index) => {
                const isToday = day.isToday;
                
                return (
                  <motion.div
                    key={`${monthName}-${year}-${index}`}
                    onClick={() => handleDayClick(day.date)}
                    className={`
                      aspect-square p-1 cursor-pointer relative group flex flex-col items-center justify-center
                      hover:bg-gray-50 hover:border hover:border-gray-300 rounded-lg
                      ${day.isSelected ? 'bg-blue-500 text-white' : ''}
                      ${isToday && !day.isSelected ? 'bg-black text-white' : ''}
                      transition-all duration-200
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={day.isSelected ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div 
                      className={`
                        ${viewMode === 'compact' ? 'text-xs' : 'text-sm'} font-medium mb-1
                        ${day.isCurrentMonth ? '' : 'text-gray-400'}
                        ${isToday || day.isSelected ? 'text-white' : 'text-black'}
                      `}
                    >
                      {day.day}
                    </motion.div>
                    
                    {/* Indicador de actividad dinámico */}
                    {renderTaskIndicator(day)}

                    {/* Indicador "+" para agregar tarea al hacer hover */}
                    {day.taskCount === 0 && (
                      <motion.div 
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 1 }}
                      >
                        <Plus size={16} className={`${isToday || day.isSelected ? 'text-white' : 'text-gray-400'}`} />
                      </motion.div>
                    )}

                    {/* Tooltip */}
                    {day.taskCount > 0 ? (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {getTaskInfo(day.day).completed} de {getTaskInfo(day.day).total} tareas completadas
                      </div>
                    ) : (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Haz clic para agregar tarea
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Información del día seleccionado */}
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
        >
          <motion.div 
            className="text-sm text-gray-600"
            key={selectedDate.toDateString()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {selectedDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'short'
            })}
          </motion.div>

          {getTasksForDate(selectedDate).length > 0 && (
            <div className="flex space-x-2 justify-center">
              <button
                onClick={() => setCalendarView('daily')}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Ver tareas del día
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                + Agregar
              </button>
            </div>
          )}
        </motion.div>

        {/* Leyenda de intensidad */}
        <motion.div 
          className="text-center space-y-2 pb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        >
          <motion.div 
            className="flex justify-center items-center space-x-1"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            {[200, 300, 400, 600, 800].map((shade, index) => (
              <motion.div
                key={shade}
                className={`w-3 h-3 bg-gray-${shade} rounded-sm`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
              />
            ))}
          </motion.div>
          <div className="flex justify-between text-xs text-gray-500 px-4">
            <span>Menos</span>
            <span>Más</span>
          </div>
        </motion.div>
      </div>

      {/* Modal para agregar tarea rápida */}
      <AnimatePresence>
        {showAddModal && (
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
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">
                  Nueva tarea para {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-black" />
                </button>
              </div>
              
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Nombre de la tarea"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              />
              
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-lg text-black hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="flex-1 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthlyCalendar; 