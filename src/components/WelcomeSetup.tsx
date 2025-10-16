import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface WelcomeSetupProps {
  onComplete: (name: string, nickname: string) => void;
}

const WelcomeSetup: React.FC<WelcomeSetupProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    nickname: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.nickname.trim()) {
      onComplete(formData.name.trim(), formData.nickname.trim());
    } else {
      setError('Por favor completa ambos campos');
    }
  };

  const inputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <motion.div 
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/lovable-uploads/ChatGPT Image Aug 28, 2025, 12_08_57 AM.png" alt="STEEB" className="w-24 h-24 rounded-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">¡Bienvenido a STEEB!</h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
            Hola, soy STEEB y te voy a ayudar para que hagas tus tareas y dejes de scrollear.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ¿Cuál es tu nombre completo?
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => inputChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ej: Juan, Juancho, JP..."
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
          >
            Continuar
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default WelcomeSetup;
