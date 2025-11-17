import React, { useState, useMemo } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, CheckCircle, Circle, Target, Heart, Lightbulb, Users, Briefcase, Book, Gamepad2, Plus } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useTheme } from '@/hooks/useTheme';
import { Task } from '@/types';

interface CalendarPanelProps {
  onClose: () => void;
}

// Iconos por tipo de tarea
const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  'productividad': Target,
  'organizacion': Briefcase,
  'aprendizaje': Book,
  'creatividad': Lightbulb,
  'salud': Heart,
  'social': Users,
  'entretenimiento': Gamepad2,
  'extra': Plus
};

// Colores por tipo de tarea (minimalista blanco y negro)
const TYPE_COLORS: Record<string, { bg: string; border: string }> = {
  'productividad': { bg: 'bg-gray-200', border: 'border-gray-600' },
  'organizacion': { bg: 'bg-gray-200', border: 'border-gray-600' },
  'aprendizaje': { bg: 'bg-gray-200', border: 'border-gray-600' },
  'creatividad': { bg: 'bg-gray-200', border: 'border-gray-600' },
  'salud': { bg: 'bg-gray-200', border: 'border-gray-600' },
  'social': { bg: 'bg-gray-200', border: 'border-gray-600' },
  'entretenimiento': { bg: 'bg-gray-200', border: 'border-gray-600' },
  'extra': { bg: 'bg-gray-200', border: 'border-gray-600' }
};

