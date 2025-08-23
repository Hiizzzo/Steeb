import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Tooltip,
} from 'recharts';
import { Pin, CheckCircle } from 'lucide-react';

type Period = 'week' | 'month' | 'year';

interface DayBar {
  label: string;
  value: number;
  isCurrent?: boolean;
  iso?: string;
  isSelected?: boolean;
}

interface ProductivityStatsConnectedProps {
  onAddTask?: () => void;
}

// Iniciales en español comenzando en Domingo
const weekDayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day; // back to Sunday
  return new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);
}

function formatISODate(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0];
}

function getWeekOfMonth(date: Date) {
  const dayOfMonth = date.getDate();
  return Math.min(5, Math.ceil(dayOfMonth / 7)); // S1..S5
}

const CentralStatsChart: React.FC<{
  period: Period;
  weekData: { label: string; value: number; iso: string; isCurrent?: boolean; isSelected?: boolean }[];
  monthData: { label: string; value: number }[];
  yearData: { label: string; value: number }[];
  onSelectDay?: (iso: string) => void;
  isDark?: boolean;
}> = ({ period, weekData, monthData, yearData, onSelectDay, isDark = false }) => {
  const axisStyle = { fontSize: 12, fill: isDark ? '#ffffff' : '#111111' } as const;
  const gridStroke = isDark ? 'rgba(255,255,255,0.2)' : '#e5e7eb';
  const commonChartProps = { margin: { top: 10, right: 8, bottom: 0, left: 0 } } as const;

  return (
         <div className={`w-full ${period === 'year' ? 'h-56 -mx-8' : 'h-56'}`}>
      <ResponsiveContainer width="100%" height="100%">
        {period === 'week' ? (
          <BarChart data={weekData} {...commonChartProps}>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip cursor={{ fill: 'rgba(229,231,235,0.6)' }} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Bar
              dataKey="value"
              fill={isDark ? '#ffffff' : '#000000'}
              radius={[2, 2, 0, 0]}
              onClick={(data) => {
                const payload = (data as any)?.payload;
                if (payload?.iso && onSelectDay) onSelectDay(payload.iso);
              }}
              isAnimationActive
              animationDuration={200}
            />
          </BarChart>
        ) : period === 'month' ? (
          <BarChart data={monthData} {...commonChartProps}>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip cursor={{ fill: 'rgba(229,231,235,0.6)' }} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Bar dataKey="value" fill={isDark ? '#ffffff' : '#000000'} radius={[2, 2, 0, 0]} isAnimationActive animationDuration={200} />
          </BarChart>
                 ) : (
           <BarChart 
             data={yearData} 
             margin={{ top: 10, right: 20, bottom: 30, left: 20 }}
           >
             <CartesianGrid stroke={gridStroke} vertical={false} />
             <XAxis 
               dataKey="label" 
               tick={axisStyle} 
               axisLine={false} 
               tickLine={false}
               interval={0} // Mostrar todas las etiquetas
               tickMargin={10} // Espacio para las etiquetas
             />
             <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
             <Tooltip cursor={{ fill: 'rgba(229,231,235,0.6)' }} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
             <Bar dataKey="value" fill={isDark ? '#ffffff' : '#000000'} radius={[2, 2, 0, 0]} isAnimationActive animationDuration={200} />
           </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

const ProductivityStatsConnected: React.FC<ProductivityStatsConnectedProps> = () => {
  const tasks = useTaskStore((s) => s.tasks);
  const [period, setPeriod] = useState<Period>('week');
  const today = new Date();
  const todayISO = formatISODate(today);
  const [selectedISO, setSelectedISO] = useState<string>(todayISO);

  // Objetivo del mes (persistido en localStorage)
  const [monthlyGoal, setMonthlyGoal] = useState<string>('');
  const [monthlyGoalDone, setMonthlyGoalDone] = useState<boolean>(false);
  const [completedGoals, setCompletedGoals] = useState<Array<{text: string, completedDate: string, month: string}>>([]);
  const [swipedGoalIndex, setSwipedGoalIndex] = useState<number | null>(null);
  const goalInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const storedText = localStorage.getItem('stebe-monthly-goal-text');
    const storedDone = localStorage.getItem('stebe-monthly-goal-done');
    const storedCompletedGoals = localStorage.getItem('stebe-completed-goals');
    
    if (storedText !== null) setMonthlyGoal(storedText);
    if (storedDone !== null) setMonthlyGoalDone(storedDone === 'true');
    if (storedCompletedGoals !== null) {
      try {
        setCompletedGoals(JSON.parse(storedCompletedGoals));
      } catch (e) {
        setCompletedGoals([]);
      }
    }
  }, []);

  useEffect(() => {
    const el = goalInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeightPx = 56; // hasta ~2 líneas
    el.style.height = Math.min(el.scrollHeight, maxHeightPx) + 'px';
  }, [monthlyGoal]);

  const { mainNumber, secondaryText, weekData, monthData, yearData } = useMemo(() => {
    const getCompletedOnDate = (isoDate: string) =>
      tasks.filter(t => t.completed && t.completedDate?.split('T')[0] === isoDate).length;

    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    // Semana actual por día
    const weekData: { label: string; value: number; iso: string; isCurrent?: boolean; isSelected?: boolean }[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const iso = formatISODate(d);
      return { label: weekDayLabels[i], value: getCompletedOnDate(iso), isCurrent: iso === todayISO, iso, isSelected: iso === selectedISO };
    });

    // Mes actual por semana (S1..S5)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const monthBuckets = [0, 0, 0, 0, 0];
    tasks.forEach(t => {
      if (!t.completed || !t.completedDate) return;
      const d = new Date(t.completedDate);
      if (d >= monthStart && d < nextMonthStart) {
        const w = getWeekOfMonth(d) - 1; // 0..4
        monthBuckets[w] += 1;
      }
    });
    const monthData = monthBuckets.map((v, i) => ({ label: `S${i + 1}`, value: v }));

    // Año actual por mes (Ene, Feb, Mar, etc.)
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const nextYearStart = new Date(today.getFullYear() + 1, 0, 1);
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const yearBuckets = new Array(12).fill(0);
    
    tasks.forEach(t => {
      if (!t.completed || !t.completedDate) return;
      const d = new Date(t.completedDate);
      if (d >= yearStart && d < nextYearStart) {
        const month = d.getMonth(); // 0..11
        yearBuckets[month] += 1;
      }
    });
    const yearData = yearBuckets.map((v, i) => ({ label: monthNames[i], value: v }));

    if (period === 'week') {
      const totalWeek = tasks.filter(t => {
        if (!t.completed || !t.completedDate) return false;
        const d = new Date(t.completedDate);
        return d >= weekStart && d <= weekEnd;
      }).length;
      return {
        mainNumber: totalWeek,
        secondaryText: 'tareas completadas esta semana',
        weekData,
        monthData,
        yearData,
      };
    }

    if (period === 'month') {
      // Mes
      const totalMonth = monthBuckets.reduce((a, b) => a + b, 0);
      return {
        mainNumber: totalMonth,
        secondaryText: 'tareas completadas este mes',
        weekData,
        monthData,
        yearData,
      };
    }

    // Año
    const totalYear = yearBuckets.reduce((a, b) => a + b, 0);
    return {
      mainNumber: totalYear,
      secondaryText: 'tareas completadas este año',
      weekData,
      monthData,
      yearData,
    };
  }, [tasks, period, selectedISO]);

  const handleSelectDay = (iso: string) => {
    setSelectedISO(iso);
  };

  const handleCompleteGoal = () => {
    if (!monthlyGoal.trim()) return; // No hacer nada si no hay texto
    
    if (!monthlyGoalDone) {
      // Completar objetivo: agregar al historial y limpiar
      const currentDate = new Date();
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const monthName = monthNames[currentDate.getMonth()];
      
      // Agregar a objetivos completados
      const newCompletedGoal = {
        text: monthlyGoal,
        completedDate: currentDate.toISOString(),
        month: monthName
      };
      
      const updatedCompletedGoals = [...completedGoals, newCompletedGoal];
      setCompletedGoals(updatedCompletedGoals);
      localStorage.setItem('stebe-completed-goals', JSON.stringify(updatedCompletedGoals));
      
      // Limpiar objetivo actual
      setMonthlyGoal('');
      setMonthlyGoalDone(false);
      localStorage.setItem('stebe-monthly-goal-text', '');
      localStorage.setItem('stebe-monthly-goal-done', 'false');
    } else {
      // Desmarcar objetivo (solo cambio visual, no afecta historial)
      setMonthlyGoalDone(false);
      localStorage.setItem('stebe-monthly-goal-done', 'false');
    }
  };

  const handleDeleteGoal = (index: number) => {
    const updatedGoals = completedGoals.filter((_, i) => i !== index);
    setCompletedGoals(updatedGoals);
    localStorage.setItem('stebe-completed-goals', JSON.stringify(updatedGoals));
    setSwipedGoalIndex(null);
  };

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return (
         <div className={`${period === 'year' ? 'max-w-2xl' : 'max-w-md'} mx-auto min-h-screen bg-white dark:bg-black text-black dark:text-white px-6 pt-2 pb-20`}>
      <h1 className="mt-0 text-center text-4xl sm:text-5xl font-extrabold tracking-wider uppercase">ESTADÍSTICAS</h1>

      {/* Objetivo del mes (solo input y checkbox, sin etiquetas adicionales) */}
      <div className="mt-4">
        <div className="w-full border border-black dark:border-white rounded-xl p-3 bg-white dark:bg-black">
          <div className="flex items-start gap-3">
            <Pin className="w-5 h-5 mt-1" />
            <div className="flex-1 grid grid-cols-[1fr_auto] gap-x-3 items-start">
              <textarea
                ref={goalInputRef}
                rows={1}
                value={monthlyGoal}
                onChange={(e) => {
                  setMonthlyGoal(e.target.value);
                  localStorage.setItem('stebe-monthly-goal-text', e.target.value);
                }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  const maxHeightPx = 56;
                  el.style.height = Math.min(el.scrollHeight, maxHeightPx) + 'px';
                }}
                placeholder="Escribe tu objetivo..."
                className="col-start-1 bg-transparent outline-none resize-none overflow-hidden text-base sm:text-lg font-medium text-black dark:text-white placeholder-gray-400 leading-snug"
              />
                             <button
                 onClick={(e) => {
                   e.stopPropagation();
                   e.preventDefault();
                   handleCompleteGoal();
                 }}
                 aria-label="Completar objetivo mensual"
                 className={`justify-self-end w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                   monthlyGoalDone ? 'bg-black border-black text-white dark:bg-white dark:border-white dark:text-black' : 'border-black dark:border-white'
                 }`}
               >
                {monthlyGoalDone && <CheckCircle className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de objetivos completados */}
      {completedGoals.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-center mb-3 text-black dark:text-white">Objetivos Completados</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {completedGoals.slice().reverse().map((goal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Contenido principal */}
                <motion.div
                  className="p-3 text-xs"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(e, info) => {
                    if (info.offset.x < -50) {
                      setSwipedGoalIndex(index);
                    } else {
                      setSwipedGoalIndex(null);
                    }
                  }}
                  style={{
                    x: swipedGoalIndex === index ? -80 : 0
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-black dark:text-white font-medium line-clamp-2">{goal.text}</p>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">{goal.month}</p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-black dark:text-white ml-2 flex-shrink-0" />
                  </div>
                </motion.div>

                {/* Botón de borrar (aparece al deslizar) */}
                <motion.div
                  className="absolute right-0 top-0 bottom-0 bg-black dark:bg-gray-800 flex items-center justify-center w-20"
                  initial={{ x: 80 }}
                  animate={{ x: swipedGoalIndex === index ? 0 : 80 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <button
                    onClick={() => handleDeleteGoal(index)}
                    className="text-white dark:text-white text-xs font-medium px-4 py-2"
                  >
                    BORRAR
                  </button>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-col items-center justify-center select-none">
        <AnimatePresence mode="wait">
          <motion.div key={`num-${period}-${mainNumber}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="leading-none">
            <div className="text-[100px] sm:text-[120px] font-black tabular-nums">{mainNumber}</div>
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div key={`sub-${period}-${selectedISO}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="text-xl sm:text-2xl text-center">
            {secondaryText}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
                 <motion.div key={`chart-${period}-${selectedISO}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className={`${period === 'year' ? 'mt-12 -mx-4' : 'mt-10'}`}>
          <CentralStatsChart period={period} weekData={weekData} monthData={monthData} yearData={yearData} onSelectDay={handleSelectDay} isDark={isDark} />
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex items-center justify-center">
        <div className="flex w-full max-w-sm border border-black dark:border-white rounded-full overflow-hidden">
          {([
            { key: 'week', label: 'Semana' },
            { key: 'month', label: 'Mes' },
            { key: 'year', label: 'Año' },
          ] as { key: Period; label: string }[]).map((it) => {
            const selected = period === it.key;
            const bg = isDark ? (selected ? '#ffffff' : '#000000') : (selected ? '#000000' : '#ffffff');
            const fg = isDark ? (selected ? '#000000' : '#ffffff') : (selected ? '#ffffff' : '#000000');
            return (
              <button
                key={it.key}
                onClick={() => setPeriod(it.key)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors`}
                style={{ backgroundColor: bg, color: fg }}
                aria-pressed={period === it.key}
              >
                {it.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductivityStatsConnected;