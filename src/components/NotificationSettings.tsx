import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Clock, Calendar, Trophy, Volume2, VolumeX, Vibrate } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { pushClient } from '@/services/pushClient';

export const NotificationSettings: React.FC = () => {
  const {
    permission,
    settings,
    updateSettings,
    requestPermission,
    testNotification,
    getNotificationStats,
    showNotification
  } = useNotifications();

  const stats = getNotificationStats();

  const [isWebPushSupported, setIsWebPushSupported] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [webPushStatus, setWebPushStatus] = useState<'idle' | 'active' | 'error'>('idle');
  const [webPushMessage, setWebPushMessage] = useState('');

  useEffect(() => {
    setIsWebPushSupported(pushClient.isSupported());
  }, []);

  const handleToggleSetting = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] });
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      // Show welcome notification
      await testNotification();

      // Si se habilitan permisos, intentar suscribir Web Push
      if (pushClient.isSupported()) {
        handleWebPushSubscription();
      }
    }
  };

  const handleWebPushSubscription = async () => {
    if (!isWebPushSupported) return;

    setIsSubscribing(true);
    setWebPushMessage('');

    try {
      const granted = permission.granted || await requestPermission();
      if (!granted) {
        setWebPushStatus('error');
        setWebPushMessage('Necesitamos permisos de notificación para activar Web Push');
        return;
      }

      const subscribed = await pushClient.ensureWebPushSubscription();
      setWebPushStatus(subscribed ? 'active' : 'error');
      setWebPushMessage(subscribed
        ? 'Suscripción Web Push activa en este navegador'
        : 'No se pudo activar Web Push. Intenta nuevamente.');
    } catch (error) {
      console.error('Error activando Web Push:', error);
      setWebPushStatus('error');
      setWebPushMessage('Ocurrió un error al activar Web Push');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-black rounded-lg shadow-sm border border-gray-300 dark:border-white p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-black dark:text-white" />
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Configuración de Notificaciones
        </h2>
      </div>

      {/* Permission Status */}
      <div className="mb-6 p-4 rounded-lg bg-white dark:bg-black border border-gray-300 dark:border-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {permission.granted ? (
              <Bell className="w-5 h-5 text-black dark:text-white" />
            ) : (
              <BellOff className="w-5 h-5 text-black dark:text-white" />
            )}
            <div>
              <p className="font-medium text-black dark:text-white">
                {permission.granted ? 'Notificaciones Habilitadas' : 'Notificaciones Deshabilitadas'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {permission.granted
                  ? 'Recibirás recordatorios y alertas de tareas'
                  : 'Habilita las notificaciones para recibir recordatorios'
                }
              </p>
            </div>
          </div>
          {!permission.granted && (
            <button
              onClick={handleRequestPermission}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Habilitar
            </button>
          )}
        </div>

        {isWebPushSupported && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-3">
            <div>
              <p className="font-medium text-black dark:text-white">Web Push (PWA)</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recibe notificaciones incluso con la app cerrada tras añadirla al inicio
              </p>
              {webPushMessage && (
                <p className={`text-sm mt-1 ${webPushStatus === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                  {webPushMessage}
                </p>
              )}
            </div>
            <button
              onClick={handleWebPushSubscription}
              disabled={isSubscribing}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-60"
            >
              {isSubscribing ? 'Activando...' : 'Activar Web Push'}
            </button>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-black dark:text-white mb-4">
          Tipos de Notificaciones
        </h3>

        {/* Daily Reminders */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-300 dark:border-white">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Calendar className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-black dark:text-white text-lg">
                Recordatorios Diarios
              </p>
              <p className="text-base text-gray-600 dark:text-gray-400">
                9:00 AM y 6:00 PM
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggleSetting('dailyReminder')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-2 ${settings.dailyReminder ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full transition-transform ${settings.dailyReminder ? 'translate-x-6 bg-white dark:bg-black' : 'translate-x-1 bg-white dark:bg-gray-300'
                }`}
            />
          </button>
        </div>

        {/* Task Reminders */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-300 dark:border-white">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Clock className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-black dark:text-white text-lg">
                Recordatorios de Tareas
              </p>
              <p className="text-base text-gray-600 dark:text-gray-400">
                15 min antes
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggleSetting('taskReminders')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-2 ${settings.taskReminders ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full transition-transform ${settings.taskReminders ? 'translate-x-6 bg-white dark:bg-black' : 'translate-x-1 bg-white dark:bg-gray-300'
                }`}
            />
          </button>
        </div>

        {/* Deadline Alerts */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-300 dark:border-white">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Bell className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-black dark:text-white text-lg">
                Alertas de Fecha Límite
              </p>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Cuando está por vencer
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggleSetting('deadlineAlerts')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-2 ${settings.deadlineAlerts ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full transition-transform ${settings.deadlineAlerts ? 'translate-x-6 bg-white dark:bg-black' : 'translate-x-1 bg-white dark:bg-gray-300'
                }`}
            />
          </button>
        </div>

        {/* Completion Celebration */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-300 dark:border-white">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Trophy className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-black dark:text-white text-lg">
                Celebración de Logros
              </p>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Al completar tareas
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggleSetting('completionCelebration')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-2 ${settings.completionCelebration ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full transition-transform ${settings.completionCelebration ? 'translate-x-6 bg-white dark:bg-black' : 'translate-x-1 bg-white dark:bg-gray-300'
                }`}
            />
          </button>
        </div>
      </div>

      {/* Sound & Vibration Settings */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-medium text-black dark:text-white mb-4">
          Configuración de Audio
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sound */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-300 dark:border-white">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {settings.sound ? (
                <Volume2 className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              )}
              <p className="font-semibold text-black dark:text-white text-lg">Sonido</p>
            </div>
            <button
              onClick={() => handleToggleSetting('sound')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-2 ${settings.sound ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full transition-transform ${settings.sound ? 'translate-x-6 bg-white dark:bg-black' : 'translate-x-1 bg-white dark:bg-gray-300'
                  }`}
              />
            </button>
          </div>

          {/* Vibration */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-300 dark:border-white">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Vibrate className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
              <p className="font-semibold text-black dark:text-white text-lg">Vibración</p>
            </div>
            <button
              onClick={() => handleToggleSetting('vibration')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-2 ${settings.vibration ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full transition-transform ${settings.vibration ? 'translate-x-6 bg-white dark:bg-black' : 'translate-x-1 bg-white dark:bg-gray-300'
                  }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Test Notifications */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-medium text-black dark:text-white mb-4">
          Probar Notificaciones
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Prueba diferentes tipos de notificaciones para ver cómo se ven
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* Basic Test */}
          <button
            onClick={testNotification}
            disabled={!permission.granted}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-black border border-gray-300 dark:border-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            <Bell className="w-5 h-5 text-black dark:text-white" />
            <span className="text-sm font-medium text-black dark:text-white">Prueba Básica</span>
          </button>

          {/* Daily Reminder Test */}
          <button
            onClick={() => {
              if (permission.granted) {
                const now = new Date();
                const greeting = now.getHours() < 12 ? '🌅 Buenos días' :
                  now.getHours() < 18 ? '🌆 Buenas tardes' : '🌙 Buenas noches';

                showNotification(greeting, {
                  body: 'Es hora de revisar tus tareas del día',
                  tag: 'daily-reminder-test',
                });
              }
            }}
            disabled={!permission.granted}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-black border border-gray-300 dark:border-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            <Calendar className="w-5 h-5 text-black dark:text-white" />
            <span className="text-sm font-medium text-black dark:text-white">Recordatorio Diario</span>
          </button>

          {/* Task Reminder Test */}
          <button
            onClick={() => {
              if (permission.granted) {
                showNotification('⏰ Recordatorio de tarea', {
                  body: '"Revisar proyecto" está programada para las 15:30',
                  tag: 'task-reminder-test',
                });
              }
            }}
            disabled={!permission.granted}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-black border border-gray-300 dark:border-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            <Clock className="w-5 h-5 text-black dark:text-white" />
            <span className="text-sm font-medium text-black dark:text-white">Recordatorio Tarea</span>
          </button>

          {/* Completion Celebration Test */}
          <button
            onClick={() => {
              if (permission.granted) {
                const celebrations = [
                  '🎉 ¡Excelente trabajo!',
                  '🌟 ¡Tarea completada!',
                  '💪 ¡Sigue así!',
                  '🏆 ¡Bien hecho!',
                  '✨ ¡Fantástico!',
                ];
                const title = celebrations[Math.floor(Math.random() * celebrations.length)];

                showNotification(title, {
                  body: 'Has completado "Ejemplo de tarea"',
                  tag: 'completion-test',
                });
              }
            }}
            disabled={!permission.granted}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-black border border-gray-300 dark:border-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            <Trophy className="w-5 h-5 text-black dark:text-white" />
            <span className="text-sm font-medium text-black dark:text-white">Celebración</span>
          </button>
        </div>

        {!permission.granted && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Habilita los permisos de notificación para probar las notificaciones
            </p>
          </div>
        )}
      </div>

      {/* Statistics */}
      {permission.granted && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-medium text-black dark:text-white mb-4">
            Estadísticas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-white">
              <p className="text-2xl font-bold text-black dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-white">
              <p className="text-2xl font-bold text-black dark:text-white">{stats.sent}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enviadas</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-white">
              <p className="text-2xl font-bold text-black dark:text-white">{stats.pending}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-white">
              <p className="text-2xl font-bold text-black dark:text-white">{stats.byType.reminder || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recordatorios</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
