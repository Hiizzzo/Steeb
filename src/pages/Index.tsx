
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import TaskItem, { Task } from '@/components/TaskItem';
import AddTaskForm from '@/components/AddTaskForm';
import TaskTimer from '@/components/TaskTimer';
import SteveMessage from '@/components/SteveMessage';
import StatsPanel from '@/components/StatsPanel';
import { Bell, CheckSquare, BarChart, Plus } from 'lucide-react';

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
  
  return (
    <div className="min-h-screen bg-steve-gray-light pb-20">
      {/* Header */}
      <header className="bg-steve-white steve-border-b p-4 mb-5 shadow">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-center">Steve</h1>
          <p className="text-sm text-center">Tu asistente anti-procrastinación</p>
        </div>
      </header>
      
      {/* Mensaje de Steve */}
      <div className="container mx-auto px-4">
        <SteveMessage 
          message={steveMessage.text}
          mood={steveMessage.mood}
        />
      </div>
      
      {/* Panel de Estadísticas */}
      {showStats && (
        <div className="container mx-auto px-4 mb-5">
          <StatsPanel tasks={tasks} />
          <Button 
            className="w-full mt-3 bg-steve-black text-steve-white hover:bg-steve-gray-dark"
            onClick={() => setShowStats(false)}
          >
            Cerrar Estadísticas
          </Button>
        </div>
      )}
      
      {/* Formulario para agregar tareas */}
      {showAddTask && (
        <div className="container mx-auto px-4 mb-5">
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
      
      {/* Listado de Tareas */}
      <div className="container mx-auto px-4">
        {!showAddTask && !showStats && (
          <>
            {pendingTasks.length > 0 && (
              <div className="mb-6">
                <h2 className="font-medium mb-3">Tareas Pendientes ({pendingTasks.length})</h2>
                
                {pendingTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onStartTimer={handleStartTimer}
                  />
                ))}
              </div>
            )}
            
            {completedTasks.length > 0 && (
              <div>
                <h2 className="font-medium mb-3">Tareas Completadas ({completedTasks.length})</h2>
                
                {completedTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onStartTimer={handleStartTimer}
                    className="opacity-70"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Timer Activo */}
      {activeTask && (
        <TaskTimer
          task={activeTask}
          onComplete={handleTimerComplete}
          onCancel={handleCancelTimer}
        />
      )}
      
      {/* Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-steve-white border-t-2 border-steve-black p-2">
        <div className="flex justify-around">
          <Button 
            variant="ghost" 
            className="flex flex-col items-center"
            onClick={() => {
              setShowAddTask(false);
              setShowStats(false);
            }}
          >
            <CheckSquare size={24} />
            <span className="text-xs mt-1">Tareas</span>
          </Button>
          
          <Button 
            variant="ghost"
            className="flex flex-col items-center rounded-full bg-steve-black text-steve-white -mt-5 p-3 hover:bg-steve-gray-dark steve-shadow"
            onClick={() => {
              setShowAddTask(true);
              setShowStats(false);
            }}
          >
            <Plus size={28} />
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex flex-col items-center"
            onClick={() => {
              setShowAddTask(false);
              setShowStats(true);
            }}
          >
            <BarChart size={24} />
            <span className="text-xs mt-1">Stats</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
