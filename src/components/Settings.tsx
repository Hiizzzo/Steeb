// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Moon,
  Sun,
  Bell,
  Lock,
  User,
  HelpCircle,
  Info,
  ChevronRight,
  Volume2,
  Smartphone,
  Palette,
  Globe,
  Shield,
  Database,
  Zap,
  Check
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTaskStore } from '@/store/useTaskStore';

const SettingsUI: React.FC = () => {
  const { user } = useAuth();
  const { stats } = useTaskStore();

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  const settingCategories = [
    {
      title: 'Apariencia',
      icon: Palette,
      settings: [
        {
          title: 'Modo Oscuro',
          icon: Moon,
          description: 'Cambiar entre tema claro y oscuro',
          type: 'toggle',
          value: darkMode,
          onChange: setDarkMode,
          enabled: true
        }
      ]
    },
    {
      title: 'Notificaciones',
      icon: Bell,
      settings: [
        {
          title: 'Notificaciones Push',
          icon: Bell,
          description: 'Recibir recordatorios de tareas',
          type: 'toggle',
          value: notifications,
          onChange: setNotifications,
          enabled: true
        },
        {
          title: 'Recordatorio Diario',
          icon: Smartphone,
          description: 'Notificación diaria para revisar tareas',
          type: 'toggle',
          value: dailyReminder,
          onChange: setDailyReminder,
          enabled: notifications
        },
        {
          title: 'Reporte Semanal',
          icon: HelpCircle,
          description: 'Resumen de progreso cada semana',
          type: 'toggle',
          value: weeklyReport,
          onChange: setWeeklyReport,
          enabled: notifications
        }
      ]
    },
    {
      title: 'Experiencia',
      icon: Zap,
      settings: [
        {
          title: 'Efectos de Sonido',
          icon: Volume2,
          description: 'Sonidos al completar tareas',
          type: 'toggle',
          value: soundEffects,
          onChange: setSoundEffects,
          enabled: true
        }
      ]
    },
    {
      title: 'Privacidad',
      icon: Shield,
      settings: [
        {
          title: 'Privacidad de Datos',
          icon: Lock,
          description: 'Controlar quién ve tus tareas',
          type: 'link',
          value: '',
          onChange: () => ('Navegar a privacidad'),
          enabled: true
        },
        {
          title: 'Exportar Datos',
          icon: Database,
          description: 'Descargar copia de tus tareas',
          type: 'link',
          value: '',
          onChange: () => ('Exportar datos'),
          enabled: true
        }
      ]
    }
  ];

  const handleSettingChange = (setting: any, value: any) => {
    setting.onChange(value);
    (`Setting ${setting.title} changed to:`, value);
  };

  const getToggleComponent = (setting: any) => (
    <button
      onClick={() => handleSettingChange(setting, !setting.value)}
      disabled={!setting.enabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        !setting.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${setting.value ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          setting.value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const getLinkComponent = (setting: any) => (
    <button
      onClick={() => handleSettingChange(setting, null)}
      disabled={!setting.enabled}
      className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${
        !setting.enabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto p-6"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-black dark:text-white mb-2 flex items-center">
            <Settings className="w-10 h-10 mr-3" />
            Configuración
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Personalizá tu experiencia en STEEB
          </p>
        </div>

        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-xl p-6 mb-8"
        >
          <div className="flex items-center">
            <div className="w-20 h-20 bg-black dark:bg-white rounded-full flex items-center justify-center text-3xl text-white dark:text-black mr-4">
              {user?.avatar || '👤'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                {user?.name || user?.nickname || 'Usuario STEEB'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                {user?.email || 'usuario@steeb.com'}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>🎯 {stats.totalTasks} tareas totales</span>
                <span>🔥 {stats.currentStreak} días seguidos</span>
                <span>⭐ {stats.completionRate.toFixed(1)}% completion</span>
              </div>
            </div>
            <button className="px-4 py-2 border border-black dark:border-white text-black dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center">
              <User className="w-4 h-4 mr-2" />
              Editar Perfil
            </button>
          </div>
        </motion.div>

        {/* Settings Categories */}
        <div className="space-y-6">
          {settingCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-xl overflow-hidden"
            >
              {/* Category Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center">
                  <category.icon className="w-6 h-6 text-black dark:text-white mr-3" />
                  <h3 className="text-lg font-bold text-black dark:text-white">
                    {category.title}
                  </h3>
                </div>
              </div>

              {/* Settings List */}
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {category.settings.map((setting, settingIndex) => (
                  <div
                    key={setting.title}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <setting.icon className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
                          <h4 className="font-semibold text-black dark:text-white">
                            {setting.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                          {setting.description}
                        </p>
                      </div>
                      <div className="ml-4">
                        {setting.type === 'toggle' && getToggleComponent(setting)}
                        {setting.type === 'link' && getLinkComponent(setting)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <button className="flex items-center hover:text-black dark:hover:text-white transition-colors">
              <HelpCircle className="w-4 h-4 mr-1" />
              Ayuda
            </button>
            <button className="flex items-center hover:text-black dark:hover:text-white transition-colors">
              <Info className="w-4 h-4 mr-1" />
              Acerca de
            </button>
            <button className="flex items-center hover:text-black dark:hover:text-white transition-colors">
              <Globe className="w-4 h-4 mr-1" />
              Idioma
            </button>
          </div>

          <div className="mt-4">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              STEEB v1.0.0 • Creado con ❤️ por Santiago Benítez
            </p>
          </div>
        </motion.div>

        {/* Save Changes Confirmation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
            onClick={() => ('Settings saved:', {
              darkMode,
              notifications,
              soundEffects,
              dailyReminder,
              weeklyReport
            })}
          >
            <Check className="w-5 h-5 mr-2" />
            Guardar Cambios
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SettingsUI;
