import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import iPhoneCalendar from '@/components/iPhoneCalendar';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTaskPersistence } from '@/hooks/useTaskPersistence';

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

const MonthlyCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playTaskCompleteSound } = useSoundEffects();
  
  // Usar el hook de persistencia mejorado
  const { 
    tasks, 
    updateTasks, 
    isLoading: isPersistenceLoading 
  } = useTaskPersistence();

  const handleToggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    
    // Si la tarea tiene subtareas y no están todas completadas, no permitir completar la tarea principal
    if (task && task.subtasks && task.subtasks.length > 0 && !task.completed) {
      const allSubtasksCompleted = task.subtasks.every(subtask => subtask.completed);
      if (!allSubtasksCompleted) {
        toast({
          title: "Completa las subtareas primero",
          description: "Necesitas completar todas las subtareas antes de completar la tarea principal.",
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
    
    // Solo reproducir sonido y mostrar toast cuando se completa (no cuando se desmarca)
    if (task && !task.completed) {
      playTaskCompleteSound();
      toast({
        title: "¡Tarea completada!",
        description: "¡Excelente trabajo! Has completado una tarea.",
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

    // Verificar si se completó la última subtarea para reproducir sonido
    const task = tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
      const subtask = task.subtasks.find(s => s.id === subtaskId);
      const otherSubtasks = task.subtasks.filter(s => s.id !== subtaskId);
      const allOthersCompleted = otherSubtasks.every(s => s.completed);
      
      if (subtask && !subtask.completed && allOthersCompleted) {
        playTaskCompleteSound();
        toast({
          title: "¡Tarea completada!",
          description: "¡Excelente trabajo! Has completado todas las subtareas.",
        });
      }
    }
  };

  const handleAddTask = (date?: string) => {
    // Si se proporciona una fecha específica, guardarla para el modal
    if (date) {
      localStorage.setItem('stebe-selected-date', date);
    }
    // Guardar preferencia para mostrar modal de agregar tarea
    localStorage.setItem('stebe-view-mode', 'tasks');
    navigate('/');
  };

  const handleDateSelect = (date: string) => {
    // Guardar la fecha seleccionada para posibles usos futuros
    localStorage.setItem('stebe-selected-calendar-date', date);
  };

  const handleShowTaskDetail = (taskId: string) => {
    // Guardar el ID de la tarea para mostrar detalles
    localStorage.setItem('stebe-selected-task', taskId);
    navigate('/');
  };

  return (
    <div className="relative">
      {/* Botón de regreso - Solo visible en desktop */}
      <motion.button
        onClick={() => navigate('/')}
        className="hidden md:flex absolute top-4 left-4 z-30 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg items-center justify-center hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
      </motion.button>
      
      {/* Nuevo calendario estilo iPhone */}
      <iPhoneCalendar 
        tasks={tasks}
        onToggleTask={handleToggleTask}
        onToggleSubtask={handleToggleSubtask}
        onAddTask={handleAddTask}
        onShowTaskDetail={handleShowTaskDetail}
        onDateSelect={handleDateSelect}
        enableMultipleSelection={false}
      />
    </div>
  );
};

export default MonthlyCalendarPage; 