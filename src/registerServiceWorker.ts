
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Registrar de manera no bloqueante después de que la página cargue
    window.addEventListener('load', async () => {
      try {
        // Usar requestIdleCallback si está disponible para mejor performance
        const registerSW = () => {
          navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
            .then((registration) => {
              console.log('[SW] Service Worker registrado exitosamente:', registration.scope);
              
              // Escuchar actualizaciones del SW
              registration.addEventListener('updatefound', () => {
                console.log('[SW] Nueva versión disponible');
              });
            })
            .catch((error) => {
              console.log('[SW] Error al registrar Service Worker:', error);
            });
        };

        if ('requestIdleCallback' in window) {
          requestIdleCallback(registerSW);
        } else {
          setTimeout(registerSW, 100);
        }
      } catch (error) {
        console.log('[SW] Service Worker no disponible');
      }
    });
  }
};
