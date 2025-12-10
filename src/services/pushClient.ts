const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined' && !('ReactNativeWebView' in window);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://v0-steeb-api-backend-production.up.railway.app/api';
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const sendSubscriptionToServer = async (subscription: PushSubscription) => {
  try {
    await fetch(`${API_BASE_URL}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userAgent: navigator.userAgent
      })
    });
  } catch (error) {
    console.error('Error enviando la suscripcion push al backend:', error);
  }
};

const subscribeToPush = async (registration?: ServiceWorkerRegistration): Promise<boolean> => {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID_PUBLIC_KEY no configurado, se omite Web Push');
    return false;
  }

  const swRegistration = registration || await navigator.serviceWorker.ready;
  const serverKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  let subscription = await swRegistration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: serverKey
    });
  }

  await sendSubscriptionToServer(subscription);
  return true;
};

export const pushClient = {
  isSupported(): boolean {
    return Boolean(
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  },

  async ensureWebPushSubscription(): Promise<boolean> {
    if (!isWeb) return false;
    if (!this.isSupported()) {
      console.warn('Push API no soportada en este navegador');
      return false;
    }

    const existingRegistration = await navigator.serviceWorker.getRegistration();
    if (!existingRegistration) {
      console.warn('No hay Service Worker activo para Web Push');
      return false;
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;
    }

    try {
      return await subscribeToPush(existingRegistration);
    } catch (error) {
      console.error('Error asegurando la suscripcion web push:', error);
      return false;
    }
  }
};
