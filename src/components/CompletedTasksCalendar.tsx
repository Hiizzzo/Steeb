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
  type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra';
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
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isShiny = document.documentElement.classList.contains('shiny');

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

  // Get minimalist styling for completed tasks
  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-gray-50 border-gray-200';
    return 'bg-gray-800 border-gray-900 text-white';
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
        intensityClass: getIntensityClass(count)
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
        intensityClass: getIntensityClass(count)
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
        intensityClass: getIntensityClass(count)
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

  // Handle touch start for swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    setIsDragging(false);
  };

  // Handle touch move for swipe detection
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    // If movement is significant, consider it a drag
    if (deltaX > 10 || deltaY > 10) {
      setIsDragging(true);
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    setTouchStart(null);
    setTimeout(() => setIsDragging(false), 100); // Reset after a short delay
  };

  // Handle date click (only if not dragging and has completed tasks)
  const handleDateClick = (day: any, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't open if it was a drag/swipe gesture
    if (isDragging) return;
    
    // Only select if there are completed tasks
    if (day.completionCount > 0) {
      setSelectedDate(day.date);
    } else {
      setSelectedDate(null);
    }
  };

  const selectedDateData = selectedDate ? completedTasksByDate[selectedDate] : null;

  return (
    <div className="min-h-screen bg-black pb-40" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="bg-black p-4 border-b border-gray-800">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-white mb-2">Progreso de Tareas</h1>
          <p className="text-sm text-gray-400">Ve tu historial de tareas completadas</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-3 text-center bg-gray-900 border-gray-800">
            <div className="flex items-center justify-center mb-1">
              <Trophy size={20} className="text-white" />
            </div>
            <div className="text-lg font-bold text-white">{stats.currentStreak}</div>
            <div className="text-xs text-gray-400">Racha actual</div>
          </Card>
          
          <Card className="p-3 text-center bg-gray-900 border-gray-800">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle size={20} className="text-white" />
            </div>
            <div className="text-lg font-bold text-white">{stats.totalCompletedTasks}</div>
            <div className="text-xs text-gray-400">Total completadas</div>
          </Card>
          
          <Card className="p-3 text-center bg-gray-900 border-gray-800">
            <div className="flex items-center justify-center mb-1">
              <Calendar size={20} className="text-white" />
            </div>
            <div className="text-lg font-bold text-white">{stats.activeDays}</div>
            <div className="text-xs text-gray-400">Días activos</div>
          </Card>
          
          <Card className="p-3 text-center bg-gray-900 border-gray-800">
            <div className="flex items-center justify-center mb-1">
              <Clock size={20} className="text-white" />
            </div>
            <div className="text-lg font-bold text-white">{stats.maxStreak}</div>
            <div className="text-xs text-gray-400">Mejor racha</div>
          </Card>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-800 rounded-full text-white"
          >
            <ChevronLeft size={18} />
          </Button>
          
          <div className="text-center">
            <h2 className={`text-xl font-bold ${
              isShiny ? 'text-black' : 'text-white'
            }`}>
              {monthNamesFull[currentMonth]} {currentYear}
            </h2>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-800 rounded-full text-white"
          >
            <ChevronRight size={18} />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {dayNames.map(dayName => (
            <div key={dayName} className="text-center text-xs font-medium text-gray-400 p-1 uppercase">
              {dayName}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="px-4">
        <div 
          className="grid grid-cols-7 gap-1 mb-6"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={(e) => handleDateClick(day, e)}
              className={`
                aspect-square p-1 text-center relative rounded-lg transition-all duration-200 border
                ${day.isCurrentMonth ? 'opacity-100' : 'opacity-40'}
                ${day.isToday ? 'ring-2 ring-white' : ''}
                ${selectedDate === day.date ? 'ring-2 ring-white' : ''}
                ${day.completionCount > 0 ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                ${day.intensityClass}
                touch-manipulation select-none
              `}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className={`text-sm font-medium ${
                  isShiny ? 'text-black' : 'text-white'
                }`}>{day.day}</div>
                {day.completionCount > 0 && (
                  <div className="mt-1 px-2 py-0.5 bg-white text-black text-[10px] rounded-full border font-bold">
                    {day.completionCount > 9 ? '9+' : day.completionCount}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Minimalist legend */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-gray-50 border border-gray-200" />
            <span className="text-xs text-gray-400">Sin tareas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-gray-800 border border-gray-900" />
            <span className="text-xs text-gray-400">Completadas</span>
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDateData && (
          <Card className="p-4 mb-6 bg-gray-900 border-gray-800">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h3>
              <p className="text-sm text-gray-400">
                {selectedDateData.count} tareas completadas
              </p>
            </div>

            <div className="space-y-3">
              {selectedDateData.tasks.map(task => (
                <div key={task.id} className="bg-gray-800 border border-gray-700 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-white flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-700 text-gray-200 border border-gray-600">
                           {task.type}
                         </span>
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="text-xs text-gray-400">
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
          <Card className="p-4 text-center bg-gray-900 border-gray-800">
            <Trophy size={24} className="mx-auto mb-2 text-white" />
            <h3 className="font-bold text-white mb-1">
              ¡{stats.currentStreak} días consecutivos!
            </h3>
            <p className="text-sm text-gray-400">
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
