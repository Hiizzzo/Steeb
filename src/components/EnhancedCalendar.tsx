import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, Clock, Plus, Sparkles } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Configuración personalizable de animaciones
const ANIMATION_CONFIG = {
  // Duración de animaciones
  monthTransition: 0.4,
  daySelection: 0.3,
  viewModeTransition: 0.5,
  taskIndicator: 0.6,
  highlight: 0.4,
  
  // Easing personalizado
  easing: [0.25, 0.46, 0.45, 0.94], // Ease-out suave
  bounceEasing: [0.68, -0.55, 0.265, 1.55], // Bounce effect
  
  // Escalas
  hoverScale: 1.05,
  tapScale: 0.95,
  selectionBounce: 1.15,
  
  // Colores personalizados para Stebe (app moderna)
  colors: {
    primary: '#3B82F6', // Azul principal
    primaryDark: '#1D4ED8',
    accent: '#FFFFFF', // Blanco
    success: '#10B981', // Verde
    warning: '#F59E0B', // Amarillo
    error: '#EF4444', // Rojo
    
    // Gradientes
    selectedGradient: 'linear-gradient(135deg, #3B82F6 0%, #FFFFFF 100%)',
    todayGradient: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
    taskGradient: 'linear-gradient(90deg, #F59E0B 0%, #EF4444 50%, #10B981 100%)',
  }
};

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

interface EnhancedCalendarProps {
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
  // Nuevas props para personalización
  animationConfig?: Partial<typeof ANIMATION_CONFIG>;
  enableAnimations?: boolean;
  showTaskIndicators?: boolean;
  autoDetectTheme?: boolean;
}

