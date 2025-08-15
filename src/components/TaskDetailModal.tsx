import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Calendar, Clock, CheckCircle, Circle, Settings } from 'lucide-react';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  notes?: string;
}

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onToggle: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onEdit?: (task: Task) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onToggle,
  onToggleSubtask,
  onEdit
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

  const getTypeLabel = (type: Task['type'] | 'personal' | 'work' | 'meditation') => {
    switch (type) {
      case 'productividad':
        return 'Productividad';
      case 'creatividad':
        return 'Creatividad';
      case 'aprendizaje':
        return 'Aprendizaje';
      case 'organizacion':
        return 'Organización';
      case 'salud':
        return 'Salud';
      case 'social':
        return 'Social';
      case 'entretenimiento':
        return 'Entretenimiento';
      case 'extra':
        return 'Extra';
      // Compatibilidad con tipos antiguos
      case 'personal':
        return 'Personal';
      case 'work':
        return 'Trabajo';
      case 'meditation':
        return 'Meditación';
      default:
        return String(type);
    }
  };

  const getTypeIcon = (type: Task['type']) => {
    switch (type) {
      case 'productividad':
        return <img src="/lovable-uploads/ed87121c-fa95-442d-8f28-4374f90b4cdb.png" alt="Productividad" className="w-4 h-4 mr-1" />;
      case 'creatividad':
        return <img src="/lovable-uploads/960a5bce-1ea1-46b3-9a15-9bbb2c33d476.png" alt="Creatividad" className="w-4 h-4 mr-1" />;
      case 'aprendizaje':
        return <img src="/lovable-uploads/5867110b-7acc-4a17-b021-60d80362cb31.png" alt="Aprendizaje" className="w-4 h-4 mr-1" />;
      case 'organizacion':
        return <img src="/lovable-uploads/a5d219fa-19b0-4b52-bffa-48e7b87ab59a.png" alt="Organización" className="w-4 h-4 mr-1" />;
      case 'salud':
        return <img src="/lovable-uploads/e6d7c376-16cd-4c37-94bf-5fb5aeffcc6b.png" alt="Salud" className="w-4 h-4 mr-1" />;
      case 'social':
        return <img src="/lovable-uploads/9a30aed8-3111-4f08-8513-1b1b5a47f5f1.png" alt="Social" className="w-4 h-4 mr-1" />;
      case 'entretenimiento':
        return <img src="/lovable-uploads/a2ff8acd-d80d-49f7-9e88-0962d6e54bd6.png" alt="Entretenimiento" className="w-4 h-4 mr-1" />;
      case 'extra':
        return <img src="/lovable-uploads/db7fad8b-8361-464e-a371-b6cf8c2d4257.png" alt="Extra" className="w-4 h-4 mr-1" />;
      default:
        return null;
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-black border border-gray-300 flex items-center`}>
                  {getTypeIcon(task.type)}
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
            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(task)}
                  className="p-2 hover:bg-gray-100 rounded-full text-black"
                  title="Editar tarea"
                >
                  <Settings size={18} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full text-black"
              >
                <X size={20} />
              </Button>
            </div>
          </div>

          {/* Notas */}
          {task.notes && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-black mb-2">Notas:</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {task.notes}
              </p>
            </div>
          )}

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
          <div className="flex justify-end space-x-2">
            <Button
              variant={task.completed ? 'default' : 'outline'}
              onClick={() => onToggle(task.id)}
              className={`flex items-center ${task.completed ? 'bg-black text-white' : ''}`}
            >
              {task.completed ? (
                <>
                  <CheckCircle className="mr-2" size={18} />
                  Marcar como pendiente
                </>
              ) : (
                <>
                  <Circle className="mr-2" size={18} />
                  Marcar como completada
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TaskDetailModal;