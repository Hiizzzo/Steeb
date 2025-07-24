import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, CheckSquare, Calendar, Trophy } from 'lucide-react';
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

interface CalendarViewProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddTask: () => void;
  onDelete?: (id: string) => void;
  onShowDetail?: (id: string) => void;
}

interface CompletedDay {
  date: string;
  count: number;
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  tasks, 
  onToggleTask, 
  onToggleSubtask, 
  onAddTask,
  onDelete,
  onShowDetail
}) => {
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

  const monthNamesFull = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

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

  // Get activity intensity for visual indicator (0-5 scale)
  const getActivityIntensity = (count: number) => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    if (count >= 4) return 4;
    return 5;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    
    // Previous month's days to fill start of grid
    const prevMonth = new Date(currentYear, currentMonth - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
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
        activityIntensity: getActivityIntensity(count)
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
        activityIntensity: getActivityIntensity(count)
      });
    }

    // Next month's days to fill the grid (ensure 6 rows)
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
        activityIntensity: getActivityIntensity(count)
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Main Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Hoy es un gran día para
        </h1>
        <h1 className="text-2xl font-bold text-gray-900">
          tachar pendientes
        </h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
        <Card className="p-4 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-center mb-2">
            <RotateCcw size={24} className="text-gray-700" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.currentStreak}</div>
          <div className="text-sm text-gray-600">días de racha</div>
        </Card>
        
        <Card className="p-4 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-center mb-2">
            <CheckSquare size={24} className="text-gray-700" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalCompletedTasks}</div>
          <div className="text-sm text-gray-600">
            <div className="w-12 h-1 bg-gray-300 rounded mx-auto"></div>
          </div>
        </Card>
        
        <Card className="p-4 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-center mb-2">
            <Calendar size={24} className="text-gray-700" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.activeDays}</div>
          <div className="text-sm text-gray-600">Días activos</div>
        </Card>
        
        <Card className="p-4 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-center mb-2">
            <Trophy size={24} className="text-gray-700" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.maxStreak}</div>
          <div className="text-sm text-gray-600">Mejor racha</div>
        </Card>
      </div>

      {/* Calendar */}
      <div className="max-w-md mx-auto">
        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">
              {monthNamesFull[currentMonth]} {currentYear}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {monthNamesFull[currentMonth].toLowerCase()} {currentYear}
            </p>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight size={20} className="text-gray-700" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {dayNames.map(dayName => (
            <div key={dayName} className="text-center text-sm font-medium text-gray-600 p-2">
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`
                aspect-square p-2 text-center relative bg-white rounded-lg border transition-all duration-200
                ${day.isCurrentMonth ? 'opacity-100 border-gray-200' : 'opacity-30 border-gray-100'}
                ${day.isToday ? 'ring-2 ring-black font-bold' : ''}
                ${selectedDate === day.date ? 'ring-2 ring-blue-500' : ''}
                cursor-pointer hover:bg-gray-50
              `}
              onClick={() => setSelectedDate(day.date)}
            >
              <div className="text-lg font-medium text-gray-900">{day.day}</div>
              
              {/* Activity indicator bars */}
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                {day.activityIntensity > 0 && (
                  <>
                    <div className={`w-1 h-1 rounded-full ${
                      day.activityIntensity >= 1 ? 'bg-gray-400' : 'bg-gray-200'
                    }`} />
                    <div className={`w-1 h-1 rounded-full ${
                      day.activityIntensity >= 2 ? 'bg-gray-500' : 'bg-gray-200'
                    }`} />
                    <div className={`w-1 h-1 rounded-full ${
                      day.activityIntensity >= 3 ? 'bg-gray-600' : 'bg-gray-200'
                    }`} />
                    <div className={`w-1 h-1 rounded-full ${
                      day.activityIntensity >= 4 ? 'bg-gray-700' : 'bg-gray-200'
                    }`} />
                    <div className={`w-1 h-1 rounded-full ${
                      day.activityIntensity >= 5 ? 'bg-gray-800' : 'bg-gray-200'
                    }`} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center mt-6 gap-8">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Menos</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-sm bg-gray-200" />
              <div className="w-2 h-2 rounded-sm bg-gray-300" />
              <div className="w-2 h-2 rounded-sm bg-gray-500" />
              <div className="w-2 h-2 rounded-sm bg-gray-700" />
              <div className="w-2 h-2 rounded-sm bg-gray-900" />
            </div>
            <span className="text-sm text-gray-500">Más</span>
          </div>
        </div>

        {/* Current Date Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'short'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;