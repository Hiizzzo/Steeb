
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTaskStore } from '@/store/useTaskStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useServiceWorkerSync } from '@/hooks/useServiceWorkerSync';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
import { useDailyTaskReminder } from '@/hooks/useDailyTaskReminder';
import { notificationService } from '@/services/notificationService';
import TaskCard from '@/components/TaskCard';
import FloatingButtons from '@/components/FloatingButtons';
import { Eye, EyeOff, CheckCircle, Trash2, Check } from 'lucide-react';

import TaskDetailModal from '@/components/TaskDetailModal';

import AppUpdateNotification from '@/components/AppUpdateNotification';

import DailyTasksConfig from '@/components/DailyTasksConfig';
import TaskCreationCard from '@/components/TaskCreationCard';
import DailyTaskReminderModal from '@/components/DailyTaskReminderModal';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import ShapeIcon from '@/components/ShapeIcon';
import type { RecurrenceRule } from '@/types';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra';
  subgroup?: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'social' | 'salud' | 'entretenimiento' | 'extra';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  notes?: string; // Notas adicionales de la tarea
  tags?: string[];
  recurrence?: RecurrenceRule;
  updatedAt?: string;
}

// 9-color Shiny rainbow palette (bottom→top: red → orange → yellow → yellow-green → green → cyan → blue-violet → purple → magenta)
// Colors chosen to stay consistent with Shiny spectrum while giving 9 distinct steps
const SHINY_RAINBOW_9 = [
  '#ff004c', // red/pink-red
  '#ff3a00', // red-orange
  '#ff7a00', // orange
  '#ffe600', // yellow
  '#a8ff00', // yellow-green
  '#00ff66', // green
  '#00c2ff', // cyan
  '#6a00ff', // violet
  '#ff00ff', // magenta
] as const;
// Given a topIndex in the combined list and the total count, return color by bottom-to-top order
const getRainbowColorBottomUp = (topIndex: number, total: number) => {
  const bottomIndex = total - 1 - topIndex;
  const idx = ((bottomIndex % SHINY_RAINBOW_9.length) + SHINY_RAINBOW_9.length) % SHINY_RAINBOW_9.length;
  return SHINY_RAINBOW_9[idx];
};

// Orden fijo para mantener categorías contiguas
const TYPE_ORDER: Array<Task['type']> = [
  'productividad',
  'organizacion',
  'aprendizaje',
  'creatividad',
  'salud',
  'social',
  'entretenimiento',
  'extra'
];

