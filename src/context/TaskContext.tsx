
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Task } from '@/components/TaskItem';
import { useToast } from '@/components/ui/use-toast';

interface TaskContextType {
  tasks: Task[];
  activeTask: Task | null;
  pendingTasks: Task[];
  completedTasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setActiveTask: React.Dispatch<React.SetStateAction<Task | null>>;
  handleAddTask: (newTaskData: Omit<Task, 'id' | 'completed' | 'actualTime'>) => void;
  handleCompleteTask: (id: string) => void;
  handleStartTimer: (id: string) => void;
  handleTimerComplete: (id: string, timeSpent: number) => void;
  handleCancelTimer: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { toast } = useToast();
  
  // Cargar tareas desde localStorage al iniciar
  useEffect(() => {
    const savedTasks = localStorage.getItem('steve-tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);
  
  // Guardar tareas en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('steve-tasks', JSON.stringify(tasks));
  }, [tasks]);
  
  // Agregar una nueva tarea
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'completed' | 'actualTime'>) => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...newTaskData,
      completed: false
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    
    toast({
      title: "Steve dice:",
      description: "¡Nueva tarea agregada! ¡A trabajar se ha dicho!",
    });
  };
  
  // Marcar una tarea como completada
  const handleCompleteTask = (id: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };
  
  // Iniciar el temporizador para una tarea
  const handleStartTimer = (id: string) => {
    const task = tasks.find(task => task.id === id);
    if (task) {
      setActiveTask(task);
      
      toast({
        title: "Steve dice:",
        description: "¡Hora de concentrarse! Estoy vigilando tu rendimiento.",
      });
    }
  };
  
  // Completar una tarea desde el temporizador
  const handleTimerComplete = (id: string, timeSpent: number) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? 
        { ...task, completed: true, actualTime: timeSpent } : 
        task
      )
    );
    
    setActiveTask(null);
    
    toast({
      title: "Steve dice:",
      description: "¡Buen trabajo! Has completado una tarea.",
    });
  };
  
  // Cancelar el temporizador
  const handleCancelTimer = () => {
    setActiveTask(null);
    
    toast({
      title: "Steve dice:",
      description: "Has pausado tu trabajo. ¡Regresa pronto!",
    });
  };
  
  // Filtrar tareas pendientes y completadas
  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  
  return (
    <TaskContext.Provider value={{
      tasks,
      activeTask,
      pendingTasks,
      completedTasks,
      setTasks,
      setActiveTask,
      handleAddTask,
      handleCompleteTask,
      handleStartTimer,
      handleTimerComplete,
      handleCancelTimer
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  
  return context;
};
