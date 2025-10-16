// ============================================================================
// NOTIFICATIONS HOOK
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Task, NotificationSettings } from '@/types';

interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

interface ScheduledNotification {
  id: string;
  taskId: string;
  type: 'reminder' | 'deadline' | 'celebration';
  title: string;
  body: string;
  scheduledTime: Date;
  sent: boolean;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermissionState>({
    granted: false,
    denied: false,
    prompt: false,
  });
  
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notification-settings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      sound: true,
      vibration: true,
      dailyReminder: true,
      taskReminders: true,
      deadlineAlerts: true,
      completionCelebration: true,
    };
  });

  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);

  // Initialize notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission({
        granted: currentPermission === 'granted',
        denied: currentPermission === 'denied',
        prompt: currentPermission === 'default',
      });
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notification-settings', JSON.stringify(settings));
  }, [settings]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (permission.granted) {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      const granted = result === 'granted';
      
      setPermission({
        granted,
        denied: result === 'denied',
        prompt: result === 'default',
      });

      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [permission.granted]);

  // Show immediate notification
  const showNotification = useCallback(async (
    title: string,
    options: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      data?: any;
      vibrate?: number[];
      silent?: boolean;
      actions?: Array<{ action: string; title: string; icon?: string }>;
    } = {}
  ): Promise<boolean> => {
    if (!settings.enabled) {
      return false;
    }

    if (!permission.granted) {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return false;
      }
    }

    try {
      const notifOptions: NotificationOptions = {
        ...(options as NotificationOptions),
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        silent: !settings.sound || options.silent,
      };
      const notification = new Notification(title, notifOptions);

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }, [settings.enabled, settings.vibration, settings.sound, permission.granted, requestPermission]);

  // Schedule a notification for later
  const scheduleNotification = useCallback((
    taskId: string,
    type: 'reminder' | 'deadline' | 'celebration',
    title: string,
    body: string,
    scheduledTime: Date
  ): string => {
    const id = `${taskId}-${type}-${Date.now()}`;
    
    const notification: ScheduledNotification = {
      id,
      taskId,
      type,
      title,
      body,
      scheduledTime,
      sent: false,
    };

    setScheduledNotifications(prev => [...prev, notification]);

    // Schedule the actual notification
    const timeUntilNotification = scheduledTime.getTime() - Date.now();
    
    if (timeUntilNotification > 0) {
      setTimeout(async () => {
        if (settings.enabled && (
          (type === 'reminder' && settings.taskReminders) ||
          (type === 'deadline' && settings.deadlineAlerts) ||
          (type === 'celebration' && settings.completionCelebration)
        )) {
          const success = await showNotification(title, {
            body,
            tag: id,
            data: { taskId, type },
            actions: type === 'reminder' ? [
              { action: 'complete', title: 'Mark Complete' },
              { action: 'snooze', title: 'Snooze 10min' },
            ] : undefined,
          });

          if (success) {
            setScheduledNotifications(prev => 
              prev.map(n => n.id === id ? { ...n, sent: true } : n)
            );
          }
        }
      }, timeUntilNotification);
    }

    return id;
  }, [settings, showNotification]);

  // Cancel a scheduled notification
  const cancelNotification = useCallback((notificationId: string) => {
    setScheduledNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Task-specific notification helpers
  const notifyTaskReminder = useCallback((task: Task, minutesBefore: number = 15) => {
    if (!task.scheduledDate || !task.scheduledTime || task.completed) {
      return null;
    }

    const taskDateTime = new Date(`${task.scheduledDate}T${task.scheduledTime}`);
    const reminderTime = new Date(taskDateTime.getTime() - (minutesBefore * 60 * 1000));

    // Don't schedule if the reminder time has already passed
    if (reminderTime.getTime() <= Date.now()) {
      return null;
    }

    return scheduleNotification(
      task.id,
      'reminder',
      '⏰ Recordatorio de tarea',
      `"${task.title}" está programada para las ${task.scheduledTime}`,
      reminderTime
    );
  }, [scheduleNotification]);

  const notifyTaskDeadline = useCallback((task: Task) => {
    if (!task.scheduledDate || task.completed) {
      return null;
    }

    const deadlineTime = new Date(`${task.scheduledDate}T23:59:59`);
    
    // Don't schedule if the deadline has already passed
    if (deadlineTime.getTime() <= Date.now()) {
      return null;
    }

    return scheduleNotification(
      task.id,
      'deadline',
      '🚨 Fecha límite',
      `"${task.title}" vence hoy`,
      deadlineTime
    );
  }, [scheduleNotification]);

  const notifyTaskCompletion = useCallback(async (task: Task) => {
    if (!settings.completionCelebration) {
      return false;
    }

    const celebrations = [
      '🎉 ¡Excelente trabajo!',
      '🌟 ¡Tarea completada!',
      '💪 ¡Sigue así!',
      '🏆 ¡Bien hecho!',
      '✨ ¡Fantástico!',
    ];

    const title = celebrations[Math.floor(Math.random() * celebrations.length)];
    const body = `Has completado "${task.title}"`;

    return await showNotification(title, {
      body,
      tag: `completion-${task.id}`,
      data: { taskId: task.id, type: 'celebration' },
      vibrate: [100, 50, 100, 50, 100],
    });
  }, [settings.completionCelebration, showNotification]);

  const notifyDailyReminder = useCallback(async () => {
    if (!settings.dailyReminder) {
      return false;
    }

    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Buenos días' : 
                    now.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';

    return await showNotification(`${greeting} 👋`, {
      body: 'Es hora de revisar tus tareas del día',
      tag: 'daily-reminder',
      actions: [
        { action: 'open-app', title: 'Ver tareas' },
        { action: 'dismiss', title: 'Después' },
      ],
    });
  }, [settings.dailyReminder, showNotification]);

  // Schedule daily reminders (morning and afternoon)
  useEffect(() => {
    if (!settings.dailyReminder) return;

    const scheduleDailyReminders = () => {
      const now = new Date();
      
      // Morning reminder (9:00 AM)
      const morningTime = new Date(now);
      morningTime.setHours(9, 0, 0, 0);
      if (now.getHours() >= 9) {
        morningTime.setDate(morningTime.getDate() + 1);
      }

      // Afternoon reminder (6:00 PM)
      const afternoonTime = new Date(now);
      afternoonTime.setHours(18, 0, 0, 0);
      if (now.getHours() >= 18) {
        afternoonTime.setDate(afternoonTime.getDate() + 1);
      }

      // Schedule morning reminder
      const timeUntilMorning = morningTime.getTime() - now.getTime();
      if (timeUntilMorning > 0) {
        setTimeout(() => {
          showNotification('🌅 Buenos días', {
            body: 'Es hora de revisar tus tareas matutinas',
            tag: 'morning-reminder',
            actions: [
              { action: 'open-app', title: 'Ver tareas' },
              { action: 'dismiss', title: 'Después' },
            ],
          });
        }, timeUntilMorning);
      }

      // Schedule afternoon reminder
      const timeUntilAfternoon = afternoonTime.getTime() - now.getTime();
      if (timeUntilAfternoon > 0) {
        setTimeout(() => {
          showNotification('🌆 Buenas tardes', {
            body: 'Momento perfecto para completar tus tareas pendientes',
            tag: 'afternoon-reminder',
            actions: [
              { action: 'open-app', title: 'Ver tareas' },
              { action: 'dismiss', title: 'Después' },
            ],
          });
        }, timeUntilAfternoon);
      }

      // Schedule for next day
      setTimeout(() => {
        scheduleDailyReminders();
      }, 24 * 60 * 60 * 1000); // 24 hours
    };

    scheduleDailyReminders();
  }, [settings.dailyReminder, showNotification]);

  // Batch notification helpers
  const scheduleTaskNotifications = useCallback((task: Task) => {
    const notificationIds: string[] = [];

    // Schedule reminder
    if (settings.taskReminders) {
      const reminderId = notifyTaskReminder(task);
      if (reminderId) notificationIds.push(reminderId);
    }

    // Schedule deadline alert
    if (settings.deadlineAlerts) {
      const deadlineId = notifyTaskDeadline(task);
      if (deadlineId) notificationIds.push(deadlineId);
    }

    return notificationIds;
  }, [settings.taskReminders, settings.deadlineAlerts, notifyTaskReminder, notifyTaskDeadline]);

  const cancelTaskNotifications = useCallback((taskId: string) => {
    const taskNotifications = scheduledNotifications.filter(n => n.taskId === taskId);
    taskNotifications.forEach(n => cancelNotification(n.id));
  }, [scheduledNotifications, cancelNotification]);

  // Update settings
  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Test notification
  const testNotification = useCallback(async () => {
    return await showNotification('🧪 Notificación de prueba', {
      body: 'Si ves esto, las notificaciones están funcionando correctamente',
      tag: 'test-notification',
    });
  }, [showNotification]);

  // Get notification statistics
  const getNotificationStats = useCallback(() => {
    const total = scheduledNotifications.length;
    const sent = scheduledNotifications.filter(n => n.sent).length;
    const pending = total - sent;
    const byType = scheduledNotifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      sent,
      pending,
      byType,
      permission,
      settings,
    };
  }, [scheduledNotifications, permission, settings]);

  return {
    // State
    permission,
    settings,
    scheduledNotifications,

    // Permission management
    requestPermission,

    // Basic notifications
    showNotification,
    scheduleNotification,
    cancelNotification,

    // Task-specific notifications
    notifyTaskReminder,
    notifyTaskDeadline,
    notifyTaskCompletion,
    notifyDailyReminder,

    // Batch operations
    scheduleTaskNotifications,
    cancelTaskNotifications,

    // Settings management
    updateSettings,

    // Utilities
    testNotification,
    getNotificationStats,
  };
};

// ============================================================================
// SERVICE WORKER NOTIFICATIONS (for background notifications)
// ============================================================================

export const registerNotificationServiceWorker = async () => {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/notification-sw.js');
      console.log('Notification Service Worker registered:', registration.scope);

      // Listen for notification actions
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
          const { action, taskId } = event.data.payload;
          
          // Handle notification actions
          switch (action) {
            case 'complete':
              // Trigger task completion
              window.dispatchEvent(new CustomEvent('notification-action-complete', {
                detail: { taskId }
              }));
              break;
            case 'snooze':
              // Snooze for 10 minutes
              window.dispatchEvent(new CustomEvent('notification-action-snooze', {
                detail: { taskId, minutes: 10 }
              }));
              break;
            case 'open-app':
              // Focus the window
              window.focus();
              break;
          }
        }
      });

      return registration;
    } catch (error) {
      console.error('Failed to register notification service worker:', error);
      return null;
    }
  }
  return null;
};