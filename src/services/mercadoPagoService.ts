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

export const mercadoPagoService = {
  // Crear pago con datos de usuario de Firebase
  createPayment: async (userData: PaymentUserData): Promise<MercadoPagoResponse> => {
    try {
      console.log('🚀 Creando pago para usuario:', userData);

      const auth = getAuth();
      const currentUid = auth.currentUser?.uid;
      const finalUserId = userData.userId || currentUid;

      if (!finalUserId) {
        throw new Error('User ID is required for payment');
      }

      const payload = {
        planId: 'black-user-plan',
        quantity: 1,
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
        const apiBaseUrl = 'https://v0-steeb-api-backend.vercel.app/api';

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
            planId: 'black-user-plan',
            quantity: 1,
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

  // Redirigir al checkout de Mercado Pago - PRODUCCIÓN
  redirectToCheckout: (response: MercadoPagoResponse) => {
    console.log('🚀 Redirigiendo a Mercado Pago:', response);

    const checkoutUrl = response.initPoint; // Usar solo initPoint (producción)
    if (checkoutUrl) {
      console.log('🛒 Abriendo checkout:', checkoutUrl);
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer,width=800,height=600');
    } else {
      throw new Error('No hay URL de checkout disponible');
    }
  },

  // Flujo de pago completo
  handlePayment: async (userData: PaymentUserData) => {
    try {
      console.log('🚀 Iniciando flujo de pago para:', userData);

      // 1. Crear preferencia de pago
      const paymentData = await mercadoPagoService.createPayment(userData);

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
        const userRole = response.data;
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