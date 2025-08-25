import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Bell, Moon, Sun, Palette, Volume2, VolumeX, Smartphone, Monitor, Database, Trash2, Info, Shield, HelpCircle, Type, Globe } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/hooks/useSettings';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { currentTheme, toggleTheme, isDark, isShiny, isLight } = useTheme();
  const { settings, updateGeneralSettings } = useSettings();
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [largeText, setLargeText] = useState(false);

  // Translation system
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      es: {
        // Header
        'settings': 'Configuración',
        
        // Appearance Section
        'appearance': 'Apariencia',
        'app_name': 'STEEB',
        'app_theme': 'Tema de la Aplicación',
        'light': 'Claro',
        'dark': 'Oscuro',
        'shiny': 'Shiny ✨',
        'app_language': 'Idioma de la Aplicación',
        'text_size': 'Tamaño de Texto',
        'text_size_desc': 'Grande (mejor legibilidad)',
        'text_size_normal': 'Normal',
        'compact_mode': 'Modo Compacto',
        
        // Notifications Section
        'notifications_sounds': 'Notificaciones y Sonidos',
        'push_notifications': 'Notificaciones Push',
        'sound_effects': 'Efectos de Sonido',
        
        // Data Section
        'data_backup': 'Datos y Respaldo',
        'backup_description': 'Respalda tus datos de STEEB en la nube',
        'auto_backup': 'Respaldo Automático',
        'export_data': 'Exportar Datos',
        'export_data_desc': 'Descargar copia de seguridad de todas tus tareas y configuraciones',
        'import_data': 'Importar Datos',
        'restore_description': 'Restaura tus datos de STEEB desde la nube',
        
        // Information Section
        'information': 'Información',
        'about_stebe': 'Acerca de STEBE',
        'app_description': 'Tu asistente de productividad STEEB',
        'help_support': 'Ayuda y Soporte',
        'help_desc': 'Guías de uso y solución de problemas',
        
        // Delete Section
        'delete_all_data': 'Eliminar Todos los Datos',
        'delete_warning': '⚠️ Esta acción no se puede deshacer',
        'delete_confirm': '¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.',
      },
      en: {
        // Header
        'settings': 'Settings',
        
        // Appearance Section
        'appearance': 'Appearance',
        'app_name': 'STEEB',
        'app_theme': 'App Theme',
        'light': 'Light',
        'dark': 'Dark',
        'shiny': 'Shiny ✨',
        'app_language': 'App Language',
        'text_size': 'Text Size',
        'text_size_desc': 'Large (better readability)',
        'text_size_normal': 'Normal',
        'compact_mode': 'Compact Mode',
        
        // Notifications Section
        'notifications_sounds': 'Notifications & Sounds',
        'push_notifications': 'Push Notifications',
        'sound_effects': 'Sound Effects',
        
        // Data Section
        'data_backup': 'Data & Backup',
        'auto_backup': 'Auto Backup',
        'export_data': 'Export Data',
        'export_data_desc': 'Download backup of all your tasks and settings',
        'import_data': 'Import Data',
        'restore_description': 'Restore your STEEB data from the cloud',
        
        // Information Section
        'information': 'Information',
        'about_stebe': 'About STEBE',
        'app_description': 'Your STEEB productivity assistant',
        'help_support': 'Help & Support',
        'help_desc': 'Usage guides and troubleshooting',
        
        // Delete Section
        'delete_all_data': 'Delete All Data',
        'delete_warning': '⚠️ This action cannot be undone',
        'delete_confirm': 'Are you sure you want to delete all data? This action cannot be undone.',
      }
    };
    
    return translations[settings.language]?.[key] || translations['es'][key] || key;
  };

  // El hook useTheme ya maneja la detección automática del tema

  // Cargar configuraciones guardadas
  useEffect(() => {
    const savedLargeText = localStorage.getItem('stebe-large-text');
    const savedCompactMode = localStorage.getItem('stebe-compact-mode');
    const savedNotifications = localStorage.getItem('stebe-notifications');
    const savedSoundEffects = localStorage.getItem('stebe-sound-effects');
    const savedAutoBackup = localStorage.getItem('stebe-auto-backup');
    const savedTheme = localStorage.getItem('stebe-theme');
    
    if (savedLargeText !== null) {
      const isLargeText = savedLargeText === 'true';
      setLargeText(isLargeText);
      // Aplicar clase CSS inmediatamente
      if (isLargeText) {
        document.documentElement.classList.add('large-text');
      }
    }
    if (savedCompactMode !== null) setCompactMode(savedCompactMode === 'true');
    if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
    if (savedSoundEffects !== null) setSoundEffects(savedSoundEffects === 'true');
    if (savedAutoBackup !== null) setAutoBackup(savedAutoBackup === 'true');
    
    // El hook useTheme ya maneja la aplicación del tema
  }, []);

  // El hook useTheme ya maneja el cambio de temas

  const toggleLargeText = () => {
    const newValue = !largeText;
    setLargeText(newValue);
    localStorage.setItem('stebe-large-text', String(newValue));
    
    // Aplicar clase CSS al documento
    if (newValue) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
  };

  const clearAllData = () => {
    if (window.confirm(t('delete_confirm'))) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const exportData = () => {
    const data = {
      tasks: localStorage.getItem('stebe-tasks'),
      monthlyGoals: localStorage.getItem('stebe-monthly-goal-text'),
      completedGoals: localStorage.getItem('stebe-completed-goals'),
      notes: localStorage.getItem('stebe-daily-notes'),
      settings: {
        theme: localStorage.getItem('theme'),
        notifications,
        soundEffects,
        autoBackup,
        compactMode
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stebe-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.tasks) localStorage.setItem('stebe-tasks', data.tasks);
            if (data.monthlyGoals) localStorage.setItem('stebe-monthly-goal-text', data.monthlyGoals);
            if (data.completedGoals) localStorage.setItem('stebe-completed-goals', data.completedGoals);
            if (data.notes) localStorage.setItem('stebe-daily-notes', data.notes);
            if (data.settings?.theme) localStorage.setItem('theme', data.settings.theme);
            
            alert('Datos importados correctamente. La página se recargará.');
            window.location.reload();
          } catch (error) {
            alert('Error al importar los datos. Verifica que el archivo sea válido.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

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

      {/* Sección: Apariencia */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          {t('appearance')}
        </h2>
        
        <div className="space-y-4">
          {/* Selección de Tema */}
          <div className="p-4 bg-gray-50 dark:bg-black rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Palette className="w-5 h-5" />
              <span className="font-medium">{t('app_theme')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => toggleTheme('light')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isLight
                    ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                    : 'border-gray-300 dark:border-white bg-white dark:bg-black text-gray-700 dark:text-white'
                }`}
              >
                <div className="text-center">
                  <div className="w-6 h-6 mx-auto mb-1 bg-yellow-400 rounded-full"></div>
                  <span className="text-xs font-medium">{t('light')}</span>
                </div>
              </button>
              
              <button
                onClick={() => toggleTheme('dark')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isDark
                    ? 'border-white bg-white text-black'
                    : 'border-gray-300 dark:border-white bg-gray-800 text-white'
                }`}
              >
                <div className="text-center">
                  <div className="w-6 h-6 mx-auto mb-1 bg-gray-600 rounded-full"></div>
                  <span className="text-xs font-medium">{t('dark')}</span>
                </div>
              </button>
              
              <button
                onClick={() => toggleTheme('shiny')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isShiny
                    ? 'border-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white'
                    : 'border-gray-300 dark:border-white bg-gray-800 text-white'
                }`}
              >
                <div className="text-center">
                  <div className="w-6 h-6 mx-auto mb-1 bg-gradient-to-r from-pink-300 via-purple-300 to-teal-300 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-xs font-medium">{t('shiny')}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Idioma */}
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

          {/* Tamaño de Texto */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black rounded-lg">
            <div className="flex items-center gap-3">
              <Type className="w-5 h-5" />
              <div>
                <span className="font-medium block">{t('text_size')}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {largeText ? t('text_size_desc') : t('text_size_normal')}
                </span>
              </div>
            </div>
            <button
              onClick={toggleLargeText}
              className={`w-12 h-6 rounded-full transition-colors ${
                largeText ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white dark:bg-black transition-transform transform ${
                largeText ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Modo Compacto */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black rounded-lg">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5" />
              <span className="font-medium">{t('compact_mode')}</span>
            </div>
            <button
              onClick={() => {
                const newValue = !compactMode;
                setCompactMode(newValue);
                localStorage.setItem('stebe-compact-mode', String(newValue));
              }}
              className={`w-12 h-6 rounded-full transition-colors ${
                compactMode ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white dark:bg-black transition-transform transform ${
                compactMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Sección: Notificaciones y Sonidos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t('notifications_sounds')}
        </h2>
        
        <div className="space-y-4">
          {/* Notificaciones */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <span className="font-medium">{t('push_notifications')}</span>
            </div>
            <button
              onClick={() => {
                const newValue = !notifications;
                setNotifications(newValue);
                localStorage.setItem('stebe-notifications', String(newValue));
              }}
              className={`w-12 h-6 rounded-full transition-colors ${
                notifications ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white dark:bg-black transition-transform transform ${
                notifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Efectos de Sonido */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black rounded-lg">
            <div className="flex items-center gap-3">
              {soundEffects ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="font-medium">{t('sound_effects')}</span>
            </div>
            <button
              onClick={() => {
                const newValue = !soundEffects;
                setSoundEffects(newValue);
                localStorage.setItem('stebe-sound-effects', String(newValue));
              }}
              className={`w-12 h-6 rounded-full transition-colors ${
                soundEffects ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white dark:bg-black transition-transform transform ${
                soundEffects ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Sección: Datos y Respaldo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          {t('data_backup')}
        </h2>
        
        <div className="space-y-4">
          {/* Respaldo Automático */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <span className="font-medium">{t('auto_backup')}</span>
            </div>
            <button
              onClick={() => {
                const newValue = !autoBackup;
                setAutoBackup(newValue);
                localStorage.setItem('stebe-auto-backup', String(newValue));
              }}
              className={`w-12 h-6 rounded-full transition-colors ${
                autoBackup ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white dark:bg-black transition-transform transform ${
                autoBackup ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Exportar Datos */}
          <button
            onClick={exportData}
            className="w-full p-4 bg-gray-50 dark:bg-black rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5" />
              <span className="font-medium">{t('export_data')}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('export_data_desc')}
            </p>
          </button>

          {/* Importar Datos */}
          <button
            onClick={importData}
            className="w-full p-4 bg-gray-50 dark:bg-black rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5" />
              <span className="font-medium">{t('import_data')}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('import_data_desc')}
            </p>
          </button>
        </div>
      </motion.div>

      {/* Sección: Información */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5" />
          {t('information')}
        </h2>
        
        <div className="space-y-4">
          {/* Acerca de */}
          <div className="p-4 bg-gray-50 dark:bg-black rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Smartphone className="w-5 h-5" />
              <span className="font-medium">{t('about_stebe')}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('about_desc')}
            </p>
          </div>

          {/* Ayuda */}
          <button className="w-full p-4 bg-gray-50 dark:bg-black rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">{t('help_support')}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('help_desc')}
            </p>
          </button>
        </div>
      </motion.div>

      {/* Botón de Eliminación de Datos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="mb-8"
      >
        <button
          onClick={clearAllData}
          className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="font-medium text-red-600 dark:text-red-400">{t('delete_all_data')}</span>
          </div>
          <p className="text-sm text-red-500 dark:text-red-400 mt-1">
            {t('delete_warning')}
          </p>
        </button>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
