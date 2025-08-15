
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, MessageCircle, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskCreationCard from './TaskCreationCard';

interface FloatingButtonsProps {
  onAddTask: () => void;
  onCreateTask?: (title: string, type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra', subtasks?: any[], scheduledDate?: string, scheduledTime?: string, notes?: string, isPrimary?: boolean) => void;
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({ onAddTask, onCreateTask }) => {
  const navigate = useNavigate();
  const [isLongPressed, setIsLongPressed] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const loadingTimer = useRef<NodeJS.Timeout | null>(null);
  const hasLongPressTriggered = useRef(false);

  // Handler para iniciar el long press
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Preparar interacción de long-press
    hasLongPressTriggered.current = false;
    setShowCalendar(false);
    setIsLongPressed(true);

    // Evitar selección durante la pulsación
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    // Temporizador para abrir Acciones rápidas si se mantiene presionado
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = setTimeout(() => {
      setShowCalendar(true);
      setShowCalendarMenu(true);
      hasLongPressTriggered.current = true;
    }, 600);
  };

  // Handler para eventos touch (fallback para mejor compatibilidad móvil)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Simular el comportamiento de pointerdown para touch events
    const syntheticEvent = {
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation()
    } as React.PointerEvent;
    handlePointerDown(syntheticEvent);
  };

  // Handler para soltar el botón
  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault(); // Prevenir comportamientos por defecto
    e.stopPropagation(); // Prevenir propagación del evento
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (loadingTimer.current) {
      clearTimeout(loadingTimer.current);
      loadingTimer.current = null;
    }
    
    // Restaurar selección de texto
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    
    // Si no alcanzó el umbral de long press, abrir modal de tarea
    if (!hasLongPressTriggered.current) {
      setShowTaskModal(true);
    }
    
    // Solo cerrar el estado de long press, pero mantener el menú abierto si ya se mostró
    setIsLongPressed(false);
    setShowCalendar(false);
    // NO cerramos showCalendarMenu aquí - se mantiene abierto hasta que el usuario haga clic
  };

  // Handler para touch end
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const syntheticEvent = {
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation()
    } as React.PointerEvent;
    handlePointerUp(syntheticEvent);
  };

  // Handler para cancelar si el usuario sale del área
  const handlePointerLeave = (e: React.PointerEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (loadingTimer.current) {
      clearTimeout(loadingTimer.current);
      loadingTimer.current = null;
    }
    
    // Restaurar selección de texto
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    
    setIsLongPressed(false);
    setShowCalendar(false);
    hasLongPressTriggered.current = false;
    // Solo cerrar el menú si no se ha abierto completamente
    if (!showCalendarMenu) {
      setShowCalendarMenu(false);
    }
  };

  // Handler para touch cancel/leave
  const handleTouchCancel = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const syntheticEvent = {
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation()
    } as React.PointerEvent;
    handlePointerLeave(syntheticEvent);
  };

  // Handler para prevenir menú contextual que puede interferir
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // Limpiar estilos al desmontar el componente
  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, []);

  // Handler para crear tarea desde el modal
  const handleCreateTask = (title: string, type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra', subtasks?: any[], scheduledDate?: string, scheduledTime?: string, notes?: string, isPrimary?: boolean) => {
    setShowTaskModal(false);
    
    // Si tenemos la función onCreateTask, la usamos para crear la tarea directamente
    if (onCreateTask) {
      console.log('🎯 Creando tarea desde FloatingButtons:', { title, type, scheduledDate, notes, isPrimary });
      onCreateTask(title, type, subtasks, scheduledDate, scheduledTime, notes, isPrimary);
    } else {
      // Fallback: abrir el modal principal
      console.log('⚠️ No se encontró onCreateTask, abriendo modal principal');
      onAddTask();
    }
  };

  return (
    <>
      <div className="fixed bottom-8 left-0 right-0 z-50 pointer-events-none no-select">
        <div className="flex items-center justify-center px-8 pointer-events-none no-select">
          {/* Botón Principal */}
          <motion.button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onContextMenu={handleContextMenu}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 hover:-translate-y-1 bg-black dark:!bg-white pointer-events-auto touch-button no-select"
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
                  {/* Indicador de "mantener presionado" */}
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
                  <Plus size={28} className="text-white dark:!text-black sm:w-8 sm:h-8" strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Modal de Creación de Tarea */}
      <AnimatePresence>
        {showTaskModal && (
          <TaskCreationCard
            onCancel={() => setShowTaskModal(false)}
            onCreate={handleCreateTask}
          />
        )}
      </AnimatePresence>

      {/* Menú Radial (long press) */}
      <AnimatePresence>
        {showCalendarMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={() => setShowCalendarMenu(false)}
          >
            {/* Overlay oscurecido */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
            />

            {/* Contenedor central para los 4 botones en cruz */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Círculo invisible para posicionamiento */}
              <div className="relative w-[0px] h-[0px]">
                {/* Arriba - Calendario */}
                <button
                  onClick={() => {
                    setShowCalendarMenu(false);
                    navigate('/monthly-calendar');
                  }}
                  className="absolute -top-[120px] -left-[48px] w-24 h-24 rounded-full border-2 border-white bg-black flex flex-col items-center justify-center"
                  style={{ color: '#FFFFFF' }}
                >
                  <Calendar size={28} color="#FFFFFF" />
                  <span className="mt-1 text-xs font-semibold" style={{ color: '#FFFFFF' }}>Calendario</span>
                </button>

                {/* Derecha - Estadísticas */}
                <button
                  onClick={() => {
                    setShowCalendarMenu(false);
                    navigate('/productivity-stats');
                  }}
                  className="absolute -right-[120px] -top-[48px] w-24 h-24 rounded-full border-2 border-white bg-black flex flex-col items-center justify-center"
                  style={{ color: '#FFFFFF' }}
                >
                  <BarChart2 size={28} color="#FFFFFF" />
                  <span className="mt-1 text-xs font-semibold" style={{ color: '#FFFFFF' }}>Estadísticas</span>
                </button>

                {/* Abajo - Chat con Stebe */}
                <button
                  onClick={() => {
                    setShowCalendarMenu(false);
                    navigate('/chat');
                  }}
                  className="absolute -bottom-[120px] -left-[48px] w-24 h-24 rounded-full border-2 border-white bg-black flex flex-col items-center justify-center"
                  style={{ color: '#FFFFFF' }}
                >
                  <MessageCircle size={28} color="#FFFFFF" />
                  <span className="mt-1 text-xs font-semibold" style={{ color: '#FFFFFF' }}>Chat con Stebe</span>
                </button>

                 {/* Izquierda - Más */}
                 
                 
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
    </>
  );
};

export default FloatingButtons;
