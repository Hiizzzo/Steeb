import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import steebIcon from '../../assets/steeb-icon.png';

// Definir tipos globales para la comunicación con el WebView
declare global {
  interface Window {
    handleNativeGoogleLogin?: (idToken: string) => void;
    handleNativeGoogleLoginError?: (error: string) => void;
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

interface AuthScreenProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onComplete, onSkip }) => {
  const { user, loginWithGoogle, updateProfile, hasPasswordProvider, linkEmailPassword, resendEmailVerification } = useAuth();
  const [mode, setMode] = useState<'welcome' | 'onboarding'>(() => {
    // Si ya hay usuario autenticado y faltan datos, arrancar en onboarding
    if (user && (!user.name || !user.nickname)) return 'onboarding';
    return 'welcome';
  });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    nickname: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  // Si el usuario está autenticado pero sin perfil completo, abrir onboarding automáticamente
  useEffect(() => {
    if (user && (!user.name || !user.nickname)) {
      setMode('onboarding');
      setIsLoading(false); // Limpiar loading cuando llegamos al onboarding
    }
  }, [user]);

  // Si el usuario está autenticado y el perfil está completo, entrar automáticamente
  useEffect(() => {
    if (user && user.name && user.nickname) {
      onComplete();
    }
  }, [user]);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');

    // DETECCIÓN DE ENTORNO NATIVO (PUENTE)
    const isNativeWrapper = navigator.userAgent.includes('SteebNativeWrapper');

    if (isNativeWrapper && window.ReactNativeWebView) {
      console.log('📲 Usando Puente Nativo para Google Sign-In');

      // 1. Definir el callback que llamará la app nativa
      window.handleNativeGoogleLogin = async (idToken: string) => {
        try {
          console.log('📲 Token recibido del nativo, autenticando en Firebase...');
          // Importar dinámicamente para evitar errores de SSR si fuera el caso
          const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
          const { auth } = await import('../lib/firebase'); // Asegúrate de importar tu instancia de auth

          const credential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, credential);

          // El hook useAuth detectará el cambio de usuario y redirigirá
          console.log('✅ Autenticación nativa exitosa');
        } catch (err: any) {
          console.error('❌ Error en login nativo:', err);
          setError('Error al iniciar sesión con Google (Nativo)');
          setIsLoading(false);
        }
      };

      window.handleNativeGoogleLoginError = (errorCode: string) => {
        console.error('❌ Error reportado por nativo:', errorCode);
        setError('Cancelado o error en la app nativa');
        setIsLoading(false);
      };

      // 2. Enviar mensaje a la app nativa para iniciar el flujo
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loginGoogle' }));
      return; // Detener flujo web normal
    }

    // FLUJO WEB NORMAL (Vercel / Navegador)
    try {
      // Forzar que siempre muestre el selector de cuentas de Google
      await loginWithGoogle(true); // true = forceAccountPicker

      // Si el usuario es nuevo o no tiene perfil completo, ir a onboarding
      // Si ya tiene perfil, entrar directamente
      const userAfterAuth = user; // El hook ya actualiza el usuario
      if (!userAfterAuth?.name || !userAfterAuth?.nickname) {
        setTimeout(() => {
          setMode('onboarding');
        }, 300);
      } else {
        onComplete();
      }
    } catch (err: any) {
      console.error('❌ Error en Google Auth:', err);

      // Mensaje específico para iOS
      if (isNative && err?.message?.includes('iOS')) {
        setError('En iOS, instala el plugin de Google Sign-In nativo');
      } else {
        setError(err?.message || 'Error al autenticarse con Google');
      }
      setIsLoading(false);
    }
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.nickname.trim()) {
      setIsLoading(true);
      setError('');
      try {
        // 1) Disparar actualización de perfil en background (optimista en el hook)
        const updateP = updateProfile(formData.name.trim(), formData.nickname.trim());

        // 2) Enlazar contraseña en background si aplica
        const pwd = (document.getElementById('onb-password') as HTMLInputElement | null)?.value || '';
        const pwd2 = (document.getElementById('onb-password2') as HTMLInputElement | null)?.value || '';
        if (pwd || pwd2) {
          if (pwd.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
          if (pwd !== pwd2) throw new Error('Las contraseñas no coinciden');
          if (!hasPasswordProvider()) {
            // Run without bloquear la navegación
            linkEmailPassword(pwd).catch(() => {
              // Silencioso; el usuario podrá intentarlo luego
            });
          }
        }

        // 3) Navegar de inmediato
        setIsLoading(false);
        onComplete();
        // No esperamos updateP; si falla, el hook deja el estado local y se puede reintentar
        void updateP;
      } catch (err: any) {
        setError(err?.message || 'No se pudo guardar tu perfil');
        setIsLoading(false);
      }
    } else {
      setError('Por favor completa todos los campos');
    }
  };

  const inputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  if (mode === 'welcome') {
    return (
      <div className="auth-welcome-container min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-4" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
        <motion.div
          className="auth-card max-w-md w-full bg-white border-2 border-white rounded-3xl p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-bold text-black mb-6">
            ¡Bienvenido a STEEB!
          </h1>

          <div className="mb-8 flex justify-center">
            <img
              src={steebIcon}
              alt="STEEB"
              className="w-40 h-40 object-contain"
            />
          </div>

          <p className="text-black text-lg mb-8">
            El niño prodigio que te salvará
          </p>

          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 p-4 border-2 border-black rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#ffffff',
              background: '#ffffff',
              backgroundImage: 'none'
            }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#000000" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#000000" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#000000" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#000000" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span className="font-medium text-black text-lg">
              {isLoading ? 'Conectando con STEEB...' : 'Entrar con Google'}
            </span>
          </button>
        </motion.div>
      </div>
    );
  }

  // Mostrar onboarding si el usuario está autenticado pero no tiene nombre/apodo
  if (mode === 'onboarding') {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <motion.div
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <img
              src="/lovable-uploads/ChatGPT Image Aug 28, 2025, 12_08_57 AM.png"
              alt="STEEB"
              className="w-16 h-16 mx-auto rounded-2xl mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Cuéntanos sobre ti!
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Para personalizar tu experiencia
            </p>
          </div>

          <form onSubmit={handleOnboarding} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tu nombre completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => inputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-input"
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cómo te gusta que te llamen?
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => inputChange('nickname', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-input"
                placeholder="Ej: Juan, Juancho, JP..."
                required
              />
            </div>

            {user && user.provider === 'google' && (
              <>
                {!hasPasswordProvider() && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      (Opcional) Crea una contraseña para entrar sin Google
                    </label>
                    <input
                      id="onb-password"
                      type="password"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-input"
                      placeholder="Contraseña (mín. 6 caracteres)"
                    />
                    <input
                      id="onb-password2"
                      type="password"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-input"
                      placeholder="Repite la contraseña"
                    />
                  </div>
                )}
              </>
            )}

            {user && !user.emailVerified && (
              <div className="pt-2">
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Tu email no está verificado. Te enviamos un correo al registrarte.</p>
                <button
                  type="button"
                  onClick={() => resendEmailVerification().catch(() => { })}
                  className="text-xs underline text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white"
                >
                  Reenviar verificación
                </button>
              </div>
            )}

            {error && (
              <div className="text-white text-sm text-center bg-black/80 border border-white/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 p-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              {isLoading ? 'Guardando...' : 'Continuar'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Este componente ya no necesita mostrar formularios de login/registro
  // Solo maneja welcome y onboarding
  return null;
};

export default AuthScreen;
