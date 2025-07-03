
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import StebeHeader from '@/components/StebeHeader';
import TaskCard from '@/components/TaskCard';
import FloatingButtons from '@/components/FloatingButtons';
import ModalAddTask from '@/components/ModalAddTask';

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
}

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: '1', 
      title: 'Design homepage', 
      type: 'work', 
      completed: true,
      subtasks: [
        { id: '1-1', title: 'Adjust colors', completed: false },
        { id: '1-2', title: 'Redesign buttons', completed: false },
        { id: '1-3', title: 'Test mobile version', completed: false }
      ]
    },
    { 
      id: '2', 
      title: 'Meeting with team', 
      type: 'work', 
      completed: true,
      subtasks: [
        { id: '2-1', title: 'Take minutes', completed: false },
        { id: '2-2', title: 'Send reminder', completed: false },
        { id: '2-3', title: 'Schedule next meeting', completed: false }
      ]
    },
    { 
      id: '3', 
      title: 'Grocery shopping', 
      type: 'personal', 
      completed: true,
      subtasks: [
        { id: '3-1', title: 'Comprar pan', completed: false },
        { id: '3-2', title: 'Queso y fiambre', completed: false },
        { id: '3-3', title: 'Jugo de naranja', completed: false }
      ]
    }
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

  const handleToggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    
    // Si la tarea tiene subtareas y no están todas completadas, no permitir completar la tarea principal
    if (task && task.subtasks && task.subtasks.length > 0 && !task.completed) {
      const allSubtasksCompleted = task.subtasks.every(subtask => subtask.completed);
      if (!allSubtasksCompleted) {
        toast({
          title: "Complete subtasks first",
          description: "You need to complete all subtasks before completing the main task.",
        });
        return;
      }
    }
    
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
    
    // Solo reproducir sonido y mostrar toast cuando se completa (no cuando se desmarca)
    if (task && !task.completed) {
      playTaskCompleteSound();
      toast({
        title: "Task completed!",
        description: "Great job! You've completed a task.",
      });
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId && task.subtasks) {
          const updatedSubtasks = task.subtasks.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
          );
          
          // Verificar si todas las subtareas están completadas
          const allSubtasksCompleted = updatedSubtasks.every(subtask => subtask.completed);
          
          return {
            ...task,
            subtasks: updatedSubtasks,
            completed: allSubtasksCompleted
          };
        }
        return task;
      })
    );

    // Verificar si se completó la última subtarea para reproducir sonido
    const task = tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
      const subtask = task.subtasks.find(s => s.id === subtaskId);
      const otherSubtasks = task.subtasks.filter(s => s.id !== subtaskId);
      const allOthersCompleted = otherSubtasks.every(s => s.completed);
      
      if (subtask && !subtask.completed && allOthersCompleted) {
        playTaskCompleteSound();
        toast({
          title: "Task completed!",
          description: "Great job! You've completed all subtasks.",
        });
      }
    }
  };

  const handleAddTask = (title: string, type: 'personal' | 'work' | 'meditation', subtasks?: SubTask[]) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      type,
      completed: false,
      subtasks
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    toast({
      title: "New task added!",
      description: "Your task has been added to the list.",
    });
  };

  const handleShowTasks = () => {
    const completedTasks = tasks.filter(t => t.completed).length;
    toast({
      title: "Task summary:",
      description: `${completedTasks} of ${tasks.length} tasks completed`,
    });
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <StebeHeader />
      
      {/* Lista de Tareas */}
      <div className="pb-24 pt-4">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              id={task.id}
              title={task.title}
              type={task.type}
              completed={task.completed}
              subtasks={task.subtasks}
              onToggle={handleToggleTask}
              onToggleSubtask={handleToggleSubtask}
            />
          ))
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-lg text-gray-600 font-medium">
              No tasks yet.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Press the + button to add your first task!
            </p>
          </div>
        )}
      </div>

      {/* Botón Add Task */}
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
