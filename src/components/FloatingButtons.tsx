
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskCreationCard from './TaskCreationCard';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface FloatingButtonsProps {
  onAddTask: (title: string, type: 'personal' | 'work' | 'meditation', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string, notes?: string) => void;
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({ onAddTask }) => {
  const navigate = useNavigate();
  const { playButtonClickSound } = useSoundEffects();
  const [isLongPressed, setIsLongPressed] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const loadingTimer = useRef<NodeJS.Timeout | null>(null);

  // Handler para iniciar el long press
  const handlePointerDown = (e: React.PointerEvent) => {
    // Reproducir sonido de click al presionar el botón
    playButtonClickSound();
    
    setIsLongPressed(true);
    setShowCalendar(false);
    
    // Mostrar loading después de 200ms (más rápido)
    loadingTimer.current = setTimeout(() => {
      setShowCalendar(true);
    }, 200);
    
    // Navegar al calendario después de 500ms (más rápido)
    longPressTimer.current = setTimeout(() => {
      navigate('/monthly-calendar');
    }, 500);
  };

  // Handler para soltar el botón
  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (loadingTimer.current) {
      clearTimeout(loadingTimer.current);
      loadingTimer.current = null;
    }
    
    // Si no fue long press completo, abrir modal de tarea
    if (!showCalendar) {
      setShowTaskModal(true);
    }
    
    setIsLongPressed(false);
    setShowCalendar(false);
  };

  // Handler para cancelar si el usuario sale del área
  const handlePointerLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (loadingTimer.current) {
      clearTimeout(loadingTimer.current);
      loadingTimer.current = null;
    }
    setIsLongPressed(false);
    setShowCalendar(false);
  };

  // Handler para crear tarea desde el modal
  const handleCreateTask = (title: string, type: 'personal' | 'work' | 'meditation', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string, notes?: string) => {
    setShowTaskModal(false);
    onAddTask(title, type, subtasks, scheduledDate, scheduledTime, notes);
  };

  return (
    <>
      <div className="fixed bottom-8 left-0 right-0 z-50 pointer-events-none">
        <div className="flex items-center justify-center px-8 pointer-events-none">
          {/* Botón Principal */}
          <motion.button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 hover:-translate-y-1 bg-black pointer-events-auto"
            style={{ touchAction: 'none' }}
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
                >
                  <Calendar size={28} className="text-white sm:w-8 sm:h-8" strokeWidth={3} />
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
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDuration: '0.3s', animationDelay: '0s' }}></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDuration: '0.3s', animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDuration: '0.3s', animationDelay: '0.2s' }}></div>
                </motion.div>
              ) : (
                <motion.div
                  key="plus"
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -180 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <Plus size={28} className="text-white sm:w-8 sm:h-8" strokeWidth={3} />
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
    </>
  );
};

export default FloatingButtons;
