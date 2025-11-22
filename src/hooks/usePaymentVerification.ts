import { useState, useCallback, useEffect } from 'react';
import { useUnifiedUserAccess } from './useUnifiedUserAccess';

interface PaymentVerificationState {
  isVerifying: boolean;
  isVerified: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export const usePaymentVerification = () => {
  const { checkUserRole, user, currentRole } = useUnifiedUserAccess();
  const [state, setState] = useState<PaymentVerificationState>({
    isVerifying: false,
    isVerified: currentRole === 'premium',
    error: null,
    lastChecked: null
  });

  // Verificación automática con polling
  const startVerification = useCallback(async (maxAttempts = 10) => {
    if (!user?.uid) {
      setState(prev => ({
        ...prev,
        error: 'Usuario no autenticado'
      }));
      return false;
    }

    setState({
      isVerifying: true,
      isVerified: false,
      error: null,
      lastChecked: new Date()
    });

    console.log('🔍 Iniciando verificación de pago para usuario:', user.uid);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📋 Intento ${attempt}/${maxAttempts} - Verificando rol del usuario...`);

        const userRole = await checkUserRole(user.uid);

        if (userRole.isPremium) {
          console.log('✅ ¡Pago verificado! Usuario ahora es premium');
          setState({
            isVerifying: false,
            isVerified: true,
            error: null,
            lastChecked: new Date()
          });

          // Enviar evento de éxito global
          window.dispatchEvent(new CustomEvent('payment-verified', {
            detail: {
              userId: user.uid,
              role: userRole.role,
              timestamp: new Date()
            }
          }));

          return true;
        }

        console.log(`⏳ Intento ${attempt} - Usuario sigue siendo ${userRole.role}. Esperando 3 segundos...`);

        // Esperar 3 segundos entre intentos
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`❌ Error en intento ${attempt}:`, error);

        if (attempt === maxAttempts) {
          setState({
            isVerifying: false,
            isVerified: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
            lastChecked: new Date()
          });
          return false;
        }

        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log('⏰ Tiempo de verificación agotado');
    setState({
      isVerifying: false,
      isVerified: false,
      error: 'Tiempo de espera agotado. El pago puede tardar unos minutos en procesarse.',
      lastChecked: new Date()
    });

    return false;
  }, [user?.uid, checkUserRole]);

  // Verificación manual (botón)
  const verifyManual = useCallback(() => {
    console.log('🔘 Iniciando verificación manual...');
    return startVerification(5); // Menos intentos para manual
  }, [startVerification]);

  // Escuchar evento de vuelta de Mercado Pago
  useEffect(() => {
    const handleReturnFromPayment = () => {
      console.log('👁️ Usuario volvió a la app, iniciando verificación automática...');

      // Esperar un poco antes de iniciar la verificación
      setTimeout(() => {
        startVerification();
      }, 2000);
    };

    const handleBuyDarkMode = () => {
      console.log('💾 Evento de compra iniciado - preparando verificación...');
    };

    // Escuchar cuando el usuario vuelve de pagar
    window.addEventListener('focus', handleReturnFromPayment);
    window.addEventListener('buy-dark-mode', handleBuyDarkMode);
    window.addEventListener('pageshow', handleReturnFromPayment);

    return () => {
      window.removeEventListener('focus', handleReturnFromPayment);
      window.removeEventListener('buy-dark-mode', handleBuyDarkMode);
      window.removeEventListener('pageshow', handleReturnFromPayment);
    };
  }, [startVerification]);

  // Actualizar estado verificado si cambia el rol
  useEffect(() => {
    if (currentRole === 'premium' && !state.isVerified) {
      setState(prev => ({
        ...prev,
        isVerified: true,
        error: null,
        lastChecked: new Date()
      }));
    } else if (currentRole === 'free' && state.isVerified) {
      setState(prev => ({
        ...prev,
        isVerified: false,
        error: null,
        lastChecked: new Date()
      }));
    }
  }, [currentRole, state.isVerified]);

  return {
    // Estado
    isVerifying: state.isVerifying,
    isVerified: state.isVerified,
    error: state.error,
    lastChecked: state.lastChecked,

    // Métodos
    startVerification,
    verifyManual,

    // Utils
    canRetry: !!state.error && !state.isVerifying,
    isPremium: currentRole === 'premium'
  };
};