// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { PaymentRecord, verifyPayment } from '@/services/paymentService';
import { useUnifiedUserAccess } from '@/hooks/useUnifiedUserAccess';

type VerificationStatus = 'verifying' | 'approved' | 'pending' | 'rejected' | 'error';
type PlanType = 'dark' | 'shiny' | 'shiny-rolls' | 'unknown';

const getPlanType = (planId?: string | null): PlanType => {
    const normalized = (planId || '').toLowerCase();
    if (!normalized) return 'unknown';
    if (normalized.includes('shiny-roll') || normalized.includes('roll')) return 'shiny-rolls';
    if (normalized.includes('shiny')) return 'shiny';
    if (normalized.includes('black') || normalized.includes('dark')) return 'dark';
    return 'unknown';
};

const getRollsCount = (planId?: string | null): number | null => {
    const match = (planId || '').toLowerCase().match(/shiny-roll-(\d+)/);
    return match ? Number(match[1]) : null;
};

const buildSuccessMessage = (planType: PlanType, rollsCount: number | null) => {
    if (planType === 'shiny-rolls') {
        if (rollsCount && rollsCount > 0) {
            const suffix = rollsCount === 1 ? '' : 's';
            return `Pago aprobado. Acreditamos ${rollsCount} tirada${suffix} Shiny.`;
        }
        return 'Pago aprobado. Acreditamos tus tiradas Shiny.';
    }
    if (planType === 'shiny') {
        return 'Pago aprobado. Tu cuenta fue actualizada a Shiny.';
    }
    if (planType === 'dark') {
        return 'Pago aprobado. Tu cuenta fue actualizada a Black.';
    }
    return 'Pago aprobado.';
};

