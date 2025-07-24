
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingButtonsProps {
  onAddTask: () => void;
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({ onAddTask }) => {
  const navigate = useNavigate();
  const [isLongPressed, setIsLongPressed] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      setIsLongPressed(true);
    }, 500); // 500ms para activar el long press
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (isLongPressed) {
      // Si estaba en modo long press, navegar al calendario
      navigate('/monthly-calendar');
      setIsLongPressed(false);
    } else {
      // Si no era long press, agregar tarea
      onAddTask();
    }
  };

  const handleMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPressed(false);
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50">
      <div className="flex items-center justify-center px-8">
        
        {/* Botón Principal con Long Press */}
        <motion.button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 hover:-translate-y-1 ${
            isLongPressed ? 'bg-gray-800' : 'bg-black'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {isLongPressed ? (
              <motion.div
                key="calendar"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 800, 
                  damping: 30,
                  duration: 0.08 
                }}
              >
                <Calendar size={28} className="text-white sm:w-8 sm:h-8" strokeWidth={3} />
              </motion.div>
            ) : (
              <motion.div
                key="plus"
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -180 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 800, 
                  damping: 30,
                  duration: 0.08 
                }}
              >
                <Plus size={28} className="text-white sm:w-8 sm:h-8" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

      </div>
    </div>
  );
};

export default FloatingButtons;
