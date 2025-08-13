import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ProductivityStatsConnected from '@/components/ProductivityStatsConnected';
import TaskCreationCard from '@/components/TaskCreationCard';
import { useTaskStore } from '@/store/useTaskStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ProductivityStatsPage: React.FC = () => {
  const [showModal, setShowModal] = React.useState(false);
  const { addTask } = useTaskStore();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/monthly-calendar');
    }
  };

  const handleAddTask = async (
    title: string,
    type: 'personal' | 'work' | 'meditation',
    subtasks?: { id: string; title: string; completed: boolean }[],
    scheduledDate?: string,
    scheduledTime?: string,
    notes?: string,
    isPrimary?: boolean,
    subgroup?: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'social' | 'salud' | 'entretenimiento' | 'extra'
  ) => {
    await addTask({
      title,
      type,
       subgroup,
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
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-6 pt-6">
        <div className="flex justify-start">
          <motion.button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-full shadow-sm hover:shadow-md transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver</span>
          </motion.button>
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
    </div>
  );
};

export default ProductivityStatsPage;