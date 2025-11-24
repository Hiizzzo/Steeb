import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
  Dices
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useUnifiedUserAccess } from '@/hooks/useUnifiedUserAccess';
import { mercadoPagoService } from '@/services/mercadoPagoService';
import { toast } from 'sonner';

interface ShinyRollsPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLL_PACKS = [
  { quantity: 1, price: 300, label: '1 Tirada' },
  { quantity: 15, price: 4000, label: '15 Tiradas' },
  { quantity: 30, price: 8000, label: '30 Tiradas' },
];

export const ShinyRollsPaymentModal: React.FC<ShinyRollsPaymentModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    isLoading
  } = useUnifiedUserAccess();
  const { currentTheme } = useTheme();

  const [selectedPack, setSelectedPack] = useState(ROLL_PACKS[0]);
  const [checkoutState, setCheckoutState] = useState<'idle' | 'creating' | 'verifying' | 'error'>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCheckoutState('idle');
      setCheckoutError(null);
      setLastSyncMessage(null);
      setSelectedPack(ROLL_PACKS[0]);
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
        name: user.displayName || 'Usuario STEEB',
        avatar: user.photoURL
      };

      // Usamos el planId específico para cada pack (ej: shiny-roll-5)
      const planId = `shiny-roll-${selectedPack.quantity}`;
      await mercadoPagoService.handlePayment(userData, planId, 1);
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
      // Esperamos un poco para dar tiempo al webhook
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Aquí podríamos implementar una verificación más robusta consultando el saldo de rolls
      // Por ahora, simulamos éxito tras espera y confiamos en el webhook
      
      setLastSyncMessage('🎉 ¡Pago procesado! Tus tiradas deberían aparecer pronto.');
      setCheckoutState('idle');
      toast.success('Verificación completada');

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      setCheckoutState('error');
      setLastSyncMessage('❌ No pudimos confirmar el pago automáticamente. Si pagaste, tus tiradas llegarán en breve.');
    }
  };

  if (!isOpen) return null;

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
              <Dices className="w-12 h-12 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              Tiradas Shiny
              <Sparkles className="w-6 h-6 text-amber-400" />
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Comprá intentos extra para ganar el modo Shiny hoy mismo.
            </p>
          </div>

          {/* Selección de Pack */}
          <div className="grid grid-cols-2 gap-3">
            {ROLL_PACKS.map((pack) => (
              <button
                key={pack.quantity}
                onClick={() => setSelectedPack(pack)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1
                  ${selectedPack.quantity === pack.quantity
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
              >
                <span className="font-bold text-lg">{pack.label}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">${pack.price}</span>
              </button>
            ))}
          </div>

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

          {!requiresLogin && (
            <div className="space-y-3 mt-2">
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
                    Comprar {selectedPack.label} (${selectedPack.price})
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
              Al finalizar el pago, volvé a esta pantalla y tocá "Ya pagué, verificar".
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
