import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';

type Period = 'day' | 'week' | 'month';

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

const weekDayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

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

const BarsChart: React.FC<{ data: DayBar[]; onSelect?: (iso: string) => void }> = ({ data, onSelect }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="w-full mt-10">
      <div className="h-36 flex items-end justify-between gap-1 px-3">
        {data.map((bar, i) => {
          const heightPct = (bar.value / max) * 100;
          const isEmphasized = bar.isCurrent || bar.isSelected;
          return (
            <div
              key={`${bar.label}-${i}`}
              className={`flex-1 flex flex-col items-center ${bar.iso ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (bar.iso && onSelect) onSelect(bar.iso);
              }}
            >
              <motion.div
                className={`w-full ${isEmphasized ? 'bg-black' : 'bg-neutral-900'} rounded-t`}
                initial={{ height: '4%' }}
                animate={{ height: `${Math.max(heightPct, 4)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              <span className={`mt-2 text-xs ${isEmphasized ? 'font-bold text-black' : 'text-neutral-700'}`}>{bar.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 h-px bg-neutral-200 mx-3" />
    </div>
  );
};

const PeriodSelector: React.FC<{ value: Period; onChange: (p: Period) => void }>
  = ({ value, onChange }) => {
  const items: { key: Period; label: string }[] = [
    { key: 'day', label: 'Día' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
  ];
  return (
    <div className="mt-10 flex items-center justify-center">
      <div className="flex w-full max-w-sm border border-black rounded-full overflow-hidden">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              value === it.key ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const ProductivityStatsConnected: React.FC<ProductivityStatsConnectedProps> = () => {
  const tasks = useTaskStore((s) => s.tasks);
  const [period, setPeriod] = useState<Period>('day');
  const today = new Date();
  const todayISO = formatISODate(today);
  const [selectedISO, setSelectedISO] = useState<string>(todayISO);

  const { mainNumber, secondaryText, bars } = useMemo(() => {
    // Filter helpers
    const getCompletedOnDate = (isoDate: string) =>
      tasks.filter(t => t.completed && (t.completedDate?.split('T')[0] === isoDate || t.scheduledDate === isoDate)).length;

    // Semana actual - por día
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const weekBars: DayBar[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const iso = formatISODate(d);
      return {
        label: weekDayLabels[i],
        value: getCompletedOnDate(iso),
        isCurrent: iso === todayISO,
        iso,
        isSelected: iso === selectedISO,
      };
    });

    if (period === 'day') {
      const targetISO = selectedISO || todayISO;
      const completedForSelected = getCompletedOnDate(targetISO);
      const isToday = targetISO === todayISO;
      const dateLabel = new Date(targetISO + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' });
      return {
        mainNumber: completedForSelected,
        secondaryText: isToday ? 'tareas completadas hoy' : `tareas completadas el ${dateLabel}`,
        bars: weekBars,
      };
    }

    if (period === 'week') {
      // Total completadas en la semana actual
      const totalWeek = tasks.filter(t => {
        const raw = t.completedDate || t.scheduledDate;
        if (!raw) return false;
        const d = new Date(raw);
        return t.completed && d >= weekStart && d <= weekEnd;
      }).length;
      return {
        mainNumber: totalWeek,
        secondaryText: 'tareas completadas esta semana',
        bars: weekBars,
      };
    }

    // Mes actual: agregamos por día de la semana (D..S)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const counts = new Array(7).fill(0) as number[];
    tasks.forEach(t => {
      if (!t.completed) return;
      const raw = t.completedDate || t.scheduledDate;
      if (!raw) return;
      const d = new Date(raw);
      if (d >= monthStart && d < nextMonthStart) {
        counts[d.getDay()] += 1; // 0..6 Domingo..Sábado
      }
    });
    const monthBars: DayBar[] = counts.map((v, i) => ({ label: weekDayLabels[i], value: v, isCurrent: i === today.getDay() }));
    const totalMonth = counts.reduce((a, b) => a + b, 0);

    return {
      mainNumber: totalMonth,
      secondaryText: 'tareas completadas este mes',
      bars: monthBars,
    };
  }, [tasks, period, selectedISO]);

  const handleSelectDay = (iso: string) => {
    setSelectedISO(iso);
    if (period !== 'day') setPeriod('day');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white text-black px-6 pt-12 pb-20">
      <h1 className="text-center text-4xl sm:text-5xl font-extrabold tracking-wider uppercase">ESTADÍSTICAS</h1>

      <div className="mt-12 flex flex-col items-center justify-center select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={`num-${period}-${mainNumber}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="leading-none"
          >
            <div className="text-[100px] sm:text-[120px] font-black tabular-nums">{mainNumber}</div>
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div
            key={`sub-${period}-${selectedISO}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-xl sm:text-2xl text-center"
          >
            {secondaryText}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`chart-${period}-${bars.map(b=>b.value).join(',')}-${selectedISO}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="mt-10"
        >
          <BarsChart data={bars} onSelect={handleSelectDay} />
        </motion.div>
      </AnimatePresence>

      <PeriodSelector value={period} onChange={(p)=>{
        setPeriod(p);
        if (p !== 'day') return;
        // when returning to day, keep selection; if undefined set to today
        setSelectedISO(prev => prev || todayISO);
      }} />
    </div>
  );
};

export default ProductivityStatsConnected;