import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Globe, Bell, User, LogOut } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { NotificationSettings } from '@/components/NotificationSettings';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { settings, updateGeneralSettings } = useSettings();
  const { isShiny, toggleTheme } = useTheme();
  const { name, nickname, clearProfile } = useUserProfile();
  const { user, linkGoogleAccount } = useAuth();
  const isGoogleLinked = user?.provider === 'google';

  const handleClearProfile = () => {
    clearProfile();
    navigate('/');
  };

  // Translation system
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      es: {
        'settings': 'Configuración',
        'app_language': 'Idioma de la Aplicación',
        'shiny_toggle': 'Activar modo Shiny',
        'enabled': 'Activado',
        'disabled': 'Desactivado',
      },
      en: {
        'settings': 'Settings',
        'app_language': 'App Language',
        'shiny_toggle': 'Enable Shiny mode',
        'enabled': 'Enabled',
        'disabled': 'Disabled',
      }
    };
    
    return translations[settings.language]?.[key] || translations['es'][key] || key;
  };

  // Solo se mantiene el selector de idioma

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white dark:bg-black text-black dark:text-white px-6 pt-4 pb-20 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">{t('settings')}</h1>
        <Settings className="w-6 h-6" />
      </div>
      {/* Único ajuste disponible: Idioma */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="p-4 bg-gray-50 dark:bg-black rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5" />
            <span className="font-medium">{t('app_language')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateGeneralSettings({ language: 'es' })}
              className={`p-3 rounded-lg border-2 transition-all ${
                settings.language === 'es'
                  ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                  : 'border-gray-300 dark:border-white bg-white dark:bg-black text-gray-700 dark:text-white'
              }`}
            >
              <div className="text-center">
                <span className="text-sm font-medium">Español</span>
              </div>
            </button>
            
            <button
              onClick={() => updateGeneralSettings({ language: 'en' })}
              className={`p-3 rounded-lg border-2 transition-all ${
                settings.language === 'en'
                  ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                  : 'border-gray-300 dark:border-white bg-white dark:bg-black text-gray-700 dark:text-white'
              }`}
            >
              <div className="text-center">
                <span className="text-sm font-medium">English</span>
              </div>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Shiny toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black rounded-lg">
          <div>
            <span className="font-medium block">{t('shiny_toggle')} ✨</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{isShiny ? t('enabled') : t('disabled')}</span>
          </div>
          <button
            onClick={() => toggleTheme(isShiny ? 'light' : 'shiny')}
            className={`w-12 h-6 rounded-full transition-colors ${
              isShiny ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white dark:bg-black transition-transform transform ${
              isShiny ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </motion.div>
      {/* Notificaciones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-8"
      >
        <NotificationSettings />
      </motion.div>
      {/* Perfil de Usuario */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-8"
      >
        <div className="p-4 bg-gray-50 dark:bg-black rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5" />
            <span className="font-medium">Perfil de Usuario</span>
          </div>
          
          <div className="space-y-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-black dark:text-white">
                  {name || 'Usuario'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {nickname && `"${nickname}"` || 'Sin apodo configurado'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nombre completo</div>
                <div className="font-medium text-black dark:text-white">{name || 'No configurado'}</div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Apodo</div>
                <div className="font-medium text-black dark:text-white">{nickname || 'No configurado'}</div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cuenta vinculada</div>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-black dark:text-white">
                    {isGoogleLinked ? 'Vinculada con Google' : 'No vinculada'}
                  </div>
                  {!isGoogleLinked && (
                    <button
                      onClick={async () => {
                        try {
                          await linkGoogleAccount();
                        } catch (e: any) {
                          alert(e?.message || 'No se pudo vincular con Google. Intenta desde navegador si estás en iOS.');
                        }
                      }}
                      className="text-sm bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                      Vincular con Google
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <User className="w-4 h-4" />
              <span className="font-medium">Editar Perfil</span>
            </button>
            <button
              onClick={handleClearProfile}
              className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Reiniciar Perfil</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Fin: configuraciones */}
    </div>
  );
};

export default SettingsPage;
