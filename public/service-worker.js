
// Enhanced Service Worker for task preservation
const CACHE_NAME = 'stebe-taskmaster-v2';
const DATA_CACHE_NAME = 'stebe-data-v1';

// Archivos que se guardarán en caché
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/manifest.json',
];

// Key localStorage items to preserve
const PRESERVE_KEYS = [
  'stebe-tasks',
  'stebe-tasks-backup',
  'stebe-tasks-version'
];

// Function to backup localStorage to IndexedDB
const backupLocalStorageToIndexedDB = async () => {
  try {
    // Open or create backup database
    const dbRequest = indexedDB.open('StebeBackupDB', 1);
    
    return new Promise((resolve, reject) => {
      dbRequest.onerror = () => reject(dbRequest.error);
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        const transaction = db.transaction(['backups'], 'readwrite');
        const store = transaction.objectStore('backups');
        
        // Backup critical localStorage items
        PRESERVE_KEYS.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            store.put({
              id: key,
              value: value,
              timestamp: new Date().toISOString(),
              source: 'localStorage'
            });
          }
        });
        
        transaction.oncomplete = () => {
          console.log('✅ localStorage respaldado en IndexedDB');
          resolve(true);
        };
        
        transaction.onerror = () => reject(transaction.error);
      };
      
      dbRequest.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('backups')) {
          const store = db.createObjectStore('backups', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  } catch (error) {
    console.error('❌ Error al respaldar localStorage:', error);
  }
};

// Function to restore localStorage from IndexedDB
const restoreLocalStorageFromIndexedDB = async () => {
  try {
    const dbRequest = indexedDB.open('StebeBackupDB', 1);
    
    return new Promise((resolve, reject) => {
      dbRequest.onerror = () => resolve(false); // Fail silently if no backup
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        
        if (!db.objectStoreNames.contains('backups')) {
          resolve(false);
          return;
        }
        
        const transaction = db.transaction(['backups'], 'readonly');
        const store = transaction.objectStore('backups');
        
        let restoredCount = 0;
        
        PRESERVE_KEYS.forEach(key => {
          const request = store.get(key);
          request.onsuccess = () => {
            if (request.result && request.result.value) {
              try {
                localStorage.setItem(key, request.result.value);
                restoredCount++;
                console.log(`✅ Restaurado ${key} desde IndexedDB`);
              } catch (e) {
                console.warn(`⚠️ No se pudo restaurar ${key}:`, e);
              }
            }
          };
        });
        
        transaction.oncomplete = () => {
          console.log(`🔧 Restaurados ${restoredCount} elementos desde backup`);
          resolve(restoredCount > 0);
        };
        
        transaction.onerror = () => resolve(false);
      };
    });
  } catch (error) {
    console.error('❌ Error al restaurar localStorage:', error);
    return false;
  }
};

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalándose...');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('📦 Caché de recursos abierta');
          return cache.addAll(urlsToCache);
        }),
      
      // Backup localStorage before installation
      backupLocalStorageToIndexedDB()
    ])
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activándose...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log('🗑️ Eliminando caché antigua:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Restore localStorage from backup if needed
      restoreLocalStorageFromIndexedDB(),
      
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Enhanced fetch strategy with data preservation
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Don't cache API calls or data requests
  if (url.pathname.includes('/api/') || 
      event.request.method !== 'GET' ||
      url.pathname.includes('localhost')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    // Network first, then cache
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            
            // If no cache, return offline page or default response
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            throw new Error('No network and no cache');
          });
      })
  );
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'BACKUP_DATA') {
    console.log('📡 Recibida solicitud de backup desde la app');
    
    event.waitUntil(
      backupLocalStorageToIndexedDB()
        .then(() => {
          // Send confirmation back to main thread
          event.ports[0].postMessage({
            success: true,
            message: 'Datos respaldados exitosamente'
          });
        })
        .catch((error) => {
          event.ports[0].postMessage({
            success: false,
            message: 'Error al respaldar datos',
            error: error.message
          });
        })
    );
  }
  
  if (event.data && event.data.type === 'RESTORE_DATA') {
    console.log('📡 Recibida solicitud de restauración desde la app');
    
    event.waitUntil(
      restoreLocalStorageFromIndexedDB()
        .then((restored) => {
          event.ports[0].postMessage({
            success: true,
            restored: restored,
            message: restored ? 'Datos restaurados exitosamente' : 'No hay datos para restaurar'
          });
        })
        .catch((error) => {
          event.ports[0].postMessage({
            success: false,
            message: 'Error al restaurar datos',
            error: error.message
          });
        })
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'STEEB';
  const options = {
    body: data.body || 'Tienes una nueva notificacion',
    icon: data.icon || '/lovable-uploads/te obesrvo.png',
    badge: '/favicon.png',
    tag: data.tag || 'steeb-push',
    data: data.data || {},
    renotify: true,
    actions: data.actions || []
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Intentar reutilizar una pestaña ya abierta hacia el destino
      for (const client of clientList) {
        if ('focus' in client) {
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === targetUrl || targetUrl === '/') {
            client.focus();
            return client;
          }
        }
      }

      // Si no existe una ventana adecuada, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});

// Periodic backup (every 5 minutes when active)
let backupInterval;

self.addEventListener('activate', () => {
  // Set up periodic backup
  backupInterval = setInterval(() => {
    backupLocalStorageToIndexedDB();
  }, 5 * 60 * 1000); // 5 minutes
});

// Clean up interval when service worker is terminated
self.addEventListener('beforeunload', () => {
  if (backupInterval) {
    clearInterval(backupInterval);
  }
});
