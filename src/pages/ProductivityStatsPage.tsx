import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductivityStatsConnected from '@/components/ProductivityStatsConnected';
import ModalAddTask from '@/components/ModalAddTask';

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

  const handleAddTask = (title: string, type: 'personal' | 'work' | 'meditation', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string, notes?: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      type,
      completed: false,
      subtasks,
      scheduledDate,
      scheduledTime,
      notes
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    setShowModal(false);
  };

  const handleOpenAddTask = () => {
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductivityStatsConnected onAddTask={handleOpenAddTask} />
      
      {/* Modal para Agregar Tarea */}
      <ModalAddTask
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddTask={handleAddTask}
        editingTask={null}
      />
    </div>
  );
};

export default ProductivityStatsPage;