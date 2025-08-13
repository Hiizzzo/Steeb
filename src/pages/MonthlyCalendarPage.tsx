import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, CheckCircle, Plus, Flame, Trophy } from 'lucide-react';

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
  
  
  const { 
    tasks, 
    setTasks: updateTasks, 
    isLoading: isPersistenceLoading 
  } = useTaskStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Generar días del calendario (inicio en lunes)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    // Ajustar para que la semana comience en lunes (0 = lunes)
    const mondayIndex = (firstDay.getDay() + 6) % 7; // 0..6 (lun..dom)
    startDate.setDate(startDate.getDate() - mondayIndex);
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const dayTasks = tasks.filter(task =>
        task.scheduledDate === dateString || task.completedDate?.split('T')[0] === dateString
      );
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

  const handleCreateTask = (title: string, type: 'personal' | 'work' | 'meditation', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string, notes?: string, isPrimary?: boolean, subgroup?: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'social' | 'salud' | 'entretenimiento' | 'extra') => {
    try {
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        type,
         subgroup,
         status: 'pending',
         completed: false,
        subtasks: subtasks || [],
        scheduledDate: scheduledDate || selectedDateForTask || undefined,
        scheduledTime,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: isPrimary ? ['principal'] : []
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

  // Métricas superiores
  const { currentStreak, bestStreak, totalCompleted, daysWithCompletedInMonth } = useMemo(() => {
    const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = normalize(new Date());

    // Fechas con al menos una tarea completada (set por día)
    const completedDates = tasks
      .filter(t => t.completed && t.completedDate)
      .map(t => new Date(t.completedDate!))
      .map(normalize);

    const key = (d: Date) => d.toISOString();
    const completedSet = new Set(completedDates.map(key));

    // Calcular racha actual (hasta hoy) y mejor racha histórica
    let current = 0;
    let best = 0;

    // Recorrer hacia atrás desde hoy mientras existan días consecutivos completados
    let probe = new Date(today);
    while (completedSet.has(key(probe))) {
      current += 1;
      probe.setDate(probe.getDate() - 1);
    }

    // Mejor racha: recorrer el rango total de fechas completadas
    if (completedDates.length > 0) {
      // Ordenar únicas
      const uniqueDates = Array.from(completedSet).map(s => new Date(s)).sort((a,b)=>a.getTime()-b.getTime());
      let streak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = uniqueDates[i-1];
        const curr = uniqueDates[i];
        const prevNext = new Date(prev);
        prevNext.setDate(prevNext.getDate() + 1);
        if (key(prevNext) === key(curr)) {
          streak += 1;
        } else {
          best = Math.max(best, streak);
          streak = 1;
        }
      }
      best = Math.max(best, streak);
    }

    // Días activos del mes visible (con al menos una completada)
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    let daysActive = 0;
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      if (completedSet.has(key(normalize(d)))) daysActive += 1;
    }

    return {
      currentStreak: current,
      bestStreak: best,
      totalCompleted: tasks.filter(t => t.completed).length,
      daysWithCompletedInMonth: daysActive,
    };
  }, [tasks, currentDate]);

  const renderCalendarDay = (day: CalendarDay, index: number) => (
    <motion.div
      key={day.dateString}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: ANIMATION_CONFIG.daySelection,
        delay: index * 0.01,
        ease: ANIMATION_CONFIG.easing as any
      }}
      className={`
          relative h-12 sm:h-14 rounded-xl bg-white border
          ${day.isCurrentMonth ? 'border-neutral-200' : 'border-neutral-100'}
          ${day.isToday ? 'ring-2 ring-black' : ''}
          ${day.isSelected ? 'outline outline-2 outline-black' : ''}
          cursor-pointer transition-colors duration-150 hover:bg-neutral-50
        `}
      onClick={() => handleDateSelect(day.dateString)}
      onMouseEnter={() => setHoveredDate(day.date)}
      onMouseLeave={() => setHoveredDate(null)}
    >
      {/* Número del día */}
      <div
        className={`absolute top-1 left-1/2 -translate-x-1/2 text-[13px] sm:text-[15px] tabular-nums
          ${day.isCurrentMonth ? 'text-neutral-900' : 'text-neutral-400'}
          ${day.isToday ? 'font-bold' : 'font-semibold'}`}
      >
        {day.day}
      </div>

      {/* Contador de tareas completadas del día (eliminado) */}
      {/* Se removió la visualización del número de tareas completadas para no mostrarlo en cada día */}

      {/* Barra de progreso diaria (siempre visible) */}
      <div className={`absolute left-2 right-2 bottom-1 h-1 rounded-full overflow-hidden 
        ${day.isCurrentMonth ? 'bg-neutral-200' : 'bg-neutral-100'}`}
      >
        {(() => {
          const width = day.totalTasks === 0 ? '0%' : (day.completedTasks === day.totalTasks ? '100%' : '50%');
          return (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width }}
              transition={{ duration: ANIMATION_CONFIG.taskIndicator, ease: ANIMATION_CONFIG.easing as any }}
              className={`h-full rounded-full ${day.totalTasks > 0 ? 'bg-neutral-800' : 'bg-neutral-300'}`}
            />
          );
        })()}
      </div>

      {/* Hover sutil */}
      <AnimatePresence>
        {hoveredDate?.toDateString() === day.date.toDateString() && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.06 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-xl bg-neutral-800"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-white p-2 pt-1">
      {/* Header con navegación */}
      <div className="max-w-[430px] mx-auto">
        {/* Botón Volver */}
        <div className="flex justify-start mb-2">
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-full shadow-sm hover:shadow-md transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver</span>
          </motion.button>
        </div>

        {/* Botón Ver más detalles */}
        <div className="flex justify-center mb-2">
          <motion.button
            onClick={() => navigate('/productivity-stats')}
            className="px-4 py-1.5 rounded-full border bg-white hover:bg-black hover:text-white transition-colors text-sm shadow-sm"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            Ver más detalles
          </motion.button>
        </div>

        {/* Título centrado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-3 hidden sm:block"
        >
          <h1 className="text-xl sm:text-2xl font-bold text-black">
            Hoy es un gran día para tachar pendientes
          </h1>
        </motion.div>

        {/* Tarjetas de métricas */}
        <div className="mb-2 -mx-1 px-1 hidden sm:block">
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-xl border bg-white text-black p-2 flex flex-col items-center justify-center gap-1 shadow-sm">
              <Flame className="w-4 h-4" />
              <div className="text-lg font-bold">{currentStreak}</div>
              <div className="text-[11px] text-gray-600 leading-none mt-0.5">días de racha</div>
            </div>
            <div className="rounded-xl border bg-white text-black p-2 flex flex-col items-center justify-center gap-1 shadow-sm">
              <CheckCircle className="w-4 h-4" />
              <div className="text-lg font-bold">{totalCompleted}</div>
              <div className="text-[11px] text-gray-600 leading-none mt-0.5">tareas completadas</div>
            </div>
            <div className="rounded-xl border bg-white text-black p-2 flex flex-col items-center justify-center gap-1 shadow-sm">
              <Calendar className="w-4 h-4" />
              <div className="text-lg font-bold">{daysWithCompletedInMonth}</div>
              <div className="text-[11px] text-gray-600 leading-none mt-0.5">Días activos</div>
            </div>
            <div className="rounded-xl border bg-white text-black p-2 flex flex-col items-center justify-center gap-1 shadow-sm">
              <Trophy className="w-4 h-4" />
              <div className="text-lg font-bold">{bestStreak}</div>
              <div className="text-[11px] text-gray-600 leading-none mt-0.5">mejor racha</div>
            </div>
          </div>
        </div>

        {/* Controles del calendario */}
        <Card className="p-3 mb-2 bg-white border">
          <div className="flex items-center justify-between mb-4">
            <motion.button
              onClick={prevMonth}
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
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
                className="text-2xl font-bold text-black"
              >
                {capitalize(currentDate.toLocaleDateString('es-ES', { 
                  month: 'long', 
                  year: 'numeric' 
                }))}
              </motion.h2>
              <div className="mt-1 text-sm text-gray-600">
                {currentDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).replace('de ', '')}
              </div>
            </div>

            <motion.button
              onClick={nextMonth}
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Días de la semana (LUN-DOM) */}
          <div className="grid grid-cols-7 gap-[6px] mb-2">
            {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((day, index) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="text-center text-xs sm:text-sm font-semibold text-gray-700 py-1"
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
            className="grid grid-cols-7 gap-[6px]"
          >
            {calendarDays.map((day, index) => renderCalendarDay(day, index))}
          </motion.div>

          {/* Leyenda y fecha seleccionada */}
          <div className="mt-2">
            <div className="flex items-center justify-center gap-3 text-xs text-gray-700">
              <span>Menos</span>
              <div className="flex gap-1">
                <span className="h-2 w-4 rounded-sm bg-black/10" />
                <span className="h-2 w-4 rounded-sm bg-black/30" />
                <span className="h-2 w-4 rounded-sm bg-black/50" />
                <span className="h-2 w-4 rounded-sm bg-black/70" />
                <span className="h-2 w-4 rounded-sm bg-black" />
              </div>
              <span>Más</span>
            </div>
            <p className="mt-2 text-center text-sm text-gray-800">
              {new Date(selectedDate || new Date().toISOString().split('T')[0]).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
            {/* Resumen de tareas del día seleccionado */}
            <p className="mt-1 text-center text-xs text-gray-600">
              {(() => {
                const day = calendarDays.find(d => d.dateString === (selectedDate || new Date().toISOString().split('T')[0]));
                const completed = day?.completedTasks ?? 0;
                const total = day?.totalTasks ?? 0;
                return `${completed} ${completed === 1 ? 'tarea hecha' : 'tareas hechas'}${total > 0 ? ` · ${total} en total` : ''}`;
              })()}
            </p>
          </div>
        </Card>

        {/* Tareas del día seleccionado */}
        {selectedDate && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="bg-white border rounded-2xl p-4 shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-3 text-black text-center">
                Tareas del {new Date(selectedDate).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>

              {calendarDays.find(d => d.dateString === selectedDate)?.tasks.length === 0 ? (
                <div className="text-center py-6 text-gray-700">
                  <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm">No hay tareas programadas para este día</p>
                  <Button
                    onClick={() => handleAddTask(selectedDate)}
                    className="mt-3 bg-black text-white rounded-full px-3 py-1.5 h-auto text-sm shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Tarea
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {calendarDays.find(d => d.dateString === selectedDate)?.tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl border hover:bg-black/5 transition-colors"
                    >
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          task.completed 
                            ? 'bg-black border-black text-white' 
                            : 'border-black/40'
                        }`}
                      >
                        {task.completed && <CheckCircle className="w-3 h-3" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-[15px] truncate ${task.completed ? 'line-through text-gray-500' : 'text-black font-medium'}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {task.type} • {task.scheduledTime || 'Sin hora'}
                        </p>
                      </div>
                      
                      <Button onClick={() => handleShowTaskDetail(task.id)} variant="ghost" size="sm" className="h-8 px-2">
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