const Index = () => {
  // Random phrases for when there are no tasks
  const getRandomNoTasksPhrase = () => {
    const phrases = [
      "¿Un día libre? Te envidio…",
      "Ni una tarea. O estás a punto de procrastinar, o estás en paz.",
      "Steeb dice: eso no suena a productividad, eh…"
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  const [showModal, setShowModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'tasks' | 'calendar'>('tasks');
  const { toast } = useToast();
  const { playTaskCompleteSound } = useSoundEffects();
  const [showCompletedToday, setShowCompletedToday] = useState(false);

  // Swipe-to-delete (lista principal) con Pointer Events (sin long-press)
  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 160;
  const [rowOffsetById, setRowOffsetById] = useState<Record<string, number>>({});
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

  const onRowPointerDown = (id: string) => (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    activeIdRef.current = id;
    startXRef.current = e.clientX;
    document.body.style.userSelect = 'none';
    longPressTriggeredRef.current = false;
    cancelLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      const t = tasks.find(t => t.id === id) || null;
      if (t) {
        setSelectedTask(t);
        setShowModal(true);
      }
    }, LONG_PRESS_MS) as unknown as number;
  };

  const onRowPointerMove = (id: string) => (e: React.PointerEvent) => {
    if (activeIdRef.current !== id) return;
    const deltaX = startXRef.current - e.clientX;
    if (Math.abs(deltaX) > MOVE_CANCEL_PX) cancelLongPress();
    if (deltaX > 0) {
      e.preventDefault();
      const next = Math.min(deltaX, MAX_SWIPE);
      setRowOffsetById(prev => ({ ...prev, [id]: next }));
    }
  };

  const finishRowSwipe = (id: string) => {
    const offset = rowOffsetById[id] || 0;
    if (offset > SWIPE_THRESHOLD) handleDeleteTask(id);
    setRowOffsetById(prev => ({ ...prev, [id]: 0 }));
    activeIdRef.current = null;
    document.body.style.userSelect = '';
  };

  const onRowPointerUp = (id: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    cancelLongPress();
    finishRowSwipe(id);
  };

  const renderSwipeRow = (task: Task, color?: string) => (
    <div key={task.id} className="relative">
      {/* Fondo con tacho visible durante swipe */}
      <div className={`absolute inset-0 rounded-lg flex items-center justify-end pr-4 transition-opacity duration-150 ${ (rowOffsetById[task.id] || 0) > 6 ? 'opacity-100' : 'opacity-0' }`}>
        <Trash2 className="w-5 h-5" />
      </div>

      <div className="flex items-center gap-3 px-1.5 py-2">
        <div
          className="flex items-center gap-3 flex-1"
          style={{
            transform: `translate3d(-${rowOffsetById[task.id] || 0}px,0,0)`,
            transition: 'transform 150ms ease-out',
            touchAction: 'pan-y',
            userSelect: (rowOffsetById[task.id] || 0) > 0 ? 'none' : undefined,
            willChange: 'transform',
          }}
          onPointerDown={onRowPointerDown(task.id)}
          onPointerMove={onRowPointerMove(task.id)}
          onPointerUp={onRowPointerUp(task.id)}
          onPointerCancel={onRowPointerUp(task.id)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {renderShapeForType(getGroupKey(task), color)}
          <div className="flex-1 min-w-0">
            <p className={`task-title text-[18px] ${task.completed ? 'line-through text-gray-500' : 'text-black font-medium'}`}>{task.title}</p>
            <p className="text-sm text-gray-600">{task.scheduledTime || 'Sin hora'}</p>
          </div>
        </div>
        
        {/* Checkbox FUERA del área de swipe */}
        <button
          onClick={() => {
            console.log('CHECKBOX CLICKED!', task.id);
            handleToggleTask(task.id);
          }}
          className={`task-checkbox-button w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center ${task.completed ? 'completed bg-black border-black dark:!bg-white dark:!border-white' : 'border-black dark:border-white'}`}
          style={{ minWidth: '24px', minHeight: '24px', zIndex: 100 }}
        >
          {task.completed && (
            <Check 
              size={14} 
              className="text-white dark:!text-black" 
              strokeWidth={3}
            />
          )}
        </button>
      </div>
    </div>
  );

  // Premium/Shiny features removed
  
  // Usar el store de tareas
  const { 
    tasks, 
    setTasks: updateTasks, 
    isLoading: isPersistenceLoading, 
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    toggleSubtask
  } = useTaskStore();

  // Debug: Log tasks loading
  useEffect(() => {
    console.log('🔍 Index.tsx: Tasks loaded:', tasks.length, tasks);
    console.log('🔍 Index.tsx: Is loading:', isPersistenceLoading);
  }, [tasks, isPersistenceLoading]);

  // Hook para sincronización con Service Worker
  const { 
    isServiceWorkerReady, 
    lastBackup, 
    triggerBackup, 
    triggerRestore 
  } = useServiceWorkerSync();

  // Hook para notificaciones de tareas
  const { scheduleTaskNotification, cancelTaskNotification } = useTaskNotifications(tasks);

  // Hook para recordatorio diario de tareas
  const { showReminder, yesterdayDate, skipReminder, markReminderShown } = useDailyTaskReminder(tasks);

  // Cargar preferencia de vista desde localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('steeb-view-mode');
    if (savedViewMode === 'calendar' || savedViewMode === 'tasks') {
      setViewMode(savedViewMode);
      // Limpiar la preferencia después de usarla
      localStorage.removeItem('steeb-view-mode');
    }
  }, []);

  // Inicializar servicio de notificaciones
  useEffect(() => {
    notificationService.initialize().then((initialized) => {
      if (initialized) {
        console.log('🔔 Servicio de notificaciones STEEB listo');
      }
    });
  }, []);

  // Premium/Shiny listeners removed

  // El hook useTaskPersistence maneja automáticamente la carga y guardado

  // Limpiar tareas con títulos vacíos al cargar
  useEffect(() => {
    const tasksWithEmptyTitles = tasks.filter(task => !task.title || !task.title.trim());
    if (tasksWithEmptyTitles.length > 0) {
      const cleanedTasks = tasks.filter(task => task.title && task.title.trim());
      updateTasks(cleanedTasks);
      console.log(`🧹 Eliminadas ${tasksWithEmptyTitles.length} tareas con títulos vacíos`);
    }
  }, [tasks.length]); // Solo ejecutar cuando cambie el número de tareas

  // Verificar si hay una fecha seleccionada del calendario
  useEffect(() => {
    const selectedDate = localStorage.getItem('steeb-selected-date');
    const shouldOpenModal = localStorage.getItem('steeb-open-add-modal');
    
    if (selectedDate || shouldOpenModal) {
      // Limpiar los flags
      localStorage.removeItem('steeb-selected-date');
      localStorage.removeItem('steeb-open-add-modal');
      
      // Abrir el modal de agregar tarea con la fecha pre-seleccionada
      setShowModal(true);
    }
  }, []);

  // Backup automático cuando cambian las tareas importantes
  useEffect(() => {
    if (tasks.length > 0 && isServiceWorkerReady) {
      // Trigger backup when tasks change significantly
      const timeoutId = setTimeout(() => {
        triggerBackup().catch(error => {
          console.warn('⚠️ Auto-backup por cambio de tareas falló:', error);
        });
      }, 2000); // Wait 2 seconds after task changes

      return () => clearTimeout(timeoutId);
    }
  }, [tasks.length, isServiceWorkerReady, triggerBackup]);

  const handleToggleTask = (id: string) => {
    console.log('🎯 handleToggleTask called with ID:', id);
    const task = tasks.find(t => t.id === id);
    console.log('🎯 Found task:', task);
    
    // Si la tarea tiene subtareas y no están todas completadas, no permitir completar la tarea principal
    if (task && task.subtasks && task.subtasks.length > 0 && !task.completed) {
      const allSubtasksCompleted = task.subtasks.every(subtask => subtask.completed);
      if (!allSubtasksCompleted) {
        console.log('🛑 Blocked: subtasks not completed');
        toast({
          title: "Complete subtasks first",
          description: "You need to complete all subtasks before completing the main task.",
        });
        return;
      }
    }
    
    const updatedTasks = tasks.map(task => {
      if (task.id !== id) return task;
      const willComplete = !task.completed;
      let nextCompletedDate: string | undefined = undefined;
      if (willComplete) {
        // Si la tarea está vencida (programada antes de hoy), marcarla con su fecha programada
        const todayStr = new Date().toISOString().split('T')[0];
        if (task.scheduledDate && task.scheduledDate < todayStr) {
          // Usar mediodía local para evitar desbordes por zona horaria al convertir a ISO
          const iso = new Date(`${task.scheduledDate}T12:00:00`).toISOString();
          nextCompletedDate = iso;
        } else {
          nextCompletedDate = new Date().toISOString();
        }
      }
      return {
        ...task,
        completed: willComplete,
        completedDate: nextCompletedDate
      };
    });
    updateTasks(updatedTasks);
    // Persistencia automática manejada por useTaskPersistence
    
    // Solo reproducir sonido y mostrar toast cuando se completa (no cuando se desmarca)
    if (task && !task.completed) {
      playTaskCompleteSound();
      toast({
        title: "Task completed!",
        description: "Great job! You've completed a task.",
      });
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId && task.subtasks) {
        const updatedSubtasks = task.subtasks.map(subtask =>
          subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
        );
        
        // Verificar si todas las subtareas están completadas
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
    // Persistencia automática manejada por useTaskPersistence

    // Verificar si se completó la última subtarea para reproducir sonido
    const task = tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
      const subtask = task.subtasks.find(s => s.id === subtaskId);
      const otherSubtasks = task.subtasks.filter(s => s.id !== subtaskId);
      const allOthersCompleted = otherSubtasks.every(s => s.completed);
      
      if (subtask && !subtask.completed && allOthersCompleted) {
        playTaskCompleteSound();
        toast({
          title: "Task completed!",
          description: "Great job! You've completed all subtasks.",
        });
      }
    }
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete) {
      const updatedTasks = tasks.filter(task => task.id !== id);
      updateTasks(updatedTasks);
      // Persistencia automática manejada por useTaskPersistence
      toast({
        title: "Task deleted",
        description: `"${taskToDelete.title}" has been removed from your list.`,
      });
    }
  };

  const handleAddTask = (title: string, type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string, notes?: string, isPrimary?: boolean, recurrence?: RecurrenceRule, subgroup?: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'social' | 'salud' | 'entretenimiento' | 'extra') => {
    console.log('🎯 Index.tsx: handleAddTask llamado con:', { title, type, scheduledDate, notes, isPrimary });
    
    // Validar que el título no esté vacío
    if (!title.trim()) {
      console.log('❌ Index.tsx: Título vacío detectado');
      toast({
        title: "Error",
        description: "El título de la tarea no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTask) {
      // Estamos editando una tarea existente
      const otherTags = (selectedTask.tags || []).filter(t => t !== 'principal');
      const nextTags = isPrimary ? [...otherTags, 'principal'] : otherTags;
      const updatedTask: Task = {
         ...selectedTask,
         title: title.trim(),
         type,
         subgroup,
         subtasks,
         scheduledDate,
         scheduledTime,
         notes: notes?.trim(),
         tags: nextTags,
         recurrence: recurrence,
         updatedAt: new Date().toISOString()
       };
      
      // Usar updateTask del store en lugar de updateTasks directamente
      updateTask(selectedTask.id, updatedTask).catch(console.error);
      
      toast({
        title: "Tarea actualizada!",
        description: "Los cambios han sido guardados.",
      });
      
      setSelectedTask(null); // Limpiar la tarea seleccionada después de editar
    } else {
      // Estamos creando una nueva tarea
      const newTaskData = {
         title: title.trim(),
         type,
         subgroup,
         status: 'pending' as const,
         completed: false,
         subtasks,
         scheduledDate: scheduledDate, // No establecer fecha automáticamente
         scheduledTime,
         notes: notes?.trim(),
         tags: isPrimary ? ['principal'] : [],
         recurrence: recurrence
       };
      
      console.log('🆕 Index.tsx: Creando nueva tarea con datos:', newTaskData);
      
      // Usar addTask del store en lugar de updateTasks directamente
      addTask(newTaskData).catch((error) => {
        console.error('❌ Index.tsx: Error al crear tarea:', error);
      });
      
      toast({
        title: "New task added!",
        description: "Your task has been added to the list.",
      });
    }
  };

  const handleShowTasks = () => {
    const completedTasks = tasks.filter(t => t.completed).length;
    toast({
      title: "Task summary:",
      description: `${completedTasks} of ${tasks.length} tasks completed`,
    });
  };

  const handleShowDetail = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setSelectedTask(task);
      setShowDetailModal(true);
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(false);
    setShowModal(true);
  };

  // Helper: formas por tipo
  const renderShapeForType = (type: Task['type'], color?: string) => {
    // Detectar el tema actual de forma reactiva
    const [theme, setTheme] = useState(() => {
      const isShiny = document.documentElement.classList.contains('shiny');
      const isDark = document.documentElement.classList.contains('dark');
      return { isShiny, isDark };
    });
    
    // Actualizar tema cuando cambie
    useEffect(() => {
      const updateTheme = () => {
        const isShiny = document.documentElement.classList.contains('shiny');
        const isDark = document.documentElement.classList.contains('dark');
        setTheme({ isShiny, isDark });
      };
      
      // Observar cambios en las clases del documento
      const observer = new MutationObserver(updateTheme);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      return () => observer.disconnect();
    }, []);
    
    // Determinar el color según el tema
    let shapeColor: string;
    if (theme.isShiny) {
      // Versión Shiny: usar colores del arcoíris
      shapeColor = color || 'black';
    } else if (theme.isDark) {
      // Versión Negra: formas blancas (forzar blanco)
      shapeColor = '#ffffff';
    } else {
      // Versión Blanca: formas negras
      shapeColor = '#000000';
    }
    
    switch (type) {
      case 'productividad':   return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="square" className="w-6 h-6" title="Trabajo" color={shapeColor} /></div>);
      case 'creatividad':     return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="triangle" className="w-6 h-6" title="Creatividad" color={shapeColor} /></div>);
      case 'salud':           return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="heart" className="w-6 h-6" title="Salud" color={shapeColor} /></div>);
      case 'organizacion':    return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="diamond" className="w-6 h-6" title="Organización" color={shapeColor} /></div>);
      case 'social':          return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="triangle" className="w-6 h-6" title="Social" color={shapeColor} /></div>);
      case 'aprendizaje':     return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="triangle" className="w-6 h-6" title="Aprendizaje" color={shapeColor} /></div>);
      case 'entretenimiento': return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="triangle" className="w-6 h-6" title="Entretenimiento" color={shapeColor} /></div>);
      case 'extra':           return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="diamond" className="w-6 h-6" title="Extra" color={shapeColor} /></div>);
      default: return <div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><div className="w-6 h-6 border border-black" /></div>;
    }
  };

  // Filter tasks for today and overdue
  const today = new Date().toISOString().split('T')[0];
  const todaysTasks = tasks.filter(task => {
    // Filtrar tareas con títulos vacíos o solo espacios en blanco
    if (!task.title || !task.title.trim()) return false;
    
    if (!task.scheduledDate) return true; // Show tasks without date as today's
    return task.scheduledDate <= today;
  });

  // Debug: Log filtered tasks
  useEffect(() => {
    console.log('🔍 Index.tsx: Today:', today);
    console.log('🔍 Index.tsx: Todays tasks:', todaysTasks.length, todaysTasks);
  }, [today, todaysTasks]);

  // Dividir tareas de hoy en pendientes y completadas (hoy y anteriores)
  const pendingTodaysTasks = todaysTasks.filter(t => !t.completed);
  const completedTodaysTasks = todaysTasks.filter(t => t.completed);
  const completedToday = completedTodaysTasks.filter(t =>
    t.completedDate ? t.completedDate.split('T')[0] === today : false
  );
  const completedBeforeToday = completedTodaysTasks.filter(t =>
    !(t.completedDate && t.completedDate.split('T')[0] === today)
  );

  // Pendientes: separar exactamente hoy (o sin fecha) vs. vencidas
  const pendingTodayExactRaw = pendingTodaysTasks.filter(t => !t.scheduledDate || t.scheduledDate === today);
  const pendingOverdueRaw = pendingTodaysTasks.filter(t => t.scheduledDate && t.scheduledDate < today);

  // Agrupar contiguamente por subgrupo (o tipo) sin encabezados
  const getGroupKey = (task: Task): Task['type'] => (task.subgroup ?? task.type);
  const timeToSortable = (t?: string) => {
    if (!t) return '99:99';
    const parts = t.split(':');
    if (parts.length >= 2) {
      const hh = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return '99:99';
  };
  const sortByCategoryThenTime = (a: Task, b: Task) => {
    const ka = getGroupKey(a);
    const kb = getGroupKey(b);
    const ia = TYPE_ORDER.indexOf(ka);
    const ib = TYPE_ORDER.indexOf(kb);
    const ca = ia === -1 ? 999 : ia;
    const cb = ib === -1 ? 999 : ib;
    if (ca !== cb) return ca - cb;
    return timeToSortable(a.scheduledTime).localeCompare(timeToSortable(b.scheduledTime));
  };

  const pendingTodayExact = [...pendingTodayExactRaw].sort(sortByCategoryThenTime);
  const pendingOverdue = [...pendingOverdueRaw].sort(sortByCategoryThenTime);



  // Día de la semana (p.ej., "Viernes") y saludo de STEEB
  const dayName = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date().getDay()];
  const isMobile = useIsMobile();

  // Detectar primer mensaje del día (mostrar al menos una vez por sesión)
  const [isFirstOfDay, setIsFirstOfDay] = useState(false);
  useEffect(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    const last = localStorage.getItem('stebe-last-greeting-date');
    const sessionLast = sessionStorage.getItem('stebe-session-greet');

    const isFirstThisCalendarDay = last !== todayKey;
    const isFirstThisSession = sessionLast !== todayKey;

    if (isFirstThisCalendarDay || isFirstThisSession) {
      setIsFirstOfDay(true);
      localStorage.setItem('stebe-last-greeting-date', todayKey);
      sessionStorage.setItem('stebe-session-greet', todayKey);
    } else {
      setIsFirstOfDay(false);
    }
  }, []);

  const steebGreeting = useMemo(() => {
    // Frase temática según el día (corta y divertida/seria)
    const daySpecials: Record<string, string[]> = {
      'Lunes': ['Lunes sin excusas', 'Lunes de arranque'],
      'Martes': ['Martes de lasaña', 'Martes con ritmo'],
      'Miércoles': ['Miércoles ninja', 'Miércoles a tope'],
      'Jueves': ['Jueves de foco', 'Jueves productivo'],
      'Viernes': ['Viernes con power', 'Viernes de cierre'],
      'Sábado': ['Sábado tranqui', 'Sábado efectivo'],
      'Domingo': ['Domingo zen', 'Domingo ligero'],
    };
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    if (isFirstOfDay) {
      // Primer saludo del día
      if (isMobile) {
        // Muy corto (<=8 palabras) e incluye el día
        const tag = pick(daySpecials[dayName] || [dayName]);
        // Ej: "Martes de lasaña. A darle."
        return `${tag}. A darle.`;
      }
      // Desktop: un poco más descriptivo
      const tag = pick(daySpecials[dayName] || [dayName]);
      return `${dayName}. ${tag}. Empecemos con algo corto y sumemos momentum.`;
    }

    if (isMobile) {
      // Frases super cortas (<= 8 palabras) para burbuja en móviles
      const shortPhrases = [
        'Una cosa rápida. Marcamos check.',
        'Algo simple hoy. Avanzá ya.',
        'Empezá pequeño. Acción ahora.',
        'Vamos con foco. Ahora.',
      ];
      const picked = shortPhrases[Math.floor(Math.random() * shortPhrases.length)];
      return `${dayName}. ${picked}`;
    }
    const phrases = [
      `${dayName}. Día perfecto para arrancar algo corto y ganar momentum.`,
      `${dayName}. Hagamos una cosita rápida y marcamos check.`,
      `${dayName}. Elegí algo simple, 5-10 min, y avanzamos juntos.`,
      `${dayName}. Empezá pequeño: una mini-tarea y después vemos la siguiente.`,
    ];
    return `${phrases[Math.floor(Math.random() * phrases.length)]}`;
  }, [dayName, isMobile, isFirstOfDay]);

  return (
          <div className="min-h-screen pb-6 relative bg-white dark:bg-black" style={{ fontFamily: 'Be Vietnam Pro, system-ui, -apple-system, sans-serif' }}>
      
      {/* STEEB en esquina superior izquierda + burbuja de diálogo */}
      <div className="absolute top-4 left-4 z-20 mr-24 flex items-start gap-2 max-w-[70%] sm:max-w-[80%]">
        <img 
          src="/lovable-uploads/te obesrvo.png"
          alt="STEEB" 
          className="w-24 h-24 sm:w-20 sm:h-20 object-contain bg-transparent rounded-none shadow-none"
        />
        <div className="relative">
          <div className="steeb-bubble rounded-xl px-3 py-2 max-w-[280px]">
            <div className="text-xs font-bold mb-0.5">
              STEEB
            </div>
            <p className="text-sm leading-snug">
              {steebGreeting}
            </p>
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10">
      
      {/* Espaciado superior para no tapar la lista con el avatar + burbuja */}
      <div className="pt-24 mb-1" />
      {/* Título principal */}
      <div className="pt-6 mb-2">
        <div className="tareas-header flex items-center justify-center py-2 bg-black text-white relative border-x border-black">
          <h1 className="text-white text-xl font-light tracking-wide" style={{ fontFamily: 'Be Vietnam Pro, system-ui, -apple-system, sans-serif' }}>TAREAS</h1>
        </div>
      </div>
      {viewMode === 'tasks' ? (
        <>
          {/* Lista de Tareas */}
          <div className="tasks-list pt-1 mx-auto w-full max-w-xl sm:max-w-2xl px-6 sm:px-8 md:px-10">
            {pendingTodaysTasks.length > 0 ? (
              <>
                {/* Color mapping across combined pending lists from bottom to top */}
                {(() => {
                  const total = pendingTodayExact.length + pendingOverdue.length;
                  return (
                    <>
                      {pendingTodayExact.map((t, i) => renderSwipeRow(t, getRainbowColorBottomUp(i, total)))}
                    </>
                  );
                })()}

                {pendingTodayExact.length > 0 && pendingOverdue.length > 0 && (
                  <div className="my-2 border-t dark:border-white/70 border-transparent" />
                )}

                {(() => {
                  const total = pendingTodayExact.length + pendingOverdue.length;
                  return pendingOverdue.map((t, i) => {
                    const topIndex = pendingTodayExact.length + i;
                    return renderSwipeRow(t, getRainbowColorBottomUp(topIndex, total));
                  });
                })()}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  {getRandomNoTasksPhrase()}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Debug: {tasks.length} tareas total, {todaysTasks.length} de hoy, {pendingTodaysTasks.length} pendientes
                </p>
              </div>
            )}

            {/* Sección de tareas completadas */}
            {(completedToday.length > 0) && (
              <div className="mt-6">
                <div className="completed-header flex items-center justify-center gap-3 mb-3 text-center">
                  <CheckCircle size={16} className="text-gray-700" />
                  <h3 className="text-sm font-semibold text-gray-700 font-varela">
                    Tareas completadas
                  </h3>
                  <span className="text-xs text-gray-500">({completedToday.length})</span>
                  {/* Toggle mostrar/ocultar las de hoy */}
                  <button
                    className="completed-toggle-btn shiny-toggle flex items-center space-x-1 text-gray-600 hover:text-black text-sm rounded px-2 py-0.5"
                    onClick={() => setShowCompletedToday(prev => !prev)}
                    aria-label={showCompletedToday ? 'Ocultar completadas' : 'Mostrar completadas'}
                  >
                    {showCompletedToday ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{showCompletedToday ? 'Ocultar' : 'Ver'}</span>
                  </button>
                </div>

                {/* Barra de progreso horizontal bajo el encabezado */}
                {(() => {
                  const total = pendingTodaysTasks.length + completedToday.length;
                  const done = completedToday.length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div className="mb-3">
                      <div className="w-full h-[4px] bg-neutral-200 dark:bg-white/15 rounded-full overflow-hidden progress-track">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full bg-black dark:!bg-white progress-fill"
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 text-center">
                        {done} de {total}
                      </div>
                    </div>
                  );
                })()}

                {/* Completadas de hoy (toggle) */}
                {completedToday.length > 0 && showCompletedToday && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Hoy</p>
                    {(() => {
                      const sorted = completedToday.slice().sort(sortByCategoryThenTime);
                      const total = sorted.length;
                      return sorted.map((t, i) => renderSwipeRow(t, getRainbowColorBottomUp(i, total)));
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="pt-1 max-w-md mx-auto px-3">
          <MonthlyCalendar
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onToggleSubtask={handleToggleSubtask}
          />
        </div>
      )}

      {/* Floating Buttons */}
      <FloatingButtons 
        onAddTask={() => setShowModal(true)}
        onCreateTask={handleAddTask}
      />

      {/* Premium badge removed */}

      {/* Modal para Agregar/Editar Tarea */}
      <AnimatePresence>
        {showModal && (
          <TaskCreationCard
            onCancel={() => {
              setShowModal(false);
              setSelectedTask(null);
            }}
            onCreate={handleAddTask}
            editingTask={selectedTask}
          />
        )}
      </AnimatePresence>

      {/* Modal de Configuración de Tareas Diarias */}
      <DailyTasksConfig
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onAddTask={handleAddTask}
      />

      {/* Modal de Detalles de Tarea */}
      <AnimatePresence>
        {showDetailModal && selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            onToggle={handleToggleTask}
            onToggleSubtask={handleToggleSubtask}
            onEdit={(task) => {
              setShowDetailModal(false);
              setShowModal(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* App Update Notification */}
      <AppUpdateNotification
        isServiceWorkerReady={isServiceWorkerReady}
        triggerBackup={triggerBackup}
                  exportTasks={() => {
            // Función placeholder para exportar tareas
            console.log('Exportar tareas');
          }}
      />

      {/* Modal de recordatorio diario */}
      <DailyTaskReminderModal
        open={showReminder}
        onOpenChange={skipReminder}
        tasks={tasks}
        yesterdayDate={yesterdayDate}
        onMarkCompleted={(taskIds, date) => {
          taskIds.forEach(taskId => {
            updateTask(taskId, { 
              completed: true, 
              completedDate: date 
            });
          });
          markReminderShown();
          toast({ title: `Marcaste ${taskIds.length} tareas como completadas ayer` });
        }}
      />
      </div>
    </div>
  );
};

export default Index;
