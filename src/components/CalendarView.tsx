import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, X, CheckCircle, Trophy, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import TaskCard from './TaskCard';

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
  notes?: string; // Notas adicionales de la tarea
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
  const [showDateDetails, setShowDateDetails] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setTouchStart(null);
      setIsDragging(false);
    };
  }, []);

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

  const monthNames = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];

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

  // Get tasks for a specific date
  const getTasksForDate = (dateStr: string) => {
    return tasks.filter(task => task.scheduledDate === dateStr);
  };

  // Get pending tasks for a specific date (only non-completed tasks)
  const getPendingTasksForDate = (dateStr: string) => {
    return tasks.filter(task => 
      task.scheduledDate === dateStr && !task.completed
    );
  };

  // Check if a date has any pending tasks
  const hasPendingTasks = (dateStr: string) => {
    return getPendingTasksForDate(dateStr).length > 0;
  };

  // Get completion count for a specific date
  const getCompletionCount = (dateStr: string) => {
    return completedTasksByDate[dateStr]?.count || 0;
  };

  // Get minimalist intensity indicator (simple black theme)
  const getIntensityIndicator = (count: number, hasPending: boolean) => {
    if (count === 0 && !hasPending) return 'bg-gray-50 border-gray-200';
    if (hasPending && count === 0) return 'bg-gray-100 border-gray-300';
    if (count > 0 && !hasPending) return 'bg-gray-800 border-gray-900 text-white';
    return 'bg-gray-600 border-gray-700 text-white'; // Has both completed and pending
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    
    // Previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const completionCount = getCompletionCount(dateStr);
      const hasPending = hasPendingTasks(dateStr);
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
        tasksCount: getTasksForDate(dateStr).length,
        hasPending,
        completionCount,
        intensityClass: getIntensityIndicator(completionCount, hasPending)
      });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === today.toDateString();
      const completionCount = getCompletionCount(dateStr);
      const hasPending = hasPendingTasks(dateStr);
      
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: true,
        isToday,
        tasksCount: getTasksForDate(dateStr).length,
        hasPending,
        completionCount,
        intensityClass: getIntensityIndicator(completionCount, hasPending)
      });
    }

    // Next month's days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const completionCount = getCompletionCount(dateStr);
      const hasPending = hasPendingTasks(dateStr);
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
        tasksCount: getTasksForDate(dateStr).length,
        hasPending,
        completionCount,
        intensityClass: getIntensityIndicator(completionCount, hasPending)
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

  // Handle date click (only if not dragging)
  const handleDateClick = (dateStr: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't open if it was a drag/swipe gesture
    if (isDragging) return;
    
    // Only open if there are tasks or if it's a tap/click
    const hasAnyTasks = getTasksForDate(dateStr).length > 0;
    if (hasAnyTasks) {
      setSelectedDate(dateStr);
      setShowDateDetails(true);
    }
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];
  const selectedDateCompletedTasks = selectedDate ? completedTasksByDate[selectedDate]?.tasks || [] : [];

  return (
    <div className="min-h-screen bg-black pb-40" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Calendar Header */}
      <div className="bg-black p-4 border-b border-gray-800">
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

        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-800 rounded-full text-white"
          >
            <ChevronLeft size={18} />
          </Button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">
              {monthNamesFull[currentMonth]} {currentYear}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {monthNames[currentMonth]} {currentYear}
            </p>
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
      <div className="px-3">
        <div 
          className="grid grid-cols-7 gap-1 mb-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={(e) => handleDateClick(day.date, e)}
              className={`
                aspect-square p-1.5 text-center relative rounded-lg transition-all duration-200 border
                ${day.isCurrentMonth ? 'opacity-100' : 'opacity-40'}
                ${day.isToday ? 'ring-2 ring-white font-bold' : ''}
                ${selectedDate === day.date && !day.isToday ? 'ring-2 ring-gray-500' : ''}
                ${day.intensityClass}
                ${day.tasksCount > 0 ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                touch-manipulation select-none
              `}
            >
              <div className="text-sm font-medium">{day.day}</div>
              
              {/* Task indicator dot */}
              {day.hasPending && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white opacity-90" />
                </div>
              )}
              
              {/* Completed tasks count */}
              {day.completionCount > 0 && (
                <div className="absolute top-0 right-0 w-3 h-3 bg-white text-black text-xs rounded-full flex items-center justify-center font-bold">
                  {day.completionCount > 9 ? '9+' : day.completionCount}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Minimalist legend */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-gray-50 border border-gray-200" />
            <span className="text-xs text-gray-400">Sin tareas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-gray-800 border border-gray-900" />
            <span className="text-xs text-gray-400">Completadas</span>
          </div>
        </div>

        {/* Motivational message */}
        {stats.currentStreak > 0 && (
          <Card className="p-4 text-center bg-gray-900 border-gray-800 mb-4">
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

        {/* Quick today access */}
        <div className="text-center mb-4">
          <p className="text-xs text-gray-400 mb-2">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'short'
            })}
          </p>
          <Button
            onClick={() => handleDateClick(today.toISOString().split('T')[0], {} as any)}
            className="bg-white text-black hover:bg-gray-100 rounded-full px-4 py-1.5 text-sm"
          >
            <Calendar size={14} className="mr-1.5" />
            Ver Hoy
          </Button>
        </div>
      </div>

      {/* Date Details Modal */}
      {showDateDetails && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-end justify-center z-50">
          <div className="bg-black border-t border-gray-800 rounded-t-3xl w-full max-w-md max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-4">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric'
                    })}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={onAddTask}
                    className="bg-white text-black hover:bg-gray-100 rounded-full p-2"
                  >
                    <Plus size={16} />
                  </Button>
                  <Button
                    onClick={() => setShowDateDetails(false)}
                    variant="ghost"
                    className="p-2 hover:bg-gray-800 rounded-full text-white"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>

              {/* Tasks Summary */}
              {(selectedDateTasks.length > 0 || selectedDateCompletedTasks.length > 0) && (
                <div className="mb-4 p-3 bg-gray-900 border border-gray-800 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      Total: {selectedDateTasks.length} programadas
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-white">
                        ✓ {selectedDateCompletedTasks.length} completadas
                      </span>
                      <span className="text-gray-400">
                        ● {getPendingTasksForDate(selectedDate).length} pendientes
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scheduled Tasks Section */}
              {selectedDateTasks.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Tareas Programadas</h4>
                  <div className="space-y-4">
                    {selectedDateTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        type={task.type}
                        completed={task.completed}
                        subtasks={task.subtasks}
                        scheduledDate={task.scheduledDate}
                        scheduledTime={task.scheduledTime}
                        notes={task.notes}
                        onToggle={onToggleTask}
                        onToggleSubtask={onToggleSubtask}
                        onDelete={onDelete}
                        onShowDetail={onShowDetail}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks Section */}
              {selectedDateCompletedTasks.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Tareas Completadas</h4>
                  <div className="space-y-3">
                    {selectedDateCompletedTasks.map(task => (
                      <div key={task.id} className="bg-gray-900 border border-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle size={16} className="text-white flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{task.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`
                                text-xs px-2 py-1 rounded-full font-medium border
                                ${task.type === 'work' ? 'bg-gray-800 text-white border-gray-700' : 
                                  task.type === 'personal' ? 'bg-gray-800 text-white border-gray-700' : 
                                  'bg-gray-800 text-white border-gray-700'}
                              `}>
                                {task.type === 'work' ? 'Trabajo' : 
                                 task.type === 'personal' ? 'Personal' : 'Meditación'}
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
                </div>
              )}

              {/* Empty state */}
              {selectedDateTasks.length === 0 && selectedDateCompletedTasks.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-400 font-medium mb-2">
                    Sin tareas programadas
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Este día está libre. ¡Perfecto para descansar o planificar nuevas tareas!
                  </p>
                  <Button
                    onClick={onAddTask}
                    className="bg-white text-black hover:bg-gray-100 rounded-full px-6 py-2"
                  >
                    <Plus size={16} className="mr-2" />
                    Agregar Tarea
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;