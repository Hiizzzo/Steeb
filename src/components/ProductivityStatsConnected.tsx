import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProductivityStats } from '@/hooks/useProductivityStats';
import { Plus, Calendar, Home, Play, RefreshCw, Medal, Star, Trophy, Sparkles } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';

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

// Steve Jobs Character Component con globo de diálogo
const SteveCharacter: React.FC = () => {
  return (
    <motion.div 
      className="relative flex items-start gap-4 mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative shrink-0">
        <div className="w-16 h-16 bg-white rounded-full border-2 border-black flex items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-full relative">
            <div className="absolute inset-1 bg-white rounded-full border border-black" />
            <div className="absolute top-3 left-3 w-1.5 h-1.5 bg-black rounded-full" />
            <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-black rounded-full" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-black" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-1 bg-black rounded-full" />
          </div>
        </div>
      </div>

      {/* Globo 'Bien hecho!' */}
      <div className="relative flex-1">
        <div className="inline-block bg-white border-2 border-black rounded-2xl px-4 py-2 shadow-sm">
          <span className="font-bold text-black">Bien hecho!</span>
        </div>
        <div className="absolute -left-3 top-4 w-3 h-3 bg-white border-l-2 border-b-2 border-black rotate-45" />
        <div className="mt-2 inline-block bg-white border-2 border-black rounded-[24px] px-4 py-2 shadow-sm">
          <span className="font-extrabold text-xl tracking-tight">Estadísticas</span>
        </div>
      </div>
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
          <circle cx="50" cy="50" r="42" stroke="#e5e7eb" strokeWidth="6" fill="transparent" />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            stroke="#000000"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence>
            {showNumber && (
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="text-2xl font-bold text-black">{completed}/{goal}</div>
                <div className="text-xs text-neutral-700">{Math.round(animatedProgress)}%</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Medalla */}
      <AnimatePresence>
        {isRewardEarned && (
          <motion.div className="absolute -top-2 -right-2" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 1.2 }}>
            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow">
              <Star size={14} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Line Chart SVG (monocromático)
const TrendLineChart: React.FC<{ data: DayBar[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.height), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.height / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full">
      <svg viewBox="0 0 100 120" preserveAspectRatio="none" className="w-full h-32">
        {/* Grid */}
        {[25, 50, 75].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="1" />
        ))}
        {/* Axis */}
        <line x1="0" y1="100" x2="100" y2="100" stroke="#000" strokeWidth="1.5" />
        {/* Line */}
        <polyline points={points} fill="none" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="flex justify-between text-[11px] text-neutral-700 mt-1">
        {data.map(d => (
          <span key={d.label} className={`tabular-nums ${d.isCurrent ? 'font-bold text-black' : ''}`}>{d.label}</span>
        ))}
      </div>
    </div>
  );
};

// Period Bars Chart (se mantiene para detalle)
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
      }, index * 80 + 150);
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
              className={`w-full rounded-t min-h-1 ${isEmpty ? 'bg-white border border-dashed border-neutral-300' : 'bg-black'}`}
              style={{ height: `${Math.max(heightPercentage, 4)}%` }}
              initial={{ height: '4%' }}
              animate={{ height: `${Math.max(heightPercentage, 4)}%` }}
              transition={{ duration: 0.5, delay: index * 0.04 }}
            />
            {isCurrent && (
              <motion.div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
            )}
            <span className={`text-xs mt-1 ${isCurrent ? 'font-bold text-black' : 'text-neutral-600'}`}>{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// Reward Badge
const RewardBadge: React.FC<{ isEarned: boolean; period: Period; progress: number; }> = ({ isEarned, period, progress }) => {
  const icons = { week: Medal, month: Trophy, year: Sparkles };
  const IconComponent = icons[period];
  return (
    <AnimatePresence>
      {isEarned && (
        <motion.div className="flex items-center justify-center p-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 16, stiffness: 260, delay: 1.4 }}>
          <div className="bg-black text-white rounded-full px-3 py-1 text-xs flex items-center gap-1">
            <IconComponent size={14} /> Meta alcanzada
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Period Selector (segmentado)
const PeriodSelector: React.FC<{ currentPeriod: Period; onPeriodChange: (period: Period) => void; }> = ({ currentPeriod, onPeriodChange }) => {
  const periods: { key: Period; label: string }[] = [
    { key: 'week', label: 'Semanal' },
    { key: 'month', label: 'Mensual' },
    { key: 'year', label: 'Anual' }
  ];
  return (
    <div className="flex border-2 border-black rounded-2xl overflow-hidden w-full">
      {periods.map(({ key, label }) => (
        <button key={key} onClick={() => onPeriodChange(key)} className={`flex-1 py-2 text-sm font-semibold transition-colors ${currentPeriod === key ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'}`}>{label}</button>
      ))}
    </div>
  );
};

// Navigation Buttons
const NavigationButtons: React.FC<{ onAddTask?: () => void }> = ({ onAddTask }) => {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-8 left-0 right-0 z-50">
      <div className="flex items-center justify-center px-8">
        <motion.button onClick={() => navigate('/')} className="w-12 h-12 rounded-full bg-black text-white shadow-lg mr-6 flex items-center justify-center" whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.96 }}>
          <Home size={18} />
        </motion.button>
        <motion.button onClick={onAddTask} className="w-16 h-16 rounded-full bg-black text-white shadow-2xl mx-6 flex items-center justify-center" whileHover={{ scale: 1.1, y: -4 }} whileTap={{ scale: 0.96 }}>
          <Plus size={26} />
        </motion.button>
        <motion.button onClick={() => navigate('/monthly-calendar')} className="w-12 h-12 rounded-full bg-black text-white shadow-lg ml-6 flex items-center justify-center" whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.96 }}>
          <Calendar size={18} />
        </motion.button>
      </div>
    </div>
  );
};

