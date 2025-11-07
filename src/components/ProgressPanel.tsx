import React, { useState, useMemo } from 'react';
import { X, BarChart3, TrendingUp, Target, Calendar, Flame, Trophy, CheckCircle } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useTheme } from '@/hooks/useTheme';

interface ProgressPanelProps {
  onClose: () => void;
}

const ProgressPanel: React.FC<ProgressPanelProps> = ({ onClose }) => {
  const { currentTheme } = useTheme();
  const { tasks } = useTaskStore();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

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

  const isDarkMode = currentTheme === 'dark';

  return (
    <div className={`h-96 flex flex-col border-t-4 ${
      isDarkMode ? 'bg-black text-white border-white' : 'bg-white text-black border-black'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b-2 flex items-center justify-center relative ${
        isDarkMode ? 'border-white' : 'border-black'
      }`}>
        <h2 className="text-2xl font-black flex items-center">
          <BarChart3 className="w-6 h-6 mr-2" />
          Progreso
        </h2>
        <button
          onClick={onClose}
          className={`absolute right-4 p-1 hover:opacity-70 transition-opacity bg-transparent border-0`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* View Mode Selector */}
      <div className={`p-3 border-b flex justify-center space-x-2 ${
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
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
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
      <div className="flex-1 overflow-y-auto p-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`p-3 rounded-lg border-2 text-center ${
            isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
          }`}>
            <div className="flex items-center justify-center mb-1">
              <Target className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold">{stats.total}</p>
            <p className="text-xs opacity-70">Total</p>
          </div>

          <div className={`p-3 rounded-lg border-2 text-center ${
            isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
          }`}>
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold">{stats.completed}</p>
            <p className="text-xs opacity-70">Completadas</p>
          </div>

          <div className={`p-3 rounded-lg border-2 text-center ${
            isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
          }`}>
            <div className="flex items-center justify-center mb-1">
              <Flame className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold">{stats.streak}</p>
            <p className="text-xs opacity-70">Racha</p>
          </div>

          <div className={`p-3 rounded-lg border-2 text-center ${
            isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
          }`}>
            <div className="flex items-center justify-center mb-1">
              <Trophy className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold">{stats.completionRate}%</p>
            <p className="text-xs opacity-70">Éxito</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`p-3 rounded-lg border-2 ${
          isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
        }`}>
          <div className="flex justify-between text-sm mb-2">
            <span>Progreso</span>
            <span className="font-medium">{stats.completionRate}%</span>
          </div>
          <div className={`w-full h-3 rounded-full overflow-hidden ${
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
        <div className={`mt-4 p-3 rounded-lg border-2 ${
          isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
        }`}>
          <h4 className="text-sm font-medium mb-2 text-center">
            {viewMode === 'day' ? 'Hoy' : viewMode === 'week' ? 'Esta semana' : 'Este mes'}
          </h4>
          <div className="flex items-end justify-center h-16 space-x-1">
            {/* Simple bar chart representation */}
            {Array.from({ length: viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 4 }, (_, i) => (
              <div
                key={i}
                className={`flex-1 max-w-8 rounded-t transition-all duration-300 ${
                  isDarkMode ? 'bg-white' : 'bg-black'
                }`}
                style={{
                  height: `${Math.random() * 60 + 20}%` // Simplified random heights
                }}
              />
            ))}
          </div>
          <p className="text-xs text-center mt-2 opacity-70">
            Promedio: {stats.averagePerDay} tareas/día
          </p>
        </div>

        {/* Motivational Message */}
        <div className={`mt-4 p-3 rounded-lg border-2 text-center ${
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

export default ProgressPanel;