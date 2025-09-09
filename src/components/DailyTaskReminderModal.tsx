import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';

interface Task {
  id: string;
  title: string;
  type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra';
  completed: boolean;
  completedDate?: string;
}

interface DailyTaskReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  yesterdayDate: string;
  onMarkCompleted: (taskIds: string[], date: string) => void;
}

const DailyTaskReminderModal: React.FC<DailyTaskReminderModalProps> = ({
  open,
  onOpenChange,
  tasks,
  yesterdayDate,
  onMarkCompleted
}) => {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Filtrar tareas incompletas que podrían haberse completado ayer
  const availableTasks = tasks.filter(task => !task.completed);

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleConfirm = () => {
    if (selectedTasks.length > 0) {
      onMarkCompleted(selectedTasks, yesterdayDate);
    }
    setSelectedTasks([]);
    onOpenChange(false);
  };

  const handleSkip = () => {
    setSelectedTasks([]);
    onOpenChange(false);
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

  if (!open) return null;

  const { name, nickname } = useUserProfile();
  const userName = name || 'Usuario';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={handleSkip}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md mx-4 bg-white dark:bg-black rounded-lg shadow-xl border border-gray-200 dark:border-white"
        >
          {/* Header: Avatar a la izquierda + burbuja de diálogo a la derecha (sin mencionar STEEB) */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-white gap-3">
            <div className="flex items-start gap-3 flex-1">
              {/* Avatar de STEBE */}
              <div className="w-20 h-20 rounded-lg shrink-0">
                <img
                  src="/lovable-uploads/icono de la app.png"
                  alt="Stebe"
                  className="w-20 h-20 rounded-lg"
                />
              </div>
              {/* Burbuja */}
              <div className="flex-1 rounded-xl border border-gray-200 dark:border-white bg-white dark:bg-black shadow-sm px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-black dark:text-white" />
                  <span className="text-xs font-semibold text-black dark:text-white uppercase tracking-wide">Recordatorio</span>
                </div>
                <p className="text-sm text-black dark:text-white">
                  {userName}, ¿completaste las tareas de ayer? Marcá las que terminaste y no te olvides más de registrarlas.
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-white mb-4">
              {formatDate(yesterdayDate)}
            </p>
            <p className="text-black dark:text-white mb-6">
              Seleccioná las tareas que completaste ayer:
            </p>

            {/* Task List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availableTasks.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-white py-4">
                  No hay tareas pendientes para marcar
                </p>
              ) : (
                availableTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTasks.includes(task.id)
                        ? 'bg-white dark:bg-black border-black dark:border-white'
                        : 'bg-gray-50 dark:bg-black border-gray-200 dark:border-white hover:bg-gray-100 dark:hover:bg-black'
                    }`}
                    onClick={() => handleTaskToggle(task.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedTasks.includes(task.id)
                        ? 'bg-black border-black dark:bg-white dark:border-white'
                        : 'border-gray-300 dark:border-white'
                    }`}>
                      {selectedTasks.includes(task.id) && (
                        <CheckCircle className="w-3 h-3 text-white dark:text-black" />
                      )}
                    </div>
                    <span className="text-sm text-black dark:text-white flex-1">
                      {task.title}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-white">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Saltar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedTasks.length === 0}
              className="flex-1"
            >
              Confirmar ({selectedTasks.length})
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DailyTaskReminderModal;