export default function PaymentSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { currentTheme } = useTheme();
    const { checkUserRole, user } = useUnifiedUserAccess();

    const [status, setStatus] = useState<VerificationStatus>('verifying');
    const [message, setMessage] = useState<string>('Verificando tu pago...');
    const [paymentDetails, setPaymentDetails] = useState<PaymentRecord | null>(null);
    const [planType, setPlanType] = useState<PlanType>('unknown');
    const [rollsCount, setRollsCount] = useState<number | null>(null);

    const hasRunVerification = useRef(false);

    useEffect(() => {
        if (hasRunVerification.current) {
            return;
        }
        hasRunVerification.current = true;

        const verifyPaymentFromUrl = async () => {
            const paymentId = searchParams.get('payment_id');
            const preferenceId = searchParams.get('preference_id');
            const externalReference = searchParams.get('external_reference');

            if (!paymentId && !preferenceId && !externalReference) {
                setStatus('error');
                setMessage('No se encontro informacion del pago en la URL.');
                return;
            }

            try {
                setStatus('verifying');
                setMessage('Verificando tu pago con Mercado Pago...');

                const result = await verifyPayment({
                    paymentId: paymentId || undefined,
                    preferenceId: preferenceId || undefined,
                    externalReference: externalReference || undefined
                });

                const detectedPlanType = getPlanType(result.planId);
                const detectedRollsCount = getRollsCount(result.planId);

                setPaymentDetails(result);
                setPlanType(detectedPlanType);
                setRollsCount(detectedRollsCount);

                if (result.status === 'approved') {
                    setStatus('approved');
                    setMessage(buildSuccessMessage(detectedPlanType, detectedRollsCount));

                    if (detectedPlanType === 'dark') {
                        try {
                            localStorage.setItem('steeb-pending-dark-upgrade', '1');
                            sessionStorage.setItem('steeb-session-dark-upgrade', '1');
                        } catch {
                            // ignore storage errors
                        }
                    }

                    if (user?.uid) {
                        setTimeout(async () => {
                            await checkUserRole(user.uid);
                        }, 2000);
                    }

                    setTimeout(() => {
                        navigate('/', { replace: true });
                    }, 3000);
                } else if (result.status === 'pending') {
                    setStatus('pending');
                    setMessage('Tu pago esta pendiente de aprobacion. Te avisaremos cuando se confirme.');
                } else if (result.status === 'rejected' || result.status === 'cancelled') {
                    setStatus('rejected');
                    setMessage('El pago fue rechazado o cancelado. Intenta nuevamente.');
                } else {
                    setStatus('error');
                    setMessage(`Estado del pago: ${result.status}`);
                }
            } catch (error) {
                console.error('Error verificando pago:', error);
                setStatus('error');
                setMessage(
                    error instanceof Error
                        ? `Error: ${error.message}`
                        : 'No se pudo verificar el pago. Intenta nuevamente mas tarde.'
                );
            }
        };

        verifyPaymentFromUrl();
    }, [searchParams, navigate, checkUserRole, user]);

    const getStatusIcon = () => {
        switch (status) {
            case 'verifying':
                return <Loader2 className="w-16 h-16 animate-spin text-blue-500" />;
            case 'approved':
                return <CheckCircle2 className="w-16 h-16 text-green-500" />;
            case 'pending':
                return <Loader2 className="w-16 h-16 text-yellow-500" />;
            case 'rejected':
            case 'error':
                return <XCircle className="w-16 h-16 text-red-500" />;
            default:
                return <Loader2 className="w-16 h-16 animate-spin text-blue-500" />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'approved':
                return 'border-green-500 bg-green-50 dark:bg-green-900/20';
            case 'pending':
                return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
            case 'rejected':
            case 'error':
                return 'border-red-500 bg-red-50 dark:bg-red-900/20';
            default:
                return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
        }
    };

    return (
        <div
            className={`min-h-screen flex items-center justify-center p-4 ${currentTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                }`}
        >
            <div
                className={`max-w-md w-full rounded-2xl p-8 shadow-2xl ${currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}
            >
                <div className="flex justify-center mb-6">
                    {getStatusIcon()}
                </div>

                <h1 className="text-2xl font-bold text-center mb-4">
                    {status === 'approved' && 'Pago Exitoso'}
                    {status === 'verifying' && 'Verificando Pago'}
                    {status === 'pending' && 'Pago Pendiente'}
                    {status === 'rejected' && 'Pago Rechazado'}
                    {status === 'error' && 'Error'}
                </h1>

                <div className={`rounded-xl border-2 p-4 mb-6 ${getStatusColor()}`}>
                    <p className="text-center text-sm">{message}</p>
                </div>

                {status === 'approved' && paymentDetails && (
                    <div className="space-y-3 mb-6">
                        {planType === 'dark' && (
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <Sparkles className="w-4 h-4 text-pink-500" />
                                <span>Modo DARK desbloqueado</span>
                            </div>
                        )}

                        {planType === 'shiny' && (
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span>Acceso Shiny activado</span>
                            </div>
                        )}

                        {planType === 'shiny-rolls' && (
                            <div className="text-sm text-center text-blue-600 dark:text-blue-300 font-medium">
                                {rollsCount
                                    ? `Tiradas Shiny acreditadas: ${rollsCount}`
                                    : 'Tus tiradas Shiny ya estan disponibles.'}
                            </div>
                        )}

                        {paymentDetails.paymentId && (
                            <div className="text-xs text-center text-gray-500">
                                ID de pago: {paymentDetails.paymentId}
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-3">
                    {status === 'approved' && (
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                            Redirigiendo a la pagina principal...
                        </div>
                    )}

                    {(status === 'error' || status === 'rejected') && (
                        <button
                            onClick={() => navigate('/', { replace: true })}
                            className="w-full py-3 rounded-xl font-semibold bg-black text-white dark:bg-white dark:text-black flex items-center justify-center gap-2 hover:opacity-90 transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver al inicio
                        </button>
                    )}

                    {status === 'pending' && (
                        <button
                            onClick={() => navigate('/', { replace: true })}
                            className="w-full py-3 rounded-xl font-semibold border-2 border-black dark:border-white flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver al inicio
                        </button>
                    )}
                </div>

                <div className="mt-6 text-xs text-center text-gray-500">
                    {status === 'pending' && (
                        <p>Los pagos pueden tardar unos minutos en procesarse. Te notificaremos cuando se confirme.</p>
                    )}
                    {status === 'rejected' && (
                        <p>Si tenes algun problema, contactanos a soporte@steeb.app</p>
                    )}
                </div>
            </div>
        </div>
    );
}

