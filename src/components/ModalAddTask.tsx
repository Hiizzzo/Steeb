
import React, { useState } from 'react';
import { X, Pencil, Calendar, ShoppingCart } from 'lucide-react';

interface ModalAddTaskProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (title: string, type: 'personal' | 'work' | 'meditation') => void;
}

const ModalAddTask: React.FC<ModalAddTaskProps> = ({ isOpen, onClose, onAddTask }) => {
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<'personal' | 'work' | 'meditation'>('work');

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
      <div className="bg-white border border-gray-300 rounded-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Add New Task
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100"
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
              placeholder="Enter task description..."
              className="w-full p-3 border border-gray-300 rounded-xl text-lg font-medium focus:outline-none focus:border-black"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              autoFocus
            />
          </div>

          {/* Selector de tipo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Task type:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'work', label: 'Work', icon: Pencil },
                { value: 'meditation', label: 'Meeting', icon: Calendar },
                { value: 'personal', label: 'Personal', icon: ShoppingCart }
              ].map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedType(option.value as any)}
                    className={`p-3 border border-gray-300 rounded-xl text-center transition-all flex flex-col items-center space-y-1 ${
                      selectedType === option.value 
                        ? 'bg-black text-white border-black' 
                        : 'bg-white text-black hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent size={20} />
                    <div className="text-xs font-medium" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      {option.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3 border border-gray-300 rounded-xl font-medium text-black bg-white hover:bg-gray-50 transition-colors"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 p-3 rounded-xl font-medium text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalAddTask;
