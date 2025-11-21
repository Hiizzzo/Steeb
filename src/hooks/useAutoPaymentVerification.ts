import { useEffect, useRef } from 'react';
import { useUserCredits } from './useUserCredits';

/**
 * Hook para verificar automáticamente el pago cuando el usuario vuelve a la app
 * Se ejecuta cada vez que la ventana recibe foco
 */
export const useAutoPaymentVerification = () => {
    const { syncWithBackend, userCredits } = useUserCredits();
    const lastCheckRef = useRef<number>(0);
    const COOLDOWN_MS = 10000; // 10 segundos entre verificaciones

    useEffect(() => {
        // Si el usuario ya tiene Dark Mode, no verificar más
        if (userCredits.hasDarkVersion) {
            return;
        }

        const handleFocus = async () => {
            const now = Date.now();

            // Cooldown para evitar spam
            if (now - lastCheckRef.current < COOLDOWN_MS) {
                return;
            }

            lastCheckRef.current = now;

            console.log('👁️ Usuario volvió a la app, verificando pago...');

            try {
                const hasAccess = await syncWithBackend();
                if (hasAccess) {
                    console.log('✅ Pago detectado! Dark Mode desbloqueado');
                    // Mostrar notificación de éxito
                    const event = new CustomEvent('steeb-message', {
                        detail: {
                            type: 'payment-success',
                            content: '🎉 ¡Pago confirmado! Dark Mode desbloqueado',
                            timestamp: new Date()
                        }
                    });
                    window.dispatchEvent(event);
                }
            } catch (error) {
                console.error('❌ Error verificando pago:', error);
            }
        };

        // Verificar cuando la ventana recibe foco
        window.addEventListener('focus', handleFocus);

        // Verificar al montar el componente (por si acaba de volver)
        handleFocus();

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [syncWithBackend, userCredits.hasDarkVersion]);
};
