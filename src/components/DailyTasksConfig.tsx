import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Settings, Plus, Trash2, Save, X } from 'lucide-react';
import { dailyTasks, DailyTask } from '@/data/dailyTasks';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface DailyTasksConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (title: string, type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string, notes?: string) => void;
}

const DailyTasksConfig: React.FC<DailyTasksConfigProps> = ({ isOpen, onClose, onAddTask }) => {
  const [customTasks, setCustomTasks] = useState<DailyTask[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState<Partial<DailyTask>>({});
  const { toast } = useToast();

  // Cargar tareas personalizadas desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('stebe-custom-daily-tasks');
    if (saved) {
      setCustomTasks(JSON.parse(saved));
    } else {
      setCustomTasks(dailyTasks); // Usar las tareas por defecto
    }
  }, []);

  // Guardar tareas personalizadas
  const saveCustomTasks = (tasks: DailyTask[]) => {
    localStorage.setItem('stebe-custom-daily-tasks', JSON.stringify(tasks));
    setCustomTasks(tasks);
  };

  const handleAddCustomTask = () => {
    if (!newTask.title?.trim()) {
      toast({
        title: "Steve dice:",
        description: "¡Necesitas darle un nombre a tu tarea diaria!",
        variant: "destructive",
      });
      return;
    }

    const task: DailyTask = {
      title: newTask.title.trim(),
      type: newTask.type || 'personal',
      subtasks: newTask.subtasks || [],
      scheduledTime: newTask.scheduledTime || '09:00'
    };

    const updatedTasks = [...customTasks, task];
    saveCustomTasks(updatedTasks);
    setNewTask({});
    setShowAddForm(false);

    toast({
      title: "Steve dice:",
      description: "¡Perfecto! He guardado tu nueva tarea diaria personalizada.",
    });
  };

  const handleDeleteTask = (index: number) => {
    const updatedTasks = customTasks.filter((_, i) => i !== index);
    saveCustomTasks(updatedTasks);
    toast({
      title: "Tu tarea se ha eliminado correctamente",
    });
  };

  const handleAddAllCustomTasks = async () => {
    toast({
      title: "¡Steve dice:",
      description: "¡Voy a añadir todas tus tareas personalizadas! ¡Es hora de brillar! ✨",
    });

    for (let i = 0; i < customTasks.length; i++) {
      const task = customTasks[i];
      
      const subtasks: SubTask[] = task.subtasks?.map((subtask, index) => ({
        id: `${Date.now()}-${i}-${index}`,
        title: subtask,
        completed: false
      })) || [];

      onAddTask(
        task.title,
        'productividad', // Mapear a un tipo válido
        subtasks.length > 0 ? subtasks : undefined,
        new Date().toISOString().split('T')[0],
        task.scheduledTime,
        undefined
      );

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setTimeout(() => {
      toast({
        title: "¡Steve dice:",
        description: `¡Listo! He añadido ${customTasks.length} tareas personalizadas. ¡Tú eres increíble! 🚀`,
      });
    }, 500);

    onClose();
  };

  const resetToDefault = () => {
    saveCustomTasks(dailyTasks);
    toast({
      title: "Steve dice:",
      description: "¡He restaurado las tareas por defecto! A veces lo simple es lo mejor.",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-lg h-[90vh] sm:h-[80vh] sm:max-h-[700px] sm:rounded-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 bg-gray-100 sm:rounded-t-2xl">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <X size={24} />
          </button>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <Settings size={20} />
            <span>Configurar Tareas Diarias</span>
          </h2>
          <button
            onClick={handleAddAllCustomTasks}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Personaliza las tareas que Steve añadirá automáticamente cada día. ¡Haz que sean perfectas para ti!
            </p>
            
            <div className="flex space-x-2 mb-4">
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 flex items-center justify-center rounded-full"
              >
                <Plus size={16} />
              </Button>
              <Button
                onClick={resetToDefault}
                variant="outline"
                className="flex-1"
              >
                Restaurar
              </Button>
            </div>
          </div>

          {/* Formulario para añadir nueva tarea */}
          {showAddForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium mb-3">Nueva Tarea Diaria</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Nombre de la tarea"
                  value={newTask.title || ''}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
                <select
                  value={newTask.type || 'personal'}
                  onChange={(e) => setNewTask({...newTask, type: e.target.value as any})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="personal">Personal</option>
                  <option value="work">Trabajo</option>
                  <option value="meditation">Meditación</option>
                </select>
                <Input
                  type="time"
                  value={newTask.scheduledTime || ''}
                  onChange={(e) => setNewTask({...newTask, scheduledTime: e.target.value})}
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleAddCustomTask}
                    className="w-10 h-10 bg-green-600 hover:bg-green-700 flex items-center justify-center rounded-full"
                  >
                    <Save size={16} />
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTask({});
                    }}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de tareas personalizadas */}
          <div className="space-y-3">
            {customTasks.map((task, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{task.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      task.type === 'work' ? 'bg-blue-100 text-blue-800' :
                      task.type === 'personal' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.type}
                    </span>
                    {task.scheduledTime && (
                      <span className="flex items-center">
                        <span className="mr-1">🕐</span>
                        {task.scheduledTime}
                      </span>
                    )}
                  </div>
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {task.subtasks.length} subtareas
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteTask(index)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyTasksConfig;