import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

// Hook para manejar datos específicos del usuario
export const useUserData = () => {
  const { user } = useAuth();
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [userSettings, setUserSettings] = useState<any>({});

  useEffect(() => {
    if (user) {
      // Cargar tareas del usuario
      const savedTasks = localStorage.getItem(`stebe-tasks-${user.id}`);
      if (savedTasks) {
        setUserTasks(JSON.parse(savedTasks));
      }

      // Cargar configuraciones del usuario
      const savedSettings = localStorage.getItem(`stebe-settings-${user.id}`);
      if (savedSettings) {
        setUserSettings(JSON.parse(savedSettings));
      } else {
        // Configuraciones por defecto
        const defaultSettings = {
          language: 'es',
          notifications: true,
          theme: 'light'
        };
        setUserSettings(defaultSettings);
        localStorage.setItem(`stebe-settings-${user.id}`, JSON.stringify(defaultSettings));
      }
    }
  }, [user]);

  const saveUserTasks = (tasks: any[]) => {
    if (user) {
      setUserTasks(tasks);
      localStorage.setItem(`stebe-tasks-${user.id}`, JSON.stringify(tasks));
    }
  };

  const saveUserSettings = (settings: any) => {
    if (user) {
      setUserSettings(settings);
      localStorage.setItem(`stebe-settings-${user.id}`, JSON.stringify(settings));
    }
  };

  const addUserTask = (task: any) => {
    if (user) {
      const newTasks = [...userTasks, { ...task, userId: user.id, id: Date.now().toString() }];
      saveUserTasks(newTasks);
    }
  };

  const updateUserTask = (taskId: string, updates: any) => {
    if (user) {
      const newTasks = userTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      saveUserTasks(newTasks);
    }
  };

  const deleteUserTask = (taskId: string) => {
    if (user) {
      const newTasks = userTasks.filter(task => task.id !== taskId);
      saveUserTasks(newTasks);
    }
  };

  return {
    userTasks,
    userSettings,
    saveUserTasks,
    saveUserSettings,
    addUserTask,
    updateUserTask,
    deleteUserTask
  };
};
