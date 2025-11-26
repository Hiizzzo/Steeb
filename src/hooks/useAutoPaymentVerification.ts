import { useEffect, useRef } from 'react';
import { useUserCredits } from './useUserCredits';
import { useAuth } from './useAuth';

const PENDING_FLAG = 'steeb-pending-dark-upgrade';
const SESSION_FLAG = 'steeb-session-dark-upgrade';
const welcomeKeyForUser = (userId?: string) =>
  userId ? `steeb-dark-welcome-${userId}` : 'steeb-dark-welcome';

const isDarkTipo = (tipo?: string | null) => {
  if (!tipo) return false;
  const normalized = tipo.toLowerCase();
  return normalized === 'black' || normalized === 'dark';
};

const buildDarkWelcomeMessage = (clubNumber?: number | null) => {
  const numberText = clubNumber
    ? `Sos el usuario BLACK numero ${clubNumber}.`
    : 'Sos parte del club BLACK.';
  return `Steeb aca: ${numberText} Bienvenido al club. Ya tenes Dark Mode y no se te quema la vista cada vez que entras. Te deje una tirada para el juego SHINY: escribime "jugar shiny" cuando quieras usarla.`;
};

/**
 * Hook que muestra el mensaje de bienvenida BLACK apenas detectamos que el usuario ya tiene acceso,
 * incluso si volvio desde otra pestana/luego de una redireccion completa.
 */
export const useAutoPaymentVerification = () => {
  const { syncWithBackend, userCredits, userRoleDetails } = useUserCredits();
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

    const showWelcomeMessage = (message: string) => {
      if (hasShownRef.current) return;
      hasShownRef.current = true;
      try {
        localStorage.removeItem(PENDING_FLAG);
        sessionStorage.removeItem(SESSION_FLAG);
        localStorage.setItem(welcomeKey, new Date().toISOString());
      } catch {
        // ignore storage issues
      }

      const event = new CustomEvent('steeb-message', {
        detail: {
          type: 'payment-success',
          content: message,
          timestamp: new Date()
        }
      });
      window.dispatchEvent(event);
    };

    // Si detectamos que el usuario volvio del pago pero todavia no vemos el upgrade, forzar sincronizacion
    if (pendingFlag && !userCredits.hasDarkVersion) {
      if (!syncAttemptedRef.current) {
        syncAttemptedRef.current = true;
        syncWithBackend();
      }
      return;
    }

    const isDarkUser = isDarkTipo(userRoleDetails?.tipoUsuario);

    // Mostrar mensaje si tenemos el flag o si nunca lo mostramos y la cuenta ya es BLACK
    if (userCredits.hasDarkVersion && isDarkUser) {
      if (pendingFlag || (!alreadyWelcomed && !hasShownRef.current)) {
        const message = buildDarkWelcomeMessage(userRoleDetails?.darkClubNumber);
        showWelcomeMessage(message);
      }
    } else {
      // Resetear refs si salio de premium para permitir futuros mensajes
      hasShownRef.current = false;
      syncAttemptedRef.current = false;
    }
  }, [
    syncWithBackend,
    userCredits.hasDarkVersion,
    user?.id,
    userRoleDetails?.darkClubNumber,
    userRoleDetails?.tipoUsuario
  ]);
};
