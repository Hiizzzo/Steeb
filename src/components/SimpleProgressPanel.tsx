import React, { useState, useMemo } from 'react';
import { BarChart3, Target, CheckCircle, Flame, Trophy } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useTheme } from '@/hooks/useTheme';

interface SimpleProgressPanelProps {
  onClose: () => void;
}

const SimpleProgressPanel: React.FC<SimpleProgressPanelProps> = ({ onClose }) => {
  const { currentTheme } = useTheme();
  const { tasks } = useTaskStore();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const isDarkMode = currentTheme === 'dark';

  // Calcular estadísticas simples
  const stats = useMemo(() => {
    const now = new Date();
    let filteredTasks = tasks;

    switch (viewMode) {
      case 'day':
        filteredTasks = tasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          return taskDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredTasks = tasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          return taskDate >= weekAgo;
        });
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredTasks = tasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          return taskDate >= monthAgo;
        });
        break;
    }

    const total = filteredTasks.length;
    const completed = filteredTasks.filter(task => task.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calcular racha simple
    let streak = 0;
    let currentDate = new Date(now);
    while (streak < 30) {
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.completedAt || task.createdAt);
        return taskDate.toDateString() === currentDate.toDateString() && task.completed;
      });

      if (dayTasks.length > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      total,
      completed,
      pending: total - completed,
      completionRate,
      streak,
      averagePerDay: viewMode === 'day' ? completed : Math.round(completed / (viewMode === 'week' ? 7 : 30))
    };
  }, [tasks, viewMode]);

  return (
    <div className={`h-full flex flex-col ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b-2 flex items-center justify-center ${
        isDarkMode ? 'border-white' : 'border-black'
      }`}>
        <h2 className="text-xl font-bold flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Progreso
        </h2>
      </div>

      {/* View Mode Selector */}
      <div className={`p-2 border-b flex justify-center space-x-1 ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        {[
          { value: 'day', label: 'Hoy' },
          { value: 'week', label: 'Semana' },
          { value: 'month', label: 'Mes' }
        ].map((mode) => (
          <button
            key={mode.value}
            onClick={() => setViewMode(mode.value as any)}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              viewMode === mode.value
                ? isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                : isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className={`p-2 rounded-lg border text-center text-xs ${
            isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
          }`}>
            <div className="flex items-center justify-center mb-1">
              <Target className="w-3 h-3" />
            </div>
            <p className="text-sm font-bold">{stats.total}</p>
            <p className="text-xs opacity-70">Total</p>
          </div>

          <div className={`p-2 rounded-lg border text-center text-xs ${
            isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
          }`}>
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="w-3 h-3" />
            </div>
            <p className="text-sm font-bold">{stats.completed}</p>
            <p className="text-xs opacity-70">Hechas</p>
          </div>

          <div className={`p-2 rounded-lg border text-center text-xs ${
            isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
          }`}>
            <div className="flex items-center justify-center mb-1">
              <Flame className="w-3 h-3" />
            </div>
            <p className="text-sm font-bold">{stats.streak}</p>
            <p className="text-xs opacity-70">Racha</p>
          </div>

          <div className={`p-2 rounded-lg border text-center text-xs ${
            isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
          }`}>
            <div className="flex items-center justify-center mb-1">
              <Trophy className="w-3 h-3" />
            </div>
            <p className="text-sm font-bold">{stats.completionRate}%</p>
            <p className="text-xs opacity-70">Éxito</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`p-3 rounded-lg border mb-3 ${
          isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
        }`}>
          <div className="flex justify-between text-sm mb-2">
            <span>Progreso</span>
            <span className="font-medium">{stats.completionRate}%</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            <div
              className={`h-full transition-all duration-300 ${
                isDarkMode ? 'bg-white' : 'bg-black'
              }`}
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <p className="text-xs mt-1 text-center opacity-70">
            {stats.completed} de {stats.total} tareas
          </p>
        </div>

        {/* Simple Chart */}
        <div className={`p-3 rounded-lg border mb-3 ${
          isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
        }`}>
          <h4 className="text-sm font-medium mb-2 text-center">
            {viewMode === 'day' ? 'Hoy' : viewMode === 'week' ? 'Esta semana' : 'Este mes'}
          </h4>
          <div className="flex items-end justify-center h-16 space-x-1">
            {Array.from({ length: viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 4 }, (_, i) => (
              <div
                key={i}
                className={`flex-1 max-w-6 rounded-t transition-all duration-300 ${
                  isDarkMode ? 'bg-white' : 'bg-black'
                }`}
                style={{
                  height: `${Math.random() * 60 + 20}%`
                }}
              />
            ))}
          </div>
          <p className="text-xs text-center mt-2 opacity-70">
            Promedio: {stats.averagePerDay} tareas/día
          </p>
        </div>

        {/* Motivational Message */}
        <div className={`p-3 rounded-lg border text-center ${
          isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
        }`}>
          <p className="text-sm">
            {stats.completionRate >= 80 ? '¡Excelente productividad! 🚀' :
             stats.completionRate >= 60 ? '¡Buen progreso! Sigue así 💪' :
             stats.completionRate >= 40 ? 'Vas bien, puedes mejorar 📈' :
             '¡Un pequeño paso a la vez! 🎯'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleProgressPanel;