import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Globe } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { settings, updateGeneralSettings } = useSettings();
  const { isShiny, toggleTheme } = useTheme();

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
    <div className="max-w-md mx-auto min-h-screen bg-white dark:bg-black text-black dark:text-white px-6 pt-4 pb-20">
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
                <span className="text-sm font-medium">🇪🇸 Español</span>
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
                <span className="text-sm font-medium">🇺🇸 English</span>
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
      {/* Fin: solo idioma */}
    </div>
  );
};

export default SettingsPage;
