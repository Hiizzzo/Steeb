import React from 'react';
import { CheckCircle, Trash2 } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useTheme } from '@/hooks/useTheme';

interface SimpleSideTasksPanelProps {
  onClose: () => void;
}

const SimpleSideTasksPanel: React.FC<SimpleSideTasksPanelProps> = ({ onClose }) => {
  const { currentTheme } = useTheme();
  const { tasks, toggleTask, deleteTask } = useTaskStore();
  const isDarkMode = currentTheme === 'dark';

  const pendingTasks = tasks.filter(t => !t.completed);

  return (
    <div className={`h-full flex flex-col ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b-2 flex items-center justify-center ${
        isDarkMode ? 'border-white' : 'border-black'
      }`}>
        <h2 className="text-xl font-bold">Tareas</h2>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-3">
        {pendingTasks.length > 0 ? (
          <>
            <p className="text-xs opacity-70 font-semibold uppercase mb-3">
              {pendingTasks.length} pendiente{pendingTasks.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg transition-all hover:shadow-md ${
                    isDarkMode ? 'bg-gray-900 border border-white' : 'bg-gray-50 border border-black'
                  }`}
                  style={{ borderLeft: '3px solid currentColor' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold break-words leading-tight">
                        {task.title}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {task.category || 'Sin categoría'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <button
                        onClick={async () => {
                          try {
                            await toggleTask(task.id);
                          } catch (error) {
                            console.error('Error al completar tarea:', error);
                          }
                        }}
                        className="flex-shrink-0 w-4 h-4 rounded-full border-2 transition-all duration-200"
                        style={{ borderColor: isDarkMode ? 'white' : 'black' }}
                        title="Completar tarea"
                      />
                      <button
                        onClick={async () => {
                          if (!window.confirm(`¿Estás seguro de que querés eliminar "${task.title}"?`)) return;

                          try {
                            await deleteTask(task.id);
                          } catch (error) {
                            console.error('Error al eliminar tarea:', error);
                          }
                        }}
                        className="flex-shrink-0 w-4 h-4 rounded-full bg-red-100 hover:bg-red-200 transition-all duration-200 flex items-center justify-center"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
            }`}>
              <CheckCircle className={`w-6 h-6 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
            </div>
            <p className={`text-sm font-medium mb-1 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              ¡No hay tareas pendientes!
            </p>
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Todas tus tareas están completadas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleSideTasksPanel;