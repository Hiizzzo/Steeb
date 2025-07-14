import React from 'react';
import { X, Calendar, Clock, Tag, FileText } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
  notes?: string;
  scheduledDate?: string;
  scheduledTime?: string;
}

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, isOpen, onClose }) => {
  if (!isOpen || !task) return null;

  const getTypeIcon = () => {
    switch (task.type) {
      case 'personal':
        return '🏠';
      case 'work':
        return '💼';
      case 'meditation':
        return '🧘';
      default:
        return '📝';
    }
  };

  const getTypeColor = () => {
    switch (task.type) {
      case 'personal':
        return 'bg-blue-100 text-blue-800';
      case 'work':
        return 'bg-green-100 text-green-800';
      case 'meditation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Detalles de la Tarea</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Task Title */}
          <div className="mb-4">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span className="text-2xl">{getTypeIcon()}</span>
              {task.title}
            </h3>
            
            {/* Task Type Badge */}
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getTypeColor()}`}>
              <Tag size={14} />
              {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
            </span>
          </div>

          {/* Task Info */}
          <div className="space-y-3 mb-6">
            {task.scheduledDate && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={18} />
                <span>Fecha: {formatDate(task.scheduledDate)}</span>
              </div>
            )}
            
            {task.scheduledTime && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={18} />
                <span>Hora: {task.scheduledTime}</span>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-gray-600" />
              <span className="font-medium text-gray-800">Notas</span>
            </div>
            {task.notes ? (
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {task.notes}
              </p>
            ) : (
              <p className="text-gray-500 italic">
                No hay notas para esta tarea
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;