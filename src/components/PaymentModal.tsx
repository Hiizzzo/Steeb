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
import { useUserCredits } from '@/hooks/useUserCredits';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { useUserRole } from '@/hooks/useUserRole';
import { useUnifiedUserAccess } from '@/hooks/useUnifiedUserAccess';
import { createCheckoutPreference, verifyPayment } from '@/services/paymentService';
import type { CreatePreferenceResponse } from '@/services/paymentService';
import { DARK_MODE_PLAN_ID, formatPlanPrice } from '@/config/paymentPlans';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const {
    userCredits,
    plan,
    syncWithBackend,
    isSyncing,
    syncError
  } = useUserCredits();
  const { updateUserRole } = useUserRole();
  const { hasDarkAccess } = useUnifiedUserAccess();
  const { currentTheme } = useTheme();

  const [preference, setPreference] = useState<CreatePreferenceResponse | null>(null);
  const [checkoutState, setCheckoutState] = useState<'idle' | 'creating' | 'ready' | 'error'>(
    'idle'
  );
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);

  const { status: sdkStatus, instance, error: sdkError } = useMercadoPago(
    MP_PUBLIC_KEY,
    isOpen
  );

  useEffect(() => {
    if (!isOpen) {
      setPreference(null);
      setCheckoutState('idle');
      setCheckoutError(null);
      setLastSyncMessage(null);
    }
  }, [isOpen]);

  const formattedPrice = useMemo(() => {
    if (!plan) return '';
    return formatPlanPrice(plan);
  }, [plan]);

  const openCheckout = (pref: CreatePreferenceResponse) => {
    console.log('🎯 openCheckout llamado con:', pref);

    // SIEMPRE usar producción real - NO sandbox
    const checkoutUrl = pref.initPoint;
    console.log('🔗 URL DE PRODUCCIÓN REAL:', checkoutUrl);

    if (!checkoutUrl) {
      console.error('❌ No se recibió una URL de checkout válida', pref);
      setCheckoutError('Error: Mercado Pago no devolvió una URL de pago válida.');
      return;
    }

    try {
      console.log('🛒 Abriendo checkout REAL de Mercado Pago:', checkoutUrl);
      const popup = window.open(checkoutUrl, '_blank', 'noopener,noreferrer');

      // Algunos navegadores móviles bloquean las nuevas ventanas. Si eso pasa,
      // redirigimos en la misma pestaña para evitar el error "Load failed".
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        console.warn('⚠️ window.open bloqueado, redirigiendo en la misma pestaña');
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      console.error('❌ No se pudo abrir el checkout de Mercado Pago:', err);
      setCheckoutError('No pudimos abrir Mercado Pago. Probá nuevamente.');
      window.location.href = checkoutUrl;
    }
  };

  const handleCreatePreference = async () => {
    if (!plan) {
      setCheckoutError('No hay planes configurados.');
      return;
    }

    if (!user?.email) {
      setCheckoutError('Inicia sesión con un email para completar el pago.');
      return;
    }

    if (!MP_PUBLIC_KEY) {
      setCheckoutError('Configura VITE_MERCADOPAGO_PUBLIC_KEY para habilitar el pago.');
      return;
    }

    setCheckoutState('creating');
    setCheckoutError(null);

    try {
      const preferenceResponse = await createCheckoutPreference({
        planId: plan.id ?? DARK_MODE_PLAN_ID,
        userId: user.id,
        email: user.email,
        name: user.name || user.nickname
      });
      setPreference(preferenceResponse);
      setCheckoutState('ready');
      openCheckout(preferenceResponse);
    } catch (error) {
      setCheckoutState('error');
      setCheckoutError(
        error instanceof Error ? error.message : 'No se pudo iniciar Mercado Pago'
      );
    }
  };

  const handleVerify = async () => {
    setLastSyncMessage(null);

    try {
      // 1. Verificar el pago en Mercado Pago
      if (preference?.externalReference || preference?.preferenceId) {
        await verifyPayment({
          externalReference: preference.externalReference,
          preferenceId: preference.preferenceId
        });
      }
    } catch (error) {
      setLastSyncMessage(
        error instanceof Error ? error.message : 'No se pudo verificar el pago en Mercado Pago.'
      );
      return;
    }

    try {
      // 2. Verificar el estado con el backend
      const active = await syncWithBackend();

      if (active) {
        // 3. 🎯 ACTIVAR EL ROL DARK (Paso que faltaba!)
        try {
          await updateUserRole('dark');
          setLastSyncMessage('🎉 ¡Pago confirmado y rol DARK activado! Ya puedes usar el modo oscuro.');
          setCheckoutState('idle');
          setPreference(null);
        } catch (roleError) {
          console.error('Error activando rol dark:', roleError);
          setLastSyncMessage('✅ Pago confirmado pero hubo un error activando el rol. Contactá soporte.');
        }
      } else {
        setLastSyncMessage('Todavía no registramos un pago aprobado. Esperá unos segundos y volvé a intentar.');
      }
    } catch (syncError) {
      console.error('Error en sincronización:', syncError);
      setLastSyncMessage('Error verificando el estado del pago. Intentalo nuevamente.');
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
              Pagá con Mercado Pago usando tarjetas de crédito o débito.
            </p>
          </div>

          {plan && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-500">{plan.title}</p>
                  <p className="text-3xl font-extrabold">{formattedPrice}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                  <CreditCard className="w-4 h-4" />
                  Pagos con cuotas
                </div>
              </div>
              <ul className="text-sm space-y-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!plan && (
            <div className="rounded-xl border border-amber-500/50 bg-amber-50 text-amber-900 p-3 text-sm">
              Configura <code>config/paymentPlans.json</code> para mostrar el plan disponible.
            </div>
          )}

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

          {sdkError && (
            <div className="rounded-xl border border-red-500/40 bg-red-50 text-red-900 p-3 text-sm">
              {sdkError}
            </div>
          )}

          {checkoutError && (
            <div className="rounded-xl border border-red-500/40 bg-red-50 text-red-900 p-3 text-sm">
              {checkoutError}
            </div>
          )}

          {lastSyncMessage && (
            <div className="rounded-xl border border-blue-500/40 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 p-3 text-sm">
              {lastSyncMessage}
            </div>
          )}

          {!isAlreadyUnlocked && !requiresLogin && plan && (
            <div className="space-y-3">
              <button
                onClick={handleCreatePreference}
                disabled={checkoutState === 'creating' || sdkStatus === 'loading'}
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

              {preference && (
                <button
                  onClick={() => openCheckout(preference)}
                  className="w-full py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Reabrir checkout
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <div id="mercado-pago-button" className="hidden" />
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
              <ShieldCheck className="w-4 h-4" />
              Seguridad Mercado Pago
            </div>
            <p>
              Al finalizar el pago volverás automáticamente a la app. También podés tocar “Ya pagué,
              verificar” para sincronizar manualmente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleVerify}
                disabled={isSyncing}
                className="flex-1 py-2 rounded-xl border border-black dark:border-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSyncing ? (
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
              {syncError && (
                <p className="text-xs text-red-500 flex-1 self-center sm:text-right">{syncError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
