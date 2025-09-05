import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Settings, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskCreationCard from './TaskCreationCard';
import type { RecurrenceRule } from '@/types';
import { useTheme } from 'next-themes';

interface FloatingButtonsProps {
  onAddTask: () => void;
  onCreateTask?: (title: string, type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra', subtasks?: any[], scheduledDate?: string, scheduledTime?: string, notes?: string, isPrimary?: boolean, recurrence?: RecurrenceRule) => void;
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({ onAddTask, onCreateTask }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [shinyEnabled, setShinyEnabled] = useState<boolean>(false);
  const [isLongPressed, setIsLongPressed] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [menuVariant, setMenuVariant] = useState<'dark' | 'light'>('light');
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const loadingTimer = useRef<NodeJS.Timeout | null>(null);
  const hasLongPressTriggered = useRef(false);
  const pressStartTime = useRef<number>(0);
  const menuRootRef = useRef<HTMLDivElement | null>(null);

  // Handler para iniciar el long press
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Usar tema real para elegir variante
    const isDark = theme === 'dark' || document.documentElement.classList.contains('dark');
    setMenuVariant(isDark ? 'dark' : 'light');

    hasLongPressTriggered.current = false;
    setShowCalendar(false);
    setIsLongPressed(true);
    pressStartTime.current = Date.now();

    document.body.style.userSelect = 'none';
    (document.body as any).style.webkitUserSelect = 'none';

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = setTimeout(() => {
      setShowCalendar(true);
      setShowCalendarMenu(true);
      hasLongPressTriggered.current = true;
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const syntheticEvent = {
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation()
    } as React.PointerEvent;
    handlePointerDown(syntheticEvent);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (loadingTimer.current) {
      clearTimeout(loadingTimer.current);
      loadingTimer.current = null;
    }
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    const duration = Date.now() - pressStartTime.current;
    const longPressed = hasLongPressTriggered.current || duration >= 300;
    if (!longPressed && !showCalendarMenu) {
      setShowTaskModal(true);
    }
    setIsLongPressed(false);
    setShowCalendar(false);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const syntheticEvent = {
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation()
    } as React.PointerEvent;
    handlePointerUp(syntheticEvent);
  };

  const handlePointerLeave = (_e: React.PointerEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (loadingTimer.current) {
      clearTimeout(loadingTimer.current);
      loadingTimer.current = null;
    }
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    setIsLongPressed(false);
    setShowCalendar(false);
    hasLongPressTriggered.current = false;
    if (!showCalendarMenu) {
      setShowCalendarMenu(false);
    }
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const syntheticEvent = {
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation()
    } as React.PointerEvent;
    handlePointerLeave(syntheticEvent);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, []);

  // Init shiny toggle from localStorage and DOM
  useEffect(() => {
    const saved = localStorage.getItem('stebe-shiny-enabled');
    const isOn = saved === '1' || document.documentElement.classList.contains('shiny');
    setShinyEnabled(!!isOn);
    if (isOn) {
      // Ensure mutual exclusivity with dark
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('shiny');
    }
  }, []);

  const toggleShiny = () => {
    setShinyEnabled((prev) => {
      const next = !prev;
      if (next) {
        // Enable shiny, disable dark
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('shiny');
        localStorage.setItem('stebe-shiny-enabled', '1');
      } else {
        // Disable shiny; revert to stored theme (do nothing else)
        document.documentElement.classList.remove('shiny');
        localStorage.setItem('stebe-shiny-enabled', '0');
      }
      return next;
    });
  };

  // Cerrar con Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCalendarMenu(false);
    };
    if (showCalendarMenu) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCalendarMenu]);

