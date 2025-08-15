import { useEffect, useCallback, useState } from 'react';

interface ServiceWorkerMessage {
  success: boolean;
  message: string;
  restored?: boolean;
  error?: string;
}

export const useServiceWorkerSync = () => {
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);

  // Register and setup service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('✅ Service Worker registrado:', registration.scope);
          setIsServiceWorkerReady(true);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            console.log('🔄 Nueva versión de la app detectada');
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log('🚀 Nueva versión activada');
                  // Trigger backup before the new version takes over
                  triggerBackup();
                }
              });
            }
          });

          // Handle service worker updates
          if (registration.waiting) {
            console.log('🔄 Service Worker esperando activación');
          }

          if (registration.active) {
            console.log('✅ Service Worker activo');
          }

        } catch (error) {
          console.error('❌ Error al registrar Service Worker:', error);
        }
      };

      registerSW();
    }
  }, [triggerBackup]);

  // Function to send backup request to service worker
  const triggerBackup = useCallback((): Promise<ServiceWorkerMessage> => {
    return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
        reject(new Error('No hay Service Worker controlador activo'));
        return;
      }

      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        const response = event.data as ServiceWorkerMessage;
        if (response.success) {
          setLastBackup(new Date());
          console.log('✅ Backup completado:', response.message);
        } else {
          console.error('❌ Error en backup:', response.message);
        }
        resolve(response);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'BACKUP_DATA' },
        [messageChannel.port2]
      );
    });
  }, []);

  // Function to restore data from service worker
  const triggerRestore = useCallback((): Promise<ServiceWorkerMessage> => {
    return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
        reject(new Error('No hay Service Worker controlador activo'));
        return;
      }

      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        const response = event.data as ServiceWorkerMessage;
        console.log('🔧 Respuesta de restauración:', response);
        resolve(response);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'RESTORE_DATA' },
        [messageChannel.port2]
      );
    });
  }, []);

  // Auto-backup every 10 minutes
  useEffect(() => {
    if (!isServiceWorkerReady) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-backup programado...');
      triggerBackup().catch(error => {
        console.warn('⚠️ Auto-backup falló:', error);
      });
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [isServiceWorkerReady, triggerBackup]);

  // Backup when page becomes hidden (user switches tabs/minimizes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isServiceWorkerReady) {
        console.log('👁️ Página oculta, creando backup...');
        triggerBackup().catch(error => {
          console.warn('⚠️ Backup de visibilidad falló:', error);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isServiceWorkerReady, triggerBackup]);

  // Backup before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isServiceWorkerReady) {
        // Use synchronous backup for page unload
        navigator.serviceWorker.controller?.postMessage({ type: 'BACKUP_DATA' });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isServiceWorkerReady]);

  // Check for app updates periodically
  useEffect(() => {
    if (!isServiceWorkerReady) return;

    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      } catch (error) {
        console.warn('⚠️ Error al verificar actualizaciones:', error);
      }
    };

    // Check for updates every 30 minutes
    const interval = setInterval(checkForUpdates, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isServiceWorkerReady]);

  return {
    isServiceWorkerReady,
    lastBackup,
    triggerBackup,
    triggerRestore
  };
};