
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import StebeHeader from '@/components/StebeHeader';
import SummaryBar from '@/components/SummaryBar';
import TaskCard from '@/components/TaskCard';
import FloatingButtons from '@/components/FloatingButtons';
import ModalAddTask from '@/components/ModalAddTask';

interface Task {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
}

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'No ver PH', type: 'personal', completed: false },
    { id: '2', title: 'Trabajar', type: 'work', completed: false },
    { id: '3', title: 'Meditar', type: 'meditation', completed: false }
  ]);
  
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  const { playTaskCompleteSound } = useSoundEffects();

  // Cargar tareas desde localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('stebe-tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Guardar tareas en localStorage
  useEffect(() => {
    localStorage.setItem('stebe-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Calcular estadísticas de tareas
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  const handleToggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
    
    // Solo reproducir sonido y mostrar toast cuando se completa (no cuando se desmarca)
    if (task && !task.completed) {
      playTaskCompleteSound();
      toast({
        title: "Steve dice:",
        description: "¡Bien hecho! Has completado una tarea.",
      });
    }
  };

  const handleAddTask = (title: string, type: 'personal' | 'work' | 'meditation') => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      type,
      completed: false
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    toast({
      title: "Steve dice:",
      description: "¡Nueva tarea agregada! ¡A trabajar se ha dicho!",
    });
  };

  const handleShowTasks = () => {
    toast({
      title: "Resumen de tareas:",
      description: `${completedTasks} de ${totalTasks} tareas completadas`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <StebeHeader />
      
      {/* Barra de resumen diario */}
      <SummaryBar 
        totalTasks={totalTasks}
        completedTasks={completedTasks}
        pendingTasks={pendingTasks}
      />
      
      {/* Lista de Tareas */}
      <div className="pb-24">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              id={task.id}
              title={task.title}
              type={task.type}
              completed={task.completed}
              onToggle={handleToggleTask}
            />
          ))
        ) : (
          <div className="text-center py-12 px-4">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg text-gray-600 font-medium">
              No tienes tareas aún.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              ¡Presiona el botón + para agregar tu primera tarea!
            </p>
          </div>
        )}
      </div>

      {/* Botones Flotantes */}
      <FloatingButtons 
        onAddTask={() => setShowModal(true)}
        onShowTasks={handleShowTasks}
      />

      {/* Modal para Agregar Tarea */}
      <ModalAddTask
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddTask={handleAddTask}
      />
    </div>
  );
};

export default Index;