  // Cerrar con clic de mouse fuera, a prueba de z-index/conflictos
  useEffect(() => {
    if (!showCalendarMenu) return;
    const handleDocumentDown = (e: Event) => {
      const root = menuRootRef.current;
      if (root && !root.contains(e.target as Node)) {
        setShowCalendarMenu(false);
      }
    };
    document.addEventListener('pointerdown', handleDocumentDown, { capture: true });
    document.addEventListener('mousedown', handleDocumentDown, { capture: true });
    document.addEventListener('click', handleDocumentDown, { capture: true });
    document.addEventListener('touchstart', handleDocumentDown, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', handleDocumentDown, { capture: true } as any);
      document.removeEventListener('mousedown', handleDocumentDown, { capture: true } as any);
      document.removeEventListener('click', handleDocumentDown, { capture: true } as any);
      document.removeEventListener('touchstart', handleDocumentDown, { capture: true } as any);
    };
  }, [showCalendarMenu]);

  const handleCreateTask = (title: string, type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra', subtasks?: any[], scheduledDate?: string, scheduledTime?: string, notes?: string, isPrimary?: boolean, recurrence?: RecurrenceRule) => {
    setShowTaskModal(false);
    if (onCreateTask) {
      onCreateTask(title, type, subtasks, scheduledDate, scheduledTime, notes, isPrimary, recurrence);
    } else {
      onAddTask();
    }
  };

  return (
    <>
      <div className="fixed bottom-8 left-0 right-0 z-50 pointer-events-none no-select">
        <div className="flex items-center justify-center px-8 pointer-events-none no-select">
          <motion.button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onContextMenu={handleContextMenu}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 hover:-translate-y-1 bg-black dark:!bg-white pointer-events-auto touch-button no-select shiny-fab"
            style={{ 
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              WebkitTouchCallout: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isLongPressed && showCalendar ? (
                <motion.div
                  key="calendar"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="relative"
                >
                  <Calendar size={28} className="text-white dark:!text-black sm:w-8 sm:h-8" strokeWidth={3} />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white dark:border-black"
                  />
                </motion.div>
              ) : isLongPressed ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="flex items-center justify-center gap-1"
                >
                  <div className="w-1.5 h-1.5 bg-white dark:!bg-black rounded-full animate-bounce" style={{ animationDuration: '0.3s', animationDelay: '0s' }}></div>
                  <div className="w-1.5 h-1.5 bg-white dark:!bg-black rounded-full animate-bounce" style={{ animationDuration: '0.3s', animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-white dark:!bg-black rounded-full animate-bounce" style={{ animationDuration: '0.3s', animationDelay: '0.2s' }}></div>
                </motion.div>
              ) : (
                <motion.div
                  key="plus"
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -180 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <Plus size={28} className="text-white dark:!text-black" strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

      </div>

      <AnimatePresence>
        {showTaskModal && (
          <TaskCreationCard
            onCancel={() => setShowTaskModal(false)}
            onCreate={handleCreateTask}
          />
        )}
      </AnimatePresence>

      {/* Menú Acciones Rápidas */}
      <AnimatePresence>
        {showCalendarMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] pointer-events-auto"
            onClick={() => setShowCalendarMenu(false)}
            onPointerDown={() => setShowCalendarMenu(false)}
            onMouseDown={() => setShowCalendarMenu(false)}
            onTouchStart={() => setShowCalendarMenu(false)}
            role="button"
            tabIndex={-1}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              className={`${menuVariant === 'dark' ? 'bg-black' : 'bg-white'} absolute inset-0`}
              onClick={() => setShowCalendarMenu(false)}
              onPointerDown={() => setShowCalendarMenu(false)}
              onMouseDown={() => setShowCalendarMenu(false)}
              onTouchStart={() => setShowCalendarMenu(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              ref={menuRootRef}
            >
              <div className="relative w-[0px] h-[0px]">
                {menuVariant === 'dark' ? (
                  // Círculo único negro con 3 opciones internas (móvil), sin textos
                  <div
                    className="absolute -top-[140px] -left-[70px] w-40 h-40 sm:w-56 sm:h-56 rounded-full border-2 border-white bg-black text-white flex items-center justify-center shadow-xl pointer-events-auto"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    {/* Líneas divisorias en Y */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="absolute left-1/2 -translate-x-1/2 w-[2px] bg-white" style={{ height: '36%', top: '0' }} />
                      <div className="absolute left-1/2 -translate-x-1/2 w-[2px] bg-white" style={{ height: '32%', transform: 'translate(-50%, 0) rotate(60deg)', transformOrigin: 'top' }} />
                      <div className="absolute left-1/2 -translate-x-1/2 w-[2px] bg-white" style={{ height: '32%', transform: 'translate(-50%, 0) rotate(-60deg)', transformOrigin: 'top' }} />
                    </div>

                    {/* Botón arriba - Calendario (más cerca del centro) */}
                    <button
                      aria-label="Calendario"
                      onClick={() => { setShowCalendarMenu(false); navigate('/monthly-calendar'); }}
                      className="absolute pointer-events-auto"
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      style={{ top: '20%', left: '50%', transform: 'translate(-50%, -50%)' }}
                    >
                      <Calendar size={36} color="#FFFFFF" />
                    </button>

                    {/* Botón abajo-izquierda - Configuración (separar levemente) */}
                    <button
                      aria-label="Configuración"
                      onClick={() => { setShowCalendarMenu(false); navigate('/settings'); }}
                      className="absolute pointer-events-auto"
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      style={{ top: '70%', left: '29%', transform: 'translate(-50%, -50%)' }}
                    >
                      <Settings size={34} color="#FFFFFF" />
                    </button>

                    {/* Botón abajo-derecha - Estadísticas (separar levemente) */}
                    <button
                      aria-label="Estadísticas"
                      onClick={() => { setShowCalendarMenu(false); navigate('/productivity-stats'); }}
                      className="absolute pointer-events-auto"
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      style={{ top: '70%', left: '71%', transform: 'translate(-50%, -50%)' }}
                    >
                      <BarChart2 size={34} color="#FFFFFF" />
                    </button>
                  </div>
                ) : (
                  // Variante blanca: círculo único blanco con borde negro e iconos negros (igual al dark pero invertido)
                  <div
                    className="absolute -top-[140px] -left-[70px] w-40 h-40 sm:w-56 sm:h-56 rounded-full border-2 border-black bg-white text-black flex items-center justify-center shadow-xl pointer-events-auto"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    {/* Líneas divisorias en Y */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="absolute left-1/2 -translate-x-1/2 w-[2px] bg-black" style={{ height: '36%', top: '0' }} />
                      <div className="absolute left-1/2 -translate-x-1/2 w-[2px] bg-black" style={{ height: '32%', transform: 'translate(-50%, 0) rotate(60deg)', transformOrigin: 'top' }} />
                      <div className="absolute left-1/2 -translate-x-1/2 w-[2px] bg-black" style={{ height: '32%', transform: 'translate(-50%, 0) rotate(-60deg)', transformOrigin: 'top' }} />
                    </div>

                    {/* Botón arriba - Calendario */}
                    <button
                      aria-label="Calendario"
                      onClick={() => { setShowCalendarMenu(false); navigate('/monthly-calendar'); }}
                      className="absolute pointer-events-auto"
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      style={{ top: '20%', left: '50%', transform: 'translate(-50%, -50%)' }}
                    >
                      <Calendar size={36} color="#000000" />
                    </button>

                    {/* Botón abajo-izquierda - Configuración */}
                    <button
                      aria-label="Configuración"
                      onClick={() => { setShowCalendarMenu(false); navigate('/settings'); }}
                      className="absolute pointer-events-auto"
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      style={{ top: '70%', left: '29%', transform: 'translate(-50%, -50%)' }}
                    >
                      <Settings size={34} color="#000000" />
                    </button>

                    {/* Botón abajo-derecha - Estadísticas */}
                    <button
                      aria-label="Estadísticas"
                      onClick={() => { setShowCalendarMenu(false); navigate('/productivity-stats'); }}
                      className="absolute pointer-events-auto"
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      style={{ top: '70%', left: '71%', transform: 'translate(-50%, -50%)' }}
                    >
                      <BarChart2 size={34} color="#000000" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingButtons;
