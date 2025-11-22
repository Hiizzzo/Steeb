import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
  X
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useUnifiedUserAccess } from '@/hooks/useUnifiedUserAccess';
import { mercadoPagoService } from '@/services/mercadoPagoService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const {
    hasDarkAccess,
    canBuyDarkMode,
    user,
    isLoading,
    waitForActivation,
    checkUserRole
  } = useUnifiedUserAccess();
  const { currentTheme } = useTheme();

  const [checkoutState, setCheckoutState] = useState<'idle' | 'creating' | 'verifying' | 'error'>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCheckoutState('idle');
      setCheckoutError(null);
      setLastSyncMessage(null);
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!user?.email || !user.uid) {
      setCheckoutError('Inicia sesión con un email para completar el pago.');
      return;
    }

    setCheckoutState('creating');
    setCheckoutError(null);

    try {
      const userData = {
        userId: user.uid,
        email: user.email,
        name: user.displayName || 'Usuario STEEB'
      };

      // 1. Iniciar proceso de pago
      await mercadoPagoService.handlePayment(userData);
      setCheckoutState('idle');
    } catch (error) {
      setCheckoutState('error');
      setCheckoutError(
        error instanceof Error ? error.message : 'No se pudo iniciar el pago'
      );
    }
  };

  const handleVerifyPayment = async () => {
    if (!user?.uid) {
      setCheckoutError('Usuario no identificado.');
      return;
    }

    setCheckoutState('verifying');
    setCheckoutError(null);
    setLastSyncMessage('⏳ Verificando estado del pago...');

    try {
      // 1. Esperar activación del premium con polling
      const userRole = await waitForActivation(user.uid, 10); // Máximo 30 segundos

      if (userRole.isPremium) {
        setLastSyncMessage('🎉 ¡Pago confirmado! Ya tienes acceso al modo DARK.');
        setCheckoutState('idle');

        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setCheckoutState('error');
      setLastSyncMessage('❌ El pago aún no fue procesado. Espera unos minutos y volvé a intentar.');
    }
  };

  if (!isOpen) return null;

  // Verificar acceso real unificado
  const isAlreadyUnlocked = hasDarkAccess;
  const requiresLogin = !user?.email;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`relative w-full max-w-lg rounded-2xl p-6 ${currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          } shadow-2xl`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col gap-4">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <Crown className="w-12 h-12 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              Versión DARK
              <Sparkles className="w-6 h-6 text-pink-500" />
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Desbloqueá el modo oscuro con Mercado Pago.
            </p>
          </div>

          {/* Plan de pago fijo */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500">Modo DARK Premium</p>
                <p className="text-3xl font-extrabold">$1 USD</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                <CreditCard className="w-4 h-4" />
                Pago único
              </div>
            </div>
            <ul className="text-sm space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                Modo oscuro permanente
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                Acceso a futuras actualizaciones
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                Soporte prioritario
              </li>
            </ul>
          </div>

          {isAlreadyUnlocked && (
            <div className="rounded-xl border border-green-500/40 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200 p-3 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Ya tenés acceso a la versión DARK. Cambiá el tema desde el selector.
            </div>
          )}

          {requiresLogin && (
            <div className="rounded-xl border border-amber-500/50 bg-amber-50 text-amber-900 p-3 text-sm">
              Inicia sesión con tu email para asociar el pago a tu cuenta.
            </div>
          )}

          {checkoutError && (
            <div className="rounded-xl border border-red-500/40 bg-red-50 text-red-900 p-3 text-sm">
              {checkoutError}
            </div>
          )}

          {lastSyncMessage && (
            <div className={`rounded-xl border p-3 text-sm ${
              lastSyncMessage.includes('🎉')
                ? 'border-green-500/40 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100'
                : 'border-blue-500/40 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100'
            }`}>
              {lastSyncMessage}
            </div>
          )}

          {!isAlreadyUnlocked && !requiresLogin && (
            <div className="space-y-3">
              <button
                onClick={handlePayment}
                disabled={checkoutState === 'creating' || isLoading}
                className="w-full py-3 rounded-xl font-semibold bg-black text-white dark:bg-white dark:text-black flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
              >
                {checkoutState === 'creating' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Preparando pago…
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pagar con Mercado Pago ($1)
                  </>
                )}
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
              <ShieldCheck className="w-4 h-4" />
              Seguridad Mercado Pago
            </div>
            <p>
              Al finalizar el pago, volvé a esta pantalla y tocá "Ya pagué, verificar" para activar el modo DARK.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleVerifyPayment}
                disabled={checkoutState === 'verifying'}
                className="flex-1 py-2 rounded-xl border border-black dark:border-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {checkoutState === 'verifying' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Ya pagué, verificar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
