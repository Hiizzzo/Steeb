// Servicio de Notificaciones para STEBE
export class NotificationService {
  private static instance: NotificationService;
  private notificationTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Solicitar permisos de notificación
  async requestPermission(): Promise<boolean> {
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

  // Programar notificación para una tarea
  scheduleTaskReminder(taskId: string, taskTitle: string, scheduledDate: string, scheduledTime?: string) {
    // Limpiar notificación anterior si existe
    this.cancelTaskReminder(taskId);

    if (!scheduledDate) return;

    const now = new Date();
    let reminderTime = new Date(scheduledDate);

    // Si hay hora específica, agregarla
    if (scheduledTime) {
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      reminderTime.setHours(hours, minutes, 0, 0);
    } else {
      // Si no hay hora específica, programar para las 9:00 AM
      reminderTime.setHours(9, 0, 0, 0);
    }

    // Programar notificación 10 minutos antes
    const notificationTime = new Date(reminderTime.getTime() - 10 * 60 * 1000);

    // Solo programar si es en el futuro
    if (notificationTime > now) {
      const timeUntilNotification = notificationTime.getTime() - now.getTime();
      
      const timeout = setTimeout(() => {
        this.sendTaskReminder(taskTitle, reminderTime);
      }, timeUntilNotification);

      this.notificationTimeouts.set(taskId, timeout);
      
      console.log(`🔔 Recordatorio programado para ${taskTitle} a las ${notificationTime.toLocaleTimeString()}`);
    }

    // También programar una notificación para la hora exacta
    if (reminderTime > now) {
      const timeUntilTask = reminderTime.getTime() - now.getTime();
      
      const exactTimeout = setTimeout(() => {
        this.sendTaskDueNotification(taskTitle);
      }, timeUntilTask);

      this.notificationTimeouts.set(`${taskId}-due`, exactTimeout);
    }
  }

  // Cancelar recordatorio de tarea
  cancelTaskReminder(taskId: string) {
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

  // Enviar recordatorio de tarea (10 min antes)
  private sendTaskReminder(taskTitle: string, dueTime: Date) {
    if (Notification.permission === 'granted') {
      const notification = new Notification('STEBE - Recordatorio de Tarea', {
        body: `"${taskTitle}" está programada para las ${dueTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
        icon: '/lovable-uploads/te obesrvo.png',
        badge: '/lovable-uploads/te obesrvo.png',
        tag: 'task-reminder',
        requireInteraction: true,
        actions: [
          {
            action: 'mark-done',
            title: 'Marcar como hecho',
            icon: '/icons/check.png'
          },
          {
            action: 'snooze',
            title: 'Recordar en 10 min',
            icon: '/icons/clock.png'
          }
        ]
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/';
        notification.close();
      };

      // Cerrar automáticamente después de 10 segundos
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
  }

  // Enviar notificación cuando es hora de la tarea
  private sendTaskDueNotification(taskTitle: string) {
    if (Notification.permission === 'granted') {
      const notification = new Notification('STEBE - ¡Es hora!', {
        body: `Es hora de hacer: "${taskTitle}"`,
        icon: '/lovable-uploads/te obesrvo.png',
        badge: '/lovable-uploads/te obesrvo.png',
        tag: 'task-due',
        requireInteraction: true,
        actions: [
          {
            action: 'start-task',
            title: 'Empezar ahora',
            icon: '/icons/play.png'
          },
          {
            action: 'postpone',
            title: 'Posponer 30 min',
            icon: '/icons/clock.png'
          }
        ]
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/';
        notification.close();
      };

      // Vibrar si está disponible (móviles)
      if ('navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      // Cerrar automáticamente después de 15 segundos
      setTimeout(() => {
        notification.close();
      }, 15000);
    }
  }

  // Notificación motivacional diaria
  scheduleDailyMotivation() {
    const now = new Date();
    const motivationTime = new Date();
    motivationTime.setHours(8, 0, 0, 0); // 8:00 AM

    // Si ya pasó la hora de hoy, programar para mañana
    if (motivationTime <= now) {
      motivationTime.setDate(motivationTime.getDate() + 1);
    }

    const timeUntilMotivation = motivationTime.getTime() - now.getTime();

    setTimeout(() => {
      this.sendDailyMotivation();
      // Programar la siguiente para el día siguiente
      this.scheduleDailyMotivation();
    }, timeUntilMotivation);
  }

  private sendDailyMotivation() {
    const motivationalMessages = [
      "¡Buenos días! STEBE aquí. Es momento de hacer que este día cuente.",
      "Nuevo día, nuevas oportunidades. ¿Qué vas a lograr hoy?",
      "La innovación distingue entre un líder y un seguidor. ¡Lidera tu día!",
      "Tu tiempo es limitado, no lo desperdicies. ¡Haz que importe!",
      "La calidad nunca es un accidente. ¡Haz todo con excelencia hoy!"
    ];

    const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    if (Notification.permission === 'granted') {
      const notification = new Notification('STEBE - Motivación Diaria', {
        body: message,
        icon: '/lovable-uploads/te obesrvo.png',
        badge: '/lovable-uploads/te obesrvo.png',
        tag: 'daily-motivation'
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/chat';
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 8000);
    }
  }

  // Notificación de productividad (cada 2 horas durante el día laboral)
  scheduleProductivityReminders() {
    const scheduleNext = () => {
      const now = new Date();
      const nextReminder = new Date();
      
      // Programar para las próximas 2 horas
      nextReminder.setHours(nextReminder.getHours() + 2);
      
      // Solo durante horas laborales (9 AM - 6 PM)
      if (nextReminder.getHours() >= 9 && nextReminder.getHours() <= 18) {
        const timeUntilReminder = nextReminder.getTime() - now.getTime();
        
        setTimeout(() => {
          this.sendProductivityReminder();
          scheduleNext(); // Programar el siguiente
        }, timeUntilReminder);
      } else {
        // Si estamos fuera del horario laboral, programar para las 9 AM del siguiente día laboral
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

  private sendProductivityReminder() {
    const productivityMessages = [
      "¿Cómo vas con tus tareas? STEBE está aquí si necesitas motivación.",
      "Pausa de productividad: ¿Estás enfocado en lo que realmente importa?",
      "Recordatorio: Los detalles hacen la perfección. ¿Cómo van los detalles?",
      "Check-in de STEBE: ¿Estás siendo productivo o solo estás ocupado?",
      "Tiempo de reflexión: ¿Estás más cerca de tus metas que hace 2 horas?"
    ];

    const message = productivityMessages[Math.floor(Math.random() * productivityMessages.length)];

    if (Notification.permission === 'granted') {
      const notification = new Notification('STEBE - Check de Productividad', {
        body: message,
        icon: '/lovable-uploads/te obesrvo.png',
        badge: '/lovable-uploads/te obesrvo.png',
        tag: 'productivity-check',
        actions: [
          {
            action: 'chat',
            title: 'Hablar con STEBE',
            icon: '/icons/chat.png'
          },
          {
            action: 'tasks',
            title: 'Ver tareas',
            icon: '/icons/tasks.png'
          }
        ]
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/chat';
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 6000);
    }
  }

  // Inicializar el servicio
  async initialize() {
    const hasPermission = await this.requestPermission();
    
    if (hasPermission) {
      console.log('🔔 Servicio de notificaciones STEBE inicializado');
      
      // Programar notificaciones recurrentes
      this.scheduleDailyMotivation();
      this.scheduleProductivityReminders();
      
      return true;
    } else {
      console.log('❌ Permisos de notificación no otorgados');
      return false;
    }
  }
}

export const notificationService = NotificationService.getInstance();