const ProductivityStatsConnected: React.FC<ProductivityStatsConnectedProps> = ({ onAddTask }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<Period>('week');
  const tasks = useTaskStore(state => state.tasks);

  const realStats = useProductivityStats(tasks);

  // Demo data (igual que antes)
  const generateDemoStats = (): PeriodStats => {
    const demoData = {
      week: {
        bars: [
          { label: 'S', height: 4, isCurrent: false, isEmpty: false, tasks: 4 },
          { label: 'M', height: 8, isCurrent: false, isEmpty: false, tasks: 8 },
          { label: 'T', height: 3, isCurrent: false, isEmpty: false, tasks: 3 },
          { label: 'W', height: 10, isCurrent: false, isEmpty: false, tasks: 10 },
          { label: 'T', height: 6, isCurrent: false, isEmpty: false, tasks: 6 },
          { label: 'F', height: 8, isCurrent: false, isEmpty: false, tasks: 8 },
          { label: 'S', height: 12, isCurrent: true, isEmpty: false, tasks: 12 }
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
        bars: Array.from({ length: 12 }, (_, i) => ({ label: 'M', height: 10 + i * 3, isCurrent: i === new Date().getMonth(), isEmpty: false, tasks: 10 + i * 3 })),
        progress: 95,
        isRewardEarned: true,
        totalTasksCompleted: 500,
        goal: 200,
        periodLabel: 'Este Año'
      }
    };
    const d = demoData[currentPeriod];
    // Devolver copias mutables para cumplir con PeriodStats
    return {
      bars: [...d.bars],
      progress: d.progress,
      isRewardEarned: d.isRewardEarned,
      totalTasksCompleted: d.totalTasksCompleted,
      goal: d.goal,
      periodLabel: d.periodLabel,
    };
  };

  // Real stats desde tasks
  const generateRealStats = (): PeriodStats => {
    const today = new Date();
    if (currentPeriod === 'week') {
      const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const bars: DayBar[] = Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        const dateStr = date.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const dayTasks = tasks.filter(task => task.scheduledDate === dateStr || task.completedDate?.split('T')[0] === dateStr);
        const completed = dayTasks.filter(task => task.completed).length;
        return { label: weekDays[index], height: completed, isCurrent: dateStr === todayStr, isEmpty: completed === 0, tasks: completed };
      });
      const totalCompleted = bars.reduce((s, b) => s + b.tasks, 0);
      const goal = 15;
      const progress = Math.min((totalCompleted / goal) * 100, 100);
      return { bars, progress, isRewardEarned: totalCompleted >= goal, totalTasksCompleted: totalCompleted, goal, periodLabel: 'Esta Semana' };
    }
    if (currentPeriod === 'month') {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const weeksInMonth = 4;
      const bars: DayBar[] = Array.from({ length: weeksInMonth }, (_, weekIndex) => {
        const weekStart = new Date(currentYear, currentMonth, weekIndex * 7 + 1);
        const weekEnd = new Date(currentYear, currentMonth, (weekIndex + 1) * 7);
        const currentWeek = Math.floor((today.getDate() - 1) / 7);
        const weekTasks = tasks.filter(task => { const taskDate = new Date(task.scheduledDate || task.completedDate || ''); return taskDate >= weekStart && taskDate <= weekEnd; });
        const completed = weekTasks.filter(task => task.completed).length;
        return { label: `S${weekIndex + 1}`, height: completed, isCurrent: weekIndex === currentWeek, isEmpty: completed === 0, tasks: completed };
      });
      const totalCompleted = bars.reduce((s, b) => s + b.tasks, 0);
      const goal = 60;
      const progress = Math.min((totalCompleted / goal) * 100, 100);
      return { bars, progress, isRewardEarned: totalCompleted >= goal, totalTasksCompleted: totalCompleted, goal, periodLabel: 'Este Mes' };
    }
    // year
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const months = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const bars: DayBar[] = Array.from({ length: 12 }, (_, monthIndex) => {
      const monthTasks = tasks.filter(task => { const d = new Date(task.scheduledDate || task.completedDate || ''); return d.getFullYear() === currentYear && d.getMonth() === monthIndex; });
      const completed = monthTasks.filter(task => task.completed).length;
      return { label: months[monthIndex], height: completed, isCurrent: monthIndex === currentMonth, isEmpty: completed === 0, tasks: completed };
    });
    const totalCompleted = bars.reduce((s, b) => s + b.tasks, 0);
    const goal = 200;
    const progress = Math.min((totalCompleted / goal) * 100, 100);
    return { bars, progress, isRewardEarned: totalCompleted >= goal, totalTasksCompleted: totalCompleted, goal, periodLabel: 'Este Año' };
  };

  const currentStats = useMemo(() => (isDemo ? generateDemoStats() : generateRealStats()), [isDemo, currentPeriod, tasks]);

  useEffect(() => { const t = setTimeout(() => setIsVisible(true), 100); return () => clearTimeout(t); }, []);

  const getMotivationalMessage = (p: number) => {
    if (p >= 100) return '¡Período perfecto! 🎉';
    if (p >= 75) return '¡Casi llegas a la meta! 💪';
    if (p >= 50) return 'Buen progreso, sigue así 👍';
    return '¡Vamos, tú puedes lograrlo! 🚀';
  };

  // Distribución por tipo (completadas)
  const completed = tasks.filter(t => t.completed);
  const totalCompleted = completed.length || 1;
  const typePerc = (type: Task['type']) => Math.round((completed.filter(t => t.type === type).length / totalCompleted) * 100);

  const typeBadges = [
    { label: 'Personal', value: typePerc('personal') },
    { label: 'Trabajo', value: typePerc('work') },
    { label: 'Meditación', value: typePerc('meditation') },
  ];

  return (
    <motion.div className={`max-w-sm mx-auto p-4 bg-white min-h-screen pb-32 ${isVisible ? 'opacity-100' : 'opacity-0'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      {/* Botón Demo */}
      <div className="flex justify-end mb-2">
        <Button variant="outline" size="sm" onClick={() => setIsDemo(!isDemo)} className="text-xs border-2 border-black">
          {isDemo ? (<><RefreshCw size={14} className="mr-1" />Real</>) : (<><Play size={14} className="mr-1" />Demo</>)}
        </Button>
      </div>

      {/* Selector periodo */}
      <PeriodSelector currentPeriod={currentPeriod} onPeriodChange={setCurrentPeriod} />

      {/* Chart principal tipo línea */}
      <Card className="p-4 mt-4 bg-white border-2 border-black rounded-2xl">
        <h3 className="text-lg font-bold text-black mb-2">Tendencia</h3>
        <TrendLineChart data={currentStats.bars} />
      </Card>

      {/* Fila: Progreso + 3 categorías */}
      <Card className="p-4 mt-4 bg-white border-2 border-black rounded-2xl">
        <div className="grid grid-cols-4 gap-3 items-end">
          {/* Círculo grande a la izquierda, un poco más arriba */}
          <div className="flex flex-col items-center justify-center -mt-2">
            <AnimatedCircularProgress
              progress={currentStats.progress}
              completed={currentStats.totalTasksCompleted}
              goal={currentStats.goal}
              isRewardEarned={currentStats.isRewardEarned}
            />
            <RewardBadge isEarned={currentStats.isRewardEarned} period={currentPeriod} progress={currentStats.progress} />
            <p className="text-[11px] text-neutral-700 mt-1 text-center max-w-[120px]">
              {getMotivationalMessage(currentStats.progress)}
            </p>
          </div>

          {/* Tres círculos a la derecha en la misma fila */}
          {typeBadges.map((b) => (
            <div key={b.label} className="flex flex-col items-center justify-end">
              <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center text-black font-extrabold">
                <span className="text-lg">{b.value}%</span>
              </div>
              <div className="text-xs font-semibold text-black mt-2 text-center leading-tight">
                {b.label}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Eliminada la tarjeta de barras por período */}

      <NavigationButtons onAddTask={onAddTask} />
    </motion.div>
  );
};

export default ProductivityStatsConnected;