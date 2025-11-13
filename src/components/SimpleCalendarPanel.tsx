import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, Circle, Target, Heart, Lightbulb, Users, Briefcase, Book, Gamepad2, Plus, X } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useTheme } from '@/hooks/useTheme';
import { Task } from '@/types';

interface SimpleCalendarPanelProps {
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

const SimpleCalendarPanel: React.FC<SimpleCalendarPanelProps> = ({ onClose }) => {
  const { currentTheme } = useTheme();
  const { tasks } = useTaskStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const isDarkMode = currentTheme === 'dark';

  // Obtener días del mes actual con tareas
  const monthData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];

      const dayTasks = tasks.filter(task => {
        // Considerar tareas con scheduledDate, createdAt o completedAt de ese día
        let taskDate;
        if (task.scheduledDate) {
          taskDate = new Date(task.scheduledDate);
        } else if (task.createdAt) {
          taskDate = new Date(task.createdAt);
        } else if (task.completedAt) {
          taskDate = new Date(task.completedAt);
        } else {
          return false;
        }
        return taskDate.toISOString().split('T')[0] === dateStr;
      });

      const completedTasks = dayTasks.filter(task => task.completed);
      const pendingTasks = dayTasks.filter(task => !task.completed);

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
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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

    return {
      total: totalTasks,
      completed: completedTasks,
      pending: totalTasks - completedTasks,
      completionRate,
      typeStats
    };
  }, [monthData]);

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

  const monthName = currentMonth.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  });

  const selectedDayData = selectedDay
    ? monthData.find(day => day && day.date.toDateString() === selectedDay.toDateString())
    : null;

  return (
    <div className={`h-full flex flex-col ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-center">
        <h2 className="text-xl font-bold flex items-center">
        </h2>
      </div>

      {/* Month Navigation */}
      <div className="p-2 flex items-center justify-between">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1 rounded transition-colors border-0 bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-2xl font-bold capitalize">{monthName}</h3>
        <button
          onClick={() => navigateMonth('next')}
          className="p-1 rounded transition-colors border-0 bg-transparent"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Calendar Grid */}
        <div className={`p-3 rounded-lg mb-3 ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, index) => (
              <div key={`weekday-${index}`} className="text-center text-sm font-medium opacity-70">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
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
                  onClick={() => setSelectedDay(day.date)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative cursor-pointer transition-all hover:scale-105 ${
                    isSelected
                      ? isDarkMode ? 'bg-white text-black shadow-lg scale-110' : 'bg-black text-white shadow-lg scale-110'
                      : isToday
                      ? isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      : isCompleted
                      ? isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                      : hasTasks
                      ? isDarkMode ? 'bg-gray-900' : 'bg-white'
                      : isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                  }`}
                  title={`${day.day} - ${day.completed}/${day.total} tareas`}
                >
                  <span className="font-medium">{day.day}</span>

                  {/* Barra de progreso del día */}
                  {day.total > 0 && (
                    <div className="w-1/2 mt-1 mx-auto">
                      <div className={`w-full h-1 rounded-full overflow-hidden ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}>
                        <div
                          className="h-full transition-all duration-300 bg-black"
                          style={{
                            width: `${(day.completed / day.total) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDayData && (
          <div className={`p-3 rounded-lg mb-3 ${
            isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`}>
            <div className="flex justify-center items-center mb-4">
              <h4 className="text-xl font-bold text-center">
                {selectedDayData.day} de {currentMonth.toLocaleDateString('es-ES', { month: 'long' })}
              </h4>
            </div>

            {selectedDayData.tasks.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedDayData.tasks.map((task: Task) => {
                  const Icon = TYPE_ICONS[task.type || 'extra'] || Plus;
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center space-x-3 text-base p-4 rounded-lg ${
                        isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className={`flex-1 truncate ${
                        task.completed ? 'line-through opacity-60' : ''
                      }`}>
                        {task.title}
                      </span>
                      {task.completed ? (
                        <CheckCircle className="w-4 h-4 text-black" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm opacity-70 text-center mb-6">No hay tareas para este día</p>
            )}
          </div>
        )}
      </div>

      {/* Stats Summary - Movido al final */}
      <div className="p-3">
        <div className="grid grid-cols-3 gap-1">
          <div className={`p-3 rounded-lg text-center ${
            isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`}>
            <p className="font-bold text-2xl">{stats.total}</p>
            <p className="opacity-70 text-sm">Total</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${
            isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`}>
            <p className="font-bold text-2xl">{stats.completed}</p>
            <p className="opacity-70 text-sm">Hechas</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${
            isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`}>
            <p className="font-bold text-2xl">{stats.pending}</p>
            <p className="opacity-70 text-sm">Pend.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleCalendarPanel;