
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import StebeHeader from '@/components/StebeHeader';
import TaskCard from '@/components/TaskCard';
import FloatingButtons from '@/components/FloatingButtons';
import ModalAddTask from '@/components/ModalAddTask';
import TaskDetailsModal from '@/components/TaskDetailsModal';
import CalendarView from '@/components/CalendarView';

import DailyTasksConfig from '@/components/DailyTasksConfig';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  notes?: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
}

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: '1', 
      title: 'Design homepage', 
      type: 'work', 
      completed: true,
      scheduledDate: new Date().toISOString().split('T')[0],
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
      scheduledDate: new Date().toISOString().split('T')[0],
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
      scheduledDate: new Date().toISOString().split('T')[0],
      subtasks: [
        { id: '3-1', title: 'Comprar pan', completed: false },
        { id: '3-2', title: 'Queso y fiambre', completed: false },
        { id: '3-3', title: 'Jugo de naranja', completed: false }
      ]
    }
  ]);
  
  const [showModal, setShowModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [viewMode, setViewMode] = useState<'tasks' | 'calendar'>('tasks');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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
        task.id === id ? { 
          ...task, 
          completed: !task.completed,
          completedDate: !task.completed ? new Date().toISOString() : undefined
        } : task
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

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete) {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
      toast({
        title: "Task deleted",
        description: `"${taskToDelete.title}" has been removed from your list.`,
      });
    }
  };

  const handleAddTask = (title: string, type: 'personal' | 'work' | 'meditation', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string, notes?: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      notes,
      type,
      completed: false,
      subtasks,
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime
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

  const handleShowDetails = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setShowDetailsModal(true);
    }
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedTask(null);
  };

  // Filter tasks for today and overdue
  const today = new Date().toISOString().split('T')[0];
  const todaysTasks = tasks.filter(task => {
    if (!task.scheduledDate) return true; // Show tasks without date as today's
    return task.scheduledDate <= today;
  });

  return (
    <div className="min-h-screen bg-white pb-32" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <StebeHeader />
      
      {viewMode === 'tasks' ? (
        <>
          {/* Lista de Tareas */}
          <div className="pt-2">
            {todaysTasks.length > 0 ? (
              todaysTasks
                .sort((a, b) => {
                  // Tareas no completadas primero, completadas al final
                  if (a.completed && !b.completed) return 1;
                  if (!a.completed && b.completed) return -1;
                  return 0;
                })
                .map(task => (
                  <TaskCard
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    type={task.type}
                    completed={task.completed}
                    subtasks={task.subtasks}
                    scheduledDate={task.scheduledDate}
                    scheduledTime={task.scheduledTime}
                    onToggle={handleToggleTask}
                    onToggleSubtask={handleToggleSubtask}
                    onDelete={handleDeleteTask}
                    onShowDetails={handleShowDetails}
                  />
                ))
            ) : (
              <div className="text-center py-12 px-4">
                <p className="text-lg text-gray-600 font-medium">
                  No tasks for today.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Press the + button to add your first task!
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <CalendarView
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onToggleSubtask={handleToggleSubtask}
          onAddTask={() => setShowModal(true)}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Floating Buttons */}
      <FloatingButtons 
        onAddTask={() => setShowModal(true)}
        onShowTasks={handleShowTasks}
        onToggleView={() => setViewMode(viewMode === 'tasks' ? 'calendar' : 'tasks')}
        viewMode={viewMode}
      />

      {/* Modal para Agregar Tarea */}
      <ModalAddTask
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddTask={handleAddTask}
      />

      {/* Modal de Configuración de Tareas Diarias */}
      <DailyTasksConfig
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onAddTask={handleAddTask}
      />

      {/* Modal de Detalles de Tarea */}
      <TaskDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetails}
        task={selectedTask}
      />
    </div>
  );
};

export default Index;
