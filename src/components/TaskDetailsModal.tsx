import React from 'react';
import { X, Calendar, Clock, FileText } from 'lucide-react';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  notes?: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
}

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ isOpen, onClose, task }) => {
  if (!isOpen || !task) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'work':
        return 'bg-blue-100 text-blue-800';
      case 'personal':
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
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Detalles de la tarea</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{task.title}</h3>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(task.type)}`}>
              {task.type === 'work' ? 'Trabajo' : task.type === 'personal' ? 'Personal' : 'Meditación'}
            </span>
          </div>

          {/* Schedule Info */}
          {(task.scheduledDate || task.scheduledTime) && (
            <div className="space-y-2">
              {task.scheduledDate && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar size={16} />
                  <span className="text-sm">{formatDate(task.scheduledDate)}</span>
                </div>
              )}
              {task.scheduledTime && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock size={16} />
                  <span className="text-sm">{task.scheduledTime}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <FileText size={16} className="text-gray-600" />
                <h4 className="font-medium text-gray-900">Notas</h4>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{task.notes}</p>
              </div>
            </div>
          )}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Subtareas ({task.subtasks.length})</h4>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full border ${
                      subtask.completed 
                        ? 'bg-black border-black' 
                        : 'border-gray-300'
                    }`}>
                      {subtask.completed && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                    <span className={`text-sm ${
                      subtask.completed 
                        ? 'line-through text-gray-400' 
                        : 'text-gray-700'
                    }`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                task.completed ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <span className="text-sm text-gray-600">
                {task.completed ? 'Completada' : 'Pendiente'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;