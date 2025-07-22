import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen bg-white">
      {/* Header with back button */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-50 rounded-full mr-3"
        >
          <ArrowLeft size={20} className="text-black" />
        </Button>
        <h1 className="text-xl font-bold text-black">Volver</h1>
      </div>

      {/* Completed Tasks Calendar */}
      <CompletedTasksCalendar tasks={tasks} />
    </div>
  );
};

export default CompletedTasksPage;
