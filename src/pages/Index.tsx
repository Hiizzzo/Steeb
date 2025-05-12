
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import TaskItem, { Task } from '@/components/TaskItem';
import AddTaskForm from '@/components/AddTaskForm';
import TaskTimer from '@/components/TaskTimer';
import SteveMessage from '@/components/SteveMessage';
import StatsPanel from '@/components/StatsPanel';
import { Bell, CheckSquare, BarChart, Plus, ArrowLeft } from 'lucide-react';

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showStats, setShowStats] = useState(false);
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
  
  // Verificar inactividad para que Steve envíe notificaciones
  useEffect(() => {
    let inactivityTimer: number | undefined;
    let reminderCount = 0;
    
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = window.setTimeout(() => {
        if (!activeTask && tasks.some(task => !task.completed)) {
          reminderCount++;
          let message = '';
          
          if (reminderCount === 1) {
            message = "¡Hey! Tienes tareas pendientes. ¿Necesitas ayuda?";
          } else if (reminderCount === 2) {
            message = "Vamos, no te distraigas. ¡Hay trabajo que hacer!";
          } else {
            message = "¡ESTOY OBSERVANDO TUS ESTADÍSTICAS! ¡PONTE A TRABAJAR AHORA!";
          }
          
          toast({
            title: "Steve dice:",
            description: message,
          });
        }
      }, 90000); // 1.5 minutos de inactividad
    };
    
    resetInactivityTimer();
    
    const handleActivity = () => {
      resetInactivityTimer();
    };
    
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [activeTask, tasks, toast]);
  
  // Agregar una nueva tarea
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'completed' | 'actualTime'>) => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...newTaskData,
      completed: false
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    setShowAddTask(false);
    
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
  
  // Determinar el mensaje de Steve
  const getSteveMessage = () => {
    if (tasks.length === 0) {
      return {
        text: "¡Hola! Soy Steve, tu supervisor de productividad. Vamos a agregar algunas tareas para empezar.",
        mood: 'happy' as const
      };
    }
    
    if (pendingTasks.length === 0 && completedTasks.length > 0) {
      return {
        text: "¡Excelente trabajo! Has completado todas tus tareas. ¿Quieres agregar más?",
        mood: 'happy' as const
      };
    }
    
    if (pendingTasks.length > 2) {
      return {
        text: `Tienes ${pendingTasks.length} tareas pendientes. ¡Es hora de ponerse a trabajar!`,
        mood: 'angry' as const
      };
    }
    
    return {
      text: "Recuerda mantener el enfoque y evitar distracciones. ¡Estoy vigilando!",
      mood: 'neutral' as const
    };
  };
  
  const steveMessage = getSteveMessage();
  
  // Nuevo diseño basado en la imagen compartida
  return (
    <div className="min-h-screen bg-white">
      {/* Header con el título y flecha de regreso */}
      <header className="pt-6 pb-4 px-6">
        <div className="flex items-center">
          <Button variant="ghost" className="p-0 mr-3">
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-4xl font-bold">Mis Tareas</h1>
        </div>
      </header>
      
      {showAddTask && (
        <div className="px-6 mb-6">
          <AddTaskForm onAddTask={handleAddTask} />
          <Button 
            className="w-full mt-3 bg-steve-white hover:bg-steve-gray-light steve-border"
            variant="outline"
            onClick={() => setShowAddTask(false)}
          >
            Cancelar
          </Button>
        </div>
      )}
      
      {showStats && (
        <div className="px-6 mb-6">
          <StatsPanel tasks={tasks} />
          <Button 
            className="w-full mt-3 bg-steve-black text-steve-white hover:bg-steve-gray-dark"
            onClick={() => setShowStats(false)}
          >
            Cerrar Estadísticas
          </Button>
        </div>
      )}
      
      {!showAddTask && !showStats && (
        <div className="px-6 pb-32">
          {/* Lista de tareas con círculos coloridos */}
          <div className="space-y-5">
            {tasks.map((task, index) => (
              <div key={task.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center gradient-bg-${index % 5}`}>
                </div>
                <span className="ml-5 text-xl">{task.title}</span>
              </div>
            ))}
            
            {tasks.length === 0 && (
              <div className="py-10">
                <SteveMessage message={steveMessage.text} mood={steveMessage.mood} />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Timer Activo */}
      {activeTask && (
        <TaskTimer
          task={activeTask}
          onComplete={handleTimerComplete}
          onCancel={handleCancelTimer}
        />
      )}
      
      {/* Botón flotante de añadir */}
      <div className="fixed bottom-6 right-6">
        <Button 
          onClick={() => {
            setShowAddTask(true);
            setShowStats(false);
          }}
          className="w-14 h-14 rounded-full gradient-bg-button flex items-center justify-center shadow-lg"
        >
          <Plus size={24} color="white" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
