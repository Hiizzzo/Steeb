// ============================================================================
// NOTIFICATIONS HOOK (EXPO) - Web-compatible version
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, NotificationSettings } from '@/types';

// Detectar si estamos en web
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined' && !('ReactNativeWebView' in window);

// Lazy load expo-notifications solo en nativo
let Notifications: any = null;
let SchedulableTriggerInputTypes: any = null;

const loadExpoNotifications = async () => {
  if (!isWeb && !Notifications) {
    try {
      const module = await import('expo-notifications');
      Notifications = module;
      SchedulableTriggerInputTypes = module.SchedulableTriggerInputTypes;

      // Configure notifications handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
          priority: Notifications.AndroidNotificationPriority?.HIGH,
        }),
      });
    } catch (error) {
      console.warn('expo-notifications not available:', error);
    }
  }
};

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
    return {
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
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Initialize notification permission on mount
  useEffect(() => {
    const init = async () => {
      await loadExpoNotifications();
      checkPermission();

      if (!isWeb && Notifications) {
        // Listeners
        notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
          console.log('Notification received:', notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
          console.log('Notification response:', response);
        });
      }
    };

    init();

    return () => {
      if (notificationListener.current?.remove) notificationListener.current.remove();
      if (responseListener.current?.remove) responseListener.current.remove();
    };
  }, []);

  const checkPermission = async () => {
    try {
      if (!isWeb && Notifications) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        setPermission({
          granted: existingStatus === 'granted',
          denied: existingStatus === 'denied',
          prompt: existingStatus === 'undetermined',
        });
      } else if (isWeb && typeof window !== 'undefined' && 'Notification' in window) {
        setPermission({
          granted: window.Notification.permission === 'granted',
          denied: window.Notification.permission === 'denied',
          prompt: window.Notification.permission === 'default',
        });
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!isWeb && Notifications) {
        const { status } = await Notifications.requestPermissionsAsync();
        const granted = status === 'granted';
        setPermission({
          granted,
          denied: status === 'denied',
          prompt: status === 'undetermined',
        });
        return granted;
      } else if (isWeb && typeof window !== 'undefined' && 'Notification' in window) {
        const result = await window.Notification.requestPermission();
        const granted = result === 'granted';
        setPermission({
          granted,
          denied: result === 'denied',
          prompt: result === 'default',
        });
        return granted;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Show immediate notification
  const showNotification = useCallback(async (
    title: string,
    options: {
      body?: string;
      data?: any;
      tag?: string;
    } = {}
  ): Promise<boolean> => {
    if (!settings.enabled) return false;
    if (!permission.granted) {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      if (!isWeb && Notifications) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body: options.body,
            data: { ...options.data, tag: options.tag },
            sound: settings.sound,
            vibrate: settings.vibration ? [0, 250, 250, 250] : undefined,
          },
          trigger: null, // Immediate
        });
      } else if (isWeb && typeof window !== 'undefined' && 'Notification' in window) {
        const notification = new window.Notification(title, {
          body: options.body,
          icon: '/lovable-uploads/te obesrvo.png',
          tag: options.tag,
        });
        setTimeout(() => notification.close(), 8000);
      }
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }, [settings, permission.granted, requestPermission]);

  // Schedule a notification for later
  const scheduleNotification = useCallback(async (
    taskId: string,
    type: 'reminder' | 'deadline' | 'celebration',
    title: string,
    body: string,
    scheduledTime: Date
  ): Promise<string> => {
    const id = `${taskId}-${type}-${Date.now()}`;

    // Validate time
    const timeUntil = scheduledTime.getTime() - Date.now();
    if (timeUntil <= 0) return '';

    if (!settings.enabled) return '';
    if (!permission.granted) {
      const granted = await requestPermission();
      if (!granted) return '';
    }

    try {
      if (!isWeb && Notifications && SchedulableTriggerInputTypes) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { taskId, type, internalId: id },
            sound: settings.sound,
          },
          trigger: {
            type: SchedulableTriggerInputTypes.DATE,
            date: scheduledTime,
          },
        });

        const notification: ScheduledNotification = {
          id: notificationId,
          taskId,
          type,
          title,
          body,
          scheduledTime,
          sent: false,
        };

        setScheduledNotifications(prev => [...prev, notification]);
        return notificationId;
      } else if (isWeb) {
        // Web: use setTimeout for scheduling
        setTimeout(() => {
          if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
            const notification = new window.Notification(title, { body });
            setTimeout(() => notification.close(), 10000);
          }
        }, timeUntil);
        return id;
      }
      return '';
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return '';
    }
  }, [settings, permission.granted, requestPermission]);

  // Cancel a scheduled notification
  const cancelNotification = useCallback(async (notificationId: string) => {
    try {
      if (!isWeb && Notifications) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }
      setScheduledNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }, []);

  // Task-specific notification helpers
  const notifyTaskReminder = useCallback(async (task: Task, minutesBefore: number = 15) => {
    if (!task.scheduledDate || !task.scheduledTime || task.completed) return null;
    if (!settings.taskReminders) return null;

    const taskDateTime = new Date(`${task.scheduledDate}T${task.scheduledTime}`);
    const reminderTime = new Date(taskDateTime.getTime() - (minutesBefore * 60 * 1000));

    if (reminderTime.getTime() <= Date.now()) return null;

    return await scheduleNotification(
      task.id,
      'reminder',
      '⏰ Recordatorio de tarea',
      `"${task.title}" está programada para las ${task.scheduledTime}`,
      reminderTime
    );
  }, [scheduleNotification, settings.taskReminders]);

  const notifyTaskDeadline = useCallback(async (task: Task) => {
    if (!task.scheduledDate || task.completed) return null;
    if (!settings.deadlineAlerts) return null;

    const alertTime = new Date(`${task.scheduledDate}T10:00:00`);

    if (alertTime.getTime() <= Date.now()) return null;

    return await scheduleNotification(
      task.id,
      'deadline',
      '🚨 Fecha límite hoy',
      `"${task.title}" vence hoy`,
      alertTime
    );
  }, [scheduleNotification, settings.deadlineAlerts]);

  const notifyTaskCompletion = useCallback(async (task: Task) => {
    if (!settings.completionCelebration) return false;

    const celebrations = [
      '🎉 ¡Excelente trabajo!',
      '🌟 ¡Tarea completada!',
      '💪 ¡Sigue así!',
      '🏆 ¡Bien hecho!',
    ];
    const title = celebrations[Math.floor(Math.random() * celebrations.length)];
    const body = `Has completado "${task.title}"`;

    return await showNotification(title, { body });
  }, [settings.completionCelebration, showNotification]);

  const notifyDailyReminder = useCallback(async () => {
    if (!settings.dailyReminder) return false;
    return await showNotification('📅 Resumen Diario', {
      body: 'Recuerda revisar tus tareas pendientes para hoy.',
    });
  }, [settings.dailyReminder, showNotification]);

  // Update settings
  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Test notification
  const testNotification = useCallback(async () => {
    return await showNotification('🧪 Notificación de prueba', {
      body: 'Si ves esto, las notificaciones están funcionando correctamente',
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
    permission,
    settings,
    scheduledNotifications,
    requestPermission,
    showNotification,
    scheduleNotification,
    cancelNotification,
    notifyTaskReminder,
    notifyTaskDeadline,
    notifyTaskCompletion,
    notifyDailyReminder,
    updateSettings,
    testNotification,
    getNotificationStats,
  };
};

export const registerNotificationServiceWorker = async () => {
  return null;
};