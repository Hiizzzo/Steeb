import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProductivityStats } from '@/hooks/useProductivityStats';
import { Plus, Calendar, Home, Play, RefreshCw } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
  subtasks?: Array<{ id: string; title: string; completed: boolean }>;
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  notes?: string;
}

interface ProductivityStatsConnectedProps {
  onAddTask?: () => void;
}

// Steve Jobs Character Component
const SteveCharacter: React.FC = () => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative">
        {/* Steve Jobs Character */}
        <div className="w-16 h-16 bg-gray-100 rounded-full border-2 border-black flex items-center justify-center">
          {/* Head */}
          <div className="w-12 h-12 bg-gray-200 rounded-full relative">
            {/* Face outline */}
            <div className="absolute inset-1 bg-white rounded-full border border-gray-400">
              {/* Eyes */}
              <div className="absolute top-3 left-2 w-1 h-1 bg-black rounded-full"></div>
              <div className="absolute top-3 right-2 w-1 h-1 bg-black rounded-full"></div>
              {/* Glasses */}
              <div className="absolute top-2.5 left-1 w-2 h-2 border border-black rounded-full"></div>
              <div className="absolute top-2.5 right-1 w-2 h-2 border border-black rounded-full"></div>
              <div className="absolute top-3 left-3 right-3 h-0.5 border-t border-black"></div>
              {/* Mouth */}
              <div className="absolute bottom-2 left-3 right-3 h-0.5 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Thumbs up */}
        <div className="absolute -right-2 -bottom-1 w-6 h-6 bg-gray-200 rounded-lg border border-gray-400 flex items-center justify-center">
          <div className="text-xs">👍</div>
        </div>
      </div>
      
      <div>
        <h1 className="text-xl font-bold text-gray-900 leading-tight">
          Tu esfuerzo es<br />
          tu mejor inversión
        </h1>
      </div>
    </div>
  );
};