const EnhancedCalendar: React.FC<EnhancedCalendarProps> = ({
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
  onDateSelect,
  animationConfig = {},
  enableAnimations = true,
  showTaskIndicators = true,
  autoDetectTheme = true
}) => {
  const { currentTheme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMultipleDates, setSelectedMultipleDates] = useState<string[]>(selectedDates);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [highlightPosition, setHighlightPosition] = useState({ x: 0, y: 0 });
  
  // Referencias para animaciones
  const calendarRef = useRef<HTMLDivElement>(null);
  const selectedDayRef = useRef<HTMLDivElement>(null);
  
  // Configuración combinada de animaciones
  const config = { ...ANIMATION_CONFIG, ...animationConfig };

  // Usar el tema actual directamente
  const isDark = currentTheme === 'dark';

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

  // Configuración de localización para español
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Función mejorada de navegación de mes con deslizamiento horizontal
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSlideDirection(direction === 'prev' ? 'left' : 'right');
    
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Simular el delay del deslizamiento antes de cambiar la fecha
    setTimeout(() => {
      setCurrentDate(newDate);
    }, config.monthTransition * 300); // 30% del tiempo total
    
    setTimeout(() => setIsAnimating(false), config.monthTransition * 1000);
  }, [currentDate, isAnimating, config.monthTransition]);

  // Navegación de semana con animación
  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSlideDirection(direction === 'prev' ? 'left' : 'right');
    
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'prev' ? -7 : 7));
    
    setTimeout(() => {
      setCurrentDate(newDate);
      setIsAnimating(false);
    }, config.monthTransition * 1000);
  }, [currentDate, isAnimating, config.monthTransition]);

  // Navegación de día
  const navigateDay = useCallback((direction: 'prev' | 'next') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const newDate = new Date(selectedDate || currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
    
    setSelectedDate(newDate);
    setCurrentDate(newDate);
    setTimeout(() => setIsAnimating(false), config.daySelection * 1000);
  }, [selectedDate, currentDate, isAnimating, config.daySelection]);

  // Generar días del calendario con datos de tareas mejorado
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
    
    // Días del mes siguiente
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

  // Manejo mejorado de selección de fechas con animación de rebote
  const handleDateSelect = useCallback((calendarDay: CalendarDay, event: React.MouseEvent) => {
    // Verificar límites de fechas
    if (minDate && calendarDay.date < minDate) return;
    if (maxDate && calendarDay.date > maxDate) return;

    // Actualizar posición del highlight para animación suave
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const calendarRect = calendarRef.current?.getBoundingClientRect();
    if (calendarRect) {
      setHighlightPosition({
        x: rect.left - calendarRect.left + rect.width / 2,
        y: rect.top - calendarRect.top + rect.height / 2
      });
    }

    // Manejar doble clic para añadir tarea
    if (lastClickedDate === calendarDay.dateString && clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      setLastClickedDate(null);
      
      if (onAddTask) {
        onAddTask(calendarDay.dateString);
      }
      return;
    }

    // Primer clic con animación de rebote
    setLastClickedDate(calendarDay.dateString);
    const timeout = setTimeout(() => {
      setLastClickedDate(null);
      setClickTimeout(null);
      
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
    }, 300);
    
    setClickTimeout(timeout);
  }, [enableMultipleSelection, selectedMultipleDates, minDate, maxDate, onDateSelect, onAddTask, lastClickedDate, clickTimeout]);

  // Obtener color dinámico según porcentaje de completación
  const getCompletionColor = useCallback((percentage: number) => {
    return isDark ? 'bg-white' : 'bg-black';
  }, [isDark]);

  // Variantes de animación para el deslizamiento de meses
  const slideVariants = {
    initial: (direction: string) => ({
      x: direction === 'right' ? '100%' : '-100%',
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: config.monthTransition }
      }
    },
    exit: (direction: string) => ({
      x: direction === 'right' ? '-100%' : '100%',
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: config.monthTransition }
      }
    })
  };

  // Variantes para el cambio de vista (Mes/Semana)
  const viewModeVariants: any = {
    initial: { scale: 0.8, opacity: 0, rotateX: -15 },
    animate: { 
      scale: 1, 
      opacity: 1, 
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        duration: config.viewModeTransition
      }
    },
    exit: { 
      scale: 0.8, 
      opacity: 0, 
      rotateX: 15,
      transition: { duration: config.viewModeTransition * 0.6 }
    }
  };

  // Renderizar vista mensual mejorada
  const renderMonthView = () => (
    <motion.div
      key={`month-${currentDate.getMonth()}-${currentDate.getFullYear()}`}
      custom={slideDirection}
      variants={slideVariants as any}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
      ref={calendarRef}
    >
      {/* Encabezado con gradiente y efectos mejorados */}
      <div className="flex items-center justify-between mb-8">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigateMonth('prev')}
            disabled={isAnimating}
            className={`p-3 rounded-xl transition-all duration-300 ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-200 hover:shadow-lg hover:shadow-gray-500/20' 
                : 'hover:bg-gray-100 text-gray-700 hover:shadow-lg hover:shadow-gray-500/20'
            }`}
          >
            <ChevronLeft size={24} />
          </Button>
        </motion.div>
        
        <motion.div 
          className="text-center"
          animate={isAnimating ? { scale: 0.95, y: -5 } : { scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <motion.h2 
            className={`text-3xl font-bold ${
              isDark ? 'text-white' : 'text-black'
            }`}
            layout
          >
            {monthNames[currentDate.getMonth()]}
          </motion.h2>
          <motion.p 
            className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            layout
          >
            {currentDate.getFullYear()}
          </motion.p>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigateMonth('next')}
            disabled={isAnimating}
            className={`p-3 rounded-xl transition-all duration-300 ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-200 hover:shadow-lg hover:shadow-gray-500/20' 
                : 'hover:bg-gray-100 text-gray-700 hover:shadow-lg hover:shadow-gray-500/20'
            }`}
          >
            <ChevronRight size={24} />
          </Button>
        </motion.div>
      </div>

      {/* Selector de vista con animación */}
      <div className="flex justify-center mb-6">
        <div className={`flex rounded-full p-1 ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          {['month', 'week'].map((mode) => (
            <motion.button
              key={mode}
              onClick={() => setViewMode(mode as 'month' | 'week')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 border-2 ${
                viewMode === mode
                  ? (isDark
                    ? 'bg-white text-black shadow-lg border-black'
                    : 'bg-black text-white shadow-lg border-black')
                  : (isDark ? 'text-gray-400 hover:text-white border-black' : 'text-gray-600 hover:text-gray-900 border-black')
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
            >
              {mode === 'month' ? 'Mes' : 'Semana'}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Encabezados de días con efecto brillante */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {dayNames.map((dayName, index) => (
          <motion.div 
            key={dayName} 
            className={`text-center text-sm font-semibold py-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            {dayName}
          </motion.div>
        ))}
      </div>

      {/* Grilla del calendario con animaciones avanzadas */}
      <motion.div 
        className="grid grid-cols-7 gap-2 relative"
        animate={isAnimating ? { opacity: 0.7, scale: 0.98 } : { opacity: 1, scale: 1 }}
        transition={{ duration: config.monthTransition }}
      >
        {calendarDays.map((calendarDay, index) => (
          <CalendarDayCell
            key={`${calendarDay.dateString}-${index}`}
            calendarDay={calendarDay}
            index={index}
            isDark={isDark}
            config={config}
            onSelect={handleDateSelect}
            hoveredDate={hoveredDate}
            setHoveredDate={setHoveredDate}
            getCompletionColor={getCompletionColor}
            showTaskIndicators={showTaskIndicators}
            enableAnimations={enableAnimations}
          />
        ))}
      </motion.div>

      {/* Tooltip mejorado con información detallada */}
      <AnimatePresence>
        {hoveredDate && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 
              px-6 py-4 rounded-2xl shadow-2xl max-w-sm backdrop-blur-lg ${
              isDark 
                ? 'bg-gray-800/90 text-white border border-gray-700' 
                : 'bg-white/90 text-gray-900 border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-black dark:text-white" />
              <p className="font-semibold">
                {hoveredDate.toLocaleDateString('es-ES', { 
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
            {(() => {
              const dayData = calendarDays.find(d => 
                d.date.toDateString() === hoveredDate.toDateString()
              );
              return dayData?.totalTasks ? (
                <p className="text-sm opacity-80">
                  {dayData.completedTasks} de {dayData.totalTasks} tareas completadas
                </p>
              ) : (
                <p className="text-sm opacity-80">Sin tareas programadas</p>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Renderizar vista semanal (nueva implementación)
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });

    return (
      <motion.div
        key="week-view"
        variants={viewModeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-6"
      >
        {/* Encabezado de semana */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigateWeek('prev')}
            disabled={isAnimating}
            className={`p-3 rounded-xl ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <ChevronLeft size={20} />
          </Button>
          
          <h2 className={`text-2xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Semana del {startOfWeek.getDate()} de {monthNames[startOfWeek.getMonth()]}
          </h2>
          
          <Button
            variant="ghost"
            onClick={() => navigateWeek('next')}
            disabled={isAnimating}
            className={`p-3 rounded-xl ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <ChevronRight size={20} />
          </Button>
        </div>

        {/* Días de la semana en vista expandida */}
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-4">
          {weekDays.map((date, index) => {
            const dateString = date.toISOString().split('T')[0];
            const dayTasks = tasks.filter(task => 
              task.scheduledDate === dateString || task.completedDate?.split('T')[0] === dateString
            );
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <motion.div
                key={dateString}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                  isToday
                    ? (isDark 
                      ? 'bg-gray-800/60 border-gray-500 shadow-lg shadow-gray-500/20' 
                      : 'bg-gray-100 border-black shadow-lg shadow-black/20')
                    : (isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')
                }`}
              >
                <div className="text-center mb-3">
                  <p className={`text-sm font-medium ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {dayNames[date.getDay()]}
                  </p>
                  <p className={`text-2xl font-bold ${
                    isToday ? 'text-gray-200' : (isDark ? 'text-white' : 'text-gray-900')
                  }`}>
                    {date.getDate()}
                  </p>
                </div>
                
                {/* Lista de tareas para el día */}
                <div className="space-y-2">
                  {dayTasks.slice(0, 3).map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-2 rounded-lg text-xs ${
                        task.completed
                          ? (isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black')
                          : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {task.completed ? (
                          <CheckCircle size={12} className="text-black dark:text-white" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-current opacity-50" />
                        )}
                        <span className={task.completed ? 'line-through' : ''}>
                          {task.title.length > 20 ? `${task.title.slice(0, 20)}...` : task.title}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {dayTasks.length > 3 && (
                    <p className={`text-xs text-center ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      +{dayTasks.length - 3} más
                    </p>
                  )}
                  
                  {dayTasks.length === 0 && (
                    <p className={`text-xs text-center ${
                      isDark ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      Sin tareas
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`max-w-md mx-auto p-6 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    } min-h-screen transition-colors duration-300 relative overflow-hidden`}>
      {/* Fondo con gradiente sutil */}
      <div className={`absolute inset-0 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800/20' 
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100/30'
      }`} />
      
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Componente separado para cada celda del calendario con animaciones optimizadas
interface CalendarDayCellProps {
  calendarDay: CalendarDay;
  index: number;
  isDark: boolean;
  config: typeof ANIMATION_CONFIG;
  onSelect: (calendarDay: CalendarDay, event: React.MouseEvent) => void;
  hoveredDate: Date | null;
  setHoveredDate: (date: Date | null) => void;
  getCompletionColor: (percentage: number) => string;
  showTaskIndicators: boolean;
  enableAnimations: boolean;
}

const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  calendarDay,
  index,
  isDark,
  config,
  onSelect,
  hoveredDate,
  setHoveredDate,
  getCompletionColor,
  showTaskIndicators,
  enableAnimations
}) => {
  const isHovered = hoveredDate?.toDateString() === calendarDay.date.toDateString();
  
  // Animación de rebote para la selección
  const bounceVariants: any = {
    idle: { scale: 1 },
    hover: { scale: config.hoverScale },
    tap: { 
      scale: config.tapScale,
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    selected: {
      scale: [1, config.selectionBounce, 1],
      transition: { 
        duration: config.daySelection,
        ease: config.bounceEasing
      }
    }
  };

  return (
    <motion.div
      variants={enableAnimations ? (bounceVariants as any) : {}}
      initial="idle"
      animate={calendarDay.isSelected ? "selected" : "idle"}
      whileHover={enableAnimations ? "hover" : {}}
      whileTap={enableAnimations ? "tap" : {}}
      className={`
        relative aspect-square rounded-2xl cursor-pointer transition-all duration-300
        ${calendarDay.isCurrentMonth 
          ? 'opacity-100' 
          : 'opacity-40'
        }
        ${calendarDay.isToday 
          ? (isDark 
            ? 'bg-gray-700 text-white shadow-xl' 
            : 'bg-gradient-to-br from-blue-500 to-white text-white shadow-xl shadow-blue-500/30'
            ) 
          : calendarDay.isSelected
            ? (isDark 
              ? 'bg-gray-600 text-white shadow-lg' 
              : 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20')
            : (isDark 
              ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600' 
              : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300')
        }
        ${isHovered ? 'shadow-2xl transform-gpu' : ''}
      `}
      onClick={(e) => onSelect(calendarDay, e)}
      onMouseEnter={() => setHoveredDate(calendarDay.date)}
      onMouseLeave={() => setHoveredDate(null)}
      style={{
        // Stagger de animación inicial
        ...(enableAnimations && {
          animationDelay: `${index * 0.02}s`
        })
      }}
    >
      {/* Número del día con mejor tipografía */}
      <div className="absolute top-3 left-3 right-3 text-center">
        <motion.span 
          className={`text-lg font-bold ${
            calendarDay.isToday || calendarDay.isSelected
              ? 'text-white' 
              : (isDark ? 'text-white' : 'text-gray-900')
          }`}
          layout
        >
          {calendarDay.day}
        </motion.span>
      </div>

      {/* Indicadores de tareas mejorados con animaciones */}
      <AnimatePresence>
        {showTaskIndicators && calendarDay.totalTasks > 0 && (
          <motion.div 
            className="absolute bottom-3 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              delay: index * 0.01 
            }}
          >
            {/* Barra de progreso con gradiente */}
            <motion.div 
              className={`h-1.5 rounded-full mb-1 ${getCompletionColor(calendarDay.completionPercentage)} dark:bg-white`}
              style={{ width: '24px' }}
              initial={{ width: 0 }}
              animate={{ width: '24px' }}
              transition={{ delay: 0.2, duration: 0.4 }}
            />
            
            {/* Contador de tareas */}
            <motion.div 
              className="text-xs text-center"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <span className={`font-medium ${
                calendarDay.isToday || calendarDay.isSelected
                  ? 'text-white' 
                  : (isDark ? 'text-gray-300' : 'text-gray-600')
              }`}>
                {calendarDay.completedTasks}/{calendarDay.totalTasks}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de múltiples tareas con animación de pulso */}
      <AnimatePresence>
        {calendarDay.totalTasks > 3 && (
          <motion.div 
            className="absolute top-3 right-3"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div 
              className={`w-2 h-2 rounded-full ${
                calendarDay.isToday || calendarDay.isSelected
                  ? 'bg-white' 
                  : 'bg-blue-500'
              }`}
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Efecto de resplandor al hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/20 to-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EnhancedCalendar;