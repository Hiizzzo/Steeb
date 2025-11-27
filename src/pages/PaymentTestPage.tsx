import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, ArrowRight, Info } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useUnifiedUserAccess } from '@/hooks/useUnifiedUserAccess';

export default function PaymentTestPage() {
    const navigate = useNavigate();
    const { currentTheme } = useTheme();
    const { user, currentRole } = useUnifiedUserAccess();

    const [testPaymentId, setTestPaymentId] = useState('');
    const [useRealPayment, setUseRealPayment] = useState(false);

    const handleSimulateSuccess = () => {
        // Simular redirección de Mercado Pago con un payment_id de prueba
        const simulatedPaymentId = testPaymentId || '1234567890';
        navigate(`/payments/success?payment_id=${simulatedPaymentId}`);
    };

    const handleSimulateWithPreference = () => {
        // Simular con preferenceId
        navigate(`/payments/success?preference_id=test-preference-123&external_reference=black-user-plan_${user?.uid}_${Date.now()}`);
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${currentTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
            <div className={`max-w-2xl w-full rounded-2xl p-8 shadow-2xl ${currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                }`}>
                <h1 className="text-3xl font-bold text-center mb-6">
                    🧪 Simulador de Pago
                </h1>

                {/* Info del usuario actual */}
                <div className={`rounded-xl border-2 p-4 mb-6 ${currentTheme === 'dark'
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-blue-500 bg-blue-50'
                    }`}>
                    <div className="flex items-start gap-2">
                        <Info className="w-5 h-5 mt-0.5 text-blue-500" />
                        <div className="flex-1">
                            <p className="font-semibold mb-2">Estado Actual del Usuario</p>
                            <div className="space-y-1 text-sm">
                                <p><strong>UID:</strong> {user?.uid || 'No autenticado'}</p>
                                <p><strong>Email:</strong> {user?.email || 'No disponible'}</p>
                                <p><strong>Rol Actual:</strong> <span className={`font-bold ${currentRole === 'premium' ? 'text-green-500' : 'text-yellow-500'
                                    }`}>{currentRole}</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Opción 1: Simular con payment_id */}
                    <div className={`rounded-xl border-2 p-6 ${currentTheme === 'dark'
                            ? 'border-gray-700 bg-gray-700/50'
                            : 'border-gray-200 bg-gray-50'
                        }`}>
                        <h2 className="text-xl font-bold mb-4">Opción 1: Simular con Payment ID</h2>
                        <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
                            Esto simulará la redirección de Mercado Pago después de un pago exitoso.
                            El sistema intentará verificar el pago usando el payment_id.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Payment ID (opcional - usa uno real si tenés)
                                </label>
                                <input
                                    type="text"
                                    value={testPaymentId}
                                    onChange={(e) => setTestPaymentId(e.target.value)}
                                    placeholder="Ej: 1234567890 o dejá vacío para usar uno de prueba"
                                    className={`w-full px-4 py-2 rounded-lg border ${currentTheme === 'dark'
                                            ? 'bg-gray-800 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="useReal"
                                    checked={useRealPayment}
                                    onChange={(e) => setUseRealPayment(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="useReal" className="text-sm">
                                    Usar un payment_id real (el backend verificará con Mercado Pago)
                                </label>
                            </div>

                            <button
                                onClick={handleSimulateSuccess}
                                className="w-full py-3 rounded-xl font-semibold bg-green-600 text-white flex items-center justify-center gap-2 hover:bg-green-700 transition"
                            >
                                <PlayCircle className="w-5 h-5" />
                                Simular Pago Exitoso
                            </button>
                        </div>
                    </div>

                    {/* Opción 2: Simular con preferenceId */}
                    <div className={`rounded-xl border-2 p-6 ${currentTheme === 'dark'
                            ? 'border-gray-700 bg-gray-700/50'
                            : 'border-gray-200 bg-gray-50'
                        }`}>
                        <h2 className="text-xl font-bold mb-4">Opción 2: Simular con Preference ID</h2>
                        <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
                            Esto simulará usando un preferenceId y externalReference.
                            El backend buscará el pago asociado a esta preferencia.
                        </p>

                        <button
                            onClick={handleSimulateWithPreference}
                            className="w-full py-3 rounded-xl font-semibold bg-blue-600 text-white flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                        >
                            <PlayCircle className="w-5 h-5" />
                            Simular con Preference ID
                        </button>
                    </div>

                    {/* Advertencia */}
                    <div className={`rounded-xl border-2 p-4 ${currentTheme === 'dark'
                            ? 'border-yellow-500 bg-yellow-900/20'
                            : 'border-yellow-500 bg-yellow-50'
                        }`}>
                        <p className="text-sm">
                            <strong>⚠️ Nota:</strong> Si usás un payment_id de prueba (no real),
                            el backend intentará verificarlo con Mercado Pago y probablemente falle.
                            Para probar el flujo completo, necesitás un payment_id real de un pago que hayas hecho.
                        </p>
                    </div>

                    {/* Botón para volver */}
                    <button
                        onClick={() => navigate('/')}
                        className={`w-full py-3 rounded-xl font-semibold border-2 flex items-center justify-center gap-2 transition ${currentTheme === 'dark'
                                ? 'border-white hover:bg-gray-700'
                                : 'border-black hover:bg-gray-100'
                            }`}
                    >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                        Volver al Inicio
                    </button>
                </div>

                {/* Instrucciones adicionales */}
                <div className="mt-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <h3 className="font-bold mb-2">📝 Cómo obtener un payment_id real:</h3>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                        <li>Hacé un pago real de $3000 ARS desde la app</li>
                        <li>Después del pago, Mercado Pago te redirigirá con el payment_id en la URL</li>
                        <li>Copiá ese payment_id y pegalo arriba</li>
                        <li>O revisá los logs del backend para ver los payment_ids procesados</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
