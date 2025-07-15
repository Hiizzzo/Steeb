
// Nombre de la caché con versioning automático
const CACHE_NAME = 'steve-app-v2024-' + self.registration.scope.replace(/[^a-zA-Z0-9]/g, '');
const STATIC_CACHE = CACHE_NAME + '-static';
const DYNAMIC_CACHE = CACHE_NAME + '-dynamic';

// Archivos críticos para cache inmediato (solo lo esencial)
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Archivos para cache en runtime
const RUNTIME_CACHE_PATTERNS = [
  /.*\.(?:js|css|woff2|woff|ttf)$/,
  /.*api\.*/,
];

// Instalación optimizada del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando service worker optimizado...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Cacheando assets críticos');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        // Skip waiting para activación inmediata
        return self.skipWaiting();
      })
  );
});

// Activación con limpieza de cachés antiguos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control inmediato de todas las páginas
      return self.clients.claim();
    })
  );
});

// Estrategia de fetch optimizada
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Solo cachear requests HTTP/HTTPS
  if (!request.url.startsWith('http')) return;
  
  // Estrategia Cache First para assets estáticos
  if (RUNTIME_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request).then((fetchResponse) => {
            // Solo cachear respuestas exitosas
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return fetchResponse;
          });
        })
        .catch(() => {
          // Fallback offline básico
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        })
    );
  }
  // Network First para todo lo demás (API calls, etc.)
  else {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(request);
        })
    );
  }
});
