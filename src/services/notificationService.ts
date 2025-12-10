// ============================================================================
// SERVICIO DE NOTIFICACIONES UNIFICADO PARA STEEB
// Funciona en Web, Android e iOS
// ============================================================================

// Detectar si estamos en entorno web
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined' && !('ReactNativeWebView' in window);

// Configuracion de motivacion diaria
const DAILY_MOTIVATION_HOUR = 10;
const DAILY_MOTIVATION_MINUTE = 0;
const LAST_DAILY_MOTIVATION_KEY = 'steeb-last-daily-motivation';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Solo importar expo-notifications en entorno nativo (se hace dinámicamente)
let ExpoNotifications: any = null;
let SchedulableTriggerInputTypes: any = null;

// Inicialización diferida para evitar errores en web
const initExpoNotifications = async () => {
  if (!isWeb && !ExpoNotifications) {
    try {
      const module = await import('expo-notifications');
      ExpoNotifications = module;
      SchedulableTriggerInputTypes = module.SchedulableTriggerInputTypes;

      // Configurar handler de notificaciones para Expo (nativo)
      ExpoNotifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
          priority: ExpoNotifications.AndroidNotificationPriority?.HIGH,
        }),
      });
    } catch (error) {
      console.warn('expo-notifications not available:', error);
    }
  }
};

export class NotificationService {
  private static instance: NotificationService;
  private notificationTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private scheduledNotificationIds: Map<string, string> = new Map();
  private initialized = false;
  private notificationSWRegistration: ServiceWorkerRegistration | null = null;

  private constructor() { }

  private getTodayKey(): string {
    return new Date().toDateString();
  }

  private hasSentDailyMotivationToday(): boolean {
    if (!isWeb || typeof localStorage === 'undefined') return false;
    try {
      return localStorage.getItem(LAST_DAILY_MOTIVATION_KEY) === this.getTodayKey();
    } catch {
      return false;
    }
  }

  private markDailyMotivationSent() {
    if (!isWeb || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(LAST_DAILY_MOTIVATION_KEY, this.getTodayKey());
    } catch {
      // Ignore storage errors to avoid breaking notification flow
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ============================================================================
  // SOLICITAR PERMISOS
  // ============================================================================
  async requestPermission(): Promise<boolean> {
    if (!isWeb) {
      await initExpoNotifications();
      if (!ExpoNotifications) return false;

      try {
        const { status } = await ExpoNotifications.requestPermissionsAsync();
        return status === 'granted';
      } catch (error) {
        console.error('Error requesting native notification permission:', error);
        return false;
      }
    } else {
      // Web
      if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission === 'denied') {
        console.log('Notificaciones denegadas por el usuario');
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  }

  // =============================================================================
  // REGISTRAR SERVICE WORKER DE NOTIFICACIONES (WEB)
  // =============================================================================
  private async ensureNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!isWeb || !('serviceWorker' in navigator)) return null;

    if (this.notificationSWRegistration) return this.notificationSWRegistration;

    try {
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      const existing = existingRegistrations.find((registration) =>
        registration.active?.scriptURL.includes('notification-sw.js') ||
        registration.installing?.scriptURL.includes('notification-sw.js') ||
        registration.waiting?.scriptURL.includes('notification-sw.js')
      );

      if (existing) {
        this.notificationSWRegistration = existing;
        return existing;
      }

      const registration = await navigator.serviceWorker.register('/notification-sw.js', { scope: '/' });
      this.notificationSWRegistration = registration;
      console.log('📱 Notification Service Worker registrado');
      return registration;
    } catch (error) {
      console.error('Error registrando el Notification Service Worker:', error);
      return null;
    }
  }

  // ============================================================================
  // VERIFICAR PERMISOS
  // ============================================================================
  async checkPermission(): Promise<boolean> {
    if (!isWeb) {
      await initExpoNotifications();
      if (!ExpoNotifications) return false;

      try {
        const { status } = await ExpoNotifications.getPermissionsAsync();
        return status === 'granted';
      } catch (error) {
        return false;
      }
    } else {
      if (!('Notification' in window)) return false;
      return Notification.permission === 'granted';
    }
  }

  // ============================================================================
  // PROGRAMAR RECORDATORIO DE TAREA
  // ============================================================================
  scheduleTaskReminder(taskId: string, taskTitle: string, scheduledDate?: string, scheduledTime?: string) {
    this.cancelTaskReminder(taskId);

    // Permitir programar recordatorios aun cuando solo se proporciona la hora.
    const now = new Date();
    let reminderTime = scheduledDate ? new Date(scheduledDate) : new Date();
    reminderTime.setHours(0, 0, 0, 0);

    if (scheduledTime) {
      const timeMatch = scheduledTime.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);

      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2] || '0', 10);
        const meridiem = timeMatch[3];

