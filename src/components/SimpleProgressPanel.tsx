import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart3, Target, CheckCircle, Flame, Trophy } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useTheme } from '@/hooks/useTheme';

interface SimpleProgressPanelProps {
  onClose: () => void;
}

const SimpleProgressPanel: React.FC<SimpleProgressPanelProps> = ({ onClose }) => {
  const { currentTheme } = useTheme();
  const { tasks } = useTaskStore();
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'year'>('week');
  const isDarkMode = currentTheme === 'dark';
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(window.innerHeight * 0.4);
  const [isDragging, setIsDragging] = useState(false);
  const [actualContainerHeight, setActualContainerHeight] = useState(window.innerHeight * 0.4);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const startYRef = useRef<number>(0);
  const currentHeightRef = useRef<number>(window.innerHeight * 0.4);

  // Handle snap positions - half screen and full screen
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const deltaY = startYRef.current - e.clientY;
      const threshold = 80;

      if (deltaY > threshold && !isFullScreen) {
        setIsFullScreen(true);
        setPanelHeight(window.innerHeight * 0.75);
        currentHeightRef.current = window.innerHeight * 0.75;
      }
      else if (deltaY < -threshold && isFullScreen) {
        setIsFullScreen(false);
        setPanelHeight(window.innerHeight * 0.4);
        currentHeightRef.current = window.innerHeight * 0.4;
      }
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isDragging) {
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, isFullScreen]);

  // Monitor actual container height for dynamic sizing - TIEMPO REAL
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newHeight = entry.contentRect.height;
        // Actualización inmediata en tiempo real - SIN DELAY
        if (Math.abs(newHeight - actualContainerHeight) > 2) {
          setActualContainerHeight(newHeight);
        }
      }
    });

    resizeObserverRef.current.observe(chartContainerRef.current);

    const updateHeight = () => {
      if (chartContainerRef.current) {
        const height = chartContainerRef.current.getBoundingClientRect().height;
        setActualContainerHeight(height);
      }
    };

    updateHeight();

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [actualContainerHeight]);

  // Actualización ULTRA RÁPIDA durante el drag para tiempo real
  useEffect(() => {
    if (isDragging && chartContainerRef.current) {
      const updateDuringDrag = () => {
        if (chartContainerRef.current) {
          const height = chartContainerRef.current.getBoundingClientRect().height;
          setActualContainerHeight(height);
        }
      };

      // Actualizar inmediatamente al iniciar drag
      updateDuringDrag();

      // Actualizar a 120fps para máxima fluidez durante el drag
      const interval = setInterval(updateDuringDrag, 8);

      return () => clearInterval(interval);
    }
  }, [isDragging]);

  // Function to get current month name in Spanish
  const getCurrentMonthName = () => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const currentDate = new Date();
    return monthNames[currentDate.getMonth()];
  };

  // Function to get current week of month in Spanish ordinal format
  const getCurrentWeekOfMonth = () => {
    const currentDate = new Date();
    const dayOfMonth = currentDate.getDate();
    const monthName = getCurrentMonthName().toLowerCase();

    let weekNumber;
    if (dayOfMonth <= 7) {
      weekNumber = 1;
    } else if (dayOfMonth <= 14) {
      weekNumber = 2;
    } else if (dayOfMonth <= 21) {
      weekNumber = 3;
    } else {
      weekNumber = 4;
    }

    const ordinalNames = ['Primera', 'Segunda', 'Tercera', 'Cuarta'];
    return `${ordinalNames[weekNumber - 1]} semana de ${monthName}`;
  };

  // Calculate completed tasks for week, month and year
  const taskCounts = useMemo(() => {
    const now = new Date();

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekTasks = tasks.filter(task => {
      const taskDate = new Date(task.completedAt || task.createdAt);
      return taskDate >= weekAgo && task.completed;
    });

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthTasks = tasks.filter(task => {
      const taskDate = new Date(task.completedAt || task.createdAt);
      return taskDate.getMonth() === currentMonth &&
             taskDate.getFullYear() === currentYear &&
             task.completed;
    });

    const yearTasks = tasks.filter(task => {
      const taskDate = new Date(task.completedAt || task.createdAt);
      return taskDate.getFullYear() === currentYear && task.completed;
    });

    return {
      weekCompleted: weekTasks.length,
      monthCompleted: monthTasks.length,
      yearCompleted: yearTasks.length
    };
  }, [tasks]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const now = new Date();
    let filteredTasks = tasks;

    switch (viewMode) {
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
        const currentYear = now.getFullYear();
        filteredTasks = tasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          return taskDate.getFullYear() === currentYear;
        });
        break;
    }

    const total = filteredTasks.length;
    const completed = filteredTasks.filter(task => task.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

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
      averagePerDay: (completed / (viewMode === 'week' ? 7 : viewMode === 'month' ? 30 : 365)).toFixed(1)
    };
  }, [tasks, viewMode]);

  // Función de escalado para todas las vistas
  const getScaledHeight = useMemo(() => {
    return (maxTasks: number, taskCount: number, containerHeight: number) => {
      const reservedSpace = 50;
      const availableHeight = Math.max(80, containerHeight - reservedSpace);
      const minHeight = Math.max(6, availableHeight * 0.06);

      if (maxTasks === 0) return minHeight;

      const scaledHeight = (taskCount / maxTasks) * availableHeight * 0.90;
      return Math.max(scaledHeight, minHeight);
    };
  }, []);

  // Calcular tareas por día de la semana
  const tasksByDay = useMemo(() => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const weekData = days.map((day, index) => {
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.completedAt || task.createdAt);
        return taskDate.getDay() === index && task.completed;
      });
      return {
        day: day.charAt(0).toUpperCase(),
        completed: dayTasks.length,
        total: dayTasks.length
      };
    });

    const maxTasks = Math.max(...weekData.map(d => d.completed), 1);

    return weekData.map(data => ({
      ...data,
      scaledHeight: getScaledHeight(maxTasks, data.completed, actualContainerHeight)
    }));
  }, [tasks, actualContainerHeight, getScaledHeight]);

  // Calcular tareas por semana del mes
  const tasksByWeek = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const weekData = [];

    for (let week = 1; week <= 4; week++) {
      const weekTasks = tasks.filter(task => {
        const taskDate = new Date(task.completedAt || task.createdAt);
        const taskMonth = taskDate.getMonth();
        const taskYear = taskDate.getFullYear();
        const dayOfMonth = taskDate.getDate();

        if (taskMonth !== currentMonth || taskYear !== currentYear || !task.completed) {
          return false;
        }

        let weekStartDay = (week - 1) * 7 + 1;
        let weekEndDay = Math.min(week * 7, new Date(currentYear, currentMonth + 1, 0).getDate());

        return dayOfMonth >= weekStartDay && dayOfMonth <= weekEndDay;
      });

      weekData.push({
        week: `Sem ${week}`,
        completed: weekTasks.length,
        total: weekTasks.length
      });
    }

    const maxTasks = Math.max(...weekData.map(d => d.completed), 1);

    return weekData.map(data => ({
      ...data,
      scaledHeight: getScaledHeight(maxTasks, data.completed, actualContainerHeight)
    }));
  }, [tasks, actualContainerHeight, getScaledHeight]);

  // Calcular tareas por mes del año
  const tasksByMonth = useMemo(() => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const currentYear = now.getFullYear();

    const monthData = monthNames.map((month, index) => {
      const monthTasks = tasks.filter(task => {
        const taskDate = new Date(task.completedAt || task.createdAt);
        return taskDate.getMonth() === index &&
               taskDate.getFullYear() === currentYear &&
               task.completed;
      });

      return {
        month: month,
        completed: monthTasks.length,
        total: monthTasks.length
      };
    });

    const maxTasks = Math.max(...monthData.map(d => d.completed), 1);

    return monthData.map(data => ({
      ...data,
      scaledHeight: getScaledHeight(maxTasks, data.completed, actualContainerHeight)
    }));
  }, [tasks, actualContainerHeight, getScaledHeight]);

  return (
    <div className={`simple-progress-panel h-full flex flex-col ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Header */}
      <div className={`p-2 flex items-center justify-center ${
        isDarkMode ? '' : 'border-b-2 border-white'
      }`}>
        <h2 className="text-xl font-bold">
          {viewMode === 'year' ? new Date().getFullYear() : viewMode === 'week' ? getCurrentWeekOfMonth() : getCurrentMonthName()}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col" style={{ minHeight: '250px' }}>
        {/* Task Count Text Above Chart */}
        <div className="text-center py-0 px-2">
          <div className={`inline-block px-2 py-0.5 rounded-lg border-0 ${
            isDarkMode ? 'bg-black/80 text-white' : 'bg-white/80 text-black'
          } backdrop-blur-sm`}>
            <div className="flex flex-col items-center justify-center min-w-[90px]">
              <div className="text-4xl font-black leading-none w-full text-center">
                {viewMode === 'week'
                  ? taskCounts.weekCompleted
                  : viewMode === 'month'
                    ? taskCounts.monthCompleted
                    : taskCounts.yearCompleted
                }
              </div>
              <div className="text-sm font-medium opacity-90 mt-0 w-full text-center">
                tareas hiciste esta semana
              </div>
            </div>
          </div>
        </div>

        {/* Test Button - Hidden X at top right */}
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => {
              // Generate random test data based on current view mode
              const testTasks = [];
              const now = new Date();
              const currentYear = now.getFullYear();
              const currentMonth = now.getMonth();

              if (viewMode === 'year') {
                // YEAR VIEW: Generate tasks for ALL 12 months
                for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
                  const tasksForThisMonth = Math.floor(Math.random() * 6) + 3;

                  for (let i = 0; i < tasksForThisMonth; i++) {
                    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
                    const dayOfMonth = Math.floor(Math.random() * daysInMonth) + 1;
                    const taskDate = new Date(currentYear, monthIndex, dayOfMonth);

                    const isCompleted = Math.random() > 0.2;

                    testTasks.push({
                      id: `test-y-${monthIndex}-${i}`,
                      title: `Test Task ${monthIndex + 1}-${i + 1}`,
                      completed: isCompleted,
                      createdAt: taskDate.toISOString(),
                      completedAt: isCompleted ? taskDate.toISOString() : null
                    });
                  }
                }
              } else if (viewMode === 'month') {
                // MONTH VIEW: Generate tasks for current month
                const firstDayOfMonth = new Date(currentYear, currentMonth, 1);

                for (let week = 1; week <= 4; week++) {
                  let weekStartDay = (week - 1) * 7 + 1;
                  let weekEndDay = Math.min(week * 7, new Date(currentYear, currentMonth + 1, 0).getDate());

                  const firstDayWeekday = firstDayOfMonth.getDay();
                  weekStartDay = Math.max(1, weekStartDay - firstDayWeekday);
                  weekEndDay = Math.min(new Date(currentYear, currentMonth + 1, 0).getDate(),
                                        weekEndDay - firstDayWeekday + (week === 1 ? firstDayWeekday + 1 : 0));

                  const tasksForThisWeek = Math.floor(Math.random() * 6) + 3;

                  for (let i = 0; i < tasksForThisWeek; i++) {
                    const dayOfMonth = Math.floor(Math.random() * (weekEndDay - weekStartDay + 1)) + weekStartDay;
                    const taskDate = new Date(currentYear, currentMonth, dayOfMonth);

                    const isCompleted = Math.random() > 0.2;

                    testTasks.push({
                      id: `test-m-w${week}-${i}`,
                      title: `Test Task M${week}-${i + 1}`,
                      completed: isCompleted,
                      createdAt: taskDate.toISOString(),
                      completedAt: isCompleted ? taskDate.toISOString() : null
                    });
                  }
                }
              } else {
                // WEEK VIEW: Generate tasks for the current week
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const daysInWeek = 7;

                for (let i = 0; i < daysInWeek; i++) {
                  const dayOfWeek = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000);
                  const tasksForThisDay = Math.floor(Math.random() * 3) + 1;

                  for (let j = 0; j < tasksForThisDay; j++) {
                    const isCompleted = Math.random() > 0.2;

                    testTasks.push({
                      id: `test-w-day${i}-${j}`,
                      title: `Test Task Day${i}-${j + 1}`,
                      completed: isCompleted,
                      createdAt: dayOfWeek.toISOString(),
                      completedAt: isCompleted ? dayOfWeek.toISOString() : null
                    });
                  }
                }
              }

              // Update the store with test data
              const { setTasks } = useTaskStore.getState();
              setTasks(testTasks);
            }}
            className="w-6 h-6 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm opacity-20 hover:opacity-100"
          >
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Simple Chart */}
        <div
          ref={chartContainerRef}
          className={`p-1 rounded-lg flex flex-col relative ${
            isDarkMode ? 'bg-gray-900 border-0' : 'bg-gray-50 border border-white'
          }`}
          style={{
            height: 'auto',
            minHeight: '230px',
            maxHeight: 'none',
            minWidth: viewMode === 'year' ? '280px' : 'auto',
            flex: '1',
            overflow: 'hidden',
            marginBottom: '24px',
            marginTop: '0px'
          }}
        >
          {/* Simple Chart Container */}
          <div
            className="flex items-end justify-center px-1"
            style={{
              gap: viewMode === 'month' ? '1.5rem' : viewMode === 'year' ? '0.1rem' : '0.4rem',
              height: 'calc(100% - 8px)',
              minHeight: '80px',
              maxHeight: 'calc(100% - 8px)'
            }}
          >
            {viewMode === 'week' ? (
              tasksByDay.map((dayData, index) => (
                <div key={index} className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`chart-bar w-8 rounded flex items-center justify-center relative overflow-hidden transition-all duration-300 ease-out`}
                    style={{
                      height: `${dayData.scaledHeight}px`,
                      backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
                      background: isDarkMode ? '#FFFFFF' : '#000000',
                      backgroundClip: 'padding-box',
                      WebkitAppearance: 'none'
                    }}
                  >
                    {dayData.completed > 0 && (
                      <span
                        className={`chart-bar-value font-bold flex items-center justify-center ${
                          isDarkMode ? 'text-black' : 'text-white'
                        }`}
                        style={{
                          fontSize: `${Math.min(12, Math.max(8, dayData.scaledHeight / 3))}px`,
                          lineHeight: 1,
                          padding: '2px'
                        }}
                      >
                        {dayData.completed}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center mt-0 text-xs" style={{ fontSize: '11px' }}>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{dayData.day}</span>
                  </div>
                </div>
              ))
            ) : viewMode === 'month' ? (
              tasksByWeek.map((weekData, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`chart-bar w-16 rounded flex items-center justify-center relative overflow-hidden transition-all duration-300 ease-out`}
                    style={{
                      height: `${weekData.scaledHeight}px`,
                      backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
                      background: isDarkMode ? '#FFFFFF' : '#000000',
                      backgroundClip: 'padding-box',
                      WebkitAppearance: 'none'
                    }}
                  >
                    {weekData.completed > 0 && (
                      <span
                        className={`chart-bar-value font-bold flex items-center justify-center ${
                          isDarkMode ? 'text-black' : 'text-white'
                        }`}
                        style={{
                          fontSize: `${Math.min(14, Math.max(9, weekData.scaledHeight / 3))}px`,
                          lineHeight: 1,
                          padding: '3px'
                        }}
                      >
                        {weekData.completed}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center mt-1 text-xs" style={{ fontSize: '10px' }}>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{weekData.week}</span>
                  </div>
                </div>
              ))
            ) : (
              tasksByMonth.map((monthData, index) => (
                <div key={index} className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`chart-bar w-7 rounded flex items-center justify-center relative overflow-hidden transition-all duration-300 ease-out`}
                    style={{
                      height: `${monthData.scaledHeight}px`,
                      backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
                      background: isDarkMode ? '#FFFFFF' : '#000000',
                      backgroundClip: 'padding-box',
                      WebkitAppearance: 'none'
                    }}
                  >
                    {monthData.completed > 0 && (
                      <span
                        className={`chart-bar-value font-bold flex items-center justify-center ${
                          isDarkMode ? 'text-black' : 'text-white'
                        }`}
                        style={{
                          fontSize: `${Math.min(9, Math.max(6, monthData.scaledHeight / 4))}px`,
                          lineHeight: 1,
                          padding: '1px'
                        }}
                      >
                        {monthData.completed}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center mt-1 text-xs" style={{ fontSize: '10px' }}>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{monthData.month}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Progress Bar Clone - Justo debajo del texto */}
          <div className={`px-1.5 py-0.5 rounded-lg border mx-2 mb-1 ${
            isDarkMode ? 'bg-gray-900 border-0' : 'bg-gray-50 border-white'
          }`}>
            <div
              className={`progress-track w-full h-2 rounded-full overflow-hidden relative ${
                isDarkMode ? 'bg-gray-600' : ''
              }`}
              style={{
                backgroundColor: isDarkMode ? '#4B5563' : '#E5E7EB'
              }}
            >
              <div
                className={`progress-fill h-full transition-all duration-500 ease-out ${
                  isDarkMode ? 'bg-white' : ''
                }`}
                style={{
                  backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
                  width: `${stats.completionRate}%`,
                  willChange: 'width',
                  minWidth: stats.completionRate > 0 ? '20px' : '0px',
                  mixBlendMode: isDarkMode ? 'normal' : undefined
                }}
              />
            </div>
            <div className="flex justify-center items-center mt-1">
              <span className={`text-sm font-medium opacity-70 no-underline ${
                isDarkMode ? 'text-gray-400' : 'text-gray-700'
              }`} style={{ textDecoration: 'none' }}>
                {stats.completed} de {stats.total}
              </span>
            </div>
          </div>

          {/* Drag Handle for resizing */}
          <div
            ref={resizeHandleRef}
            className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity ${
              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              startYRef.current = e.clientY;
              currentHeightRef.current = panelHeight;
              setIsDragging(true);
            }}
          >
            <div className={`flex items-center justify-center space-x-1 ${
              isDarkMode ? 'bg-white/30' : 'bg-black/30'
            } px-2 py-0.5 rounded-full`}>
              <div className={`w-1 h-1 rounded-full ${
                isDarkMode ? 'bg-white' : 'bg-black'
              }`}></div>
              <div className={`w-1 h-1 rounded-full ${
                isDarkMode ? 'bg-white' : 'bg-black'
              }`}></div>
              <div className={`w-1 h-1 rounded-full ${
                isDarkMode ? 'bg-white' : 'bg-black'
              }`}></div>
            </div>
          </div>
        </div>
      </div>

  
      {/* View Mode Selector at Bottom */}
      <div className={`p-1.5 flex justify-center ${
        isDarkMode ? '' : 'border-t border-white'
      }`}>
        <div className={`relative flex rounded-full p-0.5 w-full ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          {[
            { value: 'week', label: 'Semana' },
            { value: 'month', label: 'Mes' },
            { value: 'year', label: 'Año' }
          ].map((mode, index) => (
            <button
              key={mode.value}
              data-custom-color="true"
              onClick={() => setViewMode(mode.value as any)}
              className={`view-mode-btn relative flex-1 py-1.5 text-base font-sans font-medium transition-all duration-200 ease-in-out ${
                isDarkMode
                  ? `${viewMode === mode.value
                      ? 'selected-button-mode dark-view-mode-btn-selected'
                      : 'dark-view-mode-btn-default'}`
                  : (viewMode === mode.value
                    ? 'bg-black text-white shadow-none'
                    : 'bg-transparent text-black hover:bg-gray-200')
              } ${index === 0 ? 'rounded-l-full' : ''} ${index === 2 ? 'rounded-r-full' : ''} ${index === 1 ? '-mx-px' : ''}`}
              style={{
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                ...(viewMode === mode.value && isDarkMode && {
                  backgroundColor: '#FFFFFF !important',
                  background: '#FFFFFF !important',
                  color: '#000000 !important'
                }),
                border: 'none !important',
                borderWidth: '0 !important',
                borderColor: 'transparent !important'
              }}
            >
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleProgressPanel;
