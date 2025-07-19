import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Medal, Sparkles, Star, Trophy, Database } from 'lucide-react';
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

const StatsNew = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

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

  // Estadísticas semanales (original)
  const getWeeklyStats = (now: Date): PeriodStats => {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lunes
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

    // Dividir el mes en semanas
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
    const goal = 60; // Meta mensual
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
    const monthLabels = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const bars: DayBar[] = [];

    for (let i = 0; i < 12; i++) {
      const monthTasks = tasks.filter(task => {
        if (!task.completedDate) return false;
        const completedDate = new Date(task.completedDate);
        return completedDate.getFullYear() === now.getFullYear() && 
               completedDate.getMonth() === i;
      });

      const monthDate = new Date(now.getFullYear(), i, 1);
      const isCurrentMonth = now.getMonth() === i;

      bars.push({
        day: monthLabels[i],
        taskCount: monthTasks.length,
        isEmpty: monthTasks.length === 0,
        isToday: isCurrentMonth,
        date: monthDate
      });
    }

    const totalTasksCompleted = bars.reduce((sum, bar) => sum + bar.taskCount, 0);
    const goal = 200; // Meta anual
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

  // Animar el progreso del círculo cuando cambia
  useEffect(() => {
    setAnimatedPercentage(0); // Reset animation
    const timer = setTimeout(() => {
      setAnimatedPercentage(periodStats.progress);
    }, 300);
    return () => clearTimeout(timer);
  }, [periodStats.progress, selectedPeriod]);

  // Componente del círculo de progreso animado
  const AnimatedCircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 45;
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-28 h-28">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Círculo de fondo */}
          <circle
            stroke="#f3f4f6"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Círculo de progreso animado */}
          <motion.circle
            stroke="#16a34a"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ strokeDasharray }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="text-2xl font-bold text-black">
              {Math.round(percentage)}%
            </div>
            <div className="text-xs text-gray-600">
              {periodStats.totalTasksCompleted}/{periodStats.goal}
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  // Componente de barras del período
  const PeriodBarsChart = ({ bars }: { bars: DayBar[] }) => {
    const maxCount = Math.max(...bars.map(bar => bar.taskCount), 1);

    return (
      <div className="flex items-end justify-between space-x-2 px-2">
        {bars.map((bar, index) => {
          const height = Math.max((bar.taskCount / maxCount) * 60, 8);
          
          return (
            <motion.div
              key={`${selectedPeriod}-${index}`}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              {/* Barra */}
              <motion.div
                className={`w-8 border-2 border-black mb-2 transition-all duration-300 ${
                  bar.isEmpty 
                    ? 'bg-white border-dashed opacity-50' 
                    : bar.isToday
                    ? 'bg-green-500 shadow-lg'
                    : 'bg-green-400'
                }`}
                style={{ height: `${height}px` }}
                initial={{ height: 0 }}
                animate={{ height: `${height}px` }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
              />
              
              {/* Etiqueta */}
              <span className={`text-sm font-medium ${
                bar.isToday ? 'text-green-600 font-bold' : 'text-black'
              }`}>
                {bar.day}
              </span>
              
              {/* Indicador de período actual */}
              {bar.isToday && (
                <motion.div
                  className="w-2 h-2 bg-green-500 rounded-full mt-1"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Componente de recompensa
  const RewardBadge = ({ taskCount }: { taskCount: number }) => (
    <AnimatePresence>
      <motion.div
        className="flex items-center justify-center mt-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl border-2 border-yellow-300"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Star className="w-8 h-8 text-yellow-600 mr-3" fill="currentColor" />
        </motion.div>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-800">
            ¡Meta alcanzada! 🎉
          </div>
          <div className="text-sm text-yellow-700">
            {taskCount} tareas completadas {periodStats.periodLabel}
          </div>
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Sparkles className="w-6 h-6 text-yellow-600 ml-3" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Demo buttons (temporary) */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <motion.button
          onClick={handleLoadSampleData}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs flex items-center gap-1 shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Database size={14} />
          Demo
        </motion.button>
        <motion.button
          onClick={handleClearData}
          className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Clear
        </motion.button>
      </div>

      {/* Botones de período */}
      <div className="flex justify-center gap-2 mb-6">
        <motion.button
          onClick={() => setSelectedPeriod('week')}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            selectedPeriod === 'week'
              ? 'bg-black text-white'
              : 'bg-white text-black border-2 border-black'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Semana
        </motion.button>
        <motion.button
          onClick={() => setSelectedPeriod('month')}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            selectedPeriod === 'month'
              ? 'bg-black text-white'
              : 'bg-white text-black border-2 border-black'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Mes
        </motion.button>
        <motion.button
          onClick={() => setSelectedPeriod('year')}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            selectedPeriod === 'year'
              ? 'bg-black text-white'
              : 'bg-white text-black border-2 border-black'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Año
        </motion.button>
      </div>

      {/* Tarjeta principal mejorada */}
      <motion.div
        className="bg-white rounded-3xl shadow-sm mx-auto max-w-md mb-8 relative overflow-hidden"
        key={selectedPeriod} // Force re-render on period change
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Líneas de cuaderno sutiles */}
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="border-b border-gray-300" style={{ marginTop: `${i * 30}px` }}></div>
          ))}
        </div>
        
        <div className="relative p-6">
          {/* Header con medalla y avatar mejorado */}
          <motion.div
            className="flex items-start mb-6"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="relative mr-4">
              {/* Medalla con animación */}
              <motion.div
                className="w-16 h-16 rounded-full border-4 border-black bg-white flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Medal className="w-8 h-8 text-black" strokeWidth={1.5} />
              </motion.div>
              
              {/* Avatar */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <img 
                  src="/lovable-uploads/f3695274-590c-4838-b4b4-f6e21b194eef.png" 
                  alt="Avatar"
                  className="w-8 h-8 rounded-full"
                />
              </div>
              
              {/* Efecto de brillo si hay recompensa */}
              {periodStats.isRewardEarned && (
                <motion.div
                  className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trophy className="w-4 h-4 text-yellow-800" />
                </motion.div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold text-black leading-tight">
                Tu progreso<br />
                {periodStats.periodLabel}
              </h1>
            </div>
          </motion.div>

          {/* Bloque de progreso principal */}
          <motion.div
            className="flex items-start justify-between mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div>
              <motion.div
                className="text-4xl font-bold text-black mb-1"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                {periodStats.totalTasksCompleted}
              </motion.div>
              <div className="text-sm text-black">
                tareas completadas<br />
                {periodStats.periodLabel}
              </div>
            </div>
            <div className="ml-4">
              <AnimatedCircularProgress percentage={animatedPercentage} />
            </div>
          </motion.div>

          {/* Barras por período */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-black">
                Tareas por {selectedPeriod === 'week' ? 'día' : 
                           selectedPeriod === 'month' ? 'semana' : 'mes'}
              </h3>
              <div className="ml-4">
                <img 
                  src="/lovable-uploads/f3695274-590c-4838-b4b4-f6e21b194eef.png" 
                  alt="Mi avatar"
                  className="w-12 h-12 rounded-full border-2 border-black shadow-sm"
                />
              </div>
            </div>
            
            <PeriodBarsChart bars={periodStats.bars} />
          </motion.div>

          {/* Mensaje motivacional */}
          <motion.div
            className="text-center mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <div className="text-sm text-gray-600">
              {periodStats.progress === 100 
                ? "¡Período perfecto! 🎉" 
                : periodStats.progress >= 75 
                ? "¡Casi llegas a la meta! 💪" 
                : periodStats.progress >= 50 
                ? "Buen progreso, sigue así 👍" 
                : "¡Vamos, tú puedes lograrlo! 🚀"
              }
            </div>
          </motion.div>

          {/* Recompensa (si se ha ganado) */}
          {periodStats.isRewardEarned && (
            <RewardBadge taskCount={periodStats.totalTasksCompleted} />
          )}
        </div>
      </motion.div>

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
            // Recargar tareas desde localStorage
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