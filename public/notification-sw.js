// ============================================================================
// NOTIFICATION SERVICE WORKER
// ============================================================================

const NOTIFICATION_CACHE = 'stebe-notifications-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('📱 Notification Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('📱 Notification Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Listen for notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const { action, data } = event;
  const { taskId, type } = event.notification.data || {};
  
  // Handle notification actions
  if (action === 'complete' && taskId) {
    // Send message to main app to complete task
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            payload: { action: 'complete', taskId }
          });
        });
      })
    );
  } else if (action === 'snooze' && taskId) {
    // Schedule snooze (10 minutes later)
    const snoozeTime = Date.now() + (10 * 60 * 1000);
    
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            payload: { action: 'snooze', taskId, snoozeTime }
          });
        });
      })
    );
  } else if (action === 'open-app' || !action) {
    // Open or focus the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Listen for notification close
self.addEventListener('notificationclose', (event) => {
  console.log('🔔 Notification closed:', event.notification.tag);
  
  // Track notification dismissal
  const { taskId, type } = event.notification.data || {};
  
  if (taskId) {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NOTIFICATION_DISMISSED',
            payload: { taskId, type }
          });
        });
      })
    );
  }
});

// Listen for background sync (for offline notifications)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

// Listen for push notifications (future implementation)
self.addEventListener('push', (event) => {
  console.log('📨 Push notification received:', event.data?.text());
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nueva notificación de Stebe',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'stebe-notification',
      data: data.data || {},
      actions: data.actions || [],
      vibrate: [200, 100, 200],
      requireInteraction: data.requireInteraction || false,
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Stebe Calendar', options)
    );
  }
});

// Helper function to sync notifications
async function syncNotifications() {
  try {
    // Get pending notifications from IndexedDB
    const db = await openNotificationDB();
    const transaction = db.transaction(['pending-notifications'], 'readonly');
    const store = transaction.objectStore('pending-notifications');
    const pendingNotifications = await getAll(store);
    
    const now = Date.now();
    
    for (const notification of pendingNotifications) {
      if (notification.scheduledTime <= now) {
        // Show the notification
        await self.registration.showNotification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: notification.tag,
          data: notification.data,
          actions: notification.actions,
          vibrate: [200, 100, 200],
        });
        
        // Remove from pending notifications
        const deleteTransaction = db.transaction(['pending-notifications'], 'readwrite');
        const deleteStore = deleteTransaction.objectStore('pending-notifications');
        await deleteStore.delete(notification.id);
      }
    }
  } catch (error) {
    console.error('❌ Error syncing notifications:', error);
  }
}

// Helper function to open notification database
function openNotificationDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('StebeNotificationsDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending-notifications')) {
        const store = db.createObjectStore('pending-notifications', { keyPath: 'id' });
        store.createIndex('scheduledTime', 'scheduledTime', { unique: false });
      }
    };
  });
}

// Helper function to get all records from a store
function getAll(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Listen for messages from main app
self.addEventListener('message', (event) => {
  console.log('📝 Message received in notification SW:', event.data);
  
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { notification } = event.data.payload;
    
    // Store notification in IndexedDB for background sync
    event.waitUntil(scheduleNotification(notification));
  }
});

// Helper function to schedule a notification
async function scheduleNotification(notification) {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['pending-notifications'], 'readwrite');
    const store = transaction.objectStore('pending-notifications');
    
    await store.add({
      id: notification.id || `notif-${Date.now()}`,
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      tag: notification.tag,
      data: notification.data,
      actions: notification.actions,
      scheduledTime: notification.scheduledTime,
      createdAt: Date.now(),
    });
    
    // Register background sync
    if ('serviceWorker' in self && 'sync' in self.registration) {
      await self.registration.sync.register('notification-sync');
    }
    
    console.log('✅ Notification scheduled successfully');
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
  }
}

// Periodic sync for checking notifications (if supported)
if ('serviceWorker' in self && 'sync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'notification-check') {
      event.waitUntil(syncNotifications());
    }
  });
}

// Clean up old notifications periodically
setInterval(() => {
  if ('serviceWorker' in self) {
    self.registration.getNotifications().then(notifications => {
      notifications.forEach(notification => {
        // Close notifications older than 1 hour
        const notificationTime = new Date(notification.timestamp || 0);
        const hourAgo = Date.now() - (60 * 60 * 1000);
        
        if (notificationTime.getTime() < hourAgo) {
          notification.close();
        }
      });
    });
  }
}, 10 * 60 * 1000); // Check every 10 minutes