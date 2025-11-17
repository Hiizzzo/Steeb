import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, Plus, Flame, Trophy, Trash2, Check, ArrowLeft } from 'lucide-react';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import SwipeNavigationIndicator from '@/components/SwipeNavigationIndicator';

import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTaskStore } from '@/store/useTaskStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import TaskCreationCard from '@/components/TaskCreationCard';
import { Task, SubTask, RecurrenceRule } from '@/types';
import ShapeIcon from '@/components/ShapeIcon';

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

// Helpers de fecha local (evitar desfase UTC)
function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function tryParseDate(input: string): Date | null {
  if (!input) return null;
  // ISO o parseable por Date
  const d1 = new Date(input);
  if (!isNaN(d1.getTime())) return d1;
  // YYYY/MM/DD
  const ymdSlash = input.match(/^(\d{4})[\/](\d{1,2})[\/](\d{1,2})$/);
  if (ymdSlash) {
    const [, y, m, d] = ymdSlash;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  // YYYY-MM-DD (ya manejado por Date en la mayoría, pero por si falla en algunos entornos)
  const ymdDash = input.match(/^(\d{4})[-](\d{1,2})[-](\d{1,2})$/);
  if (ymdDash) {
    const [, y, m, d] = ymdDash;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return null;
}
function normalizeDateString(input?: string): string | null {
  if (!input) return null;
  const d = tryParseDate(input);
  return d ? toLocalDateString(d) : null;
}
function parseLocalDate(dateStr: string): Date {
  // Parsear YYYY-MM-DD como local para evitar el salto de día por UTC
  const ymdDash = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdDash) {
    const [, y, m, d] = ymdDash;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const parsed = tryParseDate(dateStr);
  if (parsed) return parsed;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

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
  const { playTaskCompleteSound, playTaskDeleteSound, triggerVibration } = useSoundEffects();
  const { name, nickname } = useUserProfile();
  const isMobile = useIsMobile();
  const isShiny = document.documentElement.classList.contains('shiny');

  // Sistema de navegación por swipe
  const { SwipeHandler, isSwiping, swipeProgress } = useSwipeNavigation({
    direction: 'left',
    threshold: 80,
    duration: 500,
    enableMouse: true // Habilitado para PC
  });
  
  const { 
    tasks, 
    setTasks: updateTasks, 
    deleteTask: deleteTaskStore,
    addTask, // <-- usamos la acción del store para respetar recurrencias y sincronización
    isLoading: isPersistenceLoading 
  } = useTaskStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(toLocalDateString(new Date()));
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [completedGoals, setCompletedGoals] = useState<Array<{text: string, completedDate: string, month: string}>>([]);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Cargar objetivos completados del localStorage
  useEffect(() => {
    const storedCompletedGoals = localStorage.getItem('stebe-completed-goals');
    if (storedCompletedGoals !== null) {
      try {
        setCompletedGoals(JSON.parse(storedCompletedGoals));
      } catch (e) {
        setCompletedGoals([]);
      }
    }
  }, []);

  // Obtener objetivo completado del mes actual
  const getCurrentMonthGoal = useMemo(() => {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const currentMonthName = monthNames[currentDate.getMonth()];
    return completedGoals.find(goal => goal.month === currentMonthName);
  }, [completedGoals, currentDate]);

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
      
      const dateString = toLocalDateString(date);
      const isTodayCell = dateString === toLocalDateString(new Date());
      const dayTasks = tasks.filter(task => {
        const scheduledStr = normalizeDateString(task.scheduledDate);
        const completedStr = normalizeDateString(task.completedDate || '');
        const noDateAsToday = !scheduledStr && isTodayCell; // tareas sin fecha caen en HOY
        const scheduledMatch = scheduledStr ? scheduledStr === dateString : noDateAsToday;
        const completedMatch = completedStr ? completedStr === dateString : false;
        return scheduledMatch || completedMatch;
      });
      // IMPORTANTE: Contar como "completadas en este día" SOLO si completedDate coincide con el día
      const completedTasks = dayTasks.filter(task => {
        const completedStr = normalizeDateString(task.completedDate || '');
        return task.completed && !!completedStr && completedStr === dateString;
      }).length;
      const totalTasks = dayTasks.length;
      const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      days.push({
        day: date.getDate(),
        date,
        dateString,
        isCurrentMonth: date.getMonth() === month,
        isToday: toLocalDateString(date) === toLocalDateString(today),
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

    const targetDateStr = selectedDate || toLocalDateString(new Date());

    const updatedTasks = tasks.map(task => {
      if (task.id !== id) return task;
      const isCompletedForSelectedDate = task.completed && normalizeDateString(task.completedDate || '') === targetDateStr;
      const willComplete = !isCompletedForSelectedDate;
      return {
        ...task,
        completed: willComplete,
        completedDate: willComplete ? new Date(`${targetDateStr}T12:00:00`).toISOString() : undefined
      };
    });
    updateTasks(updatedTasks);
    
    if (task) {
      const isCompletedForSelectedDate = task.completed && normalizeDateString(task.completedDate || '') === (selectedDate || toLocalDateString(new Date()));
      if (!isCompletedForSelectedDate) {
        playTaskCompleteSound();
        triggerVibration();
        toast({
          title: "¡Tarea completada!",
          description: "¡Excelente trabajo!",
        });
      }
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
        triggerVibration();
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

  const handleCreateTask = (
   title: string,
   type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra',
   subtasks?: SubTask[],
   scheduledDate?: string,
   scheduledTime?: string,
   notes?: string,
   isPrimary?: boolean,
   recurrence?: RecurrenceRule
 ) => {
    try {
      const effectiveDate = scheduledDate || selectedDateForTask || undefined;

      if (typeof addTask === 'function') {
        Promise.resolve(
          (addTask as any)({
            title: title?.trim(),
            type,
            status: 'pending',
            completed: false,
            subtasks,
            scheduledDate: effectiveDate,
            scheduledTime,
            notes,
            tags: isPrimary ? ['principal'] : [],
            recurrence
          } as any)
        ).catch((err: any) => {
          console.error('Error al crear tarea desde calendario mensual:', err);
          toast({
            title: "Error",
            description: "Hubo un problema al crear la tarea. Inténtalo de nuevo.",
          });
        });
      } else {
        // Fallback local si el store no expone addTask
        const newTask: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: title?.trim(),
          type,
          status: 'pending',
          completed: false,
          subtasks: subtasks || [],
          scheduledDate: effectiveDate,
          scheduledTime,
          notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: isPrimary ? ['principal'] : [],
          recurrence
        };
        updateTasks([...tasks, newTask]);
      }
      
      setShowTaskCreation(false);
      setSelectedDateForTask(null);
      localStorage.removeItem('stebe-selected-date');
      
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

  // Gestos: swipe-to-delete para la lista diaria (pestaña Calendario)
  const SWIPE_THRESHOLD = 60;
  const MAX_SWIPE = 160;
  const [swipeOffsetById, setSwipeOffsetById] = useState<Record<string, number>>({});
  const [deletingTaskIds, setDeletingTaskIds] = useState<Set<string>>(new Set());
  const activeIdRef = useRef<string | null>(null);
  const startXRef = useRef(0);

  const onPointerDownSwipe = (id: string) => (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    activeIdRef.current = id;
    startXRef.current = e.clientX;
    document.body.style.userSelect = 'none';
  };
  const onPointerMoveSwipe = (id: string) => (e: React.PointerEvent) => {
    if (activeIdRef.current !== id) return;
    const deltaX = startXRef.current - e.clientX; // mover a la izquierda
    if (deltaX > 0) {
      e.preventDefault();
      const next = Math.min(deltaX, MAX_SWIPE);
      setSwipeOffsetById(prev => ({ ...prev, [id]: next }));
    }
  };
  const finishRowSwipe = (id: string) => {
    const offset = swipeOffsetById[id] || 0;
    if (offset > SWIPE_THRESHOLD) {
      // Efectos de feedback
      triggerVibration();
      playTaskDeleteSound(); // Sonido específico para eliminar tareas
      
      // Marcar como eliminando para activar animación de salida
      setDeletingTaskIds(prev => new Set([...prev, id]));
      
      // Mostrar toast de confirmación
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada exitosamente.",
      });
      
      // Animación de salida con delay
      setTimeout(() => {
        if (deleteTaskStore) {
          // Si existe en el store, usar API oficial
          try { (deleteTaskStore as any)(id); } catch (e) { console.error(e); }
        } else {
          // Fallback: eliminar localmente
          updateTasks(tasks.filter(t => t.id !== id));
        }
        // Limpiar estados
        setDeletingTaskIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 300); // Delay para permitir la animación
    }
    setSwipeOffsetById(prev => ({ ...prev, [id]: 0 }));
    activeIdRef.current = null;
    document.body.style.userSelect = '';
  };
  const onPointerUpSwipe = (id: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    finishRowSwipe(id);
  };

  const renderShapeForType = (type: Task['type']) => {
    const isShiny = document.documentElement.classList.contains('shiny');
    const isDark = document.documentElement.classList.contains('dark');
    const shapeColor = isShiny ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000');
    
    switch (type) {
      case 'productividad':   return <ShapeIcon variant="square" className="w-4 h-4 mr-2" title="Trabajo" color={shapeColor} />;
      case 'salud':           return <ShapeIcon variant="heart" className="w-4 h-4 mr-2" title="Salud" color={shapeColor} />;
      case 'social':          return <ShapeIcon variant="triangle" className="w-4 h-4 mr-2" title="Social" color={shapeColor} />;
      case 'organizacion':    return <ShapeIcon variant="diamond" className="w-4 h-4 mr-2" title="Organización" color={shapeColor} />;
      case 'aprendizaje':
      case 'creatividad':
      case 'entretenimiento': return <ShapeIcon variant="triangle" className="w-4 h-4 mr-2" title={type} color={shapeColor} />;
      case 'extra':           return <ShapeIcon variant="diamond" className="w-4 h-4 mr-2" title="Extra" color={shapeColor} />;
      default: return <div className="w-4 h-4 mr-2 border" style={{ borderColor: shapeColor }} />;
    }
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

  // Helper: usar apodo solo ocasionalmente (máx. 1 vez por día) para mantener efecto psicológico
  const allowNicknamePraiseOncePerDay = () => {
    try {
      const key = 'stebe-last-nickname-praise';
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const last = localStorage.getItem(key);
      if (last !== todayStr) {
        localStorage.setItem(key, todayStr);
        return true;
      }
      return false;
    } catch {
      // Si localStorage no está disponible, permitir una vez (no persistente)
      return true;
    }
  };

  // Mensaje de consejo mensual para el globo de STEBE
  const adviceText = useMemo(() => {
    const { completed, scheduled } = monthStats;
    const rate = scheduled > 0 ? Math.round((completed / Math.max(1, scheduled)) * 100) : 0;

    const fullName = name?.trim() || 'Usuario';
    const nickName = nickname?.trim() || (name?.split(' ')[0] || 'amigo');

    // Casos especiales
    if (scheduled === 0 && totalCompleted === 0) {
      return (<>Hola <strong className="font-bold">{fullName}</strong>, 0/0. Arranquemos con 1–3 metas sencillas. Estoy con vos.</>);
    }
    if (scheduled === 0 && totalCompleted > 0) {
      return (<>Bien ahí, <strong className="font-bold">{nickName}</strong>! {totalCompleted}/0. Definí 1–3 metas y le damos.</>);
    }

    // Consejos según rendimiento (apodo para felicitar, nombre completo para retar/motivar)
    if (rate >= 85) {
      return (<>Tremendo, <strong className="font-bold">{nickName}</strong>! {completed}/{scheduled} ({rate}%). Racha {currentStreak}d. Seguimos.</>);
    }
    if (rate >= 60) {
      return (<>Vamos bien, <strong className="font-bold">{nickName}</strong>. {completed}/{scheduled} ({rate}%). Sumemos 1–2 días.</>);
    }
    if (rate > 0) {
      return (<>Ey <strong className="font-bold">{fullName}</strong>, {completed}/{scheduled} ({rate}%). Meté 1 tarea hoy y tomás ritmo.</>);
    }

    // scheduled > 0 y completed = 0
    return (<>Hola <strong className="font-bold">{fullName}</strong>, 0/{scheduled} (0%). Empecemos con 1 tarea hoy. Yo te acompaño.</>);
  }, [monthStats, currentStreak, daysWithCompletedInMonth, totalCompleted, name, nickname]);

  // Se deshabilitan gestos de navegación hacia atrás. Solo el botón dedicado permite volver.

  const renderCalendarDay = (day: CalendarDay, index: number) => {
    return (
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
            relative h-12 sm:h-14 rounded-full cursor-pointer transition-all duration-150
            bg-white text-black dark:bg-white dark:text-white
            ${day.isSelected ? 'border-2 border-black dark:border-white' : 'border border-transparent'}
            hover:shadow-sm
          `}
        onClick={() => handleDateSelect(day.dateString)}
        onMouseEnter={() => setHoveredDate(day.date)}
        onMouseLeave={() => setHoveredDate(null)}
      >
        {/* Número del día */}
        <div className={`absolute inset-0 flex items-center justify-center text-[14px] sm:text-[16px] font-semibold transition-colors text-black dark:text-white ${day.isCurrentMonth ? '' : 'opacity-60'}`}>
          {day.day}
        </div>
  
        {/* Barra de progreso: pegada al número y solo si hay tareas completadas */}
        {day.completedTasks > 0 && (
          <div className={`absolute left-2 right-2 top-8 sm:top-10 h-1 rounded-full overflow-hidden 
            ${day.isCurrentMonth ? 'bg-neutral-200 dark:bg-white/20' : 'bg-neutral-100 dark:bg-white/10'}`}
          >
            {(() => {
              const ratio = Math.min(1, day.totalTasks > 0 ? day.completedTasks / day.totalTasks : 0);
              const width = `${Math.round(ratio * 100)}%`;
              return (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width }}
                  transition={{ duration: ANIMATION_CONFIG.taskIndicator, ease: ANIMATION_CONFIG.easing as any }}
                  className="h-full rounded-full bg-black dark:!bg-white"
                />
              );
            })()}
          </div>
        )}
  
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
  };

  return (
    <SwipeHandler>
      <div
        className="min-h-screen bg-white dark:bg-black p-2 pt-1"
        style={{ fontFamily: 'Be Vietnam Pro, system-ui, -apple-system, sans-serif' }}
      >
      {/* Header con navegación */}
      <div className="max-w-[400px] mx-auto relative">
        {/* Botón para ir atrás */}
        <div className="flex items-center justify-start mb-4 mt-4">
          <button
            onClick={() => navigate('/')}
            className="hover:opacity-70 transition-opacity"
            aria-label="Volver"
          >
            <ArrowLeft size={24} className="text-black dark:text-white shiny:text-white" />
          </button>
        </div>

        {/* Header: Avatar a la izquierda y globo de consejo a la derecha */}
        <div className="flex items-start mt-6 mb-6 gap-3">
          <div className="shrink-0">
            <img
              src="/lovable-uploads/icono de la app.png"
              alt="Stebe"
              className="w-24 h-24 rounded-2xl"
            />
          </div>
          <motion.div
            className="relative flex-1 max-w-[calc(100%-110px)] bg-white dark:bg-black border border-white dark:border-white rounded-2xl px-3 py-2 mr-4 mt-2 text-sm leading-snug text-black dark:text-white shadow-sm shiny-steeb-dialog"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="font-semibold mb-0.5">STEEB</div>
            <div className="opacity-90">{adviceText}</div>
          </motion.div>
        </div>

        {/* Indicador de página actual (calendario) */}
        <div className="flex items-center justify-center my-1">
          <div className="w-3 h-3 rounded-full bg-black dark:bg-white" />
        </div>

        {/* Controles del calendario */}
        <Card className="p-3 mb-2 bg-white dark:bg-black relative border-0 shadow-none shiny-calendar-card">
          {/* Etiqueta STEEB solo en modo Shiny */}
          
          <div className="flex items-center justify-between mb-4">
            <motion.button
              onClick={prevMonth}
              className="p-2 rounded-full bg-white border-2 border-black hover:bg-white focus:bg-white active:bg-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-6 h-6 text-black" />
            </motion.button>

            <div className="flex flex-col items-center">
              <motion.h2
                key={currentDate.toISOString()}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`text-2xl font-bold text-black dark:text-black`}
               >
                {capitalize(currentDate.toLocaleDateString('es-ES', { 
                  month: 'long', 
                  year: 'numeric' 
                }))}
              </motion.h2>
              
              {/* Objetivo completado del mes */}
              {getCurrentMonthGoal && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="mt-2 px-3 py-1.5 bg-white dark:bg-black border border-white dark:border-white rounded-lg max-w-xs"
                >
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
                    <p className="text-xs text-black dark:text-white font-medium truncate">
                      {getCurrentMonthGoal.text}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            <motion.button
              onClick={nextMonth}
              className="p-2 rounded-full bg-white border-2 border-black hover:bg-white focus:bg-white active:bg-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-6 h-6 text-black" />
            </motion.button>
          </div>

          {/* Días de la semana (LUN-DOM) */}
          <div className="grid grid-cols-7 gap-[6px] mb-2">
            {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((day, index) => {
              const today = new Date();
              const currentDayIndex = (today.getDay() + 6) % 7; // Convertir domingo=0 a lunes=0
              const isToday = index === currentDayIndex;
              
              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`text-center text-xs sm:text-sm font-semibold py-2 rounded-full transition-all duration-200 ${
                    isToday 
                      ? 'text-black bg-gray-200 dark:bg-white dark:text-black scale-110 shadow-lg' 
                      : 'text-black bg-gray-100 dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {day}
                </motion.div>
              );
            })}
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

          {/* Se removió la leyenda, resumen y botón +info para un diseño más limpio */}
        </Card>

        {/* (Se quitó el botón Volver; navegación solo con la pelotita de casa) */}

        {/* Tareas del día seleccionado */}
        {selectedDate && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="bg-white dark:bg-black rounded-2xl p-4 shadow-sm"
            >
              <div className="mb-3 text-center">
                <h3 className="text-lg font-semibold text-black">
                  {(() => {
                    const s = parseLocalDate(selectedDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    });
                    return s.charAt(0).toUpperCase() + s.slice(1);
                  })()}
                </h3>
                
                {(() => {
                  const d = calendarDays.find(dd => dd.dateString === selectedDate);
                  const completed = d?.completedTasks ?? 0;
                  const total = d?.totalTasks ?? 0;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <div className="mx-auto mt-2 mb-2 w-full max-w-md">
                      <div className="w-full h-1 bg-neutral-200 dark:bg-white/15 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full bg-black dark:!bg-white"
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{completed} de {total} tareas</div>
                    </div>
                  );
                })()}
              </div>

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
                <div className="space-y-4">
                  {calendarDays.find(d => d.dateString === selectedDate)?.tasks
                    .sort((a, b) => {
                      // Tareas completadas van al final (según fecha seleccionada)
                      const aCompleted = a.completed && normalizeDateString(a.completedDate || '') === selectedDate;
                      const bCompleted = b.completed && normalizeDateString(b.completedDate || '') === selectedDate;
                      if (aCompleted && !bCompleted) return 1;
                      if (!aCompleted && bCompleted) return -1;
                      // Si ambas tienen el mismo estado, mantener orden original
                      return 0;
                    })
                    .map((task) => {
                      const isCompletedForSelectedDate = task.completed && normalizeDateString(task.completedDate || '') === selectedDate;
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -14 }}
                          animate={{ 
                            opacity: deletingTaskIds.has(task.id) ? 0 : 1, 
                            x: deletingTaskIds.has(task.id) ? -100 : 0,
                            scale: deletingTaskIds.has(task.id) ? 0.8 : 1,
                            height: deletingTaskIds.has(task.id) ? 0 : 'auto'
                          }}
                          exit={{ opacity: 0, x: -100, scale: 0.8, height: 0 }}
                          transition={{ 
                            duration: deletingTaskIds.has(task.id) ? 0.3 : 0.2,
                            ease: "easeInOut"
                          }}
                          className="relative overflow-hidden px-1.5 py-2"
                          onTouchStart={isMobile ? (e) => {
                            e.stopPropagation();
                            const touch = e.touches[0];
                            if (!touch) return;
                            activeIdRef.current = task.id;
                            startXRef.current = touch.clientX;
                            document.body.style.userSelect = 'none';
                          } : undefined}
                          onTouchMove={isMobile ? (e) => {
                            if (activeIdRef.current !== task.id || !e.touches[0]) return;
                            const deltaX = startXRef.current - e.touches[0].clientX;
                            if (deltaX > 0) {
                              e.preventDefault();
                              e.stopPropagation();
                              const next = Math.min(deltaX, MAX_SWIPE);
                              setSwipeOffsetById(prev => ({ ...prev, [task.id]: next }));
                            }
                          } : undefined}
                          onTouchEnd={isMobile ? (e) => {
                            e.stopPropagation();
                            finishRowSwipe(task.id);
                          } : undefined}
                          onPointerDown={!isMobile ? onPointerDownSwipe(task.id) : undefined}
                          onPointerMove={!isMobile ? onPointerMoveSwipe(task.id) : undefined}
                          onPointerUp={!isMobile ? onPointerUpSwipe(task.id) : undefined}
                          onPointerCancel={!isMobile ? onPointerUpSwipe(task.id) : undefined}
                          style={{
                            transform: `translate3d(-${swipeOffsetById[task.id] || 0}px,0,0)`,
                            transition: 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            touchAction: 'pan-x',
                            userSelect: (swipeOffsetById[task.id] || 0) > 0 ? 'none' : undefined,
                            willChange: 'transform',
                            filter: (swipeOffsetById[task.id] || 0) > 30 ? 'brightness(0.9)' : 'brightness(1)',
                          }}
                        >
                          {/* Fondo de eliminación con animación mejorada */}
                          <div className={`absolute inset-0 flex items-center justify-end pr-3 transition-all duration-300 ease-out ${
                            (swipeOffsetById[task.id] || 0) > 6 
                              ? 'opacity-100 bg-red-500 dark:bg-white shadow-lg transform scale-105' 
                              : 'opacity-0 bg-gray-300 dark:bg-gray-600 transform scale-100'
                          }`}>
                            <motion.span 
                              className={`text-sm mr-2 font-medium ${
                                (swipeOffsetById[task.id] || 0) > 6 
                                  ? 'text-white dark:text-black' 
                                  : 'text-gray-500'
                              }`}
                              animate={{
                                scale: (swipeOffsetById[task.id] || 0) > 6 ? 1.1 : 1,
                                x: (swipeOffsetById[task.id] || 0) > 6 ? -5 : 0
                              }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                              Eliminar
                            </motion.span>
                            <motion.div
                              animate={{
                                scale: (swipeOffsetById[task.id] || 0) > 6 ? 1.2 : 1,
                                rotate: (swipeOffsetById[task.id] || 0) > 6 ? 10 : 0,
                                x: (swipeOffsetById[task.id] || 0) > 6 ? -3 : 0
                              }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                              <Trash2 className={`w-5 h-5 ${
                                (swipeOffsetById[task.id] || 0) > 6 
                                  ? 'text-white dark:text-black' 
                                  : 'text-gray-400'
                              }`} />
                            </motion.div>
                          </div>

                          {/* Fila de contenido */}
                          <div className="relative z-10 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center">
                                {renderShapeForType(task.type)}
                                <p className={`text-[18px] truncate ${isCompletedForSelectedDate ? 'line-through text-gray-500 dark:text-white' : 'text-black dark:text-white font-medium'}`}>{task.title}</p>
                              </div>
                              {task.scheduledTime && (
                                <p className="text-sm text-gray-600">{task.scheduledTime}</p>
                              )}
                            </div>
                            {/* Selector estilo radio a la derecha */}
                            <button
                              onClick={() => handleToggleTask(task.id)}
                              aria-label="Seleccionar tarea"
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isCompletedForSelectedDate ? 'bg-black border-black dark:bg-white dark:border-white' : 'border-black dark:border-white'}`}
                            >

                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
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

        {/* Indicador de navegación por swipe */}
        <SwipeNavigationIndicator
          isVisible={isSwiping}
          progress={swipeProgress}
          direction="left"
        />
      </div>
      </div>
    </SwipeHandler>
  );
};

export default MonthlyCalendarPage;