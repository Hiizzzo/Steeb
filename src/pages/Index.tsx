
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTaskPersistence } from '@/hooks/useTaskPersistence';
import { useServiceWorkerSync } from '@/hooks/useServiceWorkerSync';
import StebeHeader from '@/components/StebeHeader';
import TaskCard from '@/components/TaskCard';
import FloatingButtons from '@/components/FloatingButtons';
import ModalAddTask from '@/components/ModalAddTask';
import CalendarView from '@/components/CalendarView';
import TaskDetailModal from '@/components/TaskDetailModal';
import SaveStatusIndicator from '@/components/SaveStatusIndicator';
import AppUpdateNotification from '@/components/AppUpdateNotification';

import DailyTasksConfig from '@/components/DailyTasksConfig';

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
  notes?: string; // Notas adicionales de la tarea
}

const Index = () => {
  // Random phrases for when there are no tasks
  const getRandomNoTasksPhrase = () => {
    const phrases = [
      "¿Un día libre? Te envidio…",
      "Ni una tarea. O estás a punto de procrastinar, o estás en paz.",
      "Stebe dice: eso no suena a productividad, eh…"
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  const [showModal, setShowModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'tasks' | 'calendar'>('tasks');
  const { toast } = useToast();
  const { playTaskCompleteSound } = useSoundEffects();
  
  // Usar el hook de persistencia mejorado
  const { 
    tasks, 
    updateTasks, 
    isLoading: isPersistenceLoading, 
    lastSaved,
    hasError,
    exportTasks,
    clearCorruptedData,
    forceReload 
  } = useTaskPersistence();

  // Hook para sincronización con Service Worker
  const { 
    isServiceWorkerReady, 
    lastBackup, 
    triggerBackup, 
    triggerRestore 
  } = useServiceWorkerSync();

  // Cargar preferencia de vista desde localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('stebe-view-mode');
    if (savedViewMode === 'calendar' || savedViewMode === 'tasks') {
      setViewMode(savedViewMode);
      // Limpiar la preferencia después de usarla
      localStorage.removeItem('stebe-view-mode');
    }
  }, []);

  // El hook useTaskPersistence maneja automáticamente la carga y guardado

  // Verificar si hay una fecha seleccionada del calendario
  useEffect(() => {
    const selectedDate = localStorage.getItem('stebe-selected-date');
    if (selectedDate) {
      // Limpiar la fecha seleccionada
      localStorage.removeItem('stebe-selected-date');
      
      // Abrir el modal de agregar tarea con la fecha pre-seleccionada
      setShowModal(true);
    }
  }, []);

  // Backup automático cuando cambian las tareas importantes
  useEffect(() => {
    if (tasks.length > 0 && isServiceWorkerReady) {
      // Trigger backup when tasks change significantly
      const timeoutId = setTimeout(() => {
        triggerBackup().catch(error => {
          console.warn('⚠️ Auto-backup por cambio de tareas falló:', error);
        });
      }, 2000); // Wait 2 seconds after task changes

      return () => clearTimeout(timeoutId);
    }
  }, [tasks.length, isServiceWorkerReady, triggerBackup]);

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
    
    const updatedTasks = tasks.map(task => 
      task.id === id ? { 
        ...task, 
        completed: !task.completed,
        completedDate: !task.completed ? new Date().toISOString() : undefined
      } : task
    );
    updateTasks(updatedTasks);
    // Persistencia automática manejada por useTaskPersistence
    
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
    const updatedTasks = tasks.map(task => {
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
    });
    updateTasks(updatedTasks);
    // Persistencia automática manejada por useTaskPersistence

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
      const updatedTasks = tasks.filter(task => task.id !== id);
      updateTasks(updatedTasks);
      // Persistencia automática manejada por useTaskPersistence
      toast({
        title: "Task deleted",
        description: `"${taskToDelete.title}" has been removed from your list.`,
      });
    }
  };

  const handleAddTask = (title: string, type: 'personal' | 'work' | 'meditation', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string, notes?: string) => {
    if (selectedTask) {
      // Estamos editando una tarea existente
      const updatedTask: Task = {
        ...selectedTask,
        title,
        type,
        subtasks,
        scheduledDate,
        scheduledTime,
        notes
      };
      
      const updatedTasks = tasks.map(task => 
        task.id === selectedTask.id ? updatedTask : task
      );
      updateTasks(updatedTasks);
      // Persistencia automática manejada por useTaskPersistence
      
      toast({
        title: "Tarea actualizada!",
        description: "Los cambios han sido guardados.",
      });
      
      setSelectedTask(null); // Limpiar la tarea seleccionada después de editar
    } else {
      // Estamos creando una nueva tarea
      const newTask: Task = {
        id: Date.now().toString(),
        title,
        type,
        completed: false,
        subtasks,
        scheduledDate: scheduledDate, // No establecer fecha automáticamente
        scheduledTime,
        notes
      };
      
      const updatedTasks = [...tasks, newTask];
      updateTasks(updatedTasks);
      // Persistencia automática manejada por useTaskPersistence
      
      toast({
        title: "New task added!",
        description: "Your task has been added to the list.",
      });
    }
  };

  const handleShowTasks = () => {
    const completedTasks = tasks.filter(t => t.completed).length;
    toast({
      title: "Task summary:",
      description: `${completedTasks} of ${tasks.length} tasks completed`,
    });
  };

  const handleShowDetail = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setSelectedTask(task);
      setShowDetailModal(true);
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(false);
    setShowModal(true);
  };

  // Filter tasks for today and overdue
  const today = new Date().toISOString().split('T')[0];
  const todaysTasks = tasks.filter(task => {
    if (!task.scheduledDate) return true; // Show tasks without date as today's
    return task.scheduledDate <= today;
  });

  return (
    <div 
      className="min-h-screen pb-6 relative bg-gray-50" 
      style={{ 
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      
      {/* Imagen de Steve Jobs en la esquina superior izquierda */}
      <div className="absolute top-3 left-3 z-20">
        <img 
          src="/lovable-uploads/te obesrvo.png" 
          alt="Steve Jobs" 
          className="w-20 h-20"
        />
      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10">
      {/* Header */}
      <StebeHeader />
      
      {/* Save Status Indicator */}
      <div className="flex justify-center mb-2">
        <SaveStatusIndicator 
          lastSaved={lastSaved} 
          isLoading={isPersistenceLoading}
          hasError={hasError}
          isServiceWorkerReady={isServiceWorkerReady}
          lastBackup={lastBackup}
        />
      </div>
      
      {viewMode === 'tasks' ? (
        <>
          {/* Lista de Tareas */}
          <div className="pt-1 max-w-sm mx-auto px-3">
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
                    notes={task.notes}
                    onToggle={handleToggleTask}
                    onToggleSubtask={handleToggleSubtask}
                    onDelete={handleDeleteTask}
                    onShowDetail={handleShowDetail}
                  />
                ))
            ) : (
              <div className="text-center py-12 px-4">
                <p className="text-lg text-gray-600 font-medium">
                  {getRandomNoTasksPhrase()}
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
          onAddTask={() => {
            setSelectedTask(null); // Limpiar tarea seleccionada para crear nueva
            setShowModal(true);
          }}
          onDelete={handleDeleteTask}
          onShowDetail={handleShowDetail}
        />
      )}

      {/* Floating Buttons */}
      <FloatingButtons 
        onAddTask={handleAddTask}
      />

      {/* Modal para Agregar Tarea */}
      <ModalAddTask
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTask(null); // Limpiar la tarea seleccionada al cerrar
        }}
        onAddTask={handleAddTask}
        editingTask={selectedTask}
      />

      {/* Modal de Configuración de Tareas Diarias */}
      <DailyTasksConfig
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onAddTask={handleAddTask}
      />

      {/* Modal de Detalles de Tarea */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onToggle={handleToggleTask}
        onToggleSubtask={handleToggleSubtask}
        onEdit={handleEditTask}
      />

      {/* App Update Notification */}
      <AppUpdateNotification
        isServiceWorkerReady={isServiceWorkerReady}
        triggerBackup={triggerBackup}
        exportTasks={exportTasks}
      />
      </div>
    </div>
  );
};

export default Index;
