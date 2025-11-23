import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { verifyPayment } from '@/services/paymentService';
import { useUnifiedUserAccess } from '@/hooks/useUnifiedUserAccess';

type VerificationStatus = 'verifying' | 'approved' | 'pending' | 'rejected' | 'error';

export default function PaymentSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { currentTheme } = useTheme();
    const { checkUserRole, user } = useUnifiedUserAccess();

    const [status, setStatus] = useState<VerificationStatus>('verifying');
    const [message, setMessage] = useState<string>('Verificando tu pago...');
    const [paymentDetails, setPaymentDetails] = useState<any>(null);

    useEffect(() => {
        const verifyPaymentFromUrl = async () => {
            // Obtener payment_id de la URL
            const paymentId = searchParams.get('payment_id');
            const preferenceId = searchParams.get('preference_id');
            const externalReference = searchParams.get('external_reference');

            console.log('🔍 PaymentSuccessPage - Parámetros recibidos:', {
                paymentId,
                preferenceId,
                externalReference
            });

            if (!paymentId && !preferenceId && !externalReference) {
                setStatus('error');
                setMessage('No se encontró información del pago en la URL');
                return;
            }

            try {
                setStatus('verifying');
                setMessage('⏳ Verificando tu pago con Mercado Pago...');

                // Llamar al endpoint de verificación
                const result = await verifyPayment({
                    paymentId: paymentId || undefined,
                    preferenceId: preferenceId || undefined,
                    externalReference: externalReference || undefined
                });

                console.log('✅ Resultado de verificación:', result);

                setPaymentDetails(result);

                // Verificar el estado del pago
                if (result.status === 'approved') {
                    setStatus('approved');
                    setMessage('🎉 ¡Pago aprobado! Tu cuenta ha sido actualizada a Black');

                    // Verificar que el usuario fue actualizado en Firebase
                    if (user?.uid) {
                        console.log('🔄 Verificando actualización del usuario en Firebase...');
                        setTimeout(async () => {
                            const userRole = await checkUserRole(user.uid);
                            console.log('👤 Rol del usuario después del pago:', userRole);

                            if (userRole.isPremium) {
                                console.log('✅ Usuario actualizado correctamente a Premium');
                            } else {
                                console.log('⚠️ Usuario aún no está como Premium, puede tardar unos segundos');
                            }
                        }, 2000);
                    }

                    // Redirigir a la página principal después de 3 segundos
                    setTimeout(() => {
                        navigate('/', { replace: true });
                    }, 3000);

                } else if (result.status === 'pending') {
                    setStatus('pending');
                    setMessage('⏳ Tu pago está pendiente de aprobación. Te notificaremos cuando se confirme.');
                } else if (result.status === 'rejected' || result.status === 'cancelled') {
                    setStatus('rejected');
                    setMessage('❌ El pago fue rechazado o cancelado. Intentá nuevamente.');
                } else {
                    setStatus('error');
                    setMessage(`Estado del pago: ${result.status}`);
                }

            } catch (error) {
                console.error('❌ Error verificando pago:', error);
                setStatus('error');
                setMessage(
                    error instanceof Error
                        ? `Error: ${error.message}`
                        : 'No se pudo verificar el pago. Intentá nuevamente más tarde.'
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
        <div className={`min-h-screen flex items-center justify-center p-4 ${currentTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
            <div className={`max-w-md w-full rounded-2xl p-8 shadow-2xl ${currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                }`}>
                {/* Icono de estado */}
                <div className="flex justify-center mb-6">
                    {getStatusIcon()}
                </div>

                {/* Título */}
                <h1 className="text-2xl font-bold text-center mb-4">
                    {status === 'approved' && '¡Pago Exitoso!'}
                    {status === 'verifying' && 'Verificando Pago'}
                    {status === 'pending' && 'Pago Pendiente'}
                    {status === 'rejected' && 'Pago Rechazado'}
                    {status === 'error' && 'Error'}
                </h1>

                {/* Mensaje */}
                <div className={`rounded-xl border-2 p-4 mb-6 ${getStatusColor()}`}>
                    <p className="text-center text-sm">{message}</p>
                </div>

                {/* Detalles del pago (solo si está aprobado) */}
                {status === 'approved' && paymentDetails && (
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Sparkles className="w-4 h-4 text-pink-500" />
                            <span>Modo DARK desbloqueado</span>
                        </div>

                        {paymentDetails.paymentId && (
                            <div className="text-xs text-center text-gray-500">
                                ID de pago: {paymentDetails.paymentId}
                            </div>
                        )}
                    </div>
                )}

                {/* Botones de acción */}
                <div className="space-y-3">
                    {status === 'approved' && (
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                            Redirigiendo a la página principal...
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

                {/* Información adicional */}
                <div className="mt-6 text-xs text-center text-gray-500">
                    {status === 'pending' && (
                        <p>Los pagos pueden tardar unos minutos en procesarse. Te notificaremos cuando se confirme.</p>
                    )}
                    {status === 'rejected' && (
                        <p>Si tenés algún problema, contactanos a soporte@steeb.app</p>
                    )}
                </div>
            </div>
        </div>
    );
}
