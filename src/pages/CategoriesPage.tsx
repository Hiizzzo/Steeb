import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CategoryGrid from '@/components/CategoryGrid';
import TaskCreationCard from '@/components/TaskCreationCard';
import { useTaskStore } from '@/store/useTaskStore';
import { useNavigate } from 'react-router-dom';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import SwipeNavigationIndicator from '@/components/SwipeNavigationIndicator';
import { useTheme } from '@/hooks/useTheme';
import { RecurrenceRule, Task } from '@/types';
import { ArrowLeft, Plus } from 'lucide-react';

const CategoriesPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Task['type'] | null>(null);
  const { addTask, tasks } = useTaskStore();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  // Sistema de navegación por swipe
  const { SwipeHandler, isSwiping, swipeProgress } = useSwipeNavigation({
    direction: 'right',
    threshold: 50,
    duration: 800,
    enableMouse: true
  });

  const handleBack = () => {
    navigate('/');
  };

  const handleCategoryClick = (type: Task['type']) => {
    setSelectedCategory(type);
    setShowModal(true);
  };

  const handleAddTask = async (
    title: string,
    type: Task['type'],
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
    setSelectedCategory(null);
  };

  return (
    <SwipeHandler>
      <div className="min-h-screen bg-white dark:bg-black">

        {/* Header con navegación */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-black dark:border-white"
        >
          <div className="flex items-center justify-between p-4">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-black dark:text-white hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Volver</span>
            </button>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {tasks.filter(t => !t.completed).length} tareas activas
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:scale-105 transition-transform"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.header>

        {/* Contenido principal */}
        <main className="p-4 pb-8">
          <CategoryGrid
            onCategoryClick={handleCategoryClick}
            showTaskCounts={true}
            className="max-w-6xl mx-auto"
          />
        </main>

        {/* Modal para crear tarea */}
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
                className="w-full max-w-md"
              >
                <TaskCreationCard
                  onCancel={() => {
                    setShowModal(false);
                    setSelectedCategory(null);
                  }}
                  onCreate={handleAddTask}
                  defaultType={selectedCategory || undefined}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicador de navegación por swipe */}
        <SwipeNavigationIndicator
          isVisible={isSwiping}
          progress={swipeProgress}
          direction="right"
        />
      </div>
    </SwipeHandler>
  );
};

export default CategoriesPage;