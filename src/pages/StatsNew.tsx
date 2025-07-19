import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Medal, Sparkles, Star, Trophy, Database, TrendingUp, Calendar, Target } from 'lucide-react';
import FloatingButtons from '../components/FloatingButtons';
import ModalAddTask from '../components/ModalAddTask';
import { loadSampleData, clearSampleData } from '../data/sampleTasks';

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
  category?: 'work' | 'study' | 'exercise' | 'personal' | 'project';
}

interface DayBar {
  day: string;
  taskCount: number;
  isEmpty: boolean;
  isToday: boolean;
  date: Date;
}

interface PeriodStats {
  bars: DayBar[];
  progress: number;
  isRewardEarned: boolean;
  totalTasksCompleted: number;
  goal: number;
  periodLabel: string;
}

// Componente mejorado de gráfico circular tipo donut
const AnimatedDonutChart = ({ 
  percentage, 
  completed, 
  total, 
  label,
  size = 160,
  strokeWidth = 8
}: { 
  percentage: number; 
  completed: number; 
  total: number; 
  label: string;
  size?: number;
  strokeWidth?: number;
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 200);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Fondo del círculo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-100"
        />
        {/* Progreso del círculo */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className="text-green-500"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (animatedPercentage / 100) * circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (animatedPercentage / 100) * circumference }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
      
      {/* Contenido central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="text-4xl font-bold text-black mb-1"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {Math.round(animatedPercentage)}%
        </motion.div>
        <motion.div
          className="text-lg font-semibold text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {completed}/{total}
        </motion.div>
        <motion.div
          className="text-xs text-gray-400 text-center mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          {label}
        </motion.div>
      </div>
    </div>
  );
};

// Componente mejorado de barras con mejor diseño
const ModernBarsChart = ({ bars, period }: { bars: DayBar[]; period: string }) => {
  const maxTasks = Math.max(...bars.map(bar => bar.taskCount), 1);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-black">
          {period === 'week' ? 'Tareas por día' : 
           period === 'month' ? 'Tareas por semana' : 
           'Tareas por mes'}
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <TrendingUp className="w-4 h-4" />
          <span>Progreso</span>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-3 items-end h-32">
        {bars.map((bar, index) => (
          <motion.div
            key={bar.day}
            className="flex flex-col items-center space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
          >
            {/* Barra */}
            <div className="relative w-full h-20 bg-gray-100 rounded-lg overflow-hidden">
              <motion.div
                className={`absolute bottom-0 w-full rounded-lg transition-all duration-300 ${
                  bar.isEmpty 
                    ? 'bg-gray-200' 
                    : bar.isToday 
                    ? 'bg-gradient-to-t from-green-500 to-green-400 shadow-lg' 
                    : 'bg-green-500'
                }`}
                initial={{ height: 0 }}
                animate={{ height: `${(bar.taskCount / maxTasks) * 100}%` }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
              />
              
              {/* Indicador de día actual */}
              {bar.isToday && (
                <motion.div
                  className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              {/* Número de tareas */}
              {bar.taskCount > 0 && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.8, duration: 0.4 }}
                >
                  <span className="text-white font-bold text-sm">
                    {bar.taskCount}
                  </span>
                </motion.div>
              )}
            </div>
            
            {/* Etiqueta del día */}
            <motion.div
              className={`text-sm font-medium transition-colors ${
                bar.isToday ? 'text-green-600' : 'text-gray-600'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.4, duration: 0.6 }}
            >
              {bar.day}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Componente de mensaje motivacional mejorado
const MotivationalMessage = ({ progress, isRewardEarned, taskCount }: { 
  progress: number; 
  isRewardEarned: boolean; 
  taskCount: number;
}) => {
  const getMessage = () => {
    if (progress === 100) return { text: "¡Meta alcanzada!", emoji: "🎉", color: "text-green-600" };
    if (progress >= 75) return { text: "¡Casi llegas a la meta!", emoji: "💪", color: "text-orange-600" };
    if (progress >= 50) return { text: "Buen progreso, sigue así", emoji: "👍", color: "text-blue-600" };
    return { text: "¡Vamos, tú puedes lograrlo!", emoji: "🚀", color: "text-purple-600" };
  };

  const message = getMessage();

  return (
    <motion.div
      className="bg-gray-50 rounded-2xl p-4 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
    >
      <div className={`text-lg font-semibold ${message.color} mb-1`}>
        {message.text} {message.emoji}
      </div>
      {isRewardEarned && (
        <motion.div
          className="flex items-center justify-center space-x-2 mt-2"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <Star className="w-5 h-5 text-yellow-500 fill-current" />
          <span className="text-sm text-gray-600">¡Recompensa desbloqueada!</span>
          <Star className="w-5 h-5 text-yellow-500 fill-current" />
        </motion.div>
      )}
    </motion.div>
  );
};

const StatsNew = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTasks, setShowTasks] = useState(false);

  // Cargar tareas desde localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('stebe-tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Función para cargar datos de ejemplo
  const handleLoadSampleData = () => {
    const sampleTasks = loadSampleData();
    setTasks(sampleTasks);
  };

  // Función para limpiar datos
  const handleClearData = () => {
    clearSampleData();
    setTasks([]);
  };

  // Calcular estadísticas según el período seleccionado
  const getPeriodStats = (): PeriodStats => {
    const now = new Date();
    
    if (selectedPeriod === 'week') {
      return getWeeklyStats(now);
    } else if (selectedPeriod === 'month') {
      return getMonthlyStats(now);
    } else {
      return getYearlyStats(now);
    }
  };

  // Estadísticas semanales
  const getWeeklyStats = (now: Date): PeriodStats => {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const bars: DayBar[] = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);

      const dayTasks = tasks.filter(task => {
        if (!task.completedDate) return false;
        const completedDate = new Date(task.completedDate);
        return completedDate.toDateString() === dayDate.toDateString();
      });

      bars.push({
        day: dayLabels[i],
        taskCount: dayTasks.length,
        isEmpty: dayTasks.length === 0,
        isToday: dayDate.toDateString() === now.toDateString(),
        date: dayDate
      });
    }

    const totalTasksCompleted = bars.reduce((sum, bar) => sum + bar.taskCount, 0);
    const goal = 15;
    const progress = Math.min((totalTasksCompleted / goal) * 100, 100);
    const isRewardEarned = totalTasksCompleted >= goal;

    return {
      bars,
      progress,
      isRewardEarned,
      totalTasksCompleted,
      goal,
      periodLabel: 'esta semana'
    };
  };

  // Estadísticas mensuales
  const getMonthlyStats = (now: Date): PeriodStats => {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const bars: DayBar[] = [];
    let weekNumber = 1;
    let weekStart = new Date(startOfMonth);

    while (weekStart <= endOfMonth) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      if (weekEnd > endOfMonth) weekEnd.setTime(endOfMonth.getTime());

      const weekTasks = tasks.filter(task => {
        if (!task.completedDate) return false;
        const completedDate = new Date(task.completedDate);
        return completedDate >= weekStart && completedDate <= weekEnd;
      });

      const isCurrentWeek = now >= weekStart && now <= weekEnd;

      bars.push({
        day: `S${weekNumber}`,
        taskCount: weekTasks.length,
        isEmpty: weekTasks.length === 0,
        isToday: isCurrentWeek,
        date: weekStart
      });

      weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() + 1);
      weekNumber++;
    }

    const totalTasksCompleted = bars.reduce((sum, bar) => sum + bar.taskCount, 0);
    const goal = 60;
    const progress = Math.min((totalTasksCompleted / goal) * 100, 100);
    const isRewardEarned = totalTasksCompleted >= goal;

    return {
      bars,
      progress,
      isRewardEarned,
      totalTasksCompleted,
      goal,
      periodLabel: 'este mes'
    };
  };

  // Estadísticas anuales
  const getYearlyStats = (now: Date): PeriodStats => {
    const currentYear = now.getFullYear();
    const monthLabels = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const bars: DayBar[] = [];

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0);

      const monthTasks = tasks.filter(task => {
        if (!task.completedDate) return false;
        const completedDate = new Date(task.completedDate);
        return completedDate >= monthStart && completedDate <= monthEnd;
      });

      const isCurrentMonth = now.getMonth() === month && now.getFullYear() === currentYear;

      bars.push({
        day: monthLabels[month],
        taskCount: monthTasks.length,
        isEmpty: monthTasks.length === 0,
        isToday: isCurrentMonth,
        date: monthStart
      });
    }

    const totalTasksCompleted = bars.reduce((sum, bar) => sum + bar.taskCount, 0);
    const goal = 200;
    const progress = Math.min((totalTasksCompleted / goal) * 100, 100);
    const isRewardEarned = totalTasksCompleted >= goal;

    return {
      bars,
      progress,
      isRewardEarned,
      totalTasksCompleted,
      goal,
      periodLabel: 'este año'
    };
  };

  const periodStats = getPeriodStats();

  return (
    <div className="min-h-screen bg-white">
      {/* Header con navegación de períodos */}
      <motion.div
        className="sticky top-0 bg-white/80 backdrop-blur-lg z-10 px-6 py-4 border-b border-gray-100"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black">Estadísticas</h1>
            <p className="text-gray-500 text-sm">Tu progreso en un vistazo</p>
          </div>
          
          {/* Botones de demo (temporal) */}
          <div className="flex space-x-2">
            <button
              onClick={handleLoadSampleData}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors"
            >
              Demo
            </button>
            <button
              onClick={handleClearData}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Selector de período */}
        <div className="flex space-x-2 bg-gray-100 rounded-full p-1">
          {[
            { key: 'week', label: 'Semana', icon: Calendar },
            { key: 'month', label: 'Mes', icon: TrendingUp },
            { key: 'year', label: 'Año', icon: Target }
          ].map(({ key, label, icon: Icon }) => (
            <motion.button
              key={key}
              onClick={() => setSelectedPeriod(key as 'week' | 'month' | 'year')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-full font-medium transition-all ${
                selectedPeriod === key
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Contenido principal */}
      <div className="px-6 py-8 space-y-8">
        {/* Tarjeta principal con gráfico donut */}
        <motion.div
          className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
          key={selectedPeriod}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="p-8">
            {/* Gráfico donut centrado */}
            <div className="flex justify-center mb-8">
              <AnimatedDonutChart
                percentage={periodStats.progress}
                completed={periodStats.totalTasksCompleted}
                total={periodStats.goal}
                label={periodStats.periodLabel}
                size={200}
                strokeWidth={12}
              />
            </div>

            {/* Estadísticas resumidas */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <div className="text-3xl font-bold text-black mb-1">
                  {periodStats.totalTasksCompleted}
                </div>
                <div className="text-sm text-gray-500">Completadas</div>
              </motion.div>
              
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {periodStats.goal}
                </div>
                <div className="text-sm text-gray-500">Meta</div>
              </motion.div>
              
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.6 }}
              >
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {Math.max(0, periodStats.goal - periodStats.totalTasksCompleted)}
                </div>
                <div className="text-sm text-gray-500">Restantes</div>
              </motion.div>
            </div>

            {/* Mensaje motivacional */}
            <MotivationalMessage
              progress={periodStats.progress}
              isRewardEarned={periodStats.isRewardEarned}
              taskCount={periodStats.totalTasksCompleted}
            />
          </div>
        </motion.div>

        {/* Gráfico de barras */}
        <motion.div
          className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div className="p-8">
            <ModernBarsChart bars={periodStats.bars} period={selectedPeriod} />
          </div>
        </motion.div>
      </div>

      {/* Botones flotantes */}
      <FloatingButtons
        onAddTask={() => setShowAddModal(true)}
        onShowTasks={() => setShowTasks(!showTasks)}
        onToggleView={() => {}}
        viewMode="tasks"
      />

      {/* Modal para agregar tarea */}
      {showAddModal && (
        <ModalAddTask
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddTask={() => {
            const savedTasks = localStorage.getItem('stebe-tasks');
            if (savedTasks) {
              setTasks(JSON.parse(savedTasks));
            }
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

export default StatsNew;