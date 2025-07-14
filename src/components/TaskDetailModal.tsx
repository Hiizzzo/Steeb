import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Calendar, Clock, CheckCircle, Circle } from 'lucide-react';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
}

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onToggle: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onToggle,
  onToggleSubtask
}) => {
  if (!isOpen || !task) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'personal':
        return 'Personal';
      case 'work':
        return 'Trabajo';
      case 'meditation':
        return 'Meditación';
      default:
        return type;
    }
  };

  const completedSubtasks = task.subtasks?.filter(subtask => subtask.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg bg-white rounded-lg shadow-xl border-2 border-gray-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-black mb-2">
                {task.title}
              </h2>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-black border border-gray-300`}>
                  {getTypeLabel(task.type)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  task.completed 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-black border border-gray-300'
                }`}>
                  {task.completed ? 'Completada' : 'Pendiente'}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-black"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Fecha y Hora */}
          {(task.scheduledDate || task.scheduledTime) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-black mb-2">Programada para:</h3>
              <div className="flex items-center space-x-4">
                {task.scheduledDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-gray-700" />
                    <span className="text-sm text-gray-800">
                      {formatDate(task.scheduledDate)}
                    </span>
                  </div>
                )}
                {task.scheduledTime && (
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-gray-700" />
                    <span className="text-sm text-gray-800">
                      {task.scheduledTime}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtareas */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-black">Subtareas</h3>
                <span className="text-sm text-gray-600">
                  {completedSubtasks} de {totalSubtasks} completadas
                </span>
              </div>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                    onClick={() => onToggleSubtask?.(task.id, subtask.id)}
                  >
                    {subtask.completed ? (
                      <div className="w-5 h-5 bg-black border-2 border-black rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    ) : (
                      <Circle size={20} className="text-gray-400" />
                    )}
                    <span className={`flex-1 ${
                      subtask.completed 
                        ? 'line-through text-gray-500' 
                        : 'text-black'
                    }`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex space-x-3">
            <Button
              onClick={() => {
                onToggle(task.id);
                onClose();
              }}
              className={`flex-1 ${
                task.completed 
                  ? 'bg-gray-100 hover:bg-gray-200 text-black border-2 border-gray-300' 
                  : 'bg-black hover:bg-gray-800 text-white border-2 border-black'
              }`}
            >
              {task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 bg-white hover:bg-gray-100 text-black border-2 border-gray-300"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TaskDetailModal;