// Weekly Activity Curve Component
const WeeklyActivityCurve: React.FC<{ data: Array<{ day: string; percentage: number; isToday?: boolean }> }> = ({ data }) => {
  const [animatedPath, setAnimatedPath] = useState('');
  const [showDot, setShowDot] = useState(false);
  
  useEffect(() => {
    const percentages = data.map(d => d.percentage);
    
    // Generate SVG path for the curve
    const width = 280;
    const height = 80;
    const points = percentages.map((percentage, index) => {
      const x = (index / (percentages.length - 1)) * width;
      const y = height - (percentage / 100) * height;
      return { x, y };
    });
    
    // Create smooth curve path
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      const cpx1 = prevPoint.x + (currentPoint.x - prevPoint.x) / 3;
      const cpy1 = prevPoint.y;
      const cpx2 = currentPoint.x - (currentPoint.x - prevPoint.x) / 3;
      const cpy2 = currentPoint.y;
      path += ` C ${cpx1} ${cpy1} ${cpx2} ${cpy2} ${currentPoint.x} ${currentPoint.y}`;
    }
    
    // Animate path drawing
    setTimeout(() => {
      setAnimatedPath(path);
      setTimeout(() => setShowDot(true), 800);
    }, 200);
  }, [data]);

  const todayIndex = data.findIndex(d => d.isToday);

  return (
    <Card className="p-4 bg-white border border-gray-200 mb-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Semanal</h3>
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-20 flex flex-col justify-between text-xs text-gray-500">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
        </div>
        
        {/* Chart area */}
        <div className="ml-8">
          <svg width="280" height="80" className="overflow-visible">
            {/* Grid lines */}
            {[25, 50, 75].map((percentage) => (
              <line
                key={percentage}
                x1="0"
                y1={80 - (percentage / 100) * 80}
                x2="280"
                y2={80 - (percentage / 100) * 80}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}
            
            {/* Animated curve */}
            <path
              d={animatedPath}
              fill="none"
              stroke="#374151"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw-path"
              style={{
                strokeDasharray: animatedPath ? '500' : '0',
                strokeDashoffset: animatedPath ? '0' : '500',
                transition: 'stroke-dashoffset 1.5s ease-out'
              }}
            />
            
            {/* Today's dot with pulse animation */}
            {showDot && todayIndex >= 0 && (
              <g>
                <circle
                  cx={280 * (todayIndex / (data.length - 1))}
                  cy={80 - (data[todayIndex].percentage / 100) * 80}
                  r="4"
                  fill="#374151"
                  className="animate-pulse"
                />
                <circle
                  cx={280 * (todayIndex / (data.length - 1))}
                  cy={80 - (data[todayIndex].percentage / 100) * 80}
                  r="8"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="1"
                  opacity="0.3"
                  className="animate-ping"
                />
              </g>
            )}
          </svg>
          
          {/* X-axis labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {data.map((item, index) => (
              <span key={index} className={item.isToday ? 'font-bold text-gray-900' : ''}>
                {item.day}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Circular Progress Component
const CircularProgress: React.FC<{ percentage: number; title: string }> = ({ percentage, title }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 500);
    return () => clearTimeout(timer);
  }, [percentage]);
  
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;
  
  return (
    <Card className="p-4 bg-white border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="flex items-center justify-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#374151"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">
              {Math.round(animatedPercentage)}%
            </span>
          </div>
        </div>
      </div>
      {/* Progress bar at bottom */}
      <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gray-400 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${animatedPercentage}%` }}
        />
      </div>
    </Card>
  );
};

// Consistency Streak Component
const ConsistencyStreak: React.FC<{ data: number[] }> = ({ data }) => {
  const [animatedHeights, setAnimatedHeights] = useState<number[]>([]);
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const maxHeight = Math.max(...data);
  
  useEffect(() => {
    // Animate bars one by one
    data.forEach((_, index) => {
      setTimeout(() => {
        setAnimatedHeights(prev => {
          const newHeights = [...prev];
          newHeights[index] = data[index];
          return newHeights;
        });
      }, index * 100);
    });
  }, [data]);
  
  return (
    <Card className="p-4 bg-white border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Consistencia</h3>
      <div className="flex items-end justify-between h-20 gap-1">
        {data.map((value, index) => {
          const heightPercentage = maxHeight > 0 ? ((animatedHeights[index] || 0) / maxHeight) * 100 : 0;
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-gray-900 rounded-t transition-all duration-500 ease-out min-h-1"
                style={{ 
                  height: `${heightPercentage}%`,
                  transitionDelay: `${index * 100}ms`
                }}
              />
              <span className="text-xs text-gray-500 mt-1">{days[index]}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// Main Navigation Buttons Component
const NavigationButtons: React.FC<{ onAddTask?: () => void }> = ({ onAddTask }) => {
  const navigate = useNavigate();

  const handleCalendarClick = () => {
    // Navegar a home y establecer localStorage para mostrar vista calendario
    localStorage.setItem('stebe-view-mode', 'calendar');
    navigate('/');
  };

  const handleHomeClick = () => {
    // Navegar a home y establecer localStorage para mostrar vista tareas
    localStorage.setItem('stebe-view-mode', 'tasks');
    navigate('/');
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50">
      <div className="flex items-center justify-center px-8">
        
        {/* Botón Home */}
        <button
          onClick={handleHomeClick}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 flex items-center justify-center transition-all duration-300 transform mr-6"
        >
          <Home size={20} className="text-white" strokeWidth={2.5} />
        </button>

        {/* Botón Principal de Crear Tarea */}
        <button
          onClick={onAddTask}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 hover:-translate-y-1 mx-6"
        >
          <Plus size={28} className="text-white sm:w-8 sm:h-8" strokeWidth={3} />
        </button>

        {/* Botón Calendario */}
        <button
          onClick={handleCalendarClick}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 flex items-center justify-center transition-all duration-300 transform ml-6"
        >
          <Calendar size={18} className="text-white" strokeWidth={2.5} />
        </button>

      </div>
    </div>
  );
};

// Main Stats Component
const ProductivityStatsConnected: React.FC<ProductivityStatsConnectedProps> = ({ onAddTask }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  
  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('stebe-tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  const realStats = useProductivityStats(tasks);
  
  // Demo data
  const demoStats = {
    completedTasks: 12,
    totalTasks: 20,
    completionPercentage: 75,
    currentStreak: 5,
    timeSpent: '4h 30m',
    weeklyActivity: [
      { day: 'Dom', percentage: 40, isToday: false },
      { day: 'Lun', percentage: 65, isToday: false },
      { day: 'Mar', percentage: 80, isToday: false },
      { day: 'Mie', percentage: 55, isToday: false },
      { day: 'Jue', percentage: 90, isToday: false },
      { day: 'Vie', percentage: 75, isToday: false },
      { day: 'Sab', percentage: 85, isToday: true }
    ],
    consistencyStreak: [40, 65, 55, 75, 85, 90, 70],
    todayProgress: 85
  };

  const currentStats = isDemo ? demoStats : realStats;
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getMotivationalMessage = (percentage: number) => {
    if (percentage === 100) return "¡Período perfecto! 🎉";
    if (percentage >= 75) return "¡Casi llegas a la meta! 💪";
    if (percentage >= 50) return "Buen progreso, sigue así 👍";
    return "¡Vamos, tú puedes lograrlo! 🚀";
  };
  
  return (
    <div className={`max-w-sm mx-auto p-4 bg-gray-50 min-h-screen transition-opacity duration-500 pb-32 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Demo Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDemo(!isDemo)}
          className="text-xs"
        >
          {isDemo ? (
            <>
              <RefreshCw size={14} className="mr-1" />
              Datos Reales
            </>
          ) : (
            <>
              <Play size={14} className="mr-1" />
              Demo
            </>
          )}
        </Button>
      </div>

      {/* Header with Steve character */}
      <SteveCharacter />
      
      {/* Main stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Tasks completed */}
        <Card className="p-3 bg-white border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{currentStats.completedTasks}-{currentStats.totalTasks}</div>
          <div className="text-xs text-gray-600">Tareas</div>
          <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gray-900 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${currentStats.completionPercentage}%` }}
            />
          </div>
        </Card>
        
        {/* Streak */}
        <Card className="p-3 bg-white border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{currentStats.currentStreak}-Día</div>
          <div className="text-xs text-gray-600">Racha ⭐</div>
        </Card>
        
        {/* Time spent */}
        <Card className="p-3 bg-white border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{currentStats.timeSpent}</div>
          <div className="text-xs text-gray-600">Tiempo</div>
        </Card>
      </div>
      
      {/* Weekly Activity Chart */}
      <WeeklyActivityCurve data={currentStats.weeklyActivity} />
      
      {/* Bottom row with two charts */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <CircularProgress percentage={currentStats.todayProgress} title="Progreso Hoy" />
        <ConsistencyStreak data={currentStats.consistencyStreak} />
      </div>

      {/* Motivational message */}
      <Card className="p-4 bg-white border border-gray-200 text-center mb-4">
        <p className="text-sm text-gray-600 mb-2">Estado actual</p>
        <p className="text-lg font-semibold text-gray-900">
          {getMotivationalMessage(currentStats.completionPercentage)}
        </p>
      </Card>

      {/* Navigation Buttons */}
      <NavigationButtons onAddTask={onAddTask} />
    </div>
  );
};

export default ProductivityStatsConnected;