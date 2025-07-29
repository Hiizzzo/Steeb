import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import CompletedTasksCalendar from '@/components/CompletedTasksCalendar';

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

const CompletedTasksPage: React.FC = () => {
  const navigate = useNavigate();

  // Get tasks from localStorage (same as in Index)
  const [tasks, setTasks] = React.useState<Task[]>([]);

  React.useEffect(() => {
    const savedTasks = localStorage.getItem('stebe-tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  return (
    <div className="min-h-screen bg-white relative">
      {/* Nuevo botón de volver en la esquina superior izquierda */}
      <motion.button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-30 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5 text-black" />
      </motion.button>

      {/* Header simplificado sin botón */}
      <div className="bg-white p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-black">Tareas Completadas</h1>
      </div>

      {/* Completed Tasks Calendar */}
      <CompletedTasksCalendar tasks={tasks} />
    </div>
  );
};

export default CompletedTasksPage;
