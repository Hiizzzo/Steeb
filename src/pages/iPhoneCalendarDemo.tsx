import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle, Plus, Settings, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import IPhoneCalendar from '@/components/iPhoneCalendar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

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

const IPhoneCalendarDemo: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  // Estados del demo
  const [enableMultipleSelection, setEnableMultipleSelection] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [minDate, setMinDate] = useState<Date | undefined>(undefined);
  const [maxDate, setMaxDate] = useState<Date | undefined>(undefined);

  // Datos de ejemplo para el demo
  const [demoTasks, setDemoTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Reunión de equipo',
      type: 'work',
      completed: true,
      scheduledDate: '2024-12-30',
      scheduledTime: '09:00',
      completedDate: '2024-12-30T09:30:00Z',
      notes: 'Discutir objetivos del Q1',
      subtasks: [
        { id: 's1', title: 'Preparar agenda', completed: true },
        { id: 's2', title: 'Revisar métricas', completed: true }
      ]
    },
    {
      id: '2',
      title: 'Ejercicio matutino',
      type: 'personal',
      completed: false,
      scheduledDate: '2024-12-31',
      scheduledTime: '07:00',
      notes: 'Correr 5km en el parque'
    },
    {
      id: '3',
      title: 'Meditación',
      type: 'meditation',
      completed: true,
      scheduledDate: '2024-12-31',
      scheduledTime: '06:30',
      completedDate: '2024-12-31T06:45:00Z',
      notes: '15 minutos de mindfulness'
    },
    {
      id: '4',
      title: 'Llamar a mamá',
      type: 'personal',
      completed: false,
      scheduledDate: '2025-01-01',
      scheduledTime: '19:00',
      notes: 'Felicitarle el año nuevo'
    },
    {
      id: '5',
      title: 'Revisar código del proyecto',
      type: 'work',
      completed: false,
      scheduledDate: '2025-01-02',
      scheduledTime: '14:00',
      subtasks: [
        { id: 's3', title: 'Revisar componentes UI', completed: false },
        { id: 's4', title: 'Optimizar queries', completed: false },
        { id: 's5', title: 'Escribir tests', completed: false }
      ]
    },
    {
      id: '6',
      title: 'Comprar groceries',
      type: 'personal',
      completed: true,
      scheduledDate: '2024-12-29',
      completedDate: '2024-12-29T16:20:00Z',
      notes: 'Lista: leche, pan, frutas'
    }
  ]);

  const handleToggleTask = (taskId: string) => {
    setDemoTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            completed: !task.completed,
            completedDate: !task.completed ? new Date().toISOString() : undefined
          } 
        : task
    ));

    const task = demoTasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      toast({
        title: "¡Tarea completada!",
        description: `Has completado: ${task.title}`,
      });
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setDemoTasks(prev => prev.map(task => {
      if (task.id === taskId && task.subtasks) {
        const updatedSubtasks = task.subtasks.map(subtask =>
          subtask.id === subtaskId 
            ? { ...subtask, completed: !subtask.completed } 
            : subtask
        );
        
        const allSubtasksCompleted = updatedSubtasks.every(subtask => subtask.completed);
        
        return {
          ...task,
          subtasks: updatedSubtasks,
          completed: allSubtasksCompleted,
          completedDate: allSubtasksCompleted ? new Date().toISOString() : task.completedDate
        };
      }
      return task;
    }));
  };

  const handleAddTask = (date?: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: `Nueva tarea ${date ? `para ${date}` : ''}`,
      type: 'personal',
      completed: false,
      scheduledDate: date || new Date().toISOString().split('T')[0],
      scheduledTime: '12:00',
      notes: 'Tarea creada desde el calendario'
    };

    setDemoTasks(prev => [...prev, newTask]);
    
    toast({
      title: "Tarea agregada",
      description: `Nueva tarea creada ${date ? `para ${date}` : ''}`,
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setDemoTasks(prev => prev.filter(task => task.id !== taskId));
    toast({
      title: "Tarea eliminada",
      description: "La tarea ha sido eliminada exitosamente",
    });
  };

  const handleDateSelect = (date: string, dates?: string[]) => {
    if (enableMultipleSelection && dates) {
      setSelectedDates(dates);
      toast({
        title: "Fechas seleccionadas",
        description: `${dates.length} fecha(s) seleccionada(s)`,
      });
    } else {
      toast({
        title: "Fecha seleccionada",
        description: new Date(date).toLocaleDateString('es-ES', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        }),
      });
    }
  };

  const handleShowTaskDetail = (taskId: string) => {
    const task = demoTasks.find(t => t.id === taskId);
    if (task) {
      toast({
        title: "Detalle de tarea",
        description: `${task.title} - ${task.type}`,
      });
    }
  };

  const generateRandomTasks = () => {
    const taskTitles = [
      'Revisar emails', 'Llamada con cliente', 'Actualizar documentación',
      'Comprar café', 'Reunión de standup', 'Planificar viaje',
      'Leer libro', 'Hacer ejercicio', 'Cocinar cena', 'Estudiar inglés'
    ];

    const newTasks: Task[] = [];
    const today = new Date();

    for (let i = 0; i < 5; i++) {
      const randomDate = new Date(today);
      randomDate.setDate(today.getDate() + Math.floor(Math.random() * 14) - 7);
      
      newTasks.push({
        id: `random-${Date.now()}-${i}`,
        title: taskTitles[Math.floor(Math.random() * taskTitles.length)],
        type: Math.random() > 0.6 ? 'work' : Math.random() > 0.3 ? 'personal' : 'meditation',
        completed: Math.random() > 0.7,
        scheduledDate: randomDate.toISOString().split('T')[0],
        scheduledTime: `${Math.floor(Math.random() * 12) + 8}:${Math.random() > 0.5 ? '00' : '30'}`,
        notes: 'Tarea generada automáticamente'
      });
    }

    setDemoTasks(prev => [...prev, ...newTasks]);
    toast({
      title: "Tareas generadas",
      description: "Se han agregado 5 tareas aleatorias",
    });
  };

  const clearAllTasks = () => {
    setDemoTasks([]);
    toast({
      title: "Tareas eliminadas",
      description: "Todas las tareas han sido eliminadas",
    });
  };

  const resetToDefaultTasks = () => {
    // Resetear a las tareas por defecto
    setDemoTasks([
      {
        id: '1',
        title: 'Reunión de equipo',
        type: 'work',
        completed: true,
        scheduledDate: '2024-12-30',
        scheduledTime: '09:00',
        completedDate: '2024-12-30T09:30:00Z',
        notes: 'Discutir objetivos del Q1',
        subtasks: [
          { id: 's1', title: 'Preparar agenda', completed: true },
          { id: 's2', title: 'Revisar métricas', completed: true }
        ]
      },
      {
        id: '2',
        title: 'Ejercicio matutino',
        type: 'personal',
        completed: false,
        scheduledDate: '2024-12-31',
        scheduledTime: '07:00',
        notes: 'Correr 5km en el parque'
      },
      {
        id: '3',
        title: 'Meditación',
        type: 'meditation',
        completed: true,
        scheduledDate: '2024-12-31',
        scheduledTime: '06:30',
        completedDate: '2024-12-31T06:45:00Z',
        notes: '15 minutos de mindfulness'
      }
    ]);
    toast({
      title: "Tareas reiniciadas",
      description: "Se han restaurado las tareas por defecto",
    });
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 px-4 py-4 border-b ${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-800' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <div className="text-center">
            <h1 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              📱 iPhone Calendar Demo
            </h1>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Todas las características
            </p>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className="p-2"
          >
            <Settings size={20} />
          </Button>
        </div>
      </div>

      {/* Panel de configuración */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`border-b ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
          }`}
        >
          <div className="max-w-md mx-auto p-4 space-y-4">
            <h3 className={`font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Configuración del Demo
            </h3>
            
            {/* Toggle tema */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Tema oscuro
                </span>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>

            {/* Toggle selección múltiple */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Selección múltiple
                </span>
              </div>
              <Switch
                checked={enableMultipleSelection}
                onCheckedChange={setEnableMultipleSelection}
              />
            </div>

            {/* Límites de fecha */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Limitar fechas
                </span>
                <Switch
                  checked={!!minDate || !!maxDate}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setMinDate(new Date());
                      setMaxDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
                    } else {
                      setMinDate(undefined);
                      setMaxDate(undefined);
                    }
                  }}
                />
              </div>
              {(minDate || maxDate) && (
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  Solo próximos 30 días
                </p>
              )}
            </div>

            {/* Acciones de demo */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={generateRandomTasks} size="sm" variant="outline">
                Generar tareas
              </Button>
              <Button onClick={resetToDefaultTasks} size="sm" variant="outline">
                Resetear
              </Button>
              <Button onClick={clearAllTasks} size="sm" variant="destructive">
                Limpiar todo
              </Button>
            </div>

            {/* Estadísticas */}
            <div className={`text-xs ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Total de tareas: {demoTasks.length} | 
              Completadas: {demoTasks.filter(t => t.completed).length} |
              {enableMultipleSelection && ` Fechas seleccionadas: ${selectedDates.length}`}
            </div>
          </div>
        </motion.div>
      )}

      {/* Calendario estilo iPhone */}
      <IPhoneCalendar
        tasks={demoTasks}
        onToggleTask={handleToggleTask}
        onToggleSubtask={handleToggleSubtask}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        onShowTaskDetail={handleShowTaskDetail}
        enableMultipleSelection={enableMultipleSelection}
        selectedDates={selectedDates}
        onDateSelect={handleDateSelect}
        minDate={minDate}
        maxDate={maxDate}
      />

      {/* Footer con información */}
      <div className={`mt-8 p-4 border-t ${
        theme === 'dark' 
          ? 'border-gray-800 bg-gray-900' 
          : 'border-gray-200 bg-white'
      }`}>
        <div className="max-w-md mx-auto text-center">
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            📱 Calendario estilo iPhone para la app <strong>stebe</strong>
          </p>
          <p className={`text-xs mt-2 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}>
            ✨ Con animaciones fluidas, tema automático, tooltips inteligentes y gestión completa de tareas
          </p>
        </div>
      </div>
    </div>
  );
};

export default IPhoneCalendarDemo;