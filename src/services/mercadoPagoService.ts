// Servicio para integración con Mercado Pago - VERSIÓN ACTUALIZADA
// Con conexión al backend real y Firebase

import { apiClient } from '@/api/client';
import { getAuth } from 'firebase/auth';

export interface PaymentPreference {
  title: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
  upgradeType: 'dark' | 'shiny' | 'shinyRoll';
  userId: string;
}

export interface MercadoPagoResponse {
  preferenceId: string;
  initPoint?: string;
  sandboxInitPoint?: string;
  externalReference?: string;
  plan?: any;
}

export interface PaymentUserData {
  userId: string;
  email: string;
  name: string;
  avatar?: string;
}

const openLinkFallback = (url: string) => {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_top';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

const submitHiddenForm = (url: string) => {
  const form = document.createElement('form');
  form.method = 'GET';
  form.action = url;
  form.target = '_self';
  document.body.appendChild(form);
  form.submit();
  form.remove();
};

const isIosDevice = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  const classicIos = /iPad|iPhone|iPod/.test(ua);
  const touchMac =
    /Mac/.test(ua) &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1;
  return classicIos || touchMac;
};

const isAndroidDevice = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  return /android/i.test(ua);
};

const openMercadoPagoDeepLinkWithFallback = (deepLinkUrl: string, fallbackUrl: string) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  let fallbackTimer: number | null = window.setTimeout(() => {
    window.location.assign(fallbackUrl);
  }, 1400);

  let visibilityHandler: (() => void) | null = null;
  const cleanup = () => {
    if (fallbackTimer) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
  };

  visibilityHandler = () => {
    if (document.hidden) {
      cleanup();
    }
  };

  document.addEventListener('visibilitychange', visibilityHandler);

  try {
    window.location.href = deepLinkUrl;
  } catch (error) {
    console.warn('[MercadoPago] Deep link falló, usando checkout web:', error);
    cleanup();
    window.location.assign(fallbackUrl);
    return true;
  }

  window.setTimeout(() => {
    cleanup();
  }, 4000);

  return true;
};

export const mercadoPagoService = {
  // Crear pago con datos de usuario de Firebase
  createPayment: async (userData: PaymentUserData, planId: string = 'black-user-plan', quantity: number = 1): Promise<MercadoPagoResponse> => {
    try {
      console.log('🚀 Creando pago para usuario:', userData, 'Plan:', planId, 'Qty:', quantity);

      const auth = getAuth();
      const currentUid = auth.currentUser?.uid;
      const finalUserId = userData.userId || currentUid;

      if (!finalUserId) {
        throw new Error('User ID is required for payment');
      }

      const payload = {
        planId,
        quantity,
        ...userData,
        userId: finalUserId // Ensure userId is explicit
      };

      const response = await apiClient.post('/payments/create-preference', payload);

      if (!response.success) {
        throw new Error(response.error || 'Error creando preferencia de pago');
      }

      console.log('✅ Pago creado exitosamente:', response.data);
      return response.data as MercadoPagoResponse;

    } catch (error) {
      console.error('❌ Error creating payment:', error);

      // Si el apiClient falla, intentar con fetch directo
      try {
        console.log('🔄 Intentando con fetch directo...');
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://v0-steeb-api-backend-production.up.railway.app/api';

        const auth = getAuth();
        const currentUid = auth.currentUser?.uid;
        const finalUserId = userData.userId || currentUid;

        if (!finalUserId) {
          throw new Error('User ID is required for payment');
        }

        const fetchResponse = await fetch(`${apiBaseUrl}/payments/create-preference`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            planId,
            quantity,
            ...userData,
            userId: finalUserId
          }),
          mode: 'cors'
        });

        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
        }

        const data = await fetchResponse.json();
        console.log('✅ Pago creado con fetch directo:', data);
        return data;

      } catch (fetchError) {
        console.error('❌ Error con fetch directo:', fetchError);
        throw new Error(`Error de conexión: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }
    }
  },

  // Crear preferencia de pago (compatibilidad con código existente)
  createPreference: async (preference: PaymentPreference): Promise<MercadoPagoResponse> => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Convertir upgradeType a planId
      const planIdMap = {
        'dark': 'black-user-plan',
        'shiny': 'shiny-mode-premium',
        'shinyRoll': 'shiny-roll-premium'
      };

      const planId = planIdMap[preference.upgradeType] || 'black-user-plan';

      const response = await apiClient.post('/payments/create-preference', {
        planId: planId,
        userId: preference.userId,
        email: currentUser.email || `user_${preference.userId}@steeb.app`,
        name: currentUser.displayName || 'Usuario STEEB',
        quantity: preference.quantity
      });

      if (!response.success) {
        throw new Error(response.error || 'Error creando preferencia de pago');
      }

      return response.data as MercadoPagoResponse;

    } catch (error) {
      console.error('Error creating payment preference:', error);
      throw error;
    }
  },

  // Redirigir al checkout de Mercado Pago - PRODUCCION
  redirectToCheckout: (response: MercadoPagoResponse) => {
    console.log('?? Redirigiendo a Mercado Pago:', response);

    const checkoutUrl = response.initPoint || response.sandboxInitPoint;
    if (!checkoutUrl) {
      throw new Error('No hay URL de checkout disponible');
    }

    const preferenceId =
      response.preferenceId ||
      (() => {
        try {
          const url = new URL(checkoutUrl);
          return url.searchParams.get('pref_id') || undefined;
        } catch {
          return undefined;
        }
      })();

    if (preferenceId) {
      const deepLinkUrl = `mercadopago://checkout/v1/redirect?pref_id=${encodeURIComponent(preferenceId)}`;

      if (isIosDevice()) {
        const launched = openMercadoPagoDeepLinkWithFallback(deepLinkUrl, checkoutUrl);
        if (launched) {
          console.log('?? Intentando abrir Mercado Pago app en iOS');
          return;
        }
      } else if (isAndroidDevice()) {
        const launched = openMercadoPagoDeepLinkWithFallback(deepLinkUrl, checkoutUrl);
        if (launched) {
          console.log('?? Intentando abrir Mercado Pago app en Android');
          return;
        }
      }
    }

    console.log('Abriendo checkout en la misma pesta?a:', checkoutUrl);

    // Mantener la misma pesta?a nos permite mostrar el mensaje final al regresar
    window.location.assign(checkoutUrl);
  },

  // Flujo de pago completo
  handlePayment: async (userData: PaymentUserData, planId: string = 'black-user-plan', quantity: number = 1) => {
    try {
      console.log('🚀 Iniciando flujo de pago para:', userData);

      // 1. Crear preferencia de pago
      const paymentData = await mercadoPagoService.createPayment(userData, planId, quantity);

      // Guardar flag para mostrar mensaje al volver si se compró DARK/BLACK
      try {
        if (typeof window !== 'undefined' && planId.toLowerCase().includes('black')) {
          localStorage.setItem('steeb-pending-dark-upgrade', '1');
        }
      } catch (storageError) {
        console.warn('⚠️ No se pudo guardar flag de upgrade BLACK:', storageError);
      }

      // 2. Redirigir a Mercado Pago
      mercadoPagoService.redirectToCheckout(paymentData);

      return paymentData;

    } catch (error) {
      console.error('❌ Error en proceso de pago:', error);
      throw error;
    }
  },

  // Procesar pago exitoso - ahora maneja verificación de rol
  processPaymentSuccess: async (preferenceId: string, userId: string) => {
    try {
      console.log('✅ Procesando pago exitoso:', { preferenceId, userId });

      // El backend ya maneja la activación del rol
      // Solo necesitamos verificar el estado
      const response = await apiClient.get(`/users/role?userId=${userId}`);

      if (response.success && response.data) {
        const userRole = response.data as any;
        console.log('🎉 Rol actualizado:', userRole);

        return {
          success: true,
          role: userRole.role,
          permissions: userRole.permissions,
          isPremium: userRole.role === 'premium'
        };
      }

      throw new Error('No se pudo verificar el rol del usuario');

    } catch (error) {
      console.error('❌ Error procesando pago exitoso:', error);
      throw error;
    }
  }
};

