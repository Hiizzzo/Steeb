import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Smartphone, Star, Heart, Mail, Github } from 'lucide-react';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import SwipeNavigationIndicator from '@/components/SwipeNavigationIndicator';
import { useTheme } from '../hooks/useTheme';

const AboutPage = () => {
  const navigate = useNavigate();
  const { isShiny } = useTheme();

  // Sistema de navegación por swipe
  const { SwipeHandler, isSwiping, swipeProgress } = useSwipeNavigation({
    direction: 'left',
    threshold: 80,
    duration: 500,
    enableMouse: true, // Habilitado para PC
    onSwipe: () => navigate('/settings') // About vuelve a settings, no al inicio
  });

  const features = [
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Gestión de Tareas",
      description: "Crea, organiza y completa tus tareas con un sistema intuitivo"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Productividad",
      description: "Métricas detalladas sobre tu rendimiento y patrones de productividad"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Privacidad Total",
      description: "Tus datos se almacenan localmente. No hacemos seguimiento ni publicidad"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Diseño Cuidado",
      description: "Interfaz minimalista y agradable que facilita el uso diario"
    }
  ];

  const handleBack = () => {
    navigate('/settings');
  };

  return (
    <SwipeHandler>
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-md mx-auto px-6 pt-4">
          {/* Header simplificado */}
          <div className="flex items-center justify-center mb-8">
            <h1 className={`text-2xl font-bold ${isShiny ? 'tareas-multicolor' : ''}`}>Acerca de STEEB</h1>
          </div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-3xl font-bold">S</span>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isShiny ? 'tareas-multicolor' : ''}`}>STEEB</h2>
          <p className={`${isShiny ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'} mb-4`}>
            Tu compañero inteligente para la gestión de tareas
          </p>
          <div className={`text-sm ${isShiny ? 'text-white/60' : 'text-gray-500 dark:text-gray-500'}`}>
            Versión 1.0.0
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-1 gap-4 mb-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
              className={`p-4 rounded-lg border ${isShiny ? 'bg-white/10 border-white/20' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isShiny ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${isShiny ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-sm ${isShiny ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Privacy Commitment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className={`p-4 rounded-lg border mb-8 ${isShiny ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-white/20' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className={`font-semibold ${isShiny ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              Compromiso de Privacidad
            </h3>
          </div>
          <p className={`text-sm ${isShiny ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'} mb-3`}>
            STEEB respeta tu privacidad. No recopilamos datos para publicidad, no hacemos seguimiento y tus datos personales permanecen en tu dispositivo.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.open('/PRIVACY_POLICY.md', '_blank')}
              className={`text-sm font-medium ${isShiny ? 'text-white underline' : 'text-blue-600 dark:text-blue-400 underline'}`}
            >
              Ver Política de Privacidad
            </button>
            <span className={`text-sm ${isShiny ? 'text-white/60' : 'text-gray-500'}`}> • </span>
            <button
              onClick={() => window.open('/TERMS_OF_SERVICE.md', '_blank')}
              className={`text-sm font-medium ${isShiny ? 'text-white underline' : 'text-blue-600 dark:text-blue-400 underline'}`}
            >
              Términos de Servicio
            </button>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className={`p-4 rounded-lg border ${isShiny ? 'bg-white/10 border-white/20' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}
        >
          <h3 className={`font-semibold mb-3 ${isShiny ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            Contacto
          </h3>
          <div className="space-y-2">
            <a
              href="mailto:privacy@steeb-app.com"
              className={`flex items-center gap-2 text-sm ${isShiny ? 'text-white/80 hover:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} transition-colors`}
            >
              <Mail className="w-4 h-4" />
              privacy@steeb-app.com
            </a>
            <a
              href="https://github.com/steeb-app"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 text-sm ${isShiny ? 'text-white/80 hover:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} transition-colors`}
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className={`text-center mt-12 mb-8 text-sm ${isShiny ? 'text-white/60' : 'text-gray-500 dark:text-gray-500'}`}
        >
          <p>Hecho con ❤️ para ayudarte a ser más productivo</p>
          <p className="mt-1">© 2025 STEEB. Todos los derechos reservados.</p>
        </motion.div>

        {/* Indicador de navegación por swipe */}
        <SwipeNavigationIndicator
          isVisible={isSwiping}
          progress={swipeProgress}
          direction="left"
        />
        </div>
      </div>
    </SwipeHandler>
  );
};

export default AboutPage;