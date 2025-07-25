import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flame, CheckCircle, Calendar, Trophy, Plus, ArrowLeft, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  notes?: string;
}

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
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (task.scheduledDate === dateString) return true;
      if (task.completedDate && task.completedDate.split('T')[0] === dateString) return true;
      return false;
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
      localStorage.setItem('stebe-selected-date', dateString);
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
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto">
          {/* Header de vista día */}
          <motion.div 
            className="sticky top-0 bg-white z-20 px-4 py-6 border-b border-gray-100"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <motion.button
                onClick={handleBackToMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </motion.button>
              
              <div className="flex space-x-2">
                <motion.button
                  onClick={goToPreviousDay}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </motion.button>
                
                <motion.button
                  onClick={goToNextDay}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </motion.button>
              </div>
            </div>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 capitalize">{formattedDate}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'tarea' : 'tareas'}
              </p>
              <motion.div 
                className="flex justify-center mt-2"
                initial={{ opacity: 1 }}
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <ChevronLeft className="w-3 h-3" />
                  <span>Desliza para cambiar día</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Lista de tareas del día */}
          <motion.div 
            className="px-4 py-6 space-y-4"
            drag="x"
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
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-3">
                      <motion.button
                        onClick={() => onToggleTask && onToggleTask(task.id)}
                        className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {task.completed && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </motion.button>
                      
                      <div className="flex-1">
                        <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </h3>
                        
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            task.type === 'personal' ? 'bg-blue-100 text-blue-700' :
                            task.type === 'work' ? 'bg-purple-100 text-purple-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {task.type === 'personal' ? 'Personal' : 
                             task.type === 'work' ? 'Trabajo' : 'Meditación'}
                          </div>
                          
                          {task.scheduledTime && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{task.scheduledTime}</span>
                            </div>
                          )}
                        </div>
                        
                        {task.notes && (
                          <p className="text-sm text-gray-600 mt-2">{task.notes}</p>
                        )}
                        
                        {/* Subtareas */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {task.subtasks.map(subtask => (
                              <div key={subtask.id} className="flex items-center space-x-2">
                                <motion.button
                                  onClick={() => onToggleSubtask && onToggleSubtask(task.id, subtask.id)}
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    subtask.completed 
                                      ? 'bg-gray-400 border-gray-400' 
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {subtask.completed && (
                                    <CheckCircle className="w-2.5 h-2.5 text-white" />
                                  )}
                                </motion.button>
                                <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                  {subtask.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
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
                    className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Agregar Tarea
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
        </div>
      </div>
    );
  }

  // Vista mensual (código existente pero mejorado)
  return (
    <div className="min-h-screen bg-white p-4">
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
                {monthName.slice(0, 3)} {year}
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
                {day}
              </div>
            ))}
          </motion.div>

          {/* Cuadrícula del calendario */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${monthName}-${year}`}
              className="grid grid-cols-7 gap-1"
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
                      aspect-square p-1 cursor-pointer relative group rounded-lg transition-all duration-200
                      ${day.isCurrentMonth ? 'hover:bg-gray-50 hover:shadow-md' : 'opacity-50'}
                      ${day.isSelected ? 'ring-2 ring-black' : ''}
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
                          text-sm font-medium mb-1 relative
                          ${day.isCurrentMonth ? (isToday ? 'text-white' : 'text-black') : 'text-gray-400'}
                        `}
                      >
                        {day.day}
                      </motion.div>
                      
                      {/* Indicadores de tareas */}
                      {day.isCurrentMonth && tasksForDay.length > 0 && (
                        <div className="flex space-x-1 mt-1">
                          {tasksForDay.slice(0, 3).map((_, idx) => (
                            <div key={idx} className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-gray-400'}`} />
                          ))}
                          {tasksForDay.length > 3 && (
                            <div className={`text-xs ${isToday ? 'text-white' : 'text-gray-500'}`}>
                              +{tasksForDay.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Barra de progreso */}
                      {day.isCurrentMonth && progress > 0 && (
                        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-1">
                          <motion.div 
                            className={`h-full ${progressColor}`}
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
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-50 min-w-64 max-w-80"
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
                            <div key={task.id} className="flex items-center space-x-2">
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
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-px border-7 border-transparent border-t-gray-200"></div>
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

        {/* Leyenda de intensidad */}
        <motion.div 
          className="text-center space-y-2"
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
            {['bg-gray-200', 'bg-red-300', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'].map((color, index) => (
              <motion.div
                key={color}
                className={`w-3 h-3 ${color} rounded-sm`}
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

        {/* Fecha seleccionada */}
        {selectedDate && (
          <motion.div 
            className="text-center pb-8"
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
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MonthlyCalendar; 