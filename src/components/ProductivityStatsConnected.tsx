import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProductivityStats } from '@/hooks/useProductivityStats';
import { Plus, Calendar, Home, Play, RefreshCw, Medal, Star, Trophy, Sparkles } from 'lucide-react';

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

interface DayBar {
  label: string;
  height: number;
  isCurrent: boolean;
  isEmpty: boolean;
  tasks: number;
}

interface PeriodStats {
  bars: DayBar[];
  progress: number;
  isRewardEarned: boolean;
  totalTasksCompleted: number;
  goal: number;
  periodLabel: string;
}

type Period = 'week' | 'month' | 'year';

// Steve Jobs Character Component
const SteveCharacter: React.FC = () => {
  return (
    <motion.div 
      className="flex items-center gap-4 mb-6"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
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
      
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      >
        <h1 className="text-xl font-bold text-gray-900 leading-tight">
          Tu esfuerzo es<br />
          tu mejor inversión
        </h1>
      </motion.div>
    </motion.div>
  );
};

// Animated Circular Progress Component
const AnimatedCircularProgress: React.FC<{ 
  progress: number; 
  completed: number; 
  goal: number;
  isRewardEarned: boolean; 
}> = ({ progress, completed, goal, isRewardEarned }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [showNumber, setShowNumber] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
      setShowNumber(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [progress]);
  
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;
  
  return (
    <div className="flex items-center justify-center relative">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="#f3f4f6"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            stroke="#16a34a"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence>
            {showNumber && (
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="text-2xl font-bold text-gray-900">
                  {completed}/{goal}
                </div>
                <div className="text-xs text-gray-600">
                  {Math.round(animatedProgress)}%
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Reward Badge */}
      <AnimatePresence>
        {isRewardEarned && (
          <motion.div
            className="absolute -top-2 -right-2"
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              damping: 15,
              stiffness: 300,
              delay: 2
            }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Star size={16} className="text-white" fill="currentColor" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Period Bars Chart Component
const PeriodBarsChart: React.FC<{ data: DayBar[] }> = ({ data }) => {
  const [animatedHeights, setAnimatedHeights] = useState<number[]>([]);
  const maxHeight = Math.max(...data.map(d => d.height), 1);
  
  useEffect(() => {
    setAnimatedHeights(new Array(data.length).fill(0));
    
    data.forEach((_, index) => {
      setTimeout(() => {
        setAnimatedHeights(prev => {
          const newHeights = [...prev];
          newHeights[index] = data[index].height;
          return newHeights;
        });
      }, index * 100 + 200);
    });
  }, [data]);
  
  return (
    <div className="flex items-end justify-between h-16 gap-1 px-2">
      {data.map((bar, index) => {
        const heightPercentage = maxHeight > 0 ? ((animatedHeights[index] || 0) / maxHeight) * 100 : 0;
        const isEmpty = bar.isEmpty;
        const isCurrent = bar.isCurrent;
        
        return (
          <div key={`${bar.label}-${index}`} className="flex flex-col items-center flex-1 relative">
            <motion.div 
              className={`w-full rounded-t transition-all duration-500 ease-out min-h-1 ${
                isEmpty 
                  ? 'bg-white border border-dashed border-gray-300 opacity-50' 
                  : isCurrent
                  ? 'bg-green-600 border border-black'
                  : 'bg-green-500 border border-black'
              }`}
              style={{ 
                height: `${Math.max(heightPercentage, 4)}%`,
                transitionDelay: `${index * 100}ms`
              }}
              initial={{ height: '4%' }}
              animate={{ height: `${Math.max(heightPercentage, 4)}%` }}
            />
            
            {/* Current period indicator */}
            {isCurrent && (
              <motion.div
                className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-600 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            
            <span className={`text-xs mt-1 ${isCurrent ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Reward Badge Component
const RewardBadge: React.FC<{ 
  isEarned: boolean; 
  period: Period; 
  progress: number;
}> = ({ isEarned, period, progress }) => {
  const icons = {
    week: Medal,
    month: Trophy,
    year: Sparkles
  };
  
  const IconComponent = icons[period];
  
  return (
    <AnimatePresence>
      {isEarned && (
        <motion.div
          className="flex items-center justify-center p-3"
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            type: "spring",
            damping: 15,
            stiffness: 300,
            delay: 2.5
          }}
        >
          <motion.div
            className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-3 shadow-lg"
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <IconComponent size={24} className="text-white" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Period Selector Component
const PeriodSelector: React.FC<{ 
  currentPeriod: Period; 
  onPeriodChange: (period: Period) => void;
}> = ({ currentPeriod, onPeriodChange }) => {
  const periods: { key: Period; label: string }[] = [
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'year', label: 'Año' }
  ];
  
  return (
    <div className="flex rounded-lg bg-gray-100 p-1 mb-4">
      {periods.map(({ key, label }) => (
        <motion.button
          key={key}
          onClick={() => onPeriodChange(key)}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
            currentPeriod === key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          {label}
        </motion.button>
      ))}
    </div>
  );
};

// Navigation Buttons Component
const NavigationButtons: React.FC<{ onAddTask?: () => void }> = ({ onAddTask }) => {
  const navigate = useNavigate();

  const handleCalendarClick = () => {
    navigate('/monthly-calendar');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50">
      <div className="flex items-center justify-center px-8">
        
        {/* Botón Home */}
        <motion.button
          onClick={handleHomeClick}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black shadow-lg flex items-center justify-center transition-all duration-300 transform mr-6"
          whileHover={{ scale: 1.05, y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
          whileTap={{ scale: 0.95 }}
        >
          <Home size={20} className="text-white" strokeWidth={2.5} />
        </motion.button>

        {/* Botón Principal de Crear Tarea */}
        <motion.button
          onClick={onAddTask}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black shadow-2xl flex items-center justify-center mx-6"
          whileHover={{ 
            scale: 1.1, 
            y: -4,
            boxShadow: "0 25px 50px rgba(0,0,0,0.3)" 
          }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={28} className="text-white sm:w-8 sm:h-8" strokeWidth={3} />
        </motion.button>

        {/* Botón Calendario */}
        <motion.button
          onClick={handleCalendarClick}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black shadow-lg flex items-center justify-center transition-all duration-300 transform ml-6"
          whileHover={{ scale: 1.05, y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
          whileTap={{ scale: 0.95 }}
        >
          <Calendar size={18} className="text-white" strokeWidth={2.5} />
        </motion.button>

      </div>
    </div>
  );
};

// Main Stats Component
const ProductivityStatsConnected: React.FC<ProductivityStatsConnectedProps> = ({ onAddTask }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<Period>('week');
  
  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('stebe-tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  const realStats = useProductivityStats(tasks);
  
  // Demo data
  const generateDemoStats = (): PeriodStats => {
    const demoData = {
      week: {
        bars: [
          { label: 'L', height: 8, isCurrent: false, isEmpty: false, tasks: 8 },
          { label: 'M', height: 12, isCurrent: false, isEmpty: false, tasks: 12 },
          { label: 'X', height: 6, isCurrent: false, isEmpty: false, tasks: 6 },
          { label: 'J', height: 15, isCurrent: false, isEmpty: false, tasks: 15 },
          { label: 'V', height: 18, isCurrent: false, isEmpty: false, tasks: 18 },
          { label: 'S', height: 10, isCurrent: false, isEmpty: false, tasks: 10 },
          { label: 'D', height: 24, isCurrent: true, isEmpty: false, tasks: 24 }
        ],
        progress: 85,
        isRewardEarned: true,
        totalTasksCompleted: 24,
        goal: 15,
        periodLabel: 'Esta Semana'
      },
      month: {
        bars: [
          { label: 'S1', height: 15, isCurrent: false, isEmpty: false, tasks: 15 },
          { label: 'S2', height: 22, isCurrent: false, isEmpty: false, tasks: 22 },
          { label: 'S3', height: 18, isCurrent: false, isEmpty: false, tasks: 18 },
          { label: 'S4', height: 35, isCurrent: true, isEmpty: false, tasks: 35 }
        ],
        progress: 90,
        isRewardEarned: true,
        totalTasksCompleted: 90,
        goal: 60,
        periodLabel: 'Este Mes'
      },
      year: {
        bars: [
          { label: 'E', height: 25, isCurrent: false, isEmpty: false, tasks: 25 },
          { label: 'F', height: 30, isCurrent: false, isEmpty: false, tasks: 30 },
          { label: 'M', height: 28, isCurrent: false, isEmpty: false, tasks: 28 },
          { label: 'A', height: 32, isCurrent: false, isEmpty: false, tasks: 32 },
          { label: 'M', height: 35, isCurrent: false, isEmpty: false, tasks: 35 },
          { label: 'J', height: 40, isCurrent: false, isEmpty: false, tasks: 40 },
          { label: 'J', height: 38, isCurrent: false, isEmpty: false, tasks: 38 },
          { label: 'A', height: 42, isCurrent: false, isEmpty: false, tasks: 42 },
          { label: 'S', height: 45, isCurrent: false, isEmpty: false, tasks: 45 },
          { label: 'O', height: 50, isCurrent: false, isEmpty: false, tasks: 50 },
          { label: 'N', height: 55, isCurrent: false, isEmpty: false, tasks: 55 },
          { label: 'D', height: 60, isCurrent: true, isEmpty: false, tasks: 60 }
        ],
        progress: 95,
        isRewardEarned: true,
        totalTasksCompleted: 500,
        goal: 200,
        periodLabel: 'Este Año'
      }
    };
    
    return demoData[currentPeriod];
  };

  // Generate real stats
  const generateRealStats = (): PeriodStats => {
    const today = new Date();
    
    if (currentPeriod === 'week') {
      const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
      const bars: DayBar[] = Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        const dateStr = date.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        
        const dayTasks = tasks.filter(task => 
          task.scheduledDate === dateStr || 
          task.completedDate?.split('T')[0] === dateStr
        );
        
        const completed = dayTasks.filter(task => task.completed).length;
        
        return {
          label: weekDays[index],
          height: completed,
          isCurrent: dateStr === todayStr,
          isEmpty: completed === 0,
          tasks: completed
        };
      });
      
      const totalCompleted = bars.reduce((sum, bar) => sum + bar.tasks, 0);
      const goal = 15;
      const progress = Math.min((totalCompleted / goal) * 100, 100);
      
      return {
        bars,
        progress,
        isRewardEarned: totalCompleted >= goal,
        totalTasksCompleted: totalCompleted,
        goal,
        periodLabel: 'Esta Semana'
      };
    }
    
    if (currentPeriod === 'month') {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const weeksInMonth = 4;
      
      const bars: DayBar[] = Array.from({ length: weeksInMonth }, (_, weekIndex) => {
        const weekStart = new Date(currentYear, currentMonth, weekIndex * 7 + 1);
        const weekEnd = new Date(currentYear, currentMonth, (weekIndex + 1) * 7);
        const currentWeek = Math.floor((today.getDate() - 1) / 7);
        
        const weekTasks = tasks.filter(task => {
          const taskDate = new Date(task.scheduledDate || task.completedDate || '');
          return taskDate >= weekStart && taskDate <= weekEnd;
        });
        
        const completed = weekTasks.filter(task => task.completed).length;
        
        return {
          label: `S${weekIndex + 1}`,
          height: completed,
          isCurrent: weekIndex === currentWeek,
          isEmpty: completed === 0,
          tasks: completed
        };
      });
      
      const totalCompleted = bars.reduce((sum, bar) => sum + bar.tasks, 0);
      const goal = 60;
      const progress = Math.min((totalCompleted / goal) * 100, 100);
      
      return {
        bars,
        progress,
        isRewardEarned: totalCompleted >= goal,
        totalTasksCompleted: totalCompleted,
        goal,
        periodLabel: 'Este Mes'
      };
    }
    
    if (currentPeriod === 'year') {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const months = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
      
      const bars: DayBar[] = Array.from({ length: 12 }, (_, monthIndex) => {
        const monthTasks = tasks.filter(task => {
          const taskDate = new Date(task.scheduledDate || task.completedDate || '');
          return taskDate.getFullYear() === currentYear && taskDate.getMonth() === monthIndex;
        });
        
        const completed = monthTasks.filter(task => task.completed).length;
        
        return {
          label: months[monthIndex],
          height: completed,
          isCurrent: monthIndex === currentMonth,
          isEmpty: completed === 0,
          tasks: completed
        };
      });
      
      const totalCompleted = bars.reduce((sum, bar) => sum + bar.tasks, 0);
      const goal = 200;
      const progress = Math.min((totalCompleted / goal) * 100, 100);
      
      return {
        bars,
        progress,
        isRewardEarned: totalCompleted >= goal,
        totalTasksCompleted: totalCompleted,
        goal,
        periodLabel: 'Este Año'
      };
    }
    
    return {
      bars: [],
      progress: 0,
      isRewardEarned: false,
      totalTasksCompleted: 0,
      goal: 1,
      periodLabel: 'Período'
    };
  };

  const currentStats = useMemo(() => {
    return isDemo ? generateDemoStats() : generateRealStats();
  }, [isDemo, currentPeriod, tasks]);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getMotivationalMessage = (progress: number) => {
    if (progress >= 100) return "¡Período perfecto! 🎉";
    if (progress >= 75) return "¡Casi llegas a la meta! 💪";
    if (progress >= 50) return "Buen progreso, sigue así 👍";
    return "¡Vamos, tú puedes lograrlo! 🚀";
  };
  
  return (
    <motion.div 
      className={`max-w-sm mx-auto p-4 bg-gray-50 min-h-screen pb-32 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Demo Button */}
      <motion.div 
        className="flex justify-end mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDemo(!isDemo)}
          className="text-xs"
        >
          {isDemo ? (
            <>
              <RefreshCw size={14} className="mr-1" />
              Real
            </>
          ) : (
            <>
              <Play size={14} className="mr-1" />
              Demo
            </>
          )}
        </Button>
      </motion.div>

      {/* Header with Steve character */}
      <SteveCharacter />
      
      {/* Period Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <PeriodSelector 
          currentPeriod={currentPeriod} 
          onPeriodChange={setCurrentPeriod} 
        />
      </motion.div>
      
      {/* Main Progress Circle and Reward */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6 bg-white border border-gray-200 mb-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentStats.periodLabel}
            </h3>
            
            <div className="flex items-center justify-center mb-4">
              <AnimatedCircularProgress
                progress={currentStats.progress}
                completed={currentStats.totalTasksCompleted}
                goal={currentStats.goal}
                isRewardEarned={currentStats.isRewardEarned}
              />
            </div>
            
            <RewardBadge
              isEarned={currentStats.isRewardEarned}
              period={currentPeriod}
              progress={currentStats.progress}
            />
          </div>
        </Card>
      </motion.div>
      
      {/* Period Bars Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-4 bg-white border border-gray-200 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Progreso Diario
          </h3>
          <PeriodBarsChart data={currentStats.bars} />
        </Card>
      </motion.div>

      {/* Motivational message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card className="p-4 bg-white border border-gray-200 text-center mb-4">
          <p className="text-sm text-gray-600 mb-2">Estado actual</p>
          <p className="text-lg font-semibold text-gray-900">
            {getMotivationalMessage(currentStats.progress)}
          </p>
        </Card>
      </motion.div>

      {/* Navigation Buttons */}
      <NavigationButtons onAddTask={onAddTask} />
    </motion.div>
  );
};

export default ProductivityStatsConnected;