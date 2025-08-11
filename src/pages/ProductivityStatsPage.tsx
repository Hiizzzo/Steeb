import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ProductivityStatsConnected from '@/components/ProductivityStatsConnected';
import TaskCreationCard from '@/components/TaskCreationCard';
import { useTaskStore } from '@/store/useTaskStore';

const ProductivityStatsPage: React.FC = () => {
  const [showModal, setShowModal] = React.useState(false);
  const { addTask } = useTaskStore();

  const handleAddTask = async (
    title: string,
    type: 'personal' | 'work' | 'meditation',
    subtasks?: { id: string; title: string; completed: boolean }[],
    scheduledDate?: string,
    scheduledTime?: string,
    notes?: string,
    isPrimary?: boolean
  ) => {
    await addTask({
      title,
      type,
      completed: false,
      subtasks,
      scheduledDate,
      scheduledTime,
      notes,
      tags: isPrimary ? ['principal'] : []
    });
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
    </div>
  );
};

export default ProductivityStatsPage;