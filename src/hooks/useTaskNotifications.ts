import { useEffect } from 'react';
import { notificationService } from '@/services/notificationService';

interface Task {
  id: string;
  title: string;
  scheduledDate?: string;
  scheduledTime?: string;
  completed: boolean;
}

export const useTaskNotifications = (tasks: Task[]) => {
  useEffect(() => {
    // Programar notificaciones para todas las tareas activas
    tasks.forEach(task => {
      if (!task.completed && task.scheduledDate) {
        notificationService.scheduleTaskReminder(
          task.id,
          task.title,
          task.scheduledDate,
          task.scheduledTime
        );
      } else if (task.completed) {
        // Cancelar notificaciones de tareas completadas
        notificationService.cancelTaskReminder(task.id);
      }
    });

    // Cleanup: cancelar notificaciones cuando el componente se desmonta
    return () => {
      tasks.forEach(task => {
        notificationService.cancelTaskReminder(task.id);
      });
    };
  }, [tasks]);

  // Función para programar notificación de una tarea específica
  const scheduleTaskNotification = (task: Task) => {
    if (!task.completed && task.scheduledDate) {
      notificationService.scheduleTaskReminder(
        task.id,
        task.title,
        task.scheduledDate,
        task.scheduledTime
      );
    }
  };

  // Función para cancelar notificación de una tarea específica
  const cancelTaskNotification = (taskId: string) => {
    notificationService.cancelTaskReminder(taskId);
  };

  return {
    scheduleTaskNotification,
    cancelTaskNotification
  };
};