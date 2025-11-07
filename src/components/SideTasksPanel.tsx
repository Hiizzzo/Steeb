import React, { useRef, useState } from 'react';
import { CheckCircle, Trash2 } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useTheme } from '@/hooks/useTheme';

interface SideTasksPanelProps {
  onClose: () => void;
}

const SideTasksPanel: React.FC<SideTasksPanelProps> = ({ onClose }) => {
  const { currentTheme } = useTheme();
  const { tasks, toggleTask, deleteTask } = useTaskStore();
  const isDarkMode = currentTheme === 'dark';

  // Swipe-to-delete logic
  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 160;
  const [rowOffsetById, setRowOffsetById] = useState<Record<string, number>>({});
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const activeIdRef = useRef<string | null>(null);
  const startXRef = useRef(0);

  const cancelLongPress = () => {
    // Cancel long press if needed
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
      const next = Math.max(0, rowOffsetById[id] + deltaX);
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

  return (
    <div className={`h-full flex flex-col ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Header */}
      <div className="p-2 pt-5 flex items-center justify-center">
        <h2 className="text-4xl font-black">Tareas</h2>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-4 pt-12">
        {pendingTasks.length > 0 && (
          <>
              <div className="space-y-3">
              {pendingTasks.map((task) => {
                const isTaskDeleting = isDeleting[task.id] || false;

                return (
                  <div key={task.id} className="relative">
                    {/* Fondo con tacho visible durante swipe */}
                    <div className={`absolute inset-0 rounded-xl flex items-center justify-end pr-4 transition-all duration-300 ease-out ${
                      (rowOffsetById[task.id] || 0) > 10 ? 'opacity-100' : 'opacity-0'
                    } ${
                      isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                    }`}>
                      <Trash2 className="w-5 h-5 text-black" />
                    </div>

                    <div
                      className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${
                        isTaskDeleting
                          ? 'bg-black dark:bg-white animate-pulse'
                          : isDarkMode ? 'bg-gray-900 border border-white' : 'bg-gray-50 border border-white'
                      }`}
                      style={{
                        borderLeft: '4px solid black',
                        transform: `translate3d(-${rowOffsetById[task.id] || 0}px,0,0)`,
                        transition: activeIdRef.current === task.id ? 'none' : 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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
                      <div className="flex-1 min-w-0">
                        <p className={`text-base font-semibold break-words leading-tight ${
                          isTaskDeleting
                            ? 'text-white dark:text-black'
                            : ''
                        }`}>
                          {task.title}
                        </p>
                        <p className={`text-xs opacity-70 mt-2 uppercase tracking-wider ${
                          isTaskDeleting
                            ? 'text-white dark:text-black'
                            : ''
                        }`}>
                          {task.category || 'Sin categoría'}
                        </p>
                      </div>

                      {/* Checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTask(task.id).catch(error => {
                            console.error('Error al completar tarea:', error);
                          });
                        }}
                        className={`flex-shrink-0 w-5 h-5 rounded-full transition-all duration-200 ${
                          task.completed
                            ? 'bg-white border-white'
                            : isDarkMode
                              ? 'bg-transparent border-white'
                              : 'bg-transparent border-black'
                        } border`}
                        style={{ borderWidth: '1px' }}
                        title="Completar tarea"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {pendingTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
            }`}>
              <CheckCircle className={`w-8 h-8 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
            </div>
            <p className={`text-lg font-medium mb-2 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              ¡No hay tareas pendientes!
            </p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Todas tus tareas están completadas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideTasksPanel;