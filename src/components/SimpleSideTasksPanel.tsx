import React, { useRef, useState } from 'react';
import { CheckCircle, Trash2, Eye, EyeOff } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { getLocalUserProfile } from '@/utils/localUserProfile';

interface SimpleSideTasksPanelProps {
  onClose: () => void;
}

const shinyTaskColors = [
  '#ff0000', '#ff4000', '#ff8000', '#ffc000', '#ffff00', '#00ff00',
  '#00ff80', '#00c0ff', '#0000ff', '#4000ff', '#c000ff', '#ff00ff'
];

const SimpleSideTasksPanel: React.FC<SimpleSideTasksPanelProps> = ({ onClose }) => {
  const { currentTheme } = useTheme();
  const { tasks, toggleTask, deleteTask } = useTaskStore();
  const { user } = useAuth();
  const isDarkMode = currentTheme === 'dark';
  const isShinyMode = currentTheme === 'shiny';
  const isLightMode = (!isDarkMode && !isShinyMode);
  const [showCompleted, setShowCompleted] = useState(false);

  // Sound ref
  const soundRef = useRef<HTMLAudioElement | null>(null);
  const completedSessionCount = useRef(0);

  // Initialize sound
  React.useEffect(() => {
    // Short "pop" sound in Base64 to avoid network/CORS/format issues
    const popSound = "data:audio/wav;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAACAAEA/v///wAAAAAAAAAAAA==";
    // Uses a slightly longer reliable "bubble check" sound base64
    const reliableSound = "data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAFAABPiwAAERUVERUVERUVERUVERUVERUVERUVERUVERUVERUVERUVERUVIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIi//uQxAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA//uQxAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA//uQxAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA//uQxAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA//uQxAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA//uQxAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA//uQxAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA//uQxAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA//uQxAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA";

    // Using a known working short "tink" sound
    const tink = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Truncated placeholder, I will use a real one below

    // Real short "click" sound
    const clickSound = "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAACAgICAAAAA//8AAP//AAACAA==";

    soundRef.current = new Audio(clickSound);
    soundRef.current.volume = 0.5;
  }, []);

  // Send message on close
  React.useEffect(() => {
    return () => {
      const count = completedSessionCount.current;
      const storedProfile = user?.id ? getLocalUserProfile(user.id) : null;
      const nickname = user?.nickname || storedProfile?.nickname || user?.name || 'amigo';

      let message = '';
      if (count > 0) {
        message = `Muy bien hecho ${nickname}. ${count} tarea${count > 1 ? 's' : ''} menos.`;
      } else {
        message = `¿Pasó algo que mirás las tareas? ¿Necesitás ayuda para empezar ${nickname}?`;
      }

      // Dispatch event for SteebChat
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('steeb-message', {
          detail: {
            content: message,
            type: 'assistant',
            timestamp: new Date()
          }
        });
        window.dispatchEvent(event);
      }
    };
  }, [user]);

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    if (!isCompleted) {
      // Marking as complete
      try {
        soundRef.current?.pause();
        soundRef.current!.currentTime = 0;
        soundRef.current?.play().catch(e => console.warn('Audio play failed', e));
        completedSessionCount.current += 1;
      } catch (e) {
        console.warn('Sound error', e);
      }
    }
    await toggleTask(taskId);
  };

  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 160;
  const [rowOffsetById, setRowOffsetById] = useState<Record<string, number>>({});
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const activeIdRef = useRef<string | null>(null);
  const startXRef = useRef(0);

  const cancelLongPress = () => {
    // placeholder for long press cancel logic
  };

  const onRowPointerDown = (id: string) => (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    activeIdRef.current = id;
    startXRef.current = e.clientX;
    document.body.style.userSelect = 'none';
  };

  const onRowPointerMove = (id: string) => (e: React.PointerEvent) => {
    if (activeIdRef.current !== id) return;
    const deltaX = startXRef.current - e.clientX;
    if (deltaX > 0) {
      e.preventDefault();
      const next = Math.min(deltaX, MAX_SWIPE);
      setRowOffsetById(prev => ({ ...prev, [id]: next }));
    } else if (deltaX < 0) {
      const next = Math.max(0, (rowOffsetById[id] ?? 0) + deltaX);
      setRowOffsetById(prev => ({ ...prev, [id]: next }));
    }
  };

  const finishRowSwipe = (id: string) => {
    const offset = rowOffsetById[id] || 0;
    if (offset > SWIPE_THRESHOLD) {
      setIsDeleting(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        deleteTask(id);
        setRowOffsetById(prev => {
          if (!(id in prev)) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setIsDeleting(prev => ({ ...prev, [id]: false }));
      }, 300);
    } else {
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

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const hasCompleted = completedTasks.length > 0;

  const getShinyAccentColor = (index: number) => shinyTaskColors[index % shinyTaskColors.length];

  const getCheckboxStyle = (completed: boolean, index: number) => {
    if (isShinyMode) {
      const color = getShinyAccentColor(index);
      return {
        '--simple-checkbox-border': color,
        borderColor: color,
        backgroundColor: completed ? color : 'transparent'
      } as React.CSSProperties;
    }
    const neutral = isDarkMode ? '#ffffff' : '#000000';
    return {
      '--simple-checkbox-border': neutral,
      borderColor: neutral,
      backgroundColor: completed ? neutral : 'transparent'
    } as React.CSSProperties;
  };

  const getDayName = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date().getDay()];
  };

  return (
    <div className={`h-full flex flex-col ${isLightMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
      <div className={`p-1 pt-2 flex items-center justify-center ${isLightMode ? 'border-b-2 border-white' : ''}`}>
        <h2 className="text-3xl font-bold">{getDayName()}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 pt-3 space-y-6">
        {pendingTasks.length > 0 ? (
          <div className="space-y-0">
            {pendingTasks.map((task, index) => {
              const isTaskDeleting = isDeleting[task.id] || false;
              const shinyAccentColor = isShinyMode ? getShinyAccentColor(index) : undefined;

              return (
                <div key={task.id} className="relative">
                  <div className={`absolute inset-0 rounded-lg flex items-center justify-end pr-3 transition-all duration-300 ease-out ${(rowOffsetById[task.id] || 0) > 10 ? 'opacity-100' : 'opacity-0'
                    } ${isShinyMode ? 'bg-black' : isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <Trash2 className={`w-4 h-4 ${isShinyMode || isDarkMode ? 'text-white' : 'text-black'}`} />
                  </div>

                  <div
                    className={`simple-task-card flex items-center gap-3 p-3 rounded-lg transition-all duration-300 mb-6 ${isTaskDeleting
                      ? 'bg-black dark:bg-white animate-pulse'
                      : isShinyMode
                        ? 'bg-black border border-black'
                        : isDarkMode
                          ? 'bg-black border border-white'
                          : 'bg-gray-50 border border-white'
                      }`}
                    style={{
                      ...(isShinyMode
                        ? { borderLeft: `4px solid ${shinyAccentColor}` }
                        : isLightMode
                          ? { borderLeft: '3px solid black' }
                          : {}),
                      transform: `translateX(-${rowOffsetById[task.id] || 0}px)`,
                      transition: activeIdRef.current === task.id ? 'none' : 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      touchAction: 'pan-y',
                      userSelect: (rowOffsetById[task.id] || 0) > 0 ? 'none' : undefined,
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale',
                      textRendering: 'optimizeLegibility',
                      marginTop: '24px'
                    }}
                    onPointerDown={onRowPointerDown(task.id)}
                    onPointerMove={onRowPointerMove(task.id)}
                    onPointerUp={onRowPointerUp(task.id)}
                    onPointerCancel={onRowPointerUp(task.id)}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold break-words leading-tight ${isTaskDeleting ? 'text-white dark:text-black' : ''}`}>
                        {task.title}
                      </p>
                      <p className={`text-xs opacity-70 mt-1 ${isTaskDeleting ? 'text-white dark:text-black' : ''}`}>
                        {task.category || 'Sin categoria'}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTask(task.id, task.completed).catch(error => {
                          console.error('Error al completar tarea:', error);
                        });
                      }}
                      className="simple-task-checkbox flex-shrink-0 w-4 h-4 rounded-full transition-all duration-200 border-2"
                      title="Completar tarea"
                      style={getCheckboxStyle(task.completed, index)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isLightMode ? 'bg-gray-200' : 'bg-gray-800'}`}>
              <CheckCircle className={`w-6 h-6 ${isLightMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
            <p className={`text-sm font-medium ${isLightMode ? 'text-black' : 'text-white'}`}>
              No hay tareas pendientes
            </p>
            <p className={`text-xs ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
              Todas tus tareas estan completadas
            </p>
          </div>
        )}

        <div className="px-1">
          <button
            onClick={() => setShowCompleted(prev => !prev)}
            disabled={!hasCompleted}
            className={`task-eye-toggle w-full py-2 flex items-center justify-center ${hasCompleted ? '' : 'cursor-not-allowed'
              }`}
          >
            {showCompleted ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {showCompleted && completedTasks.length > 0 && (
          <div className="space-y-4 pb-6">
            {completedTasks.map((task, index) => {
              const shinyAccentColor = isShinyMode ? getShinyAccentColor(index) : undefined;
              return (
                <div key={task.id} className="relative">
                  <div className={`absolute inset-0 rounded-lg flex items-center justify-end pr-3 transition-all duration-300 ease-out ${(rowOffsetById[task.id] || 0) > 10 ? 'opacity-100' : 'opacity-0'
                    } ${isShinyMode ? 'bg-black' : 'bg-gray-800'}`}>
                    <Trash2 className="w-4 h-4 text-white" />
                  </div>

                  <div
                    className={`simple-task-card flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${isShinyMode
                      ? 'bg-black border border-black text-white'
                      : isDarkMode
                        ? 'bg-black border border-white text-white'
                        : 'bg-white border border-white text-black'
                      }`}
                    style={{
                      ...(isShinyMode
                        ? { borderLeft: `4px solid ${shinyAccentColor}` }
                        : isLightMode
                          ? { borderLeft: '4px solid #000000' }
                          : {}),
                      transform: `translateX(-${rowOffsetById[task.id] || 0}px)`,
                      transition: activeIdRef.current === task.id ? 'none' : 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    }}
                    onPointerDown={onRowPointerDown(task.id)}
                    onPointerMove={onRowPointerMove(task.id)}
                    onPointerUp={onRowPointerUp(task.id)}
                    onPointerCancel={onRowPointerUp(task.id)}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold break-words leading-tight line-through opacity-70 ${isLightMode ? 'text-black' : ''
                        }`}>
                        {task.title}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTask(task.id, task.completed).catch(error => {
                          console.error('Error al completar tarea:', error);
                        });
                      }}
                      className="simple-task-checkbox flex-shrink-0 w-4 h-4 rounded-full transition-all duration-200 border-2"
                      title="Marcar como pendiente"
                      style={getCheckboxStyle(task.completed, index)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleSideTasksPanel;
