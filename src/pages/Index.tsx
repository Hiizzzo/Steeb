
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTaskStore } from '@/store/useTaskStore';
import { useServiceWorkerSync } from '@/hooks/useServiceWorkerSync';
import { notificationService } from '@/services/notificationService';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
import StebeHeader from '@/components/StebeHeader';
import TaskCard from '@/components/TaskCard';
import FloatingButtons from '@/components/FloatingButtons';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

import TaskDetailModal from '@/components/TaskDetailModal';

import AppUpdateNotification from '@/components/AppUpdateNotification';

import DailyTasksConfig from '@/components/DailyTasksConfig';
import TaskCreationCard from '@/components/TaskCreationCard';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra';
  subgroup?: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'social' | 'salud' | 'entretenimiento' | 'extra';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  notes?: string; // Notas adicionales de la tarea
  tags?: string[];
  updatedAt?: string;
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
  const [showCompletedToday, setShowCompletedToday] = useState(false);
  
  // Usar el store de tareas
  const { 
    tasks, 
    setTasks: updateTasks, 
    isLoading: isPersistenceLoading, 
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    toggleSubtask
  } = useTaskStore();

  // Hook para sincronización con Service Worker
  const { 
    isServiceWorkerReady, 
    lastBackup, 
    triggerBackup, 
    triggerRestore 
  } = useServiceWorkerSync();

  // Hook para notificaciones de tareas
  const { scheduleTaskNotification, cancelTaskNotification } = useTaskNotifications(tasks);

  // Cargar preferencia de vista desde localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('stebe-view-mode');
    if (savedViewMode === 'calendar' || savedViewMode === 'tasks') {
      setViewMode(savedViewMode);
      // Limpiar la preferencia después de usarla
      localStorage.removeItem('stebe-view-mode');
    }
  }, []);

  // Inicializar servicio de notificaciones
  useEffect(() => {
    notificationService.initialize().then((initialized) => {
      if (initialized) {
        console.log('🔔 Servicio de notificaciones STEBE listo');
      }
    });
  }, []);

  // El hook useTaskPersistence maneja automáticamente la carga y guardado

  // Limpiar tareas con títulos vacíos al cargar
  useEffect(() => {
    const tasksWithEmptyTitles = tasks.filter(task => !task.title || !task.title.trim());
    if (tasksWithEmptyTitles.length > 0) {
      const cleanedTasks = tasks.filter(task => task.title && task.title.trim());
      updateTasks(cleanedTasks);
      console.log(`🧹 Eliminadas ${tasksWithEmptyTitles.length} tareas con títulos vacíos`);
    }
  }, [tasks.length]); // Solo ejecutar cuando cambie el número de tareas

  // Verificar si hay una fecha seleccionada del calendario
  useEffect(() => {
    const selectedDate = localStorage.getItem('stebe-selected-date');
    const shouldOpenModal = localStorage.getItem('stebe-open-add-modal');
    
    if (selectedDate || shouldOpenModal) {
      // Limpiar los flags
      localStorage.removeItem('stebe-selected-date');
      localStorage.removeItem('stebe-open-add-modal');
      
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

  const handleAddTask = (title: string, type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string, notes?: string, isPrimary?: boolean, subgroup?: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'social' | 'salud' | 'entretenimiento' | 'extra') => {
    console.log('🎯 Index.tsx: handleAddTask llamado con:', { title, type, scheduledDate, notes, isPrimary });
    
    // Validar que el título no esté vacío
    if (!title.trim()) {
      console.log('❌ Index.tsx: Título vacío detectado');
      toast({
        title: "Error",
        description: "El título de la tarea no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTask) {
      // Estamos editando una tarea existente
      const otherTags = (selectedTask.tags || []).filter(t => t !== 'principal');
      const nextTags = isPrimary ? [...otherTags, 'principal'] : otherTags;
      const updatedTask: Task = {
         ...selectedTask,
         title: title.trim(),
         type,
         subgroup,
         subtasks,
         scheduledDate,
         scheduledTime,
         notes: notes?.trim(),
         tags: nextTags,
         updatedAt: new Date().toISOString()
       };
      
      // Usar updateTask del store en lugar de updateTasks directamente
      updateTask(selectedTask.id, updatedTask).catch(console.error);
      
      toast({
        title: "Tarea actualizada!",
        description: "Los cambios han sido guardados.",
      });
      
      setSelectedTask(null); // Limpiar la tarea seleccionada después de editar
    } else {
      // Estamos creando una nueva tarea
      const newTaskData = {
         title: title.trim(),
         type,
         subgroup,
         status: 'pending' as const,
         completed: false,
         subtasks,
         scheduledDate: scheduledDate, // No establecer fecha automáticamente
         scheduledTime,
         notes: notes?.trim(),
         tags: isPrimary ? ['principal'] : []
       };
      
      console.log('🆕 Index.tsx: Creando nueva tarea con datos:', newTaskData);
      
      // Usar addTask del store en lugar de updateTasks directamente
      addTask(newTaskData).catch((error) => {
        console.error('❌ Index.tsx: Error al crear tarea:', error);
      });
      
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
    // Filtrar tareas con títulos vacíos o solo espacios en blanco
    if (!task.title || !task.title.trim()) return false;
    
    if (!task.scheduledDate) return true; // Show tasks without date as today's
    return task.scheduledDate <= today;
  });

  // Dividir tareas de hoy en pendientes y completadas (hoy y anteriores)
  const pendingTodaysTasks = todaysTasks.filter(t => !t.completed);
  const completedTodaysTasks = todaysTasks.filter(t => t.completed);
  const completedToday = completedTodaysTasks.filter(t =>
    t.completedDate ? t.completedDate.split('T')[0] === today : false
  );
  const completedBeforeToday = completedTodaysTasks.filter(t =>
    !(t.completedDate && t.completedDate.split('T')[0] === today)
  );

  // Pendientes: separar exactamente hoy (o sin fecha) vs. vencidas
  const pendingTodayExact = pendingTodaysTasks.filter(t => !t.scheduledDate || t.scheduledDate === today);
  const pendingOverdue = pendingTodaysTasks.filter(t => t.scheduledDate && t.scheduledDate < today);

  // Imagen superior configurable desde localStorage
  const [topLeftImage, setTopLeftImage] = useState<string>(() => {
    return localStorage.getItem('stebe-top-left-image') || '/lovable-uploads/te obesrvo.png';
  });
  useEffect(() => {
    const handler = () => setTopLeftImage(localStorage.getItem('stebe-top-left-image') || '/lovable-uploads/te obesrvo.png');
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  useEffect(() => {
    // Si no hay imagen configurada, intentar usar la última subida desde el servidor
    const stored = localStorage.getItem('stebe-top-left-image');
    if (!stored) {
      fetch('/api/images/latest').then(r => r.json()).then(data => {
        if (data?.image) {
          // Preferir original_url sobre path
          const imageUrl = data.image.original_url || data.image.path;
          localStorage.setItem('stebe-top-left-image', imageUrl);
          setTopLeftImage(imageUrl);
        }
      }).catch(() => {});
    }
  }, []);

  return (
          <div className="min-h-screen pb-6 relative bg-steve-gray-light dark:bg-steve-gray-dark font-varela">
      
      {/* Imagen de Steve Jobs en la esquina superior izquierda */}
      <div className="absolute top-3 left-3 z-20">
        <img 
          src={topLeftImage}
          alt="Steve Jobs" 
          className="w-20 h-20"
        />

      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10">
      {/* Header */}
      <StebeHeader />
      
      {viewMode === 'tasks' ? (
        <>
          {/* Lista de Tareas */}
          <div className="pt-1 max-w-sm mx-auto px-3">
            {pendingTodaysTasks.length > 0 ? (
              <>
                {pendingTodayExact.map(task => (
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
                ))}

                {pendingTodayExact.length > 0 && pendingOverdue.length > 0 && (
                  <div className="my-2 border-t dark:border-white/70 border-transparent" />
                )}

                {pendingOverdue.map(task => (
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
                ))}
              </>
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

            {/* Sección de tareas completadas */}
            {(completedToday.length > 0) && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-gray-700" />
                    <h3 className="text-sm font-semibold text-gray-700 font-varela">
                      Tareas completadas
                    </h3>
                    <span className="text-xs text-gray-500">({completedToday.length})</span>
                  </div>
                  {/* Toggle mostrar/ocultar las de hoy */}
                  <button
                    className="flex items-center space-x-1 text-gray-600 hover:text-black text-sm"
                    onClick={() => setShowCompletedToday(prev => !prev)}
                    aria-label={showCompletedToday ? 'Ocultar completadas' : 'Mostrar completadas'}
                  >
                    {showCompletedToday ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{showCompletedToday ? 'Ocultar' : 'Ver'}</span>
                  </button>
                </div>

                {/* Completadas de hoy (toggle) */}
                {completedToday.length > 0 && showCompletedToday && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Hoy</p>
                    {completedToday.map(task => (
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
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Vista de calendario no implementada</p>
        </div>
      )}

      {/* Floating Buttons */}
      <FloatingButtons 
        onAddTask={() => setShowModal(true)}
        onCreateTask={handleAddTask}
      />

      {/* Modal para Agregar/Editar Tarea */}
      <AnimatePresence>
        {showModal && (
          <TaskCreationCard
            onCancel={() => {
              setShowModal(false);
              setSelectedTask(null);
            }}
            onCreate={handleAddTask}
            editingTask={selectedTask}
          />
        )}
      </AnimatePresence>

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
                  exportTasks={() => {
            // Función placeholder para exportar tareas
            console.log('Exportar tareas');
          }}
      />
      </div>
    </div>
  );
};

export default Index;
