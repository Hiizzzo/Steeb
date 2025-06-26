
import React, { useState } from 'react';
import { X, Star } from 'lucide-react';

interface ModalAddTaskProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (title: string, type: 'personal' | 'work' | 'meditation') => void;
}

const ModalAddTask: React.FC<ModalAddTaskProps> = ({ isOpen, onClose, onAddTask }) => {
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<'personal' | 'work' | 'meditation'>('personal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAddTask(title.trim(), selectedType);
      setTitle('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white border-4 border-black rounded-2xl p-6 w-full max-w-md"
        style={{ 
          borderWidth: '4px',
          boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center">
              <Star size={16} className="text-black fill-current" />
            </div>
            <h2 className="text-xl font-black text-black">Nueva Tarea</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <X size={16} className="text-black" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input de texto */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué tarea tienes que hacer?"
              className="w-full p-3 border-3 border-black rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-black"
              style={{ borderWidth: '3px' }}
              autoFocus
            />
          </div>

          {/* Selector de tipo */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-black">Tipo de tarea:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'personal', label: 'Personal', emoji: '👤' },
                { value: 'work', label: 'Trabajo', emoji: '⚡' },
                { value: 'meditation', label: 'Meditación', emoji: '😊' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedType(option.value as any)}
                  className={`p-3 border-2 border-black rounded-xl text-center transition-all ${
                    selectedType === option.value 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  <div className="text-lg mb-1">{option.emoji}</div>
                  <div className="text-xs font-bold">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3 border-2 border-black rounded-xl font-bold text-black bg-white hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 p-3 border-2 border-black rounded-xl font-bold text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalAddTask;
