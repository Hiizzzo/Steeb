import React from 'react';
import { motion } from 'framer-motion';
import { Star, Zap, Sparkles, Rainbow } from 'lucide-react';

const ShinyDemo = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Título con efecto neón */}
      <motion.h1 
        className="text-4xl font-bold text-center mb-8"
        animate={{ 
          textShadow: [
            "0 0 15px #ff6b9d",
            "0 0 25px #9c88ff", 
            "0 0 35px #4ecdc4",
            "0 0 15px #ff6b9d"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        ✨ Nuevo Shiny Elegante ✨
      </motion.h1>

      {/* Tarjetas con efectos neón */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta 1 */}
        <motion.div 
          className="p-6 rounded-xl border-2 relative overflow-hidden"
          whileHover={{ scale: 1.05 }}
          animate={{ 
            boxShadow: [
              "0 0 20px rgba(255, 107, 157, 0.4)",
              "0 0 40px rgba(156, 136, 255, 0.4)",
              "0 0 20px rgba(78, 205, 196, 0.4)",
              "0 0 20px rgba(255, 107, 157, 0.4)"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-8 h-8 text-pink-400" />
            <h3 className="text-xl font-semibold">Efectos Neón</h3>
          </div>
          <p className="text-gray-300">
            Colores vibrantes que se mueven constantemente, creando una experiencia visual única.
          </p>
        </motion.div>

        {/* Tarjeta 2 */}
        <motion.div 
          className="p-6 rounded-xl border-2 relative overflow-hidden"
          whileHover={{ scale: 1.05 }}
          animate={{ 
            boxShadow: [
              "0 0 20px rgba(128, 0, 255, 0.3)",
              "0 0 40px rgba(0, 255, 255, 0.3)",
              "0 0 20px rgba(255, 0, 128, 0.3)",
              "0 0 20px rgba(128, 0, 255, 0.3)"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-white" />
            <h3 className="text-xl font-semibold">Animaciones</h3>
          </div>
          <p className="text-gray-300">
            Bordes que brillan, iconos que resplandecen y efectos hover mágicos.
          </p>
        </motion.div>

        {/* Tarjeta 3 */}
        <motion.div 
          className="p-6 rounded-xl border-2 relative overflow-hidden"
          whileHover={{ scale: 1.05 }}
          animate={{ 
            boxShadow: [
              "0 0 20px rgba(0, 255, 255, 0.3)",
              "0 0 40px rgba(255, 0, 128, 0.3)",
              "0 0 20px rgba(128, 0, 255, 0.3)",
              "0 0 20px rgba(0, 255, 255, 0.3)"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <h3 className="text-xl font-semibold">Gradientes</h3>
          </div>
          <p className="text-gray-300">
            Transiciones suaves entre colores neón que crean un efecto hipnótico.
          </p>
        </motion.div>

        {/* Tarjeta 4 */}
        <motion.div 
          className="p-6 rounded-xl border-2 relative overflow-hidden"
          whileHover={{ scale: 1.05 }}
          animate={{ 
            boxShadow: [
              "0 0 20px rgba(255, 128, 0, 0.3)",
              "0 0 40px rgba(0, 255, 128, 0.3)",
              "0 0 20px rgba(255, 0, 64, 0.3)",
              "0 0 20px rgba(255, 128, 0, 0.3)"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Rainbow className="w-8 h-8 text-orange-400" />
            <h3 className="text-xl font-semibold">Colores Vivos</h3>
          </div>
          <p className="text-gray-300">
            Una paleta de colores vibrantes que transforma la interfaz en algo mágico.
          </p>
        </motion.div>
      </div>

      {/* Botón de demostración */}
      <motion.button
        className="w-full py-4 px-6 rounded-xl text-lg font-semibold relative overflow-hidden"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={{ 
          background: [
            "linear-gradient(45deg, #ff0080, #8000ff)",
            "linear-gradient(45deg, #8000ff, #00ffff)",
            "linear-gradient(45deg, #00ffff, #00ff80)",
            "linear-gradient(45deg, #00ff80, #ff8000)",
            "linear-gradient(45deg, #ff8000, #ff0080)",
            "linear-gradient(45deg, #ff0080, #8000ff)"
          ]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <span className="relative z-10">¡Activar Modo Shiny!</span>
        <motion.div
          className="absolute inset-0 bg-white/20"
          animate={{ x: [-100, 100] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>

      {/* Información adicional */}
      <div className="text-center text-gray-400">
        <p className="mb-2">
          El tema Shiny combina la elegancia del modo oscuro con la vibrancia de colores neón.
        </p>
        <p>
          Perfecto para crear una experiencia visual única y moderna.
        </p>
      </div>
    </div>
  );
};

export default ShinyDemo;
