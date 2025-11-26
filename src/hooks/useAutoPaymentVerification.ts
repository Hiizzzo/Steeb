import { useEffect, useRef } from 'react';
import { useUserCredits } from './useUserCredits';
import { useAuth } from './useAuth';

const PENDING_FLAG = 'steeb-pending-dark-upgrade';
const SESSION_FLAG = 'steeb-session-dark-upgrade';
export const DARK_WELCOME_QUEUE_KEY = 'steeb-dark-welcome-queue';
const welcomeKeyForUser = (userId?: string) =>
  userId ? `steeb-dark-welcome-${userId}` : 'steeb-dark-welcome';
const BLACK_WELCOME_MESSAGE =
  'Felicitaciones, ahora sos usuario BLACK. Tocá el tercer círculo del selector de temas (arriba a la derecha) para encender el modo DARK y acordate que el del medio te deja jugar SHINY. De regalo te sumé una tirada: escribí "jugar shiny" para usarla cuando quieras.';

/**
 * Hook que muestra el mensaje de bienvenida BLACK apenas detectamos que el usuario ya tiene acceso,
 * incluso si volvió desde otra pestaña/luego de una redirección completa.
 */
export const useAutoPaymentVerification = () => {
  const { syncWithBackend, userCredits } = useUserCredits();
  const { user } = useAuth();
  const hasShownRef = useRef(false);
  const syncAttemptedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pendingLocal = localStorage.getItem(PENDING_FLAG);
    const pendingSession = sessionStorage.getItem(SESSION_FLAG);
    const pendingFlag = pendingLocal || pendingSession;

    const welcomeKey = welcomeKeyForUser(user?.id);
    const alreadyWelcomed = localStorage.getItem(welcomeKey);

    const showWelcomeMessage = () => {
      if (hasShownRef.current) return;
      hasShownRef.current = true;
      try {
        localStorage.removeItem(PENDING_FLAG);
        sessionStorage.removeItem(SESSION_FLAG);
        localStorage.setItem(welcomeKey, new Date().toISOString());
        localStorage.setItem(
          DARK_WELCOME_QUEUE_KEY,
          JSON.stringify({
            content: BLACK_WELCOME_MESSAGE,
            timestamp: new Date().toISOString()
          })
        );
      } catch {
        // ignore storage issues
      }

      const event = new CustomEvent('steeb-message', {
        detail: {
          type: 'payment-success',
          content: BLACK_WELCOME_MESSAGE,
          timestamp: new Date()
        }
      });
      window.dispatchEvent(event);
    };

    // Si detectamos que el usuario volvió del pago pero todavía no vemos el upgrade, forzar una sincronización
    if (pendingFlag && !userCredits.hasDarkVersion) {
      if (!syncAttemptedRef.current) {
        syncAttemptedRef.current = true;
        syncWithBackend();
      }
      return;
    }

    // Mostrar mensaje si tenemos el flag o si nunca lo mostramos y la cuenta ya es BLACK
    if (userCredits.hasDarkVersion) {
      if (pendingFlag || (!alreadyWelcomed && !hasShownRef.current)) {
        showWelcomeMessage();
      }
    } else {
      // Resetear refs si salió de premium para permitir futuros mensajes
      hasShownRef.current = false;
      syncAttemptedRef.current = false;
    }
  }, [syncWithBackend, userCredits.hasDarkVersion, user?.id]);
};
