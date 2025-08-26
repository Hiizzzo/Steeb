import { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra';
  completed: boolean;
  completedDate?: string;
}

export const useDailyTaskReminder = (tasks: Task[]) => {
  const [showReminder, setShowReminder] = useState(false);
  const [yesterdayDate, setYesterdayDate] = useState('');

  useEffect(() => {
    const checkDailyReminder = () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      const todayString = today.toISOString().split('T')[0];
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      // Verificar si ya se mostró el recordatorio hoy
      const lastReminderDate = localStorage.getItem('stebe-last-reminder-date');
      if (lastReminderDate === todayString) {
        return;
      }

      // Verificar si hay tareas que se completaron ayer
      const tasksCompletedYesterday = tasks.filter(task => 
        task.completed && 
        task.completedDate && 
        task.completedDate.startsWith(yesterdayString)
      );

      // Verificar si hay tareas incompletas que podrían haberse completado ayer
      const incompleteTasks = tasks.filter(task => !task.completed);

      // Solo mostrar si hay tareas incompletas y no se completó ninguna ayer
      // (sugiere que el usuario se olvidó de marcar tareas)
      if (incompleteTasks.length > 0 && tasksCompletedYesterday.length === 0) {
        setYesterdayDate(yesterdayString);
        setShowReminder(true);
      }
    };

    // Verificar solo si hay tareas
    if (tasks.length > 0) {
      // Esperar un poco para que la app cargue completamente
      const timer = setTimeout(checkDailyReminder, 2000);
      return () => clearTimeout(timer);
    }
  }, [tasks]);

  const markReminderShown = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('stebe-last-reminder-date', today);
    setShowReminder(false);
  };

  const skipReminder = () => {
    markReminderShown();
  };

  return {
    showReminder,
    yesterdayDate,
    skipReminder,
    markReminderShown
  };
};
