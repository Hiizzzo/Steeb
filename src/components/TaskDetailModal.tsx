import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Calendar, Clock, CheckCircle, Heart, Settings } from 'lucide-react';
import ShapeIcon from "./ShapeIcon";

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
      case 'productividad': return 'Productividad';
      case 'creatividad': return 'Creatividad';
      case 'aprendizaje': return 'Aprendizaje';
      case 'organizacion': return 'Organización';
      case 'salud': return 'Salud';
      case 'social': return 'Social';
      case 'entretenimiento': return 'Entretenimiento';
      case 'extra': return 'Extra';
      case 'personal': return 'Personal';
      case 'work': return 'Trabajo';
      case 'meditation': return 'Meditación';
      default: return String(type);
    }
  };

  const getTypeIcon = (type: Task['type']) => {
    const isShiny = document.documentElement.classList.contains('shiny');
    
    // Función para obtener el color específico del icono
    const getIconColor = () => {
      if (isShiny) {
        switch (type) {
          case 'productividad':
            return '#FF0088'; // Rosa
          case 'salud':
            return '#8800FF'; // Violeta
          case 'social':
            return '#4444FF'; // Azul
          default:
            return '#FFFFFF';
        }
      }
      return '#000000'; // Negro para modo normal
    };
    
    const iconColor = getIconColor();
    
    switch (type) {
      case 'productividad':   return <ShapeIcon variant="square" className="w-6 h-6 mr-1" title="Cuadrado" color={iconColor} />;
      case 'creatividad':     return <ShapeIcon variant="triangle" className="w-6 h-6 mr-1" title="Creatividad" color={iconColor} />;
      case 'salud':           return <ShapeIcon variant="heart" className="w-6 h-6 mr-1" title="Salud" color={iconColor} />;
      case 'organizacion':    return <ShapeIcon variant="diamond" className="w-6 h-6 mr-1" title="Diamante" color={iconColor} />;
      case 'social':          return <ShapeIcon variant="triangle" className="w-6 h-6 mr-1" title="Social" color={iconColor} />;
      case 'aprendizaje':     return <ShapeIcon variant="triangle" className="w-6 h-6 mr-1" title="Aprendizaje" color={iconColor} />;
      case 'entretenimiento': return <ShapeIcon variant="triangle" className="w-6 h-6 mr-1" title="Entretenimiento" color={iconColor} />;
      case 'extra':           return <ShapeIcon variant="diamond" className="w-6 h-6 mr-1" title="Diamante" color={iconColor} />;
      default:                return null;
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 border border-gray-300 flex items-center ${
                  task.type === 'productividad' ? 'text-[#FF0088]' :
                  task.type === 'salud' ? 'text-[#8800FF]' :
                  task.type === 'social' ? 'text-[#4444FF]' : 'text-black'
                }`}>
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
                <Button variant="ghost" size="sm" onClick={() => onEdit(task)} className="p-2 hover:bg-gray-100 rounded-full text-black" title="Editar tarea">
                  <Settings size={18} />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-black">
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
                      <Heart size={18} className="text-black" fill="currentColor" />
                    ) : (
                      <Heart size={18} className="text-gray-400" />
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
            <Button variant={task.completed ? 'default' : 'outline'} onClick={() => onToggle(task.id)} className={`flex items-center ${task.completed ? 'bg-black text-white' : ''}`}>
              {task.completed ? (
                <>
                  <CheckCircle className="mr-2" size={18} />
                  Marcar como pendiente
                </>
              ) : (
                <>
                  <Heart className="mr-2" size={18} />
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