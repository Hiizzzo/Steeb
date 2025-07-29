import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import EnhancedCalendarDemo from '@/components/EnhancedCalendarDemo';

const EnhancedCalendarPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-blue-950">
      {/* Header */}
      <motion.div 
        className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Volver
                </Button>
              </motion.div>
              
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={24} className="text-blue-500" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Enhanced Calendar
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Calendario altamente dinámico para Stebe
                  </p>
                </div>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full"
            >
              <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                ✨ Demo interactivo
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center mb-12">
          <motion.h2 
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Calendario del futuro
            </span>
          </motion.h2>
          
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Experimentá un calendario que combina <strong>animaciones fluidas</strong>, 
            <strong> diseño minimalista</strong> y <strong>máxima funcionalidad</strong>. 
            Cada interacción está pensada para hacer de la gestión de tareas una experiencia visual increíble.
          </motion.p>
          
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            {[
              { emoji: "🎯", text: "Deslizamiento iOS" },
              { emoji: "🎪", text: "Efecto rebote" },
              { emoji: "🔄", text: "Transiciones 3D" },
              { emoji: "✨", text: "Indicadores animados" }
            ].map((feature, index) => (
              <motion.div
                key={feature.text}
                className="flex flex-col items-center p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <span className="text-2xl mb-2">{feature.emoji}</span>
                <span className="text-sm font-medium text-center">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Demo Component */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <EnhancedCalendarDemo />
      </motion.div>

      {/* Technical Details */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Code Example */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4 }}
          >
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Implementación simple
            </h3>
            
            <div className="bg-gray-900 rounded-2xl p-6 overflow-x-auto">
              <pre className="text-green-400 text-sm">
{`import EnhancedCalendar from '@/components/EnhancedCalendar';

// Uso básico con todas las animaciones
<EnhancedCalendar
  tasks={tasks}
  onDateSelect={handleDateSelect}
  onToggleTask={handleToggleTask}
  
  // Configuración personalizada
  animationConfig={{
    monthTransition: 0.4,
    daySelection: 0.3,
    bounceEasing: [0.68, -0.55, 0.265, 1.55]
  }}
  
  // Características opcionales
  enableAnimations={true}
  showTaskIndicators={true}
  autoDetectTheme={true}
/>`}
              </pre>
            </div>
          </motion.div>
          
          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6 }}
          >
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              Características técnicas
            </h3>
            
            <div className="space-y-4">
              {[
                {
                  title: "Animaciones optimizadas",
                  desc: "60fps constantes con spring physics y easing personalizado",
                  icon: "⚡"
                },
                {
                  title: "Tema automático",
                  desc: "Detección automática del tema del sistema con gradientes adaptativos",
                  icon: "🎨"
                },
                {
                  title: "Configuración granular",
                  desc: "Control total sobre duraciones, colores y comportamientos",
                  icon: "⚙️"
                },
                {
                  title: "Performance optimizado",
                  desc: "Memoización inteligente y gestión eficiente del estado",
                  icon: "🔥"
                },
                {
                  title: "Responsive design",
                  desc: "Adaptación perfecta a mobile, tablet y desktop",
                  icon: "📱"
                },
                {
                  title: "Accesibilidad",
                  desc: "Soporte completo para lectores de pantalla y navegación por teclado",
                  icon: "♿"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div 
        className="max-w-4xl mx-auto px-4 py-16 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0 }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-white/10"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-4">
              ¿Listo para transformar tu calendario?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Implementá el Enhanced Calendar en tu proyecto y dale a tus usuarios 
              la mejor experiencia de gestión de tareas.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() => window.open('/ENHANCED_CALENDAR_README.md', '_blank')}
                >
                  📖 Ver documentación
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  onClick={() => navigate('/monthly-calendar')}
                >
                  🚀 Ver en acción
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedCalendarPage;