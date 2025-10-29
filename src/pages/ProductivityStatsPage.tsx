import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ProductivityStatsConnected from '@/components/ProductivityStatsConnected';
import TaskCreationCard from '@/components/TaskCreationCard';
import { useTaskStore } from '@/store/useTaskStore';
import { RecurrenceRule } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import SwipeNavigationIndicator from '@/components/SwipeNavigationIndicator';
import { useTheme } from '@/hooks/useTheme';

const ProductivityStatsPage: React.FC = () => {
  const [showModal, setShowModal] = React.useState(false);
  const { addTask } = useTaskStore();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  // Sistema de navegación por swipe
  const { SwipeHandler, isSwiping, swipeProgress } = useSwipeNavigation({
    direction: 'left',
    threshold: 50, // Más sensible - distancia reducida
    duration: 800,  // Más tiempo permitido
    enableMouse: true // Habilitado explícitamente para PC
  });

  const handleBack = () => {
    navigate('/');
  };

  const handleAddTask = async (
    title: string,
    type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra',
    subtasks?: { id: string; title: string; completed: boolean }[],
    scheduledDate?: string,
    scheduledTime?: string,
    notes?: string,
    isPrimary?: boolean,
    recurrence?: RecurrenceRule
  ) => {
    await addTask({
      title,
      type,
      subgroup: type,
      status: 'pending',
      completed: false,
      subtasks,
      scheduledDate,
      scheduledTime,
      notes,
      tags: isPrimary ? ['principal'] : [],
      recurrence
    });
    setShowModal(false);
  };

  return (
    <SwipeHandler>
      <div className="min-h-screen bg-white dark:bg-black">
        {/* Header simplificado sin botón de volver */}
        <div className="max-w-md mx-auto px-6 pt-4">
          <div className="flex items-center justify-center">
            <h1 className="text-xl font-bold text-black dark:text-white">Estadísticas de Productividad</h1>
          </div>
        </div>

        <ProductivityStatsConnected onAddTask={() => setShowModal(true)} />

        <AnimatePresence>
          {showModal && (
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
                transition={{ type: 'spring', duration: 0.5 }}
              >
                <TaskCreationCard onCancel={() => setShowModal(false)} onCreate={handleAddTask} />
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
    </SwipeHandler>
  );
};

export default ProductivityStatsPage;