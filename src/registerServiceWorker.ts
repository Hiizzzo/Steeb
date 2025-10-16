
export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;

  if (import.meta.env.PROD) {
    // Solo registrar el Service Worker en producción
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registrado con éxito:', registration.scope);
        })
        .catch((error) => {
          console.log('Error al registrar el Service Worker:', error);
        });
    });
  } else {
    // En desarrollo: desregistrar cualquier SW activo para evitar conflictos con HMR / Firestore
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().then((unregistered) => {
          if (unregistered) {
            console.log('Service Worker desregistrado en desarrollo:', registration.scope);
          }
        });
      });
    });

    // Limpiar caches creados por versiones anteriores del SW en desarrollo
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key.startsWith('stebe-')) {
            caches.delete(key).then((deleted) => {
              if (deleted) {
                console.log('Cache eliminada en desarrollo:', key);
              }
            });
          }
        });
      });
    }
  }
};
