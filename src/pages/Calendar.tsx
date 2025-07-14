import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import StebeHeader from '@/components/StebeHeader';
import CalendarView from '@/components/CalendarView';
import ModalAddTask from '@/components/ModalAddTask';
import TaskDetailModal from '@/components/TaskDetailModal';
import FloatingButtons from '@/components/FloatingButtons';

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

const Calendar = () => {
  const { toast } = useToast();
  const { playTaskCompleteSound } = useSoundEffects();
  
  // Estados para las tareas
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('stebe-tasks');
    if (savedTasks) {
      return JSON.parse(savedTasks);
    }
    return [
      { 
        id: '1', 
        title: 'Design homepage', 
        type: 'work', 
        completed: true,
        scheduledDate: new Date().toISOString().split('T')[0],
        notes: "Usar paleta de colores moderna y asegurar que el diseño sea responsive.",
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
        completed: false,
        scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Mañana
        scheduledTime: '14:00',
        notes: "Revisar el progreso del proyecto y planificar siguiente sprint."
      },
      { 
        id: '3', 
        title: 'Morning meditation', 
        type: 'meditation', 
        completed: false,
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '08:00',
        notes: "10 minutos de meditación mindfulness."
      }
    ];
  });

  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Guardar tareas en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('stebe-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleToggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    
    // Verificar si la tarea tiene subtareas sin completar
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
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === selectedTask.id ? updatedTask : task
        )
      );
      
      toast({
        title: "Tarea actualizada!",
        description: "Los cambios han sido guardados.",
      });
    } else {
      // Crear nueva tarea
      const newTask: Task = {
        id: Date.now().toString(),
        title,
        type,
        completed: false,
        subtasks,
        scheduledDate,
        scheduledTime,
        notes
      };
      
      setTasks(prevTasks => [...prevTasks, newTask]);
      
      toast({
        title: "Tarea agregada!",
        description: "Nueva tarea creada exitosamente.",
      });
    }
    
    setShowModal(false);
    setSelectedTask(null);
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

  return (
    <div className="min-h-screen bg-white pb-32" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <StebeHeader />
      
      {/* Vista del Calendario */}
      <CalendarView
        tasks={tasks}
        onToggleTask={handleToggleTask}
        onToggleSubtask={handleToggleSubtask}
        onAddTask={() => {
          setSelectedTask(null);
          setShowModal(true);
        }}
        onDelete={handleDeleteTask}
        onShowDetail={handleShowDetail}
      />

      {/* Floating Buttons */}
      <FloatingButtons 
        onAddTask={() => {
          setSelectedTask(null);
          setShowModal(true);
        }}
        onShowTasks={() => {}}
        onToggleView={() => {}}
        viewMode="calendar"
      />

      {/* Modal para Agregar/Editar Tarea */}
      <ModalAddTask
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTask(null);
        }}
        onAddTask={handleAddTask}
        editingTask={selectedTask}
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
    </div>
  );
};

export default Calendar;