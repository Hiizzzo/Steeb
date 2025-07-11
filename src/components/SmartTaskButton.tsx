import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Zap, Sparkles, Calendar, Clock, Settings } from 'lucide-react';
import { dailyTasks, DailyTask } from '@/data/dailyTasks';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface SmartTaskButtonProps {
  onAddTask: (title: string, type: 'personal' | 'work' | 'meditation', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string) => void;
  onOpenConfig?: () => void;
}

const SmartTaskButton: React.FC<SmartTaskButtonProps> = ({ onAddTask, onOpenConfig }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [currentTasks, setCurrentTasks] = useState<DailyTask[]>(dailyTasks);
  const { toast } = useToast();

  // Cargar tareas personalizadas
  useEffect(() => {
    const saved = localStorage.getItem('stebe-custom-daily-tasks');
    if (saved) {
      setCurrentTasks(JSON.parse(saved));
    }
  }, []);

  const handleAddDailyTasks = async () => {
    setIsAdding(true);
    
    // Mensaje inicial de Steve
    toast({
      title: "¡Steve dice:",
      description: "¡Perfecto! Voy a añadir tus tareas diarias. ¡Es hora de ser productivo! 💪",
    });

    // Añadir cada tarea con un pequeño delay para crear efecto de "pensamiento"
    for (let i = 0; i < currentTasks.length; i++) {
      const task = currentTasks[i];
      
      // Convertir subtareas al formato esperado
      const subtasks: SubTask[] = task.subtasks?.map((subtask, index) => ({
        id: `${Date.now()}-${i}-${index}`,
        title: subtask,
        completed: false
      })) || [];

      // Añadir la tarea
      onAddTask(
        task.title,
        task.type,
        subtasks.length > 0 ? subtasks : undefined,
        new Date().toISOString().split('T')[0], // Hoy
        task.scheduledTime
      );

      // Pequeño delay entre tareas
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Mensaje final motivacional
    setTimeout(() => {
      toast({
        title: "¡Steve dice:",
        description: `¡Listo! He añadido ${currentTasks.length} tareas diarias. ¡Tú puedes con todo! 🚀`,
      });
    }, 500);

    setIsAdding(false);
  };

  const getMotivationalMessage = () => {
    const messages = [
      "¡Hora de ser productivo!",
      "¡Vamos a conquistar el día!",
      "¡Steve está aquí para ayudarte!",
      "¡Tareas inteligentes activadas!",
      "¡Rutina diaria en marcha!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="mb-4">
      <div className="flex space-x-2 mb-2">
        <Button
          onClick={handleAddDailyTasks}
          disabled={isAdding}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 steve-shadow"
        >
          <div className="flex items-center justify-center space-x-2">
            {isAdding ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Añadiendo...</span>
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                <Sparkles className="h-5 w-5" />
                <span>¡Steve, añade mis tareas diarias!</span>
              </>
            )}
          </div>
        </Button>
        
        {onOpenConfig && (
          <Button
            onClick={onOpenConfig}
            variant="outline"
            className="px-3 bg-white hover:bg-gray-50 border-gray-300"
            title="Configurar tareas diarias"
          >
            <Settings size={20} />
          </Button>
        )}
      </div>
      
      {!isAdding && (
        <div className="text-center">
          <p className="text-sm text-gray-600 flex items-center justify-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{currentTasks.length} tareas diarias inteligentes</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {getMotivationalMessage()}
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartTaskButton;