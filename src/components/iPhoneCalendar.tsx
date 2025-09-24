import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft, Calendar, CheckCircle, Clock, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  notes?: string;
}

interface CalendarDay {
  day: number;
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  tasks: Task[];
  completedTasks: number;
  totalTasks: number;
  completionPercentage: number;
}

interface iPhoneCalendarProps {
  tasks?: Task[];
  onToggleTask?: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onAddTask?: (date?: string) => void;
  onDeleteTask?: (id: string) => void;
  onShowTaskDetail?: (id: string) => void;
  enableMultipleSelection?: boolean;
  minDate?: Date;
  maxDate?: Date;
  selectedDates?: string[];
  onDateSelect?: (date: string, dates?: string[]) => void;
}

const IPhoneCalendar: React.FC<iPhoneCalendarProps> = ({
  tasks = [],
  onToggleTask,
  onToggleSubtask,
  onAddTask,
  onDeleteTask,
  onShowTaskDetail,
  enableMultipleSelection = false,
  minDate,
  maxDate,
  selectedDates = [],
  onDateSelect
}) => {
  const { currentTheme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMultipleDates, setSelectedMultipleDates] = useState<string[]>(selectedDates);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Estado para doble clic
  const [lastClickedDate, setLastClickedDate] = useState<string | null>(null);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup de timeouts
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  const isDark = currentTheme === 'dark';
  const isShiny = document.documentElement.classList.contains('shiny');

  // Configuración de localización para español
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayNamesShort = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  // Funciones de navegación con animación
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    
    setCurrentDate(newDate);
    setTimeout(() => setIsAnimating(false), 300);
  }, [currentDate, isAnimating]);

  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'prev' ? -7 : 7));
    
    setCurrentDate(newDate);
    setTimeout(() => setIsAnimating(false), 300);
  }, [currentDate, isAnimating]);

  const navigateDay = useCallback((direction: 'prev' | 'next') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const newDate = new Date(selectedDate || currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
    
    setSelectedDate(newDate);
    setCurrentDate(newDate);
    setTimeout(() => setIsAnimating(false), 200);
  }, [selectedDate, currentDate, isAnimating]);

  // Generar días del calendario con datos de tareas
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    const days: CalendarDay[] = [];
    
    // Días del mes anterior
    const daysFromPrevMonth = startingDayOfWeek;
    const prevMonth = new Date(year, month - 1, 0);
    
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const date = new Date(year, month - 1, day);
      const dateString = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(task => 
        task.scheduledDate === dateString || task.completedDate?.split('T')[0] === dateString
      );
      
      const completedTasks = dayTasks.filter(task => task.completed).length;
      
      days.push({
        day,
        date,
        dateString,
        isCurrentMonth: false,
        isToday: false,
        isSelected: enableMultipleSelection 
          ? selectedMultipleDates.includes(dateString)
          : selectedDate?.toDateString() === date.toDateString(),
        tasks: dayTasks,
        completedTasks,
        totalTasks: dayTasks.length,
        completionPercentage: dayTasks.length > 0 ? (completedTasks / dayTasks.length) * 100 : 0
      });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(task => 
        task.scheduledDate === dateString || task.completedDate?.split('T')[0] === dateString
      );
      
      const completedTasks = dayTasks.filter(task => task.completed).length;
      
      days.push({
        day,
        date,
        dateString,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: enableMultipleSelection 
          ? selectedMultipleDates.includes(dateString)
          : selectedDate?.toDateString() === date.toDateString(),
        tasks: dayTasks,
        completedTasks,
        totalTasks: dayTasks.length,
        completionPercentage: dayTasks.length > 0 ? (completedTasks / dayTasks.length) * 100 : 0
      });
    }
    
    // Días del mes siguiente (para completar la grilla)
    const totalCells = Math.ceil(days.length / 7) * 7;
    const daysToAdd = totalCells - days.length;
    
    for (let day = 1; day <= daysToAdd; day++) {
      const date = new Date(year, month + 1, day);
      const dateString = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(task => 
        task.scheduledDate === dateString || task.completedDate?.split('T')[0] === dateString
      );
      
      const completedTasks = dayTasks.filter(task => task.completed).length;
      
      days.push({
        day,
        date,
        dateString,
        isCurrentMonth: false,
        isToday: false,
        isSelected: enableMultipleSelection 
          ? selectedMultipleDates.includes(dateString)
          : selectedDate?.toDateString() === date.toDateString(),
        tasks: dayTasks,
        completedTasks,
        totalTasks: dayTasks.length,
        completionPercentage: dayTasks.length > 0 ? (completedTasks / dayTasks.length) * 100 : 0
      });
    }
    
    return days;
  }, [currentDate, tasks, selectedDate, selectedMultipleDates, enableMultipleSelection]);

  // Manejo de selección de fechas
  const handleDateSelect = useCallback((calendarDay: CalendarDay) => {
    // Verificar límites de fechas
    if (minDate && calendarDay.date < minDate) return;
    if (maxDate && calendarDay.date > maxDate) return;

    // Manejar doble clic para añadir tarea
    if (lastClickedDate === calendarDay.dateString && clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      setLastClickedDate(null);
      
      // Doble clic detectado - añadir tarea para esta fecha
      if (onAddTask) {
        onAddTask(calendarDay.dateString);
      }
      return;
    }

    // Primer clic - establecer timeout para detectar doble clic
    setLastClickedDate(calendarDay.dateString);
    const timeout = setTimeout(() => {
      setLastClickedDate(null);
      setClickTimeout(null);
      
      // Solo un clic - proceder con selección normal
      if (enableMultipleSelection) {
        const newSelectedDates = selectedMultipleDates.includes(calendarDay.dateString)
          ? selectedMultipleDates.filter(date => date !== calendarDay.dateString)
          : [...selectedMultipleDates, calendarDay.dateString];
        
        setSelectedMultipleDates(newSelectedDates);
        onDateSelect?.(calendarDay.dateString, newSelectedDates);
      } else {
        setSelectedDate(calendarDay.date);
        onDateSelect?.(calendarDay.dateString);
      }
    }, 300); // 300ms para detectar doble clic
    
    setClickTimeout(timeout);
  }, [enableMultipleSelection, selectedMultipleDates, minDate, maxDate, onDateSelect, onAddTask, lastClickedDate, clickTimeout]);

  // Obtener color según porcentaje de completación
  const getCompletionColor = useCallback((percentage: number) => {
    return isDark ? 'bg-white' : 'bg-black';
  }, [isDark]);

  // Renderizar vista mensual
  const renderMonthView = () => (
    <motion.div
      key="month-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Encabezado del calendario */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigateMonth('prev')}
          disabled={isAnimating}
          className={`p-2 rounded-full transition-colors ${
            isDark 
              ? 'hover:bg-gray-800 text-gray-200' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <ChevronLeft size={20} />
        </Button>
        
        <motion.div 
          className="text-center"
          animate={isAnimating ? { scale: 0.95 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className={`text-2xl font-semibold ${
            isShiny ? 'text-black' : (isDark ? 'text-white' : 'text-gray-900')
          }`}>
            {monthNames[currentDate.getMonth()]}
          </h2>
          <p className={`text-lg ${
            isShiny ? 'text-black' : (isDark ? 'text-gray-400' : 'text-gray-600')
          }`}>
            {currentDate.getFullYear()}
          </p>
        </motion.div>
        
        <Button
          variant="ghost"
          onClick={() => navigateMonth('next')}
          disabled={isAnimating}
          className={`p-2 rounded-full transition-colors ${
            isDark 
              ? 'hover:bg-gray-800 text-gray-200' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      {/* Encabezados de días */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(dayName => (
          <div key={dayName} className={`text-center text-sm font-medium py-2 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {dayName}
          </div>
        ))}
      </div>

      {/* Grilla del calendario */}
      <motion.div 
        className="grid grid-cols-7 gap-1"
        animate={isAnimating ? { opacity: 0.7 } : { opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {calendarDays.map((calendarDay, index) => (
          <motion.div
            key={`${calendarDay.dateString}-${index}`}
            className={`
              relative aspect-square rounded-lg cursor-pointer transition-all duration-200 
              border-2 border-transparent
              ${calendarDay.isCurrentMonth 
                ? (isDark ? 'opacity-100' : 'opacity-100') 
                : (isDark ? 'opacity-40' : 'opacity-40')
              }
              ${calendarDay.isToday 
                ? (isDark 
                  ? 'bg-gray-700 text-white shadow-lg' 
                  : 'bg-blue-500 text-white shadow-lg'
                  ) 
                : (isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50')
              }
              ${calendarDay.isSelected 
                ? (isDark ? 'ring-2 ring-gray-400' : 'ring-2 ring-blue-500') 
                : ''
              }
              ${hoveredDate?.toDateString() === calendarDay.date.toDateString() 
                ? 'scale-105 shadow-md' 
                : ''
              }
            `}
            onClick={() => handleDateSelect(calendarDay)}
            onMouseEnter={() => setHoveredDate(calendarDay.date)}
            onMouseLeave={() => setHoveredDate(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Número del día */}
            <div className="absolute top-2 left-2 right-2 text-center">
              <span className={`text-lg font-semibold ${
                calendarDay.isToday 
                  ? 'text-white' 
                  : (isShiny ? 'text-black' : (isDark ? 'text-white' : 'text-gray-900'))
              }`}>
                {calendarDay.day}
              </span>
            </div>

            {/* Indicador de tareas */}
            {calendarDay.totalTasks > 0 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                <div className={`w-6 h-1 rounded-full ${
                  getCompletionColor(calendarDay.completionPercentage)
                }`} />
                <div className="text-xs mt-1 text-center">
                  <span className={`${
                    calendarDay.isToday 
                      ? 'text-white' 
                      : (isDark ? 'text-gray-300' : 'text-gray-600')
                  }`}>
                    {calendarDay.completedTasks}/{calendarDay.totalTasks}
                  </span>
                </div>
              </div>
            )}

            {/* Puntos indicadores para múltiples tareas */}
            {calendarDay.totalTasks > 3 && (
              <div className="absolute top-2 right-2">
                <div className={`w-2 h-2 rounded-full ${
                  calendarDay.isToday 
                    ? 'bg-white' 
                    : (isDark ? 'bg-gray-300' : 'bg-blue-500')
                }`} />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Tooltip de información al hacer hover */}
      <AnimatePresence>
        {hoveredDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 
              px-4 py-2 rounded-lg shadow-lg max-w-xs ${
              isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            } border`}
          >
            {(() => {
              const hoveredDay = calendarDays.find(day => 
                day.date.toDateString() === hoveredDate.toDateString()
              );
              
              if (!hoveredDay || hoveredDay.totalTasks === 0) {
                return (
                  <p className="text-sm">
                    {hoveredDate.toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'short' 
                    })} - Sin tareas
                  </p>
                );
              }
              
              return (
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {hoveredDate.toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </p>
                  <p className="text-xs">
                    {hoveredDay.completedTasks} de {hoveredDay.totalTasks} tareas completadas
                  </p>
                  {hoveredDay.tasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center gap-2 text-xs">
                      {task.completed ? (
                        <CheckCircle size={12} className="text-green-500" />
                      ) : (
                        <Clock size={12} className="text-gray-400" />
                      )}
                      <span className={task.completed ? 'line-through opacity-70' : ''}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {hoveredDay.tasks.length > 3 && (
                    <p className="text-xs opacity-70">
                      +{hoveredDay.tasks.length - 3} más...
                    </p>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botones de vista */}
      <div className="flex justify-center gap-2 mt-6">
        <Button
          variant={viewMode === 'month' ? 'default' : 'outline'}
          onClick={() => setViewMode('month')}
          size="sm"
          className={`relative overflow-hidden ${isShiny ? 'rainbow-border-animated' : ''}`}
          style={isShiny ? {
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff)',
            backgroundSize: '400% 400%',
            animation: 'rainbow-move 3s ease infinite',
            border: '2px solid transparent',
            backgroundClip: 'padding-box'
          } : {}}
        >
          Mes
        </Button>
        <Button
          variant={viewMode === 'week' ? 'default' : 'outline'}
          onClick={() => setViewMode('week')}
          size="sm"
          className={`relative overflow-hidden ${isShiny ? 'rainbow-border-animated' : ''}`}
          style={isShiny ? {
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff)',
            backgroundSize: '400% 400%',
            animation: 'rainbow-move 3s ease infinite',
            border: '2px solid transparent',
            backgroundClip: 'padding-box'
          } : {}}
        >
          Semana
        </Button>
        {selectedDate && (
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            onClick={() => setViewMode('day')}
            size="sm"
            className={`relative overflow-hidden ${isShiny ? 'rainbow-border-animated' : ''}`}
            style={isShiny ? {
              background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff)',
              backgroundSize: '400% 400%',
              animation: 'rainbow-move 3s ease infinite',
              border: '2px solid transparent',
              backgroundClip: 'padding-box'
            } : {}}
          >
            Día
          </Button>
        )}
      </div>
    </motion.div>
  );

  // Renderizar vista de día
  const renderDayView = () => {
    if (!selectedDate) return null;
    
    const selectedDay = useMemo(() => {
      const target = selectedDate || currentDate;
      const y = target.getFullYear();
      const m = target.getMonth();
      const d = target.getDate();
      // Suponemos que tasks es un array de { id, dateISO, ... }
      const dateKey = new Date(y, m, d).toISOString().split('T')[0];
      const dayTasks = tasks.filter((t: any) => (t.date || t.dateISO || t.scheduledDate) === dateKey || (t.date && t.date.startsWith(dateKey)));
      return { dateKey, tasks: dayTasks };
    }, [tasks, currentDate, selectedDate]);

    return (
      <motion.div
        key="day-view"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Encabezado de vista día */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigateDay('prev')}
            disabled={isAnimating}
            className={`p-2 rounded-full ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <ChevronLeft size={20} />
          </Button>
          
          <div className="text-center">
            <h2 className={`text-xl font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {selectedDate.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </h2>
            {selectedDay && selectedDay.totalTasks > 0 && (
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {selectedDay.completedTasks} de {selectedDay.totalTasks} tareas completadas
              </p>
            )}
            <div className={`${isDark ? 'border-white/20' : 'border-black/10'} border-t mt-3`}></div>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => navigateDay('next')}
            disabled={isAnimating}
            className={`p-2 rounded-full ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <ChevronRight size={20} />
          </Button>
        </div>

        {/* Lista de tareas del día */}
        <div className="space-y-3">
          {selectedDay && selectedDay.tasks.length > 0 ? (
            selectedDay.tasks.map(task => (
              <Card key={task.id} className={`relative overflow-hidden p-4 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
                onPointerDown={onPointerDownSwipe(task.id)}
                onPointerMove={onPointerMoveSwipe(task.id)}
                onPointerUp={onPointerUpSwipe(task.id)}
                onPointerCancel={onPointerUpSwipe(task.id)}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  if (!touch) return;
                  activeIdRef.current = task.id;
                  startXRef.current = touch.clientX;
                }}
                onTouchMove={(e) => {
                  if (activeIdRef.current !== task.id || !e.touches[0]) return;
                  const deltaX = startXRef.current - e.touches[0].clientX;
                  if (deltaX > 0) {
                    e.preventDefault();
                    const next = Math.min(deltaX, MAX_SWIPE);
                    setSwipeOffsetById(prev => ({ ...prev, [task.id]: next }));
                  }
                }}
                onTouchEnd={() => finishRowSwipe(task.id)}
                style={{
                  transform: `translate3d(-${swipeOffsetById[task.id] || 0}px,0,0)`,
                  transition: 'transform 150ms ease-out',
                  touchAction: 'pan-y',
                  userSelect: (swipeOffsetById[task.id] || 0) > 0 ? 'none' as any : undefined,
                  willChange: 'transform',
                }}
              >
                {/* Fondo de eliminación */}
                <div className={`absolute inset-0 flex items-center justify-end pr-4 transition-all duration-150 ${
                  (swipeOffsetById[task.id] || 0) > 6 ? 'opacity-100 bg-black dark:bg-white' : 'opacity-0 bg-gray-300 dark:bg-gray-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium text-sm">Eliminar</span>
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                </div>
              
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleTask?.(task.id)}
                      className="p-0 h-auto"
                    >
                      {task.completed ? (
                        <CheckCircle size={20} className="text-green-500" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          isDark ? 'border-gray-400' : 'border-gray-300'
                        }`} />
                      )}
                    </Button>
                    
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        task.completed 
                          ? `line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}` 
                          : (isDark ? 'text-white' : 'text-gray-900')
                      }`}>
                        {task.title}
                      </h3>
                      
                      {task.scheduledTime && (
                        <p className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <Clock size={14} className="inline mr-1" />
                          {task.scheduledTime}
                        </p>
                      )}
                      
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {task.subtasks.map(subtask => (
                            <div key={subtask.id} className="flex items-center gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleSubtask?.(task.id, subtask.id)}
                                className="p-0 h-auto"
                              >
                                {subtask.completed ? (
                                  <CheckCircle size={16} className="text-green-500" />
                                ) : (
                                  <div className={`w-4 h-4 rounded-full border-2 ${
                                    isDark ? 'border-gray-500' : 'border-gray-400'
                                  }`} />
                                )}
                              </Button>
                              <span className={`text-sm ${
                                subtask.completed 
                                  ? `line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}` 
                                  : (isDark ? 'text-gray-300' : 'text-gray-600')
                              }`}>
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className={`text-center py-8 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              {onAddTask && (
                <Button
                  onClick={() => onAddTask(selectedDate.toISOString().split('T')[0])}
                  className="mt-4 w-10 h-10 rounded-full flex items-center justify-center bg-black text-white hover:bg-gray-800"
                  size="sm"
                >
                  <Plus size={16} />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Botón para volver a vista mensual */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setViewMode('month')}
            size="sm"
          >
            Volver al mes
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`max-w-md mx-auto p-4 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    } min-h-screen transition-colors duration-200 relative`}>
      <AnimatePresence mode="wait">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'day' && renderDayView()}
      </AnimatePresence>
      

    </div>
  );
};

export default IPhoneCalendar;