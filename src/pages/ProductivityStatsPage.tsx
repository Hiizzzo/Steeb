import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductivityStatsConnected from '@/components/ProductivityStatsConnected';
import TaskCreationCard from '@/components/TaskCreationCard';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  notes?: string;
  tags?: string[];
}

const ProductivityStatsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const navigate = useNavigate();

  // Load tasks from localStorage
  React.useEffect(() => {
    const savedTasks = localStorage.getItem('stebe-tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save tasks to localStorage
  React.useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('stebe-tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleAddTask = (title: string, type: 'personal' | 'work' | 'meditation', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string, notes?: string, isPrimary?: boolean) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      type,
      completed: false,
      subtasks,
      scheduledDate,
      scheduledTime,
      notes,
      tags: isPrimary ? ['principal'] : []
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    setShowModal(false);
  };

  const handleOpenAddTask = () => {
    setShowModal(true);
  };

  const handleCancelTaskCreation = () => {
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductivityStatsConnected onAddTask={handleOpenAddTask} />
      
      {/* TaskCreationCard para agregar tareas */}
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
              transition={{ type: "spring", duration: 0.5 }}
            >
              <TaskCreationCard
                onCancel={handleCancelTaskCreation}
                onCreate={handleAddTask}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductivityStatsPage;