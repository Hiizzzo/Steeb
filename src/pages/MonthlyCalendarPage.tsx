import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, CheckCircle, Plus, Flame, Trophy } from 'lucide-react';

import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTaskStore } from '@/store/useTaskStore';
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
  // DD/MM/YYYY
  const dmy = input.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
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
  const { playTaskCompleteSound } = useSoundEffects();
  
  
  const { 
    tasks, 
    setTasks: updateTasks, 
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
      const completedTasks = dayTasks.filter(task => task.completed).length;
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
        tags: isPrimary ? ['principal'] : [],
        recurrence
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

  const renderShapeForType = (type: Task['type']) => {
    switch (type) {
      case 'productividad':   return <ShapeIcon variant="square" className="w-4 h-4 mr-2 text-black" title="Trabajo" />;
      case 'salud':           return <ShapeIcon variant="heart" className="w-4 h-4 mr-2 text-black" title="Salud" />;
      case 'social':          return <ShapeIcon variant="triangle" className="w-4 h-4 mr-2 text-black" title="Social" />;
      case 'organizacion':    return <ShapeIcon variant="diamond" className="w-4 h-4 mr-2 text-black" title="Organización" />;
      case 'aprendizaje':
      case 'creatividad':
      case 'entretenimiento': return <ShapeIcon variant="triangle" className="w-4 h-4 mr-2 text-black" title={type} />;
      case 'extra':           return <ShapeIcon variant="diamond" className="w-4 h-4 mr-2 text-black" title="Extra" />;
      default: return <div className="w-4 h-4 mr-2 border border-black" />;
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

  // Mensaje de consejo mensual para el globo de STEBE
  const adviceText = useMemo(() => {
    const { completed, scheduled } = monthStats;
    const rate = scheduled > 0 ? Math.round((completed / Math.max(1, scheduled)) * 100) : 0;

    // Casos especiales
    if (scheduled === 0 && totalCompleted === 0) {
      return 'Aún no hay tareas este mes. Planifica 1-3 objetivos clave para empezar con foco.';
    }
    if (scheduled === 0 && totalCompleted > 0) {
      return `Buen impulso: completaste ${totalCompleted} tareas. Programa metas para enfocar tu energía.`;
    }

    // Consejos según rendimiento
    if (rate >= 85) {
      return `¡Gran mes! Completaste ${completed} de ${scheduled} (${rate}%). Mantén la racha de ${currentStreak} día(s).`;
    }
    if (rate >= 60) {
      return `Vas bien: ${completed}/${scheduled} (${rate}%). Intenta sumar 1-2 días más activos (hoy llevas ${daysWithCompletedInMonth}).`;
    }
    if (rate > 0) {
      return `Progreso en marcha: ${completed}/${scheduled} (${rate}%). Elige 1 tarea pequeña diaria para ganar ritmo.`;
    }

    return 'Empieza con una tarea sencilla hoy para construir momentum. ¡Yo te acompaño!';
  }, [monthStats, currentStreak, daysWithCompletedInMonth, totalCompleted]);

  // Swipe para volver al inicio (gesto izquierda)
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);
  const [mouseLastX, setMouseLastX] = useState<number | null>(null);
  const wheelCooldownRef = useRef<number>(0);
  const wheelAccumRef = useRef<number>(0);
  const wheelTimerRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    if (mouseStartX === null) return;
    const handleWindowMouseUp = (e: MouseEvent) => {
      const endX = e.clientX;
      const dx = endX - (mouseStartX ?? endX);
      if (dx < -100) {
        navigate('/');
      }
      setMouseStartX(null);
      setMouseLastX(null);
    };
    const handleWindowMouseMove = (e: MouseEvent) => {
      setMouseLastX(e.clientX);
    };
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('mousemove', handleWindowMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('mousemove', handleWindowMouseMove);
    };
  }, [mouseStartX, navigate]);

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
          relative h-14 sm:h-16 rounded-xl bg-white dark:bg-black
          ${day.isToday ? 'ring-2 ring-black dark:ring-white' : ''}
          ${day.isSelected ? 'outline outline-2 outline-black dark:outline-white' : ''}
          cursor-pointer transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-white/5
        `}
      onClick={() => handleDateSelect(day.dateString)}
      onMouseEnter={() => setHoveredDate(day.date)}
      onMouseLeave={() => setHoveredDate(null)}
    >
      {/* Número del día */}
      <div
        className={`absolute top-1 left-1/2 -translate-x-1/2 text-[18px] sm:text-[20px] tabular-nums
          ${day.isCurrentMonth ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-white/60'}
          ${day.isToday ? 'font-bold' : 'font-semibold'}`}
      >
        {day.day}
      </div>

      {/* Barra de progreso: pegada al número y solo si hay tareas completadas */}
      {day.completedTasks > 0 && (
        <div className={`absolute left-2 right-2 top-8 sm:top-10 h-1 rounded-full overflow-hidden 
          ${day.isCurrentMonth ? 'bg-neutral-200 dark:bg-white/20' : 'bg-neutral-100 dark:bg-white/10'}`}
        >
          {(() => {
            const ratio = day.completedTasks / Math.max(1, day.totalTasks);
            let width = 0;
            if (ratio >= 1) {
              width = 100;
            } else if (ratio >= 7 / 8) {
              width = (7 / 8) * 100;
            } else if (ratio >= 6 / 8) {
              width = (6 / 8) * 100;
            } else if (ratio >= 5 / 8) {
              width = (5 / 8) * 100;
            } else if (ratio >= 4 / 8) {
              width = (4 / 8) * 100;
            } else if (ratio >= 2 / 8) {
              width = (2 / 8) * 100;
            } else if (ratio >= 1 / 8) {
              width = (1 / 8) * 100;
            } else {
              width = 0;
            }
            return (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: ANIMATION_CONFIG.taskIndicator, ease: ANIMATION_CONFIG.easing as any }}
                className={`h-full rounded-full bg-black dark:!bg-white`}
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

  return (
    <div
      className="min-h-screen bg-white dark:bg-black p-2 pt-1"
      style={{ fontFamily: 'Be Vietnam Pro, system-ui, -apple-system, sans-serif' }}
      onWheelCapture={(e) => {
        const now = performance.now();
        if (now - (wheelCooldownRef.current || 0) < 700) return;
        // Acumular pequeños desplazamientos horizontales
        wheelAccumRef.current += e.deltaX;
        // Reiniciar acumulador después de una pausa corta
        if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current);
        wheelTimerRef.current = window.setTimeout(() => {
          wheelAccumRef.current = 0;
          wheelTimerRef.current = null;
        }, 220) as unknown as number;

        // Si hay gesto marcado a la izquierda o derecha (según configuración del dispositivo)
        if (Math.abs(wheelAccumRef.current) > 60) {
          wheelCooldownRef.current = now;
          wheelAccumRef.current = 0;
          if (wheelTimerRef.current) {
            window.clearTimeout(wheelTimerRef.current);
            wheelTimerRef.current = null;
          }
          navigate('/');
        }
      }}
      onTouchStart={(e) => setSwipeStartX(e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const endX = e.changedTouches[0]?.clientX ?? null;
        const now = performance.now();
        // Doble tap en el borde izquierdo
        if (e.changedTouches[0] && e.changedTouches[0].clientX < 96) {
          if (now - (lastTapRef.current || 0) < 300) {
            navigate('/');
            lastTapRef.current = 0;
            return;
          }
          lastTapRef.current = now;
        }
        if (swipeStartX !== null && endX !== null && endX - swipeStartX < -60) {
          navigate('/');
        }
        setSwipeStartX(null);
      }}
      onDoubleClickCapture={(e) => {
        // Doble clic en el borde izquierdo
        if (e.clientX < 96) {
          navigate('/');
        }
      }}
      onMouseDown={(e) => {
        // Solo botón izquierdo
        if (e.button === 0) setMouseStartX(e.clientX);
      }}
      onMouseMove={(e) => {
        if (mouseStartX !== null) setMouseLastX(e.clientX);
      }}
      onMouseUp={(e) => {
        if (mouseStartX !== null) {
          const dx = (mouseLastX ?? e.clientX) - mouseStartX;
          if (dx < -80) navigate('/');
        }
        setMouseStartX(null);
        setMouseLastX(null);
      }}
    >
      {/* Header con navegación */}
      <div className="max-w-[430px] mx-auto relative">
        {/* Header: Avatar a la izquierda y globo de consejo a la derecha */}
        <div className="flex items-start justify-between my-2 gap-3">
          <div className="shrink-0">
            <img
              src="/lovable-uploads/icono de la app.png"
              alt="Stebe"
              className="w-24 h-24 rounded-2xl"
            />
          </div>
          <motion.div 
            className="relative max-w-[65%] bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2 pr-5 sm:pr-7 mr-14 sm:mr-16 md:mr-20 text-sm leading-snug text-black dark:text-white shadow-sm"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="font-semibold mb-0.5">STEEB</div>
            <div className="opacity-90">{adviceText}</div>
          </motion.div>
        </div>

        {/* Controles del calendario */}
        <Card className="p-3 mb-2 bg-white dark:bg-black relative border-0 shadow-none">
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
                className="text-2xl font-bold text-black dark:text-white"
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
                  className="mt-2 px-3 py-1.5 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg max-w-xs"
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
                className="text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 py-1"
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

          {/* Se removió la leyenda, resumen y botón +info para un diseño más limpio */}
        </Card>

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
                  {calendarDays.find(d => d.dateString === selectedDate)?.tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 px-1.5 py-2 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          {renderShapeForType(task.type)}
                          <p className={`text-[18px] truncate ${task.completed ? 'line-through text-gray-500' : 'text-black font-medium'}`}>{task.title}</p>
                        </div>
                        {task.scheduledTime && (
                          <p className="text-sm text-gray-600">{task.scheduledTime}</p>
                        )}
                      </div>
                      {/* Selector estilo radio a la derecha */}
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        aria-label="Seleccionar tarea"
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.completed ? 'bg-black border-black dark:bg-white dark:border-white' : 'border-black dark:border-white'}`}
                      />
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