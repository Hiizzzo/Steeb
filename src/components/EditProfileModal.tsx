import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Edit3 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTheme } from '@/hooks/useTheme';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { name, nickname, saveProfile } = useUserProfile();
  const { isShiny } = useTheme();
  const [formData, setFormData] = useState({
    name: name || '',
    nickname: nickname || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Actualizar el formulario cuando cambien los valores del perfil
  useEffect(() => {
    setFormData({
      name: name || '',
      nickname: nickname || ''
    });
  }, [name, nickname, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    setIsLoading(true);
    try {
      saveProfile(formData.name.trim(), formData.nickname.trim());
      onClose();
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      alert('Error al guardar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: 'name' | 'nickname', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className={`w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl ${
              isShiny ? 'border-2 border-white/20 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm' : ''
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isShiny ? 'bg-white/10' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Edit3 className={`w-5 h-5 ${
                      isShiny ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                    }`} />
                  </div>
                  <h2 className={`text-xl font-semibold ${
                    isShiny ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>
                    Editar Perfil
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    isShiny 
                      ? 'hover:bg-white/10 text-white' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Nombre completo */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isShiny ? 'text-white/90' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Nombre completo *
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      isShiny ? 'text-white/60' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Tu nombre completo"
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                        isShiny 
                          ? 'bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:bg-white/15'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Apodo */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isShiny ? 'text-white/90' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Apodo (opcional)
                  </label>
                  <div className="relative">
                    <Edit3 className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      isShiny ? 'text-white/60' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      value={formData.nickname}
                      onChange={(e) => handleInputChange('nickname', e.target.value)}
                      placeholder="¿Cómo te gusta que te llamen?"
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                        isShiny 
                          ? 'bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:bg-white/15'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20'
                      }`}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${
                    isShiny ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    STEEB usará tu apodo para motivarte y felicitarte
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      isShiny 
                        ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !formData.name.trim()}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isShiny 
                        ? 'bg-white text-black hover:bg-white/90'
                        : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'
                    }`}
                  >
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;