import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, CheckCircle, Clock, Plus, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTaskStore } from '@/store/useTaskStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import TaskCreationCard from '@/components/TaskCreationCard';
import { Task, SubTask } from '@/types';

// Configuración de animaciones para Stebe
const ANIMATION_CONFIG = {
  monthTransition: 0.4,
  daySelection: 0.3,
  taskIndicator: 0.6,
  highlight: 0.4,
  easing: [0.25, 0.46, 0.45, 0.94],
  bounceEasing: [0.68, -0.55, 0.265, 1.55],
  hoverScale: 1.05,
  tapScale: 0.95,
  selectionBounce: 1.15,
  colors: {
    primary: '#000000',
    primaryDark: '#000000',
    accent: '#000000',
    success: '#000000',
    warning: '#000000',
    error: '#000000',
    selectedGradient: 'linear-gradient(135deg, #000000 0%, #000000 100%)',
    todayGradient: 'linear-gradient(135deg, #000000 0%, #000000 100%)',
    taskGradient: 'linear-gradient(90deg, #000000 0%, #000000 50%, #000000 100%)',
  }
};

// Types imported from '@/types'

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

const MonthlyCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playTaskCompleteSound } = useSoundEffects();
  const { theme } = useTheme();
  
  const { 
    tasks, 
    setTasks: updateTasks, 
    isLoading: isPersistenceLoading 
  } = useTaskStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const isDark = theme === 'dark';

  // Generar días del calendario
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const dayTasks = tasks.filter(task => task.scheduledDate === dateString);
      const completedTasks = dayTasks.filter(task => task.completed).length;
      const totalTasks = dayTasks.length;
      const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      days.push({
        day: date.getDate(),
        date,
        dateString,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: selectedDate === dateString,
        tasks: dayTasks,
        completedTasks,
        totalTasks,
        completionPercentage
      });
    }
    
    return days;
  }, [currentDate, tasks, selectedDate]);

  const handleToggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    
    if (task && task.subtasks && task.subtasks.length > 0 && !task.completed) {
      const allSubtasksCompleted = task.subtasks.every(subtask => subtask.completed);
      if (!allSubtasksCompleted) {
        toast({
          title: "Completa las subtareas primero",
          description: "Necesitas completar todas las subtareas antes de completar la tarea principal.",
        });
        return;
      }
    }
    
    const updatedTasks = tasks.map(task => 
      task.id === id ? { 
        ...task, 
        completed: !task.completed,
        completedDate: !task.completed ? new Date().toISOString() : undefined
      } : task
    );
    updateTasks(updatedTasks);
    
    if (task && !task.completed) {
      playTaskCompleteSound();
      toast({
        title: "¡Tarea completada!",
        description: "¡Excelente trabajo! Has completado una tarea.",
      });
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId && task.subtasks) {
        const updatedSubtasks = task.subtasks.map(subtask =>
          subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
        );
        
        const allSubtasksCompleted = updatedSubtasks.every(subtask => subtask.completed);
        
        return {
          ...task,
          subtasks: updatedSubtasks,
          completed: allSubtasksCompleted
        };
      }
      return task;
    });
    updateTasks(updatedTasks);

    const task = tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
      const subtask = task.subtasks.find(s => s.id === subtaskId);
      const otherSubtasks = task.subtasks.filter(s => s.id !== subtaskId);
      const allOthersCompleted = otherSubtasks.every(s => s.completed);
      
      if (subtask && !subtask.completed && allOthersCompleted) {
        playTaskCompleteSound();
        toast({
          title: "¡Tarea completada!",
          description: "¡Excelente trabajo! Has completado todas las subtareas.",
        });
      }
    }
  };

  const [showTaskCreation, setShowTaskCreation] = useState(false);
  const [selectedDateForTask, setSelectedDateForTask] = useState<string | null>(null);

  const handleAddTask = (date?: string) => {
    if (date) {
      localStorage.setItem('stebe-selected-date', date);
    }
    setSelectedDateForTask(date || null);
    setShowTaskCreation(true);
  };

  const handleCancelTaskCreation = () => {
    setShowTaskCreation(false);
    setSelectedDateForTask(null);
    localStorage.removeItem('stebe-selected-date');
  };

  const handleCreateTask = (title: string, type: 'personal' | 'work' | 'meditation', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string, notes?: string) => {
    try {
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        type,
        status: 'pending',
        completed: false,
        subtasks: subtasks || [],
        scheduledDate: scheduledDate || selectedDateForTask || undefined,
        scheduledTime,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedTasks = [...tasks, newTask];
      updateTasks(updatedTasks);
      
      setShowTaskCreation(false);
      setSelectedDateForTask(null);
      localStorage.removeItem('stebe-selected-date');
      
      toast({
        title: "¡Tarea creada!",
        description: "Tu tarea ha sido agregada exitosamente.",
      });
    } catch (error) {
      console.error('Error al crear tarea:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al crear la tarea. Inténtalo de nuevo.",
      });
    }
  };

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString);
    localStorage.setItem('stebe-selected-calendar-date', dateString);
  };

  const handleShowTaskDetail = (taskId: string) => {
    localStorage.setItem('stebe-selected-task', taskId);
    navigate('/');
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getCompletionColor = (percentage: number) => {
    return '#000000'; // Siempre negro para mantener consistencia
  };

  // Estadísticas del mes actual (tareas completadas y programadas)
  const monthStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const parseDateOnly = (dateString: string) => {
      const [yyyy, mm, dd] = dateString.split('-').map(Number);
      return new Date(yyyy, (mm || 1) - 1, dd || 1);
    };

    const completed = tasks.filter(t => (
      t.completed && t.completedDate &&
      new Date(t.completedDate) >= monthStart && new Date(t.completedDate) <= monthEnd
    )).length;

    const scheduled = tasks
      .filter(t => !!t.scheduledDate)
      .filter(t => {
        const d = parseDateOnly(t.scheduledDate!);
        return d >= monthStart && d <= monthEnd;
      }).length;

    return { completed, scheduled };
  }, [currentDate, tasks]);

  const renderCalendarDay = (day: CalendarDay, index: number) => (
    <motion.div
      key={day.dateString}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: ANIMATION_CONFIG.daySelection,
        delay: index * 0.02,
        ease: ANIMATION_CONFIG.easing as any
      }}
              className={`
          relative min-h-[60px] p-1 border border-gray-200 dark:border-gray-700 rounded-lg
          ${day.isCurrentMonth ? 'bg-white dark:bg-black' : 'bg-gray-50 dark:bg-gray-900'}
          ${day.isToday ? 'ring-2 ring-black dark:ring-white' : ''}
          ${day.isSelected ? 'ring-2 ring-black dark:ring-white' : ''}
          cursor-pointer transition-all duration-300
          hover:shadow-lg hover:scale-105
        `}
      onClick={() => handleDateSelect(day.dateString)}
      onMouseEnter={() => setHoveredDate(day.date)}
      onMouseLeave={() => setHoveredDate(null)}
      whileHover={{ scale: ANIMATION_CONFIG.hoverScale }}
      whileTap={{ scale: ANIMATION_CONFIG.tapScale }}
    >
      {/* Número del día */}
      <div className={`
        text-xs font-semibold mb-1
        ${day.isCurrentMonth ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-600'}
        ${day.isToday ? 'text-black dark:text-white' : ''}
        ${day.isSelected ? 'text-black dark:text-white' : ''}
      `}>
        {day.day}
      </div>

      {/* Indicadores de tareas */}
      {day.totalTasks > 0 && (
        <div className="space-y-1">
                     {/* Barra de progreso */}
           <div className="w-full h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${day.completionPercentage}%` }}
              transition={{ duration: ANIMATION_CONFIG.taskIndicator, ease: ANIMATION_CONFIG.easing as any }}
              className="h-full rounded-full"
              style={{ background: getCompletionColor(day.completionPercentage) }}
            />
          </div>
          
                     {/* Contador de tareas */}
           <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-600 dark:text-gray-400">
              {day.completedTasks}/{day.totalTasks}
            </span>
                         {day.completionPercentage === 100 && (
               <CheckCircle className="w-2 h-2 text-black dark:text-white" />
             )}
          </div>
        </div>
      )}

      {/* Efecto de hover */}
      <AnimatePresence>
        {hoveredDate?.toDateString() === day.date.toDateString() && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg -z-10"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black p-4">
      {/* Header con navegación */}
      <div className="max-w-6xl mx-auto">
        {/* Botón Volver */}
        <div className="flex justify-start mb-4">
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver</span>
          </motion.button>
        </div>

        {/* Título centrado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Calendario
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organiza tu tiempo con estilo
          </p>
        </motion.div>

        {/* Botón Agregar Tarea centrado */}
        <div className="flex justify-center mb-6">
          <AnimatePresence>
            {selectedDate && (
              <motion.button
                onClick={() => handleAddTask(selectedDate)}
                className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Agregar Tarea</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Controles del calendario */}
        <Card className="p-6 mb-6 bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <motion.button
              onClick={prevMonth}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-6 h-6" />
      </motion.button>
      
            <div className="flex flex-col items-center">
              <motion.h2
                key={currentDate.toISOString()}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-2xl font-bold text-gray-800 dark:text-white"
              >
                {currentDate.toLocaleDateString('es-ES', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </motion.h2>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{monthStats.completed} completadas</span>
                {monthStats.scheduled > 0 && (
                  <span>• {monthStats.scheduled} programadas</span>
                )}
              </div>
            </div>

            <motion.button
              onClick={nextMonth}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>

                     {/* Días de la semana */}
           <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, index) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </motion.div>
            ))}
          </div>

                     {/* Días del calendario */}
           <motion.div
             key={currentDate.toISOString()}
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: ANIMATION_CONFIG.monthTransition }}
             className="grid grid-cols-7 gap-1"
           >
            {calendarDays.map((day, index) => renderCalendarDay(day, index))}
          </motion.div>
        </Card>

        {/* Tareas del día seleccionado */}
        {selectedDate && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                Tareas del {new Date(selectedDate).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              
              {calendarDays.find(d => d.dateString === selectedDate)?.tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay tareas programadas para este día</p>
                  <Button
                    onClick={() => handleAddTask(selectedDate)}
                    className="mt-4 bg-black dark:bg-white text-white dark:text-black"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Tarea
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {calendarDays.find(d => d.dateString === selectedDate)?.tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          task.completed 
                            ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {task.completed && <CheckCircle className="w-3 h-3" />}
                      </button>
                      
                      <div className="flex-1">
                        <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-white'}`}>
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {task.type} • {task.scheduledTime || 'Sin hora'}
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => handleShowTaskDetail(task.id)}
                        variant="ghost"
                        size="sm"
                      >
                        Ver
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
                 )}

                 {/* TaskCreationCard para agregar tareas */}
        <AnimatePresence>
          {showTaskCreation && (
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
                  onCancel={handleCancelTaskCreation}
                  onCreate={handleCreateTask}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
       </div>
    </div>
  );
};

export default MonthlyCalendarPage; 