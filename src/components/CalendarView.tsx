import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, X } from 'lucide-react';
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
  scheduledTime?: string;
  completedDate?: string;
}

interface CalendarViewProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddTask: () => void;
  onDelete?: (id: string) => void;
  onShowDetail?: (id: string) => void;
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

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowDateDetails(true);
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="min-h-screen bg-white pb-32" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Calendar Header */}
      <div className="bg-white p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigateMonth('prev')}
            className="p-3 hover:bg-gray-50 rounded-full"
          >
            <ChevronLeft size={20} className="text-black" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-black">
              {monthNamesFull[currentMonth]} {currentYear}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {monthNames[currentMonth]} {currentYear}
            </p>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => navigateMonth('next')}
            className="p-3 hover:bg-gray-50 rounded-full"
          >
            <ChevronRight size={20} className="text-black" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayNames.map(dayName => (
            <div key={dayName} className="text-center text-xs font-medium text-gray-500 p-2 uppercase">
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
              onClick={() => handleDateClick(day.date)}
              className={`
                aspect-square p-2 text-center relative rounded-lg transition-all duration-200
                ${day.isCurrentMonth ? 'text-black hover:bg-gray-50' : 'text-gray-300'}
                ${day.isToday ? 'bg-black text-white font-bold' : ''}
                ${selectedDate === day.date && !day.isToday ? 'bg-gray-100 ring-2 ring-black' : ''}
              `}
            >
              <div className="text-base font-medium">{day.day}</div>
              {day.tasksCount > 0 && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {Array.from({ length: Math.min(day.tasksCount, 3) }).map((_, i) => (
                    <div 
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        day.isToday ? 'bg-white' : 'bg-black'
                      }`}
                    />
                  ))}
                  {day.tasksCount > 3 && (
                    <div className={`text-xs font-bold ${day.isToday ? 'text-white' : 'text-black'}`}>
                      +{day.tasksCount - 3}
                    </div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Quick today access */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 mb-2">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <Button
            onClick={() => handleDateClick(today.toISOString().split('T')[0])}
            className="bg-black text-white hover:bg-gray-800 rounded-full px-6 py-2"
          >
            <Calendar size={16} className="mr-2" />
            Ver Hoy
          </Button>
        </div>
      </div>

      {/* Date Details Modal */}
      {showDateDetails && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-4">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-black">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric'
                    })}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={onAddTask}
                    className="bg-black text-white hover:bg-gray-800 rounded-full p-2"
                  >
                    <Plus size={16} />
                  </Button>
                  <Button
                    onClick={() => setShowDateDetails(false)}
                    variant="ghost"
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>

              {/* Tasks for selected date */}
              {selectedDateTasks.length > 0 ? (
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
                      onToggle={onToggleTask}
                      onToggleSubtask={onToggleSubtask}
                      onDelete={onDelete}
                      onShowDetail={onShowDetail}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">
                    Sin recordatorios
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    No hay tareas programadas para este día
                  </p>
                  <Button
                    onClick={onAddTask}
                    className="bg-black text-white hover:bg-gray-800 rounded-full px-6 py-2"
                  >
                    <Plus size={16} className="mr-2" />
                    Nuevo
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