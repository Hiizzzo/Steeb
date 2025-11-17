import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  BarChart3,
  Target,
  Award,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Zap,
  Trophy,
  Flame,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useTheme } from '@/hooks/useTheme';

interface StatsData {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  streak: number;
  bestDay: string;
  averagePerDay: number;
}

const ProgressPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  console.log('🎯 ProgressPage renderizado - Iniciando componente');
  const { currentTheme } = useTheme();
  const { tasks } = useTaskStore();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('week');

  // Calcular estadísticas basadas en el modo de vista
  const stats = useMemo<StatsData>(() => {
    const now = new Date();
    let filteredTasks = tasks;

    // Filtrar tareas según el modo de vista
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
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filteredTasks = tasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          return taskDate >= yearAgo;
        });
        break;
    }

    const total = filteredTasks.length;
    const completed = filteredTasks.filter(task => task.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calcular racha (streak) - días consecutivos con tareas completadas
    let streak = 0;
    let currentDate = new Date(now);
    while (streak < 365) { // Máximo 1 año de racha
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

    // Encontrar mejor día
    const dayStats: Record<string, number> = {};
    tasks.forEach(task => {
      if (task.completed) {
        const dayName = new Date(task.completedAt || task.createdAt).toLocaleDateString('es-ES', { weekday: 'long' });
        dayStats[dayName] = (dayStats[dayName] || 0) + 1;
      }
    });

    const bestDay = Object.entries(dayStats).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0];

    // Promedio por día
    const daysCount = viewMode === 'day' ? 1 :
                     viewMode === 'week' ? 7 :
                     viewMode === 'month' ? 30 : 365;
    const averagePerDay = Math.round(completed / Math.max(daysCount, 1));

    return {
      total,
      completed,
      pending,
      completionRate,
      streak,
      bestDay,
      averagePerDay
    };
  }, [tasks, viewMode]);

  // Análisis y consejos de STEEB
  const steebAnalysis = useMemo(() => {
    const { completionRate, streak, averagePerDay, bestDay } = stats;

    let analysis = '';
    let advice = '';
    let motivation = '';

    if (completionRate >= 80) {
      analysis = '¡Estás en llamas! 🎯 Tu productividad es increíble';
      advice = 'Mantén este ritmo, eres una máquina';
      motivation = 'Sigue así, campeón';
    } else if (completionRate >= 60) {
      analysis = 'Buen progreso 💪 Vas por buen camino';
      advice = 'Un empujón más y llegas a la excelencia';
      motivation = 'Tú puedes, crack';
    } else if (completionRate >= 40) {
      analysis = 'Hay espacio para mejorar 📈';
      advice = 'Enfócate en las tareas más importantes primero';
      motivation = 'Dale que va, sos capaz';
    } else {
      analysis = 'Necesitamos un plan de acción ⚡';
      advice = 'Empecemos con tareas pequeñas y graduales';
      motivation = '¡Vamos! Una a la vez';
    }

    if (streak >= 7) {
      analysis += ` • ${streak} días seguidos de fuego 🔥`;
    } else if (streak >= 3) {
      analysis += ` • ${streak} días de racha, seguí así 💫`;
    }

    if (bestDay && averagePerDay > 2) {
      advice += ` • Tu mejor día es ${bestDay} con ${averagePerDay} tareas en promedio`;
    }

    return { analysis, advice, motivation };
  }, [stats]);

  // Preparar datos para gráficos
  const chartData = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const today = new Date();
    const weekData = days.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + index + 1);

      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.toDateString() === date.toDateString();
      });

      const completed = dayTasks.filter(t => t.completed).length;
      const total = dayTasks.length;

      return { day, completed, total };
    });

    return weekData;
  }, [tasks]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
        currentTheme === 'dark'
          ? 'bg-black text-white border-2 border-white'
          : 'bg-white text-black border-2 border-black'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b-2 ${
          currentTheme === 'dark' ? 'border-white' : 'border-black'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentTheme === 'dark' ? 'bg-white' : 'bg-black'
            }`}>
              <BarChart3 className={`w-5 h-5 ${
                currentTheme === 'dark' ? 'text-black' : 'text-white'
              }`} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Progreso</h2>
              <p className={`text-sm ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Tu evolución visual</p>
            </div>
          </div>
          <button
            onClick={() => {
              console.log('❌ Botón X clickeado en ProgressPage');
              onClose();
            }}
            className={`p-2 rounded-full transition-colors ${
              currentTheme === 'dark'
                ? 'hover:bg-white hover:text-black'
                : 'hover:bg-black hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Selector */}
        <div className={`flex items-center justify-center p-4 space-x-2 border-b ${
          currentTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
        }`}>
          {(['day', 'week', 'month', 'year'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border-2 ${
                viewMode === mode
                  ? currentTheme === 'dark'
                    ? 'bg-white text-black border-black'
                    : 'bg-black text-white border-black'
                  : currentTheme === 'dark'
                    ? 'bg-gray-800 text-white hover:bg-gray-700 border-black'
                    : 'bg-gray-200 text-black hover:bg-gray-300 border-black'
              }`}
            >
              {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : mode === 'month' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto pb-6 px-6 max-h-[60vh]">
          {/* STEEB Analysis - Blanco y Negro */}
          <div className={`mb-6 p-4 rounded-2xl border-2 ${
            currentTheme === 'dark'
              ? 'bg-gray-900 border-white'
              : 'bg-gray-50 border-black'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Sparkles className={`w-6 h-6 ${
                  currentTheme === 'dark' ? 'text-white' : 'text-black'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold mb-1 ${
                  currentTheme === 'dark' ? 'text-white' : 'text-black'
                }`}>Análisis de STEEB</h3>
                <p className={`text-sm mb-2 ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>{steebAnalysis.analysis}</p>
                <p className={`text-sm mb-1 ${
                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>💡 Consejo: {steebAnalysis.advice}</p>
                <p className={`text-sm font-medium ${
                  currentTheme === 'dark' ? 'text-white' : 'text-black'
                }`}>🔥 {steebAnalysis.motivation}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid - Blanco y Negro */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-xl border-2 ${
              currentTheme === 'dark'
                ? 'bg-gray-900 border-white'
                : 'bg-gray-50 border-black'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <Target className={`w-5 h-5 ${
                  currentTheme === 'dark' ? 'text-white' : 'text-black'
                }`} />
                <span className={`text-2xl font-bold ${
                  currentTheme === 'dark' ? 'text-white' : 'text-black'
                }`}>{stats.total}</span>
              </div>
              <p className={`text-xs ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Total tareas</p>
            </div>

            <div className={`p-4 rounded-xl border-2 ${
              currentTheme === 'dark'
                ? 'bg-gray-900 border-white'
                : 'bg-gray-50 border-black'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className={`w-5 h-5 ${
                  currentTheme === 'dark' ? 'text-white' : 'text-black'
                }`} />
                <span className={`text-2xl font-bold ${
                  currentTheme === 'dark' ? 'text-white' : 'text-black'
                }`}>{stats.completed}</span>
              </div>
              <p className={`text-xs ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Completadas</p>
            </div>

            <div className={`p-4 rounded-xl border-2 ${
              currentTheme === 'dark'
                ? 'bg-gray-900 border-white'
                : 'bg-gray-50 border-black'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <Flame className={`w-5 h-5 ${
                  currentTheme === 'dark' ? 'text-white' : 'text-black'
                }`} />
                <span className={`text-2xl font-bold ${
                  currentTheme === 'dark' ? 'text-white' : 'text-black'
                }`}>{stats.streak}</span>
              </div>
              <p className={`text-xs ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Días seguidos</p>
            </div>

            <div className={`p-4 rounded-xl border-2 ${
              currentTheme === 'dark'
                ? 'bg-gray-900 border-white'
                : 'bg-gray-50 border-black'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <Trophy className={`w-5 h-5 ${
                  currentTheme === 'dark' ? 'text-white' : 'text-black'
                }`} />
                <span className={`text-2xl font-bold ${
                  currentTheme === 'dark' ? 'text-white' : 'text-black'
                }`}>{stats.completionRate}%</span>
              </div>
              <p className={`text-xs ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Tasa éxito</p>
            </div>
          </div>

          {/* Weekly Chart - Blanco y Negro */}
          {viewMode === 'week' && (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                currentTheme === 'dark' ? 'text-white' : 'text-black'
              }`}>
                <BarChart3 className="w-5 h-5 mr-2" />
                Esta semana
              </h3>
              <div className={`p-4 rounded-xl border-2 ${
                currentTheme === 'dark'
                  ? 'bg-gray-900 border-white'
                  : 'bg-gray-50 border-black'
              }`}>
                <div className="flex items-end justify-between h-40 space-x-2">
                  {chartData.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="flex-1 flex items-end justify-center w-full">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-300 hover:opacity-80 ${
                            currentTheme === 'dark' ? 'bg-white' : 'bg-black'
                          }`}
                          style={{
                            height: `${Math.max((day.completed / Math.max(...chartData.map(d => d.total), 1)) * 100, 5)}%`
                          }}
                        />
                      </div>
                      <span className={`text-xs mt-2 ${
                        currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>{day.day}</span>
                      <span className={`text-xs font-bold ${
                        currentTheme === 'dark' ? 'text-white' : 'text-black'
                      }`}>{day.completed}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chart for other periods */}
          {viewMode !== 'week' && (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                currentTheme === 'dark' ? 'text-white' : 'text-black'
              }`}>
                <BarChart3 className="w-5 h-5 mr-2" />
                {viewMode === 'day' ? 'Hoy' : viewMode === 'month' ? 'Este mes' : 'Este año'}
              </h3>
              <div className={`p-8 rounded-xl border-2 text-center ${
                currentTheme === 'dark'
                  ? 'bg-gray-900 border-white'
                  : 'bg-gray-50 border-black'
              }`}>
                <BarChart3 className={`w-16 h-16 mx-auto mb-4 ${
                  currentTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <p className={`text-lg font-medium mb-2 ${
                  currentTheme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  {stats.completed} tareas completadas
                </p>
                <p className={`text-sm ${
                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Tasa de éxito: {stats.completionRate}%
                </p>
              </div>
            </div>
          )}

          {/* Insights - Blanco y Negro */}
          <div className="space-y-3">
            <h3 className={`text-lg font-semibold flex items-center ${
              currentTheme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              <Zap className="w-5 h-5 mr-2" />
              Insights rápidos
            </h3>

            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              currentTheme === 'dark'
                ? 'bg-gray-900 border-gray-700'
                : 'bg-gray-50 border-gray-300'
            }`}>
              <span className={`text-sm ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Promedio diario</span>
              <span className={`font-bold ${
                currentTheme === 'dark' ? 'text-white' : 'text-black'
              }`}>{stats.averagePerDay} tareas</span>
            </div>

            {stats.bestDay && (
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                currentTheme === 'dark'
                  ? 'bg-gray-900 border-gray-700'
                  : 'bg-gray-50 border-gray-300'
              }`}>
                <span className={`text-sm ${
                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Tu mejor día</span>
                <span className={`font-bold capitalize ${
                  currentTheme === 'dark' ? 'text-white' : 'text-black'
                }`}>{stats.bestDay}</span>
              </div>
            )}

            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              currentTheme === 'dark'
                ? 'bg-gray-900 border-gray-700'
                : 'bg-gray-50 border-gray-300'
            }`}>
              <span className={`text-sm ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Tareas pendientes</span>
              <span className={`font-bold ${
                currentTheme === 'dark' ? 'text-white' : 'text-black'
              }`}>{stats.pending}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;