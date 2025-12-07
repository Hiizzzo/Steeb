
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTaskStore } from '@/store/useTaskStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useServiceWorkerSync } from '@/hooks/useServiceWorkerSync';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
import { useDailyTaskReminder } from '@/hooks/useDailyTaskReminder';
import { useTheme } from '@/hooks/useTheme';
import { useUserProfile } from '@/hooks/useUserProfile';
import { notificationService } from '@/services/notificationService';
import SteebChatAI from '@/components/SteebChatAI';
import { Eye, EyeOff, CheckCircle, Trash2, Check, TrendingUp } from 'lucide-react';

import TaskDetailModal from '@/components/TaskDetailModal';
import SteveAvatar from '@/components/SteveAvatar';

import AppUpdateNotification from '@/components/AppUpdateNotification';

import DailyTasksConfig from '@/components/DailyTasksConfig';
import DailyTaskReminderModal from '@/components/DailyTaskReminderModal';
import ShapeIcon from '@/components/ShapeIcon';
import ThemeToggle from '@/components/ThemeToggle';
import type { RecurrenceRule, Task, SubTask } from '@/types';
import ModalAddTask from '@/components/ModalAddTask';
import ProgressPage from '@/components/ProgressPage';


// 9-colores (de abajo hacia arriba): ROJO, NARANJA, AMARILLO, VERDE, CELESTE, AZUL, INDIGO, ROSA FUERTE, VIOLETA
const STEEBE_COLORS_8 = [
  '#ff004c', // ROJO
  '#ff7a00', // NARANJA
  '#ffe600', // AMARILLO
  '#00ff66', // VERDE
  '#00c2ff', // CELESTE
  '#0000ff', // AZUL
  '#4b0082', // INDIGO
  '#ff00ff', // ROSA FUERTE
  '#8b00ff', // VIOLETA
] as const;

// Dado un índice desde el tope (0 es la primera tarea visible), asignar color contando desde abajo
const getRainbowColorBottomUp = (topIndex: number, total: number) => {
  const len = STEEBE_COLORS_8.length;
  if (total <= 0) return STEEBE_COLORS_8[0];
  // El último (más abajo) debe recibir ROJO (índice 0), y hacia arriba sigue NARANJA, etc.
  const idxFromBottom = ((total - 1 - topIndex) % len + len) % len;
  return STEEBE_COLORS_8[idxFromBottom];
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

// API URL for sleep status (server-side check to prevent manipulation)
const STEEB_STATUS_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/steeb-status`
  : 'https://v0-steeb-api-backend-production.up.railway.app/api/steeb-status';

// Local fallback for sleep detection (used when server is unavailable)
const getLocalSleepStatus = (): boolean => {
  const now = new Date();
  const argentinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  const hour = argentinaTime.getHours();
  const dayOfWeek = argentinaTime.getDay();

  console.log('😴 DEBUG - Argentina time:', argentinaTime.toString());
  console.log('😴 DEBUG - Hour:', hour, 'DayOfWeek:', dayOfWeek, '(0=Sun, 6=Sat)');

  // Saturday (6) and Sunday (0): After Friday/Saturday nights - sleep 3:00 AM to 9:59 AM
  if (dayOfWeek === 6 || dayOfWeek === 0) {
    const sleeping = hour >= 3 && hour < 10;
    console.log('😴 DEBUG - Saturday/Sunday check (late night schedule): sleeping =', sleeping);
    return sleeping;
  }
  // Other days (Mon-Fri mornings): 0:00 AM to 7:59 AM
  const sleeping = hour >= 0 && hour < 8;
  console.log('😴 DEBUG - Weekday check (normal schedule): sleeping =', sleeping);
  return sleeping;
};

const getArgentinaTime = (base?: Date) =>
  new Date((base || new Date()).toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));

const getSleepWindowForDate = (argDate: Date) => {
  const date = new Date(argDate);
  const dayOfWeek = date.getDay();
  const weekend = dayOfWeek === 5 || dayOfWeek === 6;
  const startHour = weekend ? 3 : 0;
  const endHour = weekend ? 10 : 8;
  const start = new Date(date);
  start.setHours(startHour, 0, 0, 0);
  const end = new Date(date);
  end.setHours(endHour, 0, 0, 0);
  return { start, end };
};

const getMsUntilNextSleepCheck = (argTime?: Date) => {
  const now = argTime || getArgentinaTime();
  const { start, end } = getSleepWindowForDate(now);
  if (now < start) return start.getTime() - now.getTime();
  if (now >= start && now < end) return end.getTime() - now.getTime();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { start: nextStart } = getSleepWindowForDate(tomorrow);
  return nextStart.getTime() - now.getTime();
};

const Index = () => {

  // Steeb sleep mode state (fetched from server, with local fallback)
  const [isSleeping, setIsSleeping] = useState(() => {
    const initialSleep = getLocalSleepStatus();
    console.log('Initial sleep status:', initialSleep);
    return initialSleep;
  });
  const { nickname } = useUserProfile();
  const previousSleepingRef = useRef(isSleeping);

  // Fetch sleep status from server (with local fallback)
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let isCancelled = false;

    const scheduleNextCheck = (overrideDelay?: number) => {
      const delay = overrideDelay ?? Math.max(getMsUntilNextSleepCheck(), 1000);
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = window.setTimeout(() => {
        if (!isCancelled) {
          fetchSleepStatus();
        }
      }, delay);
    };

    async function fetchSleepStatus() {
      try {
        console.log('Fetching Steeb sleep status from:', STEEB_STATUS_API);
        const response = await fetch(STEEB_STATUS_API);
        if (response.ok) {
          const data = await response.json();
          console.log('Steeb sleep status response:', data);
          setIsSleeping(data.isSleeping || false);
        } else {
          const localStatus = getLocalSleepStatus();
          console.log('Steeb sleep status error, using local fallback:', localStatus);
          setIsSleeping(localStatus);
        }
        if (!isCancelled) {
          scheduleNextCheck();
        }
      } catch (error) {
        console.warn('Could not fetch Steeb sleep status, using local fallback');
        const localStatus = getLocalSleepStatus();
        console.log('Could not fetch Steeb sleep status, using local fallback:', localStatus);
        setIsSleeping(localStatus);
        if (!isCancelled) {
          scheduleNextCheck(60 * 1000);
        }
      }
    }

    fetchSleepStatus();

    return () => {
      isCancelled = true;
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, []);

  useEffect(() => {
    if (previousSleepingRef.current && !isSleeping) {
      const safeNick = nickname?.trim().length ? nickname.trim() : 'amigo';
      notificationService.sendImmediateNotification(
        'STEEB - Buen día',
        `Buen día, ${safeNick}!`,
        'steeb-morning'
      );
    }
    previousSleepingRef.current = isSleeping;
  }, [isSleeping, nickname]);

  // Sync browser/app icons con el estado de sueno de STEEB
  useEffect(() => {
    const updater = (window as any).__steebSetSleepIconState;
    if (typeof updater === 'function') {
      updater(isSleeping);
    }
  }, [isSleeping]);

  const [showModal, setShowModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { toast } = useToast();
  const { playTaskCompleteSound, triggerVibration } = useSoundEffects();
  const [showCompletedToday, setShowCompletedToday] = useState(false);
  const { currentTheme } = useTheme();

  // Aplicar colores al header según tema (excluyendo ThemeToggle)
  useEffect(() => {
    const applyHeaderColors = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const isShiny = document.documentElement.classList.contains('shiny');

      // Aplicar solo al header principal y sus elementos directos (excluyendo ThemeToggle)
      const headerMain = document.querySelector('.tareas-header') as HTMLElement;
      const h1Element = document.querySelector('.tareas-header h1') as HTMLElement;

      if (headerMain) {
        if (isDark) {
          // Dark mode: header blanco con texto negro
          headerMain.style.setProperty('background-color', '#ffffff', 'important');
          headerMain.style.setProperty('background', '#ffffff', 'important');
          headerMain.style.setProperty('color', '#000000', 'important');
        } else if (isShiny) {
          // Shiny mode: header negro con texto blanco
          headerMain.style.setProperty('background-color', '#000000', 'important');
          headerMain.style.setProperty('background', '#000000', 'important');
          headerMain.style.setProperty('color', '#ffffff', 'important');
        } else {
          // Light mode: header negro con texto blanco
          headerMain.style.setProperty('background-color', '#000000', 'important');
          headerMain.style.setProperty('background', '#000000', 'important');
          headerMain.style.setProperty('color', '#ffffff', 'important');
        }
      }

      if (h1Element) {
        if (isDark) {
          h1Element.style.setProperty('color', '#000000', 'important');
          h1Element.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
          h1Element.style.background = 'none';
          h1Element.style.animation = 'none';
        } else if (isShiny) {
          h1Element.style.setProperty('color', '#ffffff', 'important');
          h1Element.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
          h1Element.style.background = 'none';
          h1Element.style.animation = 'none';
        } else {
          h1Element.style.setProperty('color', '#ffffff', 'important');
          h1Element.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
          h1Element.style.background = 'none';
          h1Element.style.animation = 'none';
        }
      }
    };

    // Aplicar inmediatamente y cuando cambie el tema
    applyHeaderColors();

    const observer = new MutationObserver(applyHeaderColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      observer.disconnect();
    };
  }, [currentTheme]);


  // Swipe-to-delete (lista principal) con Pointer Events (sin long-press)
  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 160;
  const [rowOffsetById, setRowOffsetById] = useState<Record<string, number>>({});
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
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
    } else if (deltaX < 0) {
      // Permitir retorno suave cuando se desliza hacia la derecha
      const next = Math.max(0, rowOffsetById[id] + deltaX);
      setRowOffsetById(prev => ({ ...prev, [id]: next }));
    }
  };

  const finishRowSwipe = (id: string) => {
    const offset = rowOffsetById[id] || 0;
    if (offset > SWIPE_THRESHOLD) {
      // Activar animación de eliminación
      setIsDeleting(prev => ({ ...prev, [id]: true }));

      // Eliminar después de la animación (300ms)
      setTimeout(() => {
        handleDeleteTask(id);

        // Limpiar el estado local del swipe para esta fila
        setRowOffsetById(prev => {
          if (!(id in prev)) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });

        setIsDeleting(prev => ({ ...prev, [id]: false }));
      }, 300);
    } else {
      // Animación suave de retorno sin rebote
      setTimeout(() => {
        setRowOffsetById(prev => ({ ...prev, [id]: 0 }));
      }, 50);
    }
    activeIdRef.current = null;
    document.body.style.userSelect = '';
  };

  const onRowPointerUp = (id: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    cancelLongPress();
    finishRowSwipe(id);
  };

  // Helper para determinar el grupo/tipo de una tarea
  const getGroupKey = (task: Task): Task['type'] => {
    return task?.type ?? 'extra';
  };

  const renderSwipeRow = (task: Task, color?: string) => {
    // Validación de seguridad para evitar errores de renderizado
    if (!task || !task.id || !task.title) {
      console.warn('⚠️ Tarea inválida en renderSwipeRow:', task);
      return null;
    }

    const isTaskDeleting = isDeleting[task.id] || false;

    return (
      <div key={task.id} className="relative">
        {/* Fondo con tacho visible durante swipe */}
        <div className={`absolute inset-0 rounded-lg bg-white dark:bg-black flex items-center justify-end pr-4 transition-all duration-300 ease-out ${(rowOffsetById[task.id] || 0) > 10 ? 'opacity-100' : 'opacity-0'}`}>
          <Trash2 className="w-5 h-5 text-black dark:text-white" />
        </div>

        <div className={`flex items-center gap-3 px-1.5 py-2 rounded-lg transition-all duration-600 ${isTaskDeleting
          ? 'bg-black dark:bg-white animate-pulse'
          : ''
          }`}>
          <div
            className="flex items-center gap-3 flex-1"
            style={{
              transform: `translate3d(-${rowOffsetById[task.id] || 0}px,0,0)`,
              transition: activeIdRef.current === task.id ? 'none' : 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
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
              <p className={`task-title text-[18px] ${isTaskDeleting
                ? 'text-white dark:text-white'
                : task.completed
                  ? 'line-through text-gray-500'
                  : 'text-black font-medium'
                }`}>{task.title}</p>
              {task.scheduledTime && (
                <p className={`text-sm ${isTaskDeleting
                  ? 'text-white dark:text-white'
                  : 'text-gray-600'
                  }`}>{task.scheduledTime}</p>
              )}
            </div>
          </div>

          {/* Checkbox FUERA del área de swipe */}
          <button
            onClick={() => handleToggleTask(task.id)}
            className={`task-checkbox-button w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center ${task.completed ? 'completed !bg-black !border-black dark:!bg-transparent dark:!border-white' : '!bg-white !border-black dark:border-white'}`}
            style={{ minWidth: '24px', minHeight: '24px', zIndex: 100 }}
          >
            {/* task.completed && <Check size={16} className="text-transparent dark:text-transparent" /> */}
          </button>
        </div>
      </div>
    );
  };

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

  // Inicializar servicio de notificaciones
  useEffect(() => {
    notificationService.initialize().then((initialized) => {
      if (initialized) {
      }
    });
  }, []);

  // Premium/Shiny listeners removed

  // El hook useTaskPersistence maneja automáticamente la carga y guardado

  // Limpiar tareas con títulos vacíos al cargar (con debounce para evitar loops)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const tasksWithEmptyTitles = tasks.filter(task => !task.title || !task.title.trim() || !task.id);
      if (tasksWithEmptyTitles.length > 0) {
        const cleanedTasks = tasks.filter(task => task.title && task.title.trim() && task.id);
        if (cleanedTasks.length !== tasks.length) {
          updateTasks(cleanedTasks);
        }
      }
    }, 500); // Debounce de 500ms para evitar múltiples ejecuciones

    return () => clearTimeout(timeoutId);
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
    const task = tasks.find(t => t.id === id);

    // Si la tarea tiene subtareas y no están todas completadas, no permitir completar la tarea principal
    if (task && task.subtasks && task.subtasks.length > 0 && !task.completed) {
      const allSubtasksCompleted = task.subtasks.every(subtask => subtask.completed);
      if (!allSubtasksCompleted) {
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

    // Solo reproducir sonido y vibración cuando se completa (no cuando se desmarca)
    if (task && !task.completed) {
      playTaskCompleteSound();
      triggerVibration();
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
        triggerVibration();
      }
    }
  };

  const handleDeleteTask = (id: string) => {
    try {
      const taskToDelete = tasks.find(t => t.id === id);
      if (!taskToDelete) {
        console.warn('⚠️ Tarea no encontrada para eliminar:', id);
        return;
      }


      // Solo vibración al eliminar - sin sonido
      triggerVibration();

      // Usar la función del store que es más robusta
      deleteTask(id);

      toast({
        title: "Tu tarea se ha eliminado correctamente",
      });
    } catch (error) {
      console.error('❌ Error al eliminar tarea:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleAddTask = (title: string, type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string, notes?: string, isPrimary?: boolean, recurrence?: RecurrenceRule, subgroup?: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'social' | 'salud' | 'entretenimiento' | 'extra') => {

    // Validar que el título no esté vacío
    if (!title.trim()) {
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

  // Estado para detectar el tema actual
  const [theme, setTheme] = useState(() => {
    const isShiny = document.documentElement.classList.contains('shiny');
    const isDark = document.documentElement.classList.contains('dark');
    return { isShiny, isDark };
  });

  const headerBackgroundColor = theme.isDark ? '#ffffff' : '#000000';
  const headerTextColor = theme.isDark ? '#000000' : '#ffffff';

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

  // Helper: formas por tipo
  const renderShapeForType = (type: Task['type'], color?: string) => {
    // Determinar el color según el tema
    let shapeColor: string;
    if (theme.isShiny) {
      // En modo Shiny usar el color calculado por índice (patrón solicitado)
      shapeColor = color ?? '#ffffff';
    } else if (theme.isDark) {
      // Versión Negra: formas blancas (forzar blanco)
      shapeColor = '#ffffff';
    } else {
      // Versión Blanca: formas negras con fondo blanco
      shapeColor = '#000000'; // negro puro para mejor contraste
    }

    switch (type) {
      case 'productividad': return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="square" className="w-6 h-6" title="Trabajo" color={shapeColor} /></div>);
      case 'creatividad': return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="triangle" className="w-6 h-6" title="Creatividad" color={shapeColor} /></div>);
      case 'salud': return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="heart" className="w-6 h-6" title="Salud" color={shapeColor} /></div>);
      case 'organizacion': return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="diamond" className="w-6 h-6" title="Organización" color={shapeColor} /></div>);
      case 'social': return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="triangle" className="w-6 h-6" title="Social" color={shapeColor} /></div>);
      case 'aprendizaje': return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="triangle" className="w-6 h-6" title="Aprendizaje" color={shapeColor} /></div>);
      case 'entretenimiento': return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="triangle" className="w-6 h-6" title="Entretenimiento" color={shapeColor} /></div>);
      case 'extra': return (<div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><ShapeIcon variant="diamond" className="w-6 h-6" title="Extra" color={shapeColor} /></div>);
      default: return <div className="task-shape-wrapper task-shine mr-1" style={{ color: shapeColor }}><div className="w-6 h-6 border border-black" /></div>;
    }
  };

  // Filter tasks for today and overdue
  const todayISO = new Date().toISOString().split('T')[0];

  // Selector semanal: día seleccionado (por defecto hoy)
  const [selectedDateISO, setSelectedDateISO] = useState<string>(todayISO);
  const selectedDateObj = useMemo(() => new Date(selectedDateISO), [selectedDateISO]);

  // Calcular los días de la semana actual (L a D), iniciando en lunes
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = (date.getDay() + 6) % 7; // 0 (L) .. 6 (D)
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  const weekStart = useMemo(() => getMonday(new Date()), []);
  const weekDays = useMemo(() => {
    const letters = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const iso = date.toISOString().split('T')[0];
      return { date, iso, letter: letters[i] };
    });
  }, [weekStart]);
  const todaysTasks = useMemo(() => {
    return tasks.filter(task => {
      // Filtrar tareas con títulos vacíos o solo espacios en blanco
      if (!task.title || !task.title.trim()) {
        console.warn('⚠️ Tarea con título vacío encontrada:', task.id);
        return false;
      }

      // Verificar que la tarea tenga un ID válido
      if (!task.id) {
        console.warn('⚠️ Tarea sin ID encontrada:', task);
        return false;
      }
      // Si no tiene fecha programada, solo se muestra cuando el día seleccionado es HOY
      if (!task.scheduledDate) return selectedDateISO === todayISO;
      // Mostrar tareas programadas hasta el día seleccionado (incluye vencidas respecto a ese día)
      return task.scheduledDate <= selectedDateISO;
    });
  }, [tasks, selectedDateISO, todayISO]);


  // Dividir tareas de hoy en pendientes y completadas (hoy y anteriores)
  const pendingTodaysTasks = todaysTasks.filter(t => !t.completed);
  const completedTodaysTasks = todaysTasks.filter(t => t.completed);
  const completedToday = completedTodaysTasks.filter(t =>
    t.completedDate ? t.completedDate.split('T')[0] === selectedDateISO : false
  );
  const completedBeforeToday = completedTodaysTasks.filter(t =>
    !(t.completedDate && t.completedDate.split('T')[0] === selectedDateISO)
  );

  // Pendientes: separar exactamente hoy (o sin fecha) vs. vencidas
  const pendingTodayExactRaw = pendingTodaysTasks.filter(t => {
    // Cuando miramos HOY: incluir sin fecha o con fecha exactamente hoy
    if (selectedDateISO === todayISO) return !t.scheduledDate || t.scheduledDate === selectedDateISO;
    // Cuando miramos otro día: solo exactamente ese día
    return !!t.scheduledDate && t.scheduledDate === selectedDateISO;
  });
  const pendingOverdueRaw = pendingTodaysTasks.filter(t => t.scheduledDate && t.scheduledDate < selectedDateISO);



  // Día de la semana (p.ej., "Viernes")
  const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date().getDay()];
  const isMobile = useIsMobile();



  return (
    <div className="h-screen pb-6 relative bg-white dark:bg-black m-0 p-0" style={{ fontFamily: 'Be Vietnam Pro, system-ui, -apple-system, sans-serif', marginTop: '0', paddingTop: '0' }}>

      {/* Header STEEB en la raíz del HTML - arriba de todo */}
      <div className="pb-0.5 fixed top-0 left-0 right-0 z-50" style={{ marginTop: '0', paddingTop: '0' }}>
        <div
          className={`tareas-header flex items-center justify-center py-0 relative w-screen steeb-header-force-white`}
          style={{
            backgroundColor: headerBackgroundColor,
            background: headerBackgroundColor,
            color: headerTextColor,
            marginTop: 0,
            paddingTop: 0,
            borderRadius: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            clipPath: 'none',
            zIndex: 50
          }}
        >
          <div
            className="flex items-center justify-center flex-1 px-4 w-full steeb-force-white-child"
            style={{ backgroundColor: headerBackgroundColor, background: headerBackgroundColor }}
          >
            {/* ÍCONO STEEB - IZQUIERDA */}
            <div className="w-32 h-32 mr-1 flex items-center justify-center flex-shrink-0 steeb-force-white-child" style={{ backgroundColor: `${headerBackgroundColor} !important`, background: `${headerBackgroundColor} !important` }}>
              {theme.isShiny ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div
                    className="absolute inset-3 border-2 border-white rounded-[2.2rem] z-0"
                    style={{
                      background: 'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff00cc, #ff004c, #ff0000)',
                      backgroundSize: '200% 100%',
                      animation: 'shinyShiftHorizontal 3s linear infinite'
                    }}
                  ></div>
                  <img src="/steve-jobs-shiny.png" alt="Steeb" className="w-full h-full object-contain relative z-10 scale-110" style={{
                    filter: 'none',
                    opacity: 1,
                    backgroundColor: 'transparent'
                  }} />
                </div>
              ) : (
                <img
                  src={theme.isDark
                    ? (isSleeping ? "/Steebsleepdarksupremo.png" : "/Steebwhitesupremo.png")
                    : (isSleeping ? "/steeb_sleep_icon.jpg" : "/Steebblacksupremo.png")}
                  alt="Steeb"
                  className="w-full h-full object-cover rounded-3xl"
                  style={{
                    filter: 'none',
                    opacity: 1,
                    backgroundColor: 'transparent'
                  }}
                />
              )}
            </div>

            {/* TEXTO FIJO "STEEB" - MÁS CERCA DEL ÍCONO */}
            <h1 className="text-3xl font-normal tracking-wide text-center steeb-main-title" style={{ color: `${headerTextColor} !important`, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: '700', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', width: '100%', height: '100%', paddingTop: '8px', paddingLeft: '16px' }}>
              STEEB
            </h1>

            {/* ThemeToggle - SIEMPRE VISIBLE */}
            <div className="ml-auto flex-shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 mt-0.5 pt-0">

        {/* Listas de tareas */}
        <div className="px-4 mt-3">
          {pendingOverdueRaw.length > 0 && (
            <div className="mb-3">
              <h3 className="text-[11px] uppercase tracking-widest opacity-60 mb-1">Vencidas</h3>
              {pendingOverdueRaw.map(t => renderSwipeRow(t, '#FF4D4F'))}
            </div>
          )}



          {/* Mostrar botón de ojo solo si hay tareas completadas */}
          {(completedToday.length > 0 || completedBeforeToday.length > 0) && (
            <div className="flex justify-start mb-4">
              <button
                onClick={() => setShowCompletedToday(!showCompletedToday)}
                className="text-gray-500 bg-transparent hover:bg-transparent p-0 border-none transition-colors"
              >
                {showCompletedToday ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          )}
          {showCompletedToday && (
            <div className="mt-2">
              {completedToday.length > 0 && (
                <div>
                  <h4 className="text-[11px] uppercase tracking-widest opacity-60 mb-1">Completadas hoy</h4>
                  {completedToday.map(t => renderSwipeRow(t))}
                </div>
              )}
              {completedBeforeToday.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-[11px] uppercase tracking-widest opacity-60 mb-1">Completadas antes</h4>
                  {completedBeforeToday.map(t => renderSwipeRow(t))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Botón flotante de Progreso - Ahora abre el panel del chat */}
        <div
          className="fixed bottom-24 right-6 opacity-0 pointer-events-none"
          title="El progreso ahora se abre escribiendo 'progreso' en el chat"
        >
          <TrendingUp className="w-6 h-6 text-gray-400" />
        </div>


        {/* Modales */}
        <ModalAddTask
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onAddTask={handleAddTask}
          editingTask={selectedTask || undefined}
        />

        <TaskDetailModal
          task={selectedTask}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTask(null);
          }}
          onEdit={handleEditTask}
          onToggle={handleToggleTask}
          onToggleSubtask={handleToggleSubtask}
        />

        {/* Recordatorio diario para revisar tareas de ayer */}
        {showReminder && yesterdayDate && (
          <DailyTaskReminderModal
            open={showReminder}
            onOpenChange={(open) => !open && skipReminder()}
            tasks={tasks}
            yesterdayDate={yesterdayDate}
            onMarkCompleted={(taskIds, date) => {
              // Marcar tareas como completadas
              taskIds.forEach(id => {
                const task = tasks.find(t => t.id === id);
                if (task) {
                  // Usar la fecha de ayer para completedDate
                  const completedDate = new Date(date).toISOString();
                  updateTask(id, { ...task, completed: true, completedDate });
                }
              });
              markReminderShown();
            }}
          />
        )}

        {/* Configuración de tareas diarias (solo cuando se inicia por primera vez) */}
        {showConfigModal && (
          <DailyTasksConfig
            isOpen={true}
            onClose={() => setShowConfigModal(false)}
            onAddTask={handleAddTask}
          />
        )}

      </div>

      {/* Chat STEEB Permanente - ocupa todo el ancho y alto de la pantalla */}
      <div className="fixed top-32 left-0 right-0 bottom-0 z-40">
        <SteebChatAI isSleeping={isSleeping} />
      </div>
    </div>
  );
};

export default Index;
