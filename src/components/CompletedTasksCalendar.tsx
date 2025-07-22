import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, Trophy, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
  completedDate?: string;
  notes?: string;
}

interface CompletedTasksCalendarProps {
  tasks: Task[];
}

interface CompletedDay {
  date: string;
  count: number;
  tasks: Task[];
}

const CompletedTasksCalendar: React.FC<CompletedTasksCalendarProps> = ({ tasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Get previous month's days to fill the grid
  const prevMonth = new Date(currentYear, currentMonth - 1, 0);
  const daysInPrevMonth = prevMonth.getDate();

  const monthNamesFull = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

  // Get completed tasks grouped by completion date
  const completedTasksByDate = useMemo(() => {
    const completedTasks = tasks.filter(task => task.completed && task.completedDate);
    const groupedTasks: { [key: string]: CompletedDay } = {};

    completedTasks.forEach(task => {
      if (task.completedDate) {
        const date = task.completedDate.split('T')[0];
        if (!groupedTasks[date]) {
          groupedTasks[date] = {
            date,
            count: 0,
            tasks: []
          };
        }
        groupedTasks[date].count++;
        groupedTasks[date].tasks.push(task);
      }
    });

    return groupedTasks;
  }, [tasks]);

  // Calculate streak and statistics
  const stats = useMemo(() => {
    const completedDates = Object.keys(completedTasksByDate).sort();
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    
    // Calculate current streak (from today backwards)
    let checkDate = new Date(today);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (completedTasksByDate[dateStr]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate max streak
    for (let i = 0; i < completedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(completedDates[i - 1]);
        const currentDate = new Date(completedDates[i]);
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    const totalCompletedTasks = Object.values(completedTasksByDate).reduce((sum, day) => sum + day.count, 0);
    const activeDays = Object.keys(completedTasksByDate).length;

    return {
      currentStreak,
      maxStreak,
      totalCompletedTasks,
      activeDays
    };
  }, [completedTasksByDate, today]);

  // Get completion count for a specific date
  const getCompletionCount = (dateStr: string) => {
    return completedTasksByDate[dateStr]?.count || 0;
  };

  // Get heat map intensity (0-4 levels)
  const getHeatMapIntensity = (count: number) => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    
    // Previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const count = getCompletionCount(dateStr);
      
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
        completionCount: count,
        intensity: getHeatMapIntensity(count)
      });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === today.toDateString();
      const count = getCompletionCount(dateStr);
      
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: true,
        isToday,
        completionCount: count,
        intensity: getHeatMapIntensity(count)
      });
    }

    // Next month's days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const count = getCompletionCount(dateStr);
      
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
        completionCount: count,
        intensity: getHeatMapIntensity(count)
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getHeatMapColor = (intensity: number) => {
    switch (intensity) {
      case 0: return 'bg-gray-100';
      case 1: return 'bg-green-200';
      case 2: return 'bg-green-300';
      case 3: return 'bg-green-400';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-100';
    }
  };

  const selectedDateData = selectedDate ? completedTasksByDate[selectedDate] : null;

  return (
    <div className="min-h-screen bg-white pb-40" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-black mb-2">Progreso de Tareas</h1>
          <p className="text-sm text-gray-600">Ve tu historial de tareas completadas</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-3 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-center mb-1">
              <Trophy size={20} className="text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-700">{stats.currentStreak}</div>
            <div className="text-xs text-green-600">Racha actual</div>
          </Card>
          
          <Card className="p-3 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle size={20} className="text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-700">{stats.totalCompletedTasks}</div>
            <div className="text-xs text-blue-600">Total completadas</div>
          </Card>
          
          <Card className="p-3 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-center mb-1">
              <Calendar size={20} className="text-purple-600" />
            </div>
            <div className="text-lg font-bold text-purple-700">{stats.activeDays}</div>
            <div className="text-xs text-purple-600">Días activos</div>
          </Card>
          
          <Card className="p-3 text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-center mb-1">
              <Clock size={20} className="text-orange-600" />
            </div>
            <div className="text-lg font-bold text-orange-700">{stats.maxStreak}</div>
            <div className="text-xs text-orange-600">Mejor racha</div>
          </Card>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-50 rounded-full"
          >
            <ChevronLeft size={18} className="text-black" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-black">
              {monthNamesFull[currentMonth]} {currentYear}
            </h2>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-50 rounded-full"
          >
            <ChevronRight size={18} className="text-black" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {dayNames.map(dayName => (
            <div key={dayName} className="text-center text-xs font-medium text-gray-500 p-1 uppercase">
              {dayName}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="px-4">
        <div className="grid grid-cols-7 gap-1 mb-6">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => setSelectedDate(day.completionCount > 0 ? day.date : null)}
              className={`
                aspect-square p-1 text-center relative rounded-lg transition-all duration-200 border
                ${day.isCurrentMonth ? 'text-black' : 'text-gray-300'}
                ${day.isToday ? 'ring-2 ring-black' : ''}
                ${selectedDate === day.date ? 'ring-2 ring-blue-500' : ''}
                ${day.completionCount > 0 ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                ${getHeatMapColor(day.intensity)}
              `}
            >
              <div className="text-sm font-medium">{day.day}</div>
              {day.completionCount > 0 && (
                <div className="absolute top-0 right-0 w-4 h-4 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {day.completionCount}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Heat map legend */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-xs text-gray-500">Menos</span>
          {[0, 1, 2, 3, 4].map(intensity => (
            <div
              key={intensity}
              className={`w-3 h-3 rounded-sm ${getHeatMapColor(intensity)} border`}
            />
          ))}
          <span className="text-xs text-gray-500">Más</span>
        </div>

        {/* Selected Date Details */}
        {selectedDateData && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-black">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h3>
              <p className="text-sm text-gray-600">
                {selectedDateData.count} tareas completadas
              </p>
            </div>

            <div className="space-y-3">
              {selectedDateData.tasks.map(task => (
                <div key={task.id} className="bg-white p-3 rounded-lg border shadow-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-black">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`
                          text-xs px-2 py-1 rounded-full font-medium
                          ${task.type === 'work' ? 'bg-blue-100 text-blue-700' : 
                            task.type === 'personal' ? 'bg-green-100 text-green-700' : 
                            'bg-purple-100 text-purple-700'}
                        `}>
                          {task.type === 'work' ? 'Trabajo' : 
                           task.type === 'personal' ? 'Personal' : 'Meditación'}
                        </span>
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtareas
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Motivational message */}
        {stats.currentStreak > 0 && (
          <Card className="p-4 text-center bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <Trophy size={24} className="mx-auto mb-2 text-yellow-600" />
            <h3 className="font-bold text-black mb-1">
              ¡{stats.currentStreak} días consecutivos!
            </h3>
            <p className="text-sm text-gray-600">
              {stats.currentStreak >= 7 ? '¡Increíble constancia! 🏆' :
               stats.currentStreak >= 3 ? '¡Excelente progreso! 💪' :
               '¡Sigue así! 🚀'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompletedTasksCalendar;
