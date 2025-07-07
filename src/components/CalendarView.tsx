import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  completedDate?: string;
}

interface CalendarViewProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddTask: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  tasks, 
  onToggleTask, 
  onToggleSubtask, 
  onAddTask 
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

  // Get previous month's days to fill the grid
  const prevMonth = new Date(currentYear, currentMonth - 1, 0);
  const daysInPrevMonth = prevMonth.getDate();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Get tasks for a specific date
  const getTasksForDate = (dateStr: string) => {
    return tasks.filter(task => task.scheduledDate === dateStr);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    
    // Previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
        tasksCount: getTasksForDate(dateStr).length
      });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === today.toDateString();
      
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: true,
        isToday,
        tasksCount: getTasksForDate(dateStr).length
      });
    }

    // Next month's days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
        tasksCount: getTasksForDate(dateStr).length
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

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="h-screen bg-white flex flex-col" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Calendar Header */}
      <div className="border-b-2 border-black bg-white p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100"
          >
            <ChevronLeft size={20} className="text-black" />
          </Button>
          
          <h2 className="text-2xl font-bold text-black">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          
          <Button
            variant="ghost"
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100"
          >
            <ChevronRight size={20} className="text-black" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map(dayName => (
            <div key={dayName} className="text-center text-sm font-bold text-black p-2">
              {dayName}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar Grid */}
        <div className={`p-4 ${selectedDate ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
          <div className="grid grid-cols-7 gap-1 h-full">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(selectedDate === day.date ? null : day.date)}
                className={`
                  border border-black p-2 text-center relative min-h-[60px] flex flex-col justify-between
                  ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                  ${day.isToday ? 'bg-black text-white' : ''}
                  ${selectedDate === day.date ? 'ring-2 ring-black' : ''}
                  hover:bg-gray-100 transition-colors
                `}
              >
                <div className="text-sm font-medium">{day.day}</div>
                {day.tasksCount > 0 && (
                  <div className={`
                    w-5 h-5 rounded-full text-xs flex items-center justify-center self-end
                    ${day.isToday ? 'bg-white text-black' : 'bg-black text-white'}
                  `}>
                    {day.tasksCount}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Date Tasks - Sidebar */}
        {selectedDate && (
          <div className="w-1/2 border-l-2 border-black bg-white p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-lg font-bold text-black">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={onAddTask}
                  className="bg-black text-white hover:bg-gray-800 p-1"
                  size="sm"
                >
                  <Plus size={14} />
                </Button>
                <Button
                  onClick={() => setSelectedDate(null)}
                  variant="ghost"
                  className="p-1"
                  size="sm"
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {selectedDateTasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      id={task.id}
                      title={task.title}
                      type={task.type}
                      completed={task.completed}
                      subtasks={task.subtasks}
                      onToggle={onToggleTask}
                      onToggleSubtask={onToggleSubtask}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 font-medium text-sm">
                    No hay tareas
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Haz clic en + para agregar
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;