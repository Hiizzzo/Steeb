import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

interface AuthScreenProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onComplete, onSkip }) => {
  const { user, login, loginWithGoogle, register, updateProfile, hasPasswordProvider, linkEmailPassword, resendEmailVerification } = useAuth();
  const [mode, setMode] = useState<'welcome' | 'login' | 'register' | 'onboarding'>(() => {
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
  // Detectar si existe un plugin nativo de Google disponible
  const hasNativeGoogle = (() => {
    try {
      const anyWin: any = globalThis as any;
      const Plugins = anyWin?.Capacitor?.Plugins;
      const Google = Plugins?.GoogleAuth || Plugins?.Google;
      return !!(isNative && Google && typeof Google.signIn === 'function');
    } catch {
      return false;
    }
  })();

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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      // Usar un pequeño delay para transición suave
      setTimeout(() => {
        setMode('onboarding');
      }, 300);
    } catch (err) {
      setError('Error al iniciar sesión con Google');
      setIsLoading(false);
    }
    // El loading se mantiene hasta que la transición termine
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(formData.email, formData.password);
      onComplete();
    } catch (err: any) {
      const code = err?.code || '';
      const msg =
        code === 'auth/invalid-email' ? 'Email inválido'
        : code === 'auth/user-disabled' ? 'Usuario deshabilitado'
        : code === 'auth/user-not-found' ? 'No existe una cuenta con ese email'
        : code === 'auth/wrong-password' ? 'Contraseña incorrecta'
        : code === 'auth/operation-not-allowed' ? 'El método Email/Contraseña está deshabilitado en Firebase'
        : code === 'auth/too-many-requests' ? 'Demasiados intentos, intenta más tarde'
        : code === 'auth/network-request-failed' ? 'Error de red. Verifica tu conexión'
        : 'No se pudo iniciar sesión';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await register(formData.email, formData.password, formData.name, formData.nickname);
      onComplete();
    } catch (err: any) {
      const code = err?.code || '';
      const msg =
        code === 'auth/email-already-in-use' ? 'Ese email ya está registrado'
        : code === 'auth/invalid-email' ? 'Email inválido'
        : code === 'auth/weak-password' ? 'La contraseña es muy débil (mínimo 6 caracteres)'
        : code === 'auth/operation-not-allowed' ? 'El método Email/Contraseña está deshabilitado en Firebase'
        : code === 'auth/network-request-failed' ? 'Error de red. Verifica tu conexión'
        : err?.message || 'No se pudo crear la cuenta';
      setError(msg);
    } finally {
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
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <motion.div 
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <img 
              src="/lovable-uploads/ChatGPT Image Aug 28, 2025, 12_08_57 AM.png" 
              alt="STEEB" 
              className="w-24 h-24 mx-auto rounded-2xl mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Bienvenido a STEEB!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Hola, soy STEEB y te voy a ayudar para que hagas tus tareas y dejes de scrollear.
            </p>
          </div>

          <div className="space-y-4">
            {(!isNative || hasNativeGoogle) && (
              <>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 p-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {isLoading ? 'Autenticando...' : 'Continuar con Google'}
                </button>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">o</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
                </div>
              </>
            )}

            {isNative && !hasNativeGoogle && (
              <div className="text-sm text-gray-600 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                En la app iOS usa Email/Contraseña por ahora. Para Google en iOS, instala y configura el plugin nativo y reinicia la app.
              </div>
            )}

            <button
              onClick={() => setMode('login')}
              className="w-full bg-black text-white dark:bg-white dark:text-black py-3 px-4 rounded-xl font-medium hover:bg-gray-900 dark:hover:bg-gray-200 transition-colors"
            >
              Iniciar Sesión
            </button>

            <button
              onClick={() => setMode('register')}
              className="w-full bg-transparent border-2 border-black text-black dark:border-white dark:text-white py-3 px-4 rounded-xl font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              Crear Cuenta
            </button>
            
            {/* Botón Skip */}
            {onSkip && (
              <button
                onClick={onSkip}
                className="w-full text-gray-500 dark:text-gray-400 py-2 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors mt-4"
              >
                Skip
              </button>
            )}
          </div>
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Contraseña (mín. 6 caracteres)"
                  />
                  <input
                    id="onb-password2"
                    type="password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                onClick={() => resendEmailVerification().catch(() => {})}
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
            src="/lovable-uploads/icono de la app.png" 
            alt="STEEB" 
            className="w-16 h-16 mx-auto rounded-2xl mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-6">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => inputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cuál es tu apodo?
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => inputChange('nickname', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => inputChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => inputChange('password', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="text-white text-sm text-center bg-black/80 border border-white/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black py-3 px-4 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Cargando...' : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>

          <button
            type="button"
            onClick={() => setMode('welcome')}
            className="w-full text-gray-600 dark:text-gray-400 py-2 text-sm hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            ← Volver
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