const CalendarPanel: React.FC<CalendarPanelProps> = ({ onClose }) => {
  const { currentTheme } = useTheme();
  const { tasks } = useTaskStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Obtener días del mes actual con tareas
  const monthData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);
    // Día de la semana del primer día (0 = Domingo, 1 = Lunes, etc.)
    const startDayOfWeek = firstDay.getDay();

    // Crear array con todos los días del mes
    const days = [];

    // Agregar días vacíos al inicio para alinear el calendario
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Agregar todos los días del mes
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];

      // Filtrar tareas para este día
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.scheduledDate || task.createdAt || task.completedDate);
        return taskDate.toISOString().split('T')[0] === dateStr;
      });

      const completedTasks = dayTasks.filter(task => task.completed);
      const pendingTasks = dayTasks.filter(task => !task.completed);

      // Agrupar tareas por tipo
      const tasksByType: Record<string, { total: number; completed: number }> = {};
      dayTasks.forEach(task => {
        const type = task.type || 'extra';
        if (!tasksByType[type]) {
          tasksByType[type] = { total: 0, completed: 0 };
        }
        tasksByType[type].total++;
        if (task.completed) {
          tasksByType[type].completed++;
        }
      });

      days.push({
        date,
        day,
        tasks: dayTasks,
        completedTasks,
        pendingTasks,
        total: dayTasks.length,
        completed: completedTasks.length,
        pending: pendingTasks.length,
        tasksByType
      });
    }

    return days;
  }, [tasks, currentMonth]);

  // Estadísticas del mes
  const stats = useMemo(() => {
    const validDays = monthData.filter(day => day !== null);
    const totalTasks = validDays.reduce((sum, day) => sum + day!.total, 0);
    const completedTasks = validDays.reduce((sum, day) => sum + day!.completed, 0);
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calcular distribución por tipo
    const typeStats: Record<string, { total: number; completed: number }> = {};
    validDays.forEach(day => {
      Object.entries(day!.tasksByType).forEach(([type, stats]) => {
        if (!typeStats[type]) {
          typeStats[type] = { total: 0, completed: 0 };
        }
        typeStats[type].total += stats.total;
        typeStats[type].completed += stats.completed;
      });
    });

    // Calcular días con tareas
    const daysWithTasks = validDays.filter(day => day!.total > 0).length;
    const productiveDays = validDays.filter(day => day!.completed > 0).length;

    return {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      completionRate,
      daysWithTasks,
      productiveDays,
      typeStats
    };
  }, [monthData]);

  // Navegación de meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
    setSelectedDay(null);
  };

  // Formatear nombre del mes
  const monthName = currentMonth.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  });

  const isDarkMode = currentTheme === 'dark';

  // Obtener tareas del día seleccionado
  const selectedDayData = selectedDay
    ? monthData.find(day => day && day.date.toDateString() === selectedDay.toDateString())
    : null;

  return (
    <div className={`h-96 flex flex-col border-t-4 ${
      isDarkMode ? 'bg-black text-white border-white' : 'bg-white text-black border-black'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b-2 flex items-center justify-center relative ${
        isDarkMode ? 'border-white' : 'border-black'
      }`}>
        <h2 className="text-2xl font-black flex items-center">
          <Calendar className="w-6 h-6 mr-2" />
          CALENDARIO
        </h2>
        <button
          onClick={onClose}
          className={`absolute right-4 p-1 hover:opacity-70 transition-opacity bg-transparent border-0`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Month Navigation */}
      <div className={`p-3 border-b flex items-center justify-between ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <button
          onClick={() => navigateMonth('prev')}
          className={`p-1 rounded transition-colors ${
            isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-bold capitalize">{monthName}</h3>
        <button
          onClick={() => navigateMonth('next')}
          className={`p-1 rounded transition-colors ${
            isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className={`p-2 rounded-lg border text-center text-xs ${
            isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
          }`}>
            <p className="font-bold">{stats.total}</p>
            <p className="opacity-70">Total</p>
          </div>
          <div className={`p-2 rounded-lg border text-center text-xs ${
            isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
          }`}>
            <p className="font-bold">{stats.completed}</p>
            <p className="opacity-70">Hechas</p>
          </div>
          <div className={`p-2 rounded-lg border text-center text-xs ${
            isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
          }`}>
            <p className="font-bold">{stats.pending}</p>
            <p className="opacity-70">Pendientes</p>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className={`p-3 rounded-lg border-2 mb-3 ${
          isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
        }`}>
          {/* Days of week headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day) => (
              <div key={day} className="text-center text-xs font-medium opacity-70">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {monthData.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const isToday = day.date.toDateString() === new Date().toDateString();
              const isSelected = selectedDay?.toDateString() === day.date.toDateString();
              const hasTasks = day.total > 0;
              const isCompleted = day.total > 0 && day.completed === day.total;

              return (
                <div
                  key={day.day}
                  onClick={() => hasTasks && setSelectedDay(day.date)}
                  className={`aspect-square flex flex-col items-center justify-center rounded text-xs relative cursor-pointer transition-all ${
                    isSelected
                      ? isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                      : isToday
                      ? isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      : isCompleted
                      ? isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                      : hasTasks
                      ? isDarkMode ? 'bg-gray-900 border border-gray-600' : 'bg-white border border-gray-400'
                      : 'opacity-30'
                  } ${hasTasks ? 'hover:scale-105' : ''}`}
                  title={`${day.day} - ${day.completed}/${day.total} tareas`}
                >
                  <span className="font-medium">{day.day}</span>
                  {hasTasks && (
                    <div className="flex space-x-1 mt-1">
                      {day.completed > 0 && (
                        <div className={`w-1 h-1 rounded-full ${
                          isDarkMode ? 'bg-green-400' : 'bg-green-600'
                        }`} />
                      )}
                      {day.pending > 0 && (
                        <div className={`w-1 h-1 rounded-full ${
                          isDarkMode ? 'bg-red-400' : 'bg-red-600'
                        }`} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Type Legend */}
          <div className={`text-xs p-2 rounded ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <p className="font-medium mb-1">Tipos de tareas:</p>
            <div className="grid grid-cols-4 gap-1">
              {Object.entries(TYPE_ICONS).slice(0, 4).map(([type, Icon]) => (
                <div key={type} className="flex items-center space-x-1">
                  <Icon className="w-3 h-3" />
                  <span className="capitalize truncate">{type.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDayData && (
          <div className={`p-3 rounded-lg border-2 mb-3 ${
            isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">
                {selectedDayData.day} de {currentMonth.toLocaleDateString('es-ES', { month: 'long' })}
              </h4>
              <button
                onClick={() => setSelectedDay(null)}
                className={`p-1 rounded text-xs ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                }`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {selectedDayData.tasks.length > 0 ? (
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {selectedDayData.tasks.map((task: Task) => {
                  const Icon = TYPE_ICONS[task.type || 'extra'] || Plus;
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center space-x-2 text-xs p-1 rounded ${
                        isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                      }`}
                    >
                      <Icon className="w-3 h-3 flex-shrink-0" />
                      <span className={`flex-1 truncate ${
                        task.completed ? 'line-through opacity-60' : ''
                      }`}>
                        {task.title}
                      </span>
                      {task.completed ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <Circle className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs opacity-70 text-center">No hay tareas para este día</p>
            )}
          </div>
        )}

        {/* Type Summary */}
        {Object.keys(stats.typeStats).length > 0 && (
          <div className={`p-3 rounded-lg border-2 ${
            isDarkMode ? 'bg-gray-900 border-white' : 'bg-gray-50 border-black'
          }`}>
            <h4 className="text-sm font-medium mb-2">Resumen por tipo</h4>
            <div className="space-y-1">
              {Object.entries(stats.typeStats).map(([type, typeData]) => {
                const Icon = TYPE_ICONS[type] || Plus;
                const completionRate = typeData.total > 0
                  ? Math.round((typeData.completed / typeData.total) * 100)
                  : 0;

                return (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-3 h-3" />
                      <span className="capitalize">{type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>{typeData.completed}/{typeData.total}</span>
                      <span className={`font-medium ${
                        completionRate >= 80 ? 'text-green-500' :
                        completionRate >= 50 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {completionRate}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className={`mt-3 p-2 rounded text-xs text-center ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <p>💡 Click en un día con tareas para ver detalles</p>
        </div>
      </div>
    </div>
  );
};

export default CalendarPanel;