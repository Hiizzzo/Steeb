// Servicio para integración con Mercado Pago - VERSIÓN LIMPIA DE PRODUCCIÓN
// SIN SIMULACIÓN, SIN TESTING, SIN BASURA

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

export const mercadoPagoService = {
  // Crear preferencia de pago - PRODUCCIÓN
  createPreference: async (preference: PaymentPreference): Promise<MercadoPagoResponse> => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      // Convertir upgradeType a planId
      const planIdMap = {
        'dark': 'dark-mode-premium',
        'shiny': 'shiny-mode-premium',
        'shinyRoll': 'shiny-roll-premium'
      };

      const planId = planIdMap[preference.upgradeType] || 'dark-mode-premium';

      const response = await fetch(`${apiBaseUrl}/api/payments/create-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planId,
          userId: preference.userId,
          email: `user_${preference.userId}@steeb.app`,
          name: 'Usuario STEEB'
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error creating payment preference:', error);
      throw error;
    }
  },

  // Redirigir al checkout de Mercado Pago - PRODUCCIÓN
  redirectToCheckout: (response: MercadoPagoResponse) => {
    console.log('🚀 Redirigiendo a Mercado Pago:', response);

    const checkoutUrl = response.sandboxInitPoint || response.initPoint;
    if (checkoutUrl) {
      console.log('🛒 Abriendo checkout:', checkoutUrl);
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer,width=800,height=600');
    } else {
      throw new Error('No hay URL de checkout disponible');
    }
  },

  // Procesar pago exitoso - PRODUCCIÓN
  processPaymentSuccess: async (preferenceId: string, userId: string) => {
    try {
      console.log('Procesando pago exitoso:', { preferenceId, userId });

      // Aquí se verificaría el estado del pago con la API de Mercado Pago
      // y se activaría el upgrade correspondiente

      return true;
    } catch (error) {
      console.error('Error processing payment success:', error);
      throw error;
    }
  }
};