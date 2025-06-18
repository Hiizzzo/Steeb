import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import TaskItem, { Task } from '@/components/TaskItem';
import AddTaskForm from '@/components/AddTaskForm';
import TaskTimer from '@/components/TaskTimer';
import SteveMessage from '@/components/SteveMessage';
import StatsPanel from '@/components/StatsPanel';
import { Bell, CheckSquare, BarChart, Plus, Timer, Star, Sparkles, Trophy } from 'lucide-react';
import PomodoroTimer from '@/components/PomodoroTimer';
import { useSoundEffects } from '@/hooks/useSoundEffects';

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const {
    toast
  } = useToast();
  const {
    playTaskCompleteSound,
    playTimerStartSound
  } = useSoundEffects();

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
            description: message
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

  // Abrir Pomodoro
  const handleOpenPomodoro = () => {
    setShowPomodoro(true);
    toast({
      title: "Steve dice:",
      description: "¡Hora de usar la técnica Pomodoro! 25 minutos de trabajo intenso."
    });
  };

  // Cerrar Pomodoro
  const handleClosePomodoro = () => {
    setShowPomodoro(false);
  };

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
      description: "¡Nueva tarea agregada! ¡A trabajar se ha dicho!"
    });
  };

  // Marcar una tarea como completada
  const handleCompleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prevTasks => prevTasks.map(task => task.id === id ? {
      ...task,
      completed: !task.completed
    } : task));
    // Reproducir sonido solo cuando se completa la tarea (no cuando se desmarca)
    if (task && !task.completed) {
      playTaskCompleteSound();
    }
  };

  // Iniciar el temporizador para una tarea
  const handleStartTimer = (id: string) => {
    const task = tasks.find(task => task.id === id);
    if (task) {
      setActiveTask(task);
      playTimerStartSound();
      toast({
        title: "Steve dice:",
        description: "¡Hora de concentrarse! Estoy vigilando tu rendimiento."
      });
    }
  };

  // Completar una tarea desde el temporizador
  const handleTimerComplete = (id: string, timeSpent: number) => {
    setTasks(prevTasks => prevTasks.map(task => task.id === id ? {
      ...task,
      completed: true,
      actualTime: timeSpent
    } : task));
    setActiveTask(null);
    playTaskCompleteSound();
    toast({
      title: "Steve dice:",
      description: "¡Buen trabajo! Has completado una tarea."
    });
  };

  // Cancelar el temporizador
  const handleCancelTimer = () => {
    setActiveTask(null);
    toast({
      title: "Steve dice:",
      description: "Has pausado tu trabajo. ¡Regresa pronto!"
    });
  };

  // Filtrar tareas pendientes y completadas
  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  // Determinar el mensaje de Steve
  const getSteveMessage = () => {
    if (tasks.length === 0) {
      return {
        text: "¡Hola! Soy Steve, tu amigo supervisor. ¿Listos para ser súper productivos hoy? ¡Vamos a agregar tareas geniales! 🚀",
        mood: 'happy' as const
      };
    }
    if (pendingTasks.length === 0 && completedTasks.length > 0) {
      return {
        text: "¡INCREÍBLE! 🎉 ¡Has completado TODAS tus tareas! ¡Eres una máquina de productividad! ¿Quieres agregar más aventuras? ⭐",
        mood: 'happy' as const
      };
    }
    if (pendingTasks.length > 2) {
      return {
        text: `¡Tienes ${pendingTasks.length} misiones esperándote! 💪 ¡Es hora de conquistar el mundo de la productividad! ¡TÚ PUEDES! 🔥`,
        mood: 'angry' as const
      };
    }
    return {
      text: "¡Mantén el enfoque, campeón! 🎯 Cada tarea completada te hace más fuerte. ¡Estoy aquí apoyándote! ⚡",
      mood: 'neutral' as const
    };
  };
  const steveMessage = getSteveMessage();
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 pb-20">
      {/* Header con diseño más divertido */}
      <header className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 p-6 mb-6 shadow-lg">
        <div className="container mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Star className="text-yellow-300 animate-pulse" size={32} />
              <h1 className="text-3xl font-bold text-white tracking-wide">STEBE</h1>
              <Sparkles className="text-yellow-300 animate-pulse" size={32} />
            </div>
            <p className="text-purple-100 text-sm font-medium">¡Tu compañero de aventuras productivas!</p>
          </div>
        </div>
      </header>

      {/* Mensaje de Steve con diseño más amigable */}
      <div className="container mx-auto px-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-lg border-4 border-purple-200">
          <SteveMessage message={steveMessage.text} mood={steveMessage.mood} />
        </div>
      </div>

      {/* Panel de Estadísticas */}
      {showStats && (
        <div className="container mx-auto px-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-lg border-4 border-blue-200">
            <StatsPanel tasks={tasks} />
            <Button 
              className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg" 
              onClick={() => setShowStats(false)}
            >
              <Trophy size={20} className="mr-2" />
              ¡Cerrar Estadísticas!
            </Button>
          </div>
        </div>
      )}

      {/* Formulario para agregar tareas */}
      {showAddTask && (
        <div className="container mx-auto px-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-lg border-4 border-green-200">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-green-600 flex items-center justify-center">
                <Plus size={24} className="mr-2" />
                ¡Nueva Aventura!
              </h3>
              <p className="text-green-500 text-sm">¡Vamos a crear algo genial!</p>
            </div>
            <AddTaskForm onAddTask={handleAddTask} />
            <Button 
              className="w-full mt-4 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold py-3 rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all" 
              onClick={() => setShowAddTask(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Listado de Tareas con diseño más visual */}
      <div className="container mx-auto px-4">
        {!showAddTask && !showStats && (
          <>
            {/* Tareas Pendientes */}
            {pendingTasks.length > 0 && (
              <div className="mb-8">
                <div className="bg-white rounded-2xl p-4 shadow-lg border-4 border-orange-200 mb-4">
                  <h2 className="text-xl font-bold text-orange-600 flex items-center justify-center mb-4">
                    <Timer size={24} className="mr-2 animate-pulse" />
                    Misiones Activas ({pendingTasks.length})
                    <Sparkles size={20} className="ml-2 text-yellow-500" />
                  </h2>
                  <div className="space-y-3">
                    {pendingTasks.map(task => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        onComplete={handleCompleteTask} 
                        onStartTimer={handleStartTimer} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tareas Completadas */}
            {completedTasks.length > 0 && (
              <div className="mb-8">
                <div className="bg-white rounded-2xl p-4 shadow-lg border-4 border-green-200">
                  <h2 className="text-xl font-bold text-green-600 flex items-center justify-center mb-4">
                    <Trophy size={24} className="mr-2 text-yellow-500" />
                    ¡Logros Desbloqueados! ({completedTasks.length})
                    <Star size={20} className="ml-2 text-yellow-500 animate-pulse" />
                  </h2>
                  <div className="space-y-3">
                    {completedTasks.map(task => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        onComplete={handleCompleteTask} 
                        onStartTimer={handleStartTimer} 
                        className="opacity-80 bg-gradient-to-r from-green-50 to-emerald-50" 
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje cuando no hay tareas */}
            {tasks.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-white rounded-2xl p-8 shadow-lg border-4 border-purple-200">
                  <Star size={64} className="mx-auto text-purple-400 mb-4 animate-pulse" />
                  <h3 className="text-2xl font-bold text-purple-600 mb-2">¡Tu aventura comienza aquí!</h3>
                  <p className="text-purple-400 mb-6">¡Presiona el botón mágico para crear tu primera misión!</p>
                  <Button 
                    onClick={() => setShowAddTask(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                  >
                    <Plus size={20} className="mr-2" />
                    ¡Crear Primera Misión!
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Timer Activo */}
      {activeTask && <TaskTimer task={activeTask} onComplete={handleTimerComplete} onCancel={handleCancelTimer} />}

      {/* Pomodoro Timer */}
      {showPomodoro && <PomodoroTimer onClose={handleClosePomodoro} />}

      {/* Navigation Bar con diseño más divertido */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-purple-300 p-3 shadow-2xl">
        <div className="flex justify-around items-center">
          <Button 
            variant="ghost" 
            className="flex flex-col items-center p-3 rounded-xl hover:bg-purple-100 transition-all" 
            onClick={() => {
              setShowAddTask(false);
              setShowStats(false);
            }}
          >
            <CheckSquare size={24} className="text-purple-600" />
            <span className="text-xs mt-1 font-bold text-purple-600">Misiones</span>
          </Button>

          <Button 
            onClick={() => {
              setShowAddTask(true);
              setShowStats(false);
            }} 
            className="flex flex-col items-center rounded-full -mt-6 p-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 shadow-xl transform hover:scale-110 transition-all"
          >
            <Plus size={32} />
          </Button>

          <Button 
            variant="ghost" 
            className="flex flex-col items-center p-3 rounded-xl hover:bg-blue-100 transition-all" 
            onClick={() => {
              setShowAddTask(false);
              setShowStats(true);
            }}
          >
            <BarChart size={24} className="text-blue-600" />
            <span className="text-xs mt-1 font-bold text-blue-600">Stats</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