        if (meridiem === 'pm' && hours < 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;

        reminderTime.setHours(hours, minutes, 0, 0);
      } else {
        reminderTime.setHours(9, 0, 0, 0);
      }
    } else {
      reminderTime.setHours(9, 0, 0, 0);
    }

    // Si la hora ya pasó hoy, moverla al día siguiente para evitar programar en el pasado.
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const notificationTime = new Date(reminderTime.getTime() - 10 * 60 * 1000);

    if (notificationTime > now) {
      if (!isWeb) {
        this.scheduleNativeReminder(taskId, taskTitle, reminderTime, notificationTime);
      } else {
        this.scheduleWebReminder(taskId, taskTitle, reminderTime, notificationTime);
      }
    }

    if (reminderTime > now) {
      if (!isWeb) {
        this.scheduleNativeDueNotification(taskId, taskTitle, reminderTime);
      } else {
        this.scheduleWebDueNotification(taskId, taskTitle, reminderTime);
      }
    }
  }

  // ============================================================================
  // NOTIFICACIONES NATIVAS (ANDROID/iOS)
  // ============================================================================
  private async scheduleNativeReminder(
    taskId: string,
    taskTitle: string,
    dueTime: Date,
    notificationTime: Date
  ) {
    await initExpoNotifications();
    if (!ExpoNotifications || !SchedulableTriggerInputTypes) return;

    try {
      const notificationId = await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title: 'STEEB - Recordatorio de Tarea',
          body: `"${taskTitle}" está programada para las ${dueTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
          data: { taskId, type: 'reminder' },
          sound: true,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: notificationTime,
        },
      });
      this.scheduledNotificationIds.set(taskId, notificationId);
      console.log(`🔔 [Nativo] Recordatorio programado para ${taskTitle}`);
    } catch (error) {
      console.error('Error scheduling native reminder:', error);
    }
  }

  private async scheduleNativeDueNotification(taskId: string, taskTitle: string, dueTime: Date) {
    await initExpoNotifications();
    if (!ExpoNotifications || !SchedulableTriggerInputTypes) return;

    try {
      const notificationId = await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title: 'STEEB - ¡Es hora!',
          body: `Es hora de hacer: "${taskTitle}"`,
          data: { taskId, type: 'due' },
          sound: true,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: dueTime,
        },
      });
      this.scheduledNotificationIds.set(`${taskId}-due`, notificationId);
    } catch (error) {
      console.error('Error scheduling native due notification:', error);
    }
  }

  // ============================================================================
  // NOTIFICACIONES WEB
  // ============================================================================
  private scheduleWebReminder(
    taskId: string,
    taskTitle: string,
    dueTime: Date,
    notificationTime: Date
  ) {
    const now = new Date();
    const timeUntilNotification = notificationTime.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      this.sendWebReminder(taskTitle, dueTime);
    }, timeUntilNotification);

    this.notificationTimeouts.set(taskId, timeout);
    console.log(`🔔 [Web] Recordatorio programado para ${taskTitle} a las ${notificationTime.toLocaleTimeString()}`);
  }

  private scheduleWebDueNotification(taskId: string, taskTitle: string, dueTime: Date) {
    const now = new Date();
    const timeUntilTask = dueTime.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      this.sendWebDueNotification(taskTitle);
    }, timeUntilTask);

    this.notificationTimeouts.set(`${taskId}-due`, timeout);
  }

  private sendWebReminder(taskTitle: string, dueTime: Date) {
    if (Notification.permission === 'granted') {
      const notification = new Notification('STEEB - Recordatorio de Tarea', {
        body: `"${taskTitle}" está programada para las ${dueTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
        icon: '/lovable-uploads/te obesrvo.png',
        badge: '/lovable-uploads/te obesrvo.png',
        tag: 'task-reminder',
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/';
        notification.close();
      };

      setTimeout(() => notification.close(), 10000);
    }
  }

  private sendWebDueNotification(taskTitle: string) {
    if (Notification.permission === 'granted') {
      const notification = new Notification('STEEB - ¡Es hora!', {
        body: `Es hora de hacer: "${taskTitle}"`,
        icon: '/lovable-uploads/te obesrvo.png',
        badge: '/lovable-uploads/te obesrvo.png',
        tag: 'task-due',
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/';
        notification.close();
      };

      if ('navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      setTimeout(() => notification.close(), 15000);
    }
  }

  // ============================================================================
  // CANCELAR RECORDATORIOS
  // ============================================================================
  async cancelTaskReminder(taskId: string) {
    if (!isWeb && ExpoNotifications) {
      const notificationId = this.scheduledNotificationIds.get(taskId);
      if (notificationId) {
        await ExpoNotifications.cancelScheduledNotificationAsync(notificationId);
        this.scheduledNotificationIds.delete(taskId);
      }
      const dueNotificationId = this.scheduledNotificationIds.get(`${taskId}-due`);
      if (dueNotificationId) {
        await ExpoNotifications.cancelScheduledNotificationAsync(dueNotificationId);
        this.scheduledNotificationIds.delete(`${taskId}-due`);
      }
    } else {
      const timeout = this.notificationTimeouts.get(taskId);
      if (timeout) {
        clearTimeout(timeout);
        this.notificationTimeouts.delete(taskId);
      }
      const dueTimeout = this.notificationTimeouts.get(`${taskId}-due`);
      if (dueTimeout) {
        clearTimeout(dueTimeout);
        this.notificationTimeouts.delete(`${taskId}-due`);
      }
    }
  }

  // ============================================================================
  // PROGRAMAR BATCH DE RECORDATORIOS
  // ============================================================================
  scheduleBatchReminders(tasks: Array<{ id: string; title: string; scheduledDate?: string; scheduledTime?: string }>) {
    tasks.forEach(t => {
      if (t.scheduledDate) {
        this.scheduleTaskReminder(t.id, t.title, t.scheduledDate, t.scheduledTime);
      }
    });
  }

  // ============================================================================
  // NOTIFICACIONES DIARIAS
  // ============================================================================
  async scheduleDailyMotivation() {
    const now = new Date();
    const motivationTime = new Date();
    motivationTime.setHours(DAILY_MOTIVATION_HOUR, DAILY_MOTIVATION_MINUTE, 0, 0);
    const alreadySentToday = this.hasSentDailyMotivationToday();

    if (isWeb && !alreadySentToday && now >= motivationTime) {
      await this.sendDailyMotivation();
    }

    if (motivationTime <= now) {
      motivationTime.setTime(motivationTime.getTime() + DAY_IN_MS);
    }

    const timeUntilMotivation = motivationTime.getTime() - now.getTime();

    if (!isWeb) {
      await initExpoNotifications();
      if (!ExpoNotifications || !SchedulableTriggerInputTypes) return;

      try {
        await ExpoNotifications.scheduleNotificationAsync({
          content: {
            title: 'STEEB - Buenos dias',
            body: 'Es momento de hacer que este dia cuente! Revisa tus tareas.',
            data: { type: 'daily-motivation' },
            sound: true,
          },
          trigger: {
            type: SchedulableTriggerInputTypes.DAILY,
            hour: DAILY_MOTIVATION_HOUR,
            minute: DAILY_MOTIVATION_MINUTE,
          },
        });
        console.log('Motivacion diaria programada (nativo)');
      } catch (error) {
        console.error('Error scheduling daily motivation:', error);
      }
    } else {
      setTimeout(async () => {
        await this.sendDailyMotivation();
        this.scheduleDailyMotivation();
      }, timeUntilMotivation);
    }
  }

  private async sendDailyMotivation(): Promise<boolean> {
    const motivationalMessages = [
      'Buenos dias! STEEB aqui. Es momento de hacer que este dia cuente.',
      'Nuevo dia, nuevas oportunidades. Que vas a lograr hoy?',
      'La innovacion distingue entre un lider y un seguidor. Lidera tu dia!',
      'Tu tiempo es limitado, no lo desperdicies. Haz que importe!',
      'La calidad nunca es un accidente. Haz todo con excelencia hoy!'
    ];

    const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    let delivered = false;

    if (!isWeb && ExpoNotifications) {
      await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title: 'STEEB - Motivacion Diaria',
          body: message,
          sound: true,
        },
        trigger: null,
      });
      delivered = true;
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const notification = new Notification('STEEB - Motivacion Diaria', {
        body: message,
        icon: '/lovable-uploads/te obesrvo.png',
        tag: 'daily-motivation'
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/';
        notification.close();
      };

      setTimeout(() => notification.close(), 8000);
      delivered = true;
    }

    if (delivered) {
      this.markDailyMotivationSent();
    }

    return delivered;
  }

  // ============================================================================
  // RECORDATORIOS DE PRODUCTIVIDAD
  // ============================================================================
  async scheduleProductivityReminders() {
    if (!isWeb) {
      await initExpoNotifications();
      if (!ExpoNotifications || !SchedulableTriggerInputTypes) return;

      const hours = [10, 12, 14, 16];
      for (const hour of hours) {
        try {
          await ExpoNotifications.scheduleNotificationAsync({
            content: {
              title: 'STEEB - Check de Productividad',
              body: '¿Cómo vas con tus tareas? STEEB está aquí si necesitas motivación.',
              data: { type: 'productivity-check' },
            },
            trigger: {
              type: SchedulableTriggerInputTypes.DAILY,
              hour,
              minute: 0,
            },
          });
        } catch (error) {
          console.error(`Error scheduling productivity reminder for ${hour}:00:`, error);
        }
      }
    } else {
      const scheduleNext = () => {
        const now = new Date();
        const nextReminder = new Date();
        nextReminder.setHours(nextReminder.getHours() + 2);

        if (nextReminder.getHours() >= 9 && nextReminder.getHours() <= 18) {
          const timeUntilReminder = nextReminder.getTime() - now.getTime();

          setTimeout(() => {
            this.sendProductivityReminder();
            scheduleNext();
          }, timeUntilReminder);
        } else {
          nextReminder.setDate(nextReminder.getDate() + 1);
          nextReminder.setHours(9, 0, 0, 0);

          const timeUntilReminder = nextReminder.getTime() - now.getTime();
          setTimeout(() => {
            this.sendProductivityReminder();
            scheduleNext();
          }, timeUntilReminder);
        }
      };

      scheduleNext();
    }
  }

  private sendProductivityReminder() {
    const productivityMessages = [
      "¿Cómo vas con tus tareas? STEEB está aquí si necesitas motivación.",
      "Pausa de productividad: ¿Estás enfocado en lo que realmente importa?",
      "Recordatorio: Los detalles hacen la perfección. ¿Cómo van los detalles?",
      "Check-in de STEEB: ¿Estás siendo productivo o solo estás ocupado?",
      "Tiempo de reflexión: ¿Estás más cerca de tus metas que hace 2 horas?"
    ];

    const message = productivityMessages[Math.floor(Math.random() * productivityMessages.length)];

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const notification = new Notification('STEEB - Check de Productividad', {
        body: message,
        icon: '/lovable-uploads/te obesrvo.png',
        tag: 'productivity-check',
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/';
        notification.close();
      };

      setTimeout(() => notification.close(), 6000);
    }
  }

  // ============================================================================
  // ENVIAR NOTIFICACIÓN INMEDIATA
  // ============================================================================
  async sendImmediateNotification(title: string, body: string, tag?: string): Promise<boolean> {
    const hasPermission = await this.checkPermission();
    if (!hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    if (!isWeb && ExpoNotifications) {
      try {
        await ExpoNotifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { tag },
            sound: true,
          },
          trigger: null,
        });
        return true;
      } catch (error) {
        console.error('Error sending immediate native notification:', error);
        return false;
      }
    } else {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/lovable-uploads/te obesrvo.png',
          tag: tag || 'steeb-notification',
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        setTimeout(() => notification.close(), 8000);
        return true;
      } catch (error) {
        console.error('Error sending web notification:', error);
        return false;
      }
    }
  }

  // ============================================================================
  // INICIALIZAR SERVICIO
  // ============================================================================
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    const hasPermission = await this.requestPermission();

    if (hasPermission) {
      if (isWeb) {
        await this.ensureNotificationServiceWorker();
      }

      console.log('🔔 Servicio de notificaciones STEEB inicializado', isWeb ? '(Web)' : '(Nativo)');

      await this.scheduleDailyMotivation();
      await this.scheduleProductivityReminders();

      if (isWeb) {
        import('./pushClient').then(({ pushClient }) => {
          pushClient.ensureWebPushSubscription().catch((error) => {
            console.error('Error activando Web Push:', error);
          });
        }).catch((error) => {
          console.error('Error cargando pushClient:', error);
        });
      }

      this.initialized = true;
      return true;
    } else {
      console.log('❌ Permisos de notificación no otorgados');
      return false;
    }
  }
}

export const notificationService = NotificationService.getInstance();
