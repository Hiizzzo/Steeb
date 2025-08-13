import React, { useMemo, useState } from 'react';
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

function getWeekOfMonth(date: Date) {
  const dayOfMonth = date.getDate();
  return Math.min(5, Math.ceil(dayOfMonth / 7)); // S1..S5
}

const CentralStatsChart: React.FC<{
  period: Period;
  dayData: { hour: number; label: string; value: number }[];
  weekData: { label: string; value: number; iso: string; isCurrent?: boolean; isSelected?: boolean }[];
  monthData: { label: string; value: number }[];
  onSelectDay?: (iso: string) => void;
}> = ({ period, dayData, weekData, monthData, onSelectDay }) => {
  const axisStyle = { fontSize: 12, fill: '#111' } as const;
  const gridStroke = '#e5e7eb';
  const commonChartProps = { margin: { top: 10, right: 8, bottom: 0, left: 0 } } as const;

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        {period === 'day' ? (
          <LineChart data={dayData} {...commonChartProps}>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="label"
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
              interval={3}
            />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip cursor={{ stroke: '#d1d5db' }} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Line type="monotone" dataKey="value" stroke="#000" strokeWidth={2} dot={false} isAnimationActive animationDuration={200} />
          </LineChart>
        ) : period === 'week' ? (
          <BarChart data={weekData} {...commonChartProps}>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip cursor={{ fill: 'rgba(229,231,235,0.6)' }} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Bar
              dataKey="value"
              fill="#000"
              radius={[2, 2, 0, 0]}
              onClick={(data) => {
                const payload = (data as any)?.payload;
                if (payload?.iso && onSelectDay) onSelectDay(payload.iso);
              }}
              isAnimationActive
              animationDuration={200}
            />
          </BarChart>
        ) : (
          <BarChart data={monthData} {...commonChartProps}>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip cursor={{ fill: 'rgba(229,231,235,0.6)' }} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Bar dataKey="value" fill="#000" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={200} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

const ProductivityStatsConnected: React.FC<ProductivityStatsConnectedProps> = () => {
  const tasks = useTaskStore((s) => s.tasks);
  const [period, setPeriod] = useState<Period>('day');
  const today = new Date();
  const todayISO = formatISODate(today);
  const [selectedISO, setSelectedISO] = useState<string>(todayISO);

  const { mainNumber, secondaryText, weekData, monthData, dayData } = useMemo(() => {
    const getCompletedOnDate = (isoDate: string) =>
      tasks.filter(t => t.completed && t.completedDate?.split('T')[0] === isoDate).length;

    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    // Semana actual por día
    const weekData: { label: string; value: number; iso: string; isCurrent?: boolean; isSelected?: boolean }[] = Array.from({ length: 7 }, (_, i) => {
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

    // Día seleccionado por horas
    const targetISO = selectedISO || todayISO;
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, label: `${h}`, value: 0 }));
    tasks.forEach(t => {
      if (!t.completed || !t.completedDate) return;
      const d = new Date(t.completedDate);
      const iso = d.toISOString().split('T')[0];
      if (iso === targetISO) {
        const h = d.getHours();
        hours[h].value += 1;
      }
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

    if (period === 'day') {
      const completedForSelected = getCompletedOnDate(targetISO);
      const isToday = targetISO === todayISO;
      return {
        mainNumber: completedForSelected,
        secondaryText: isToday ? 'tareas completadas hoy' : `tareas completadas el ${new Date(targetISO + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' })}`,
        weekData,
        monthData,
        dayData: hours,
      };
    }

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
        dayData: hours,
      };
    }

    // Mes
    const totalMonth = monthBuckets.reduce((a, b) => a + b, 0);
    return {
      mainNumber: totalMonth,
      secondaryText: 'tareas completadas este mes',
      weekData,
      monthData,
      dayData: hours,
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
            transition={{ duration: 0.2 }}
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
            transition={{ duration: 0.2 }}
            className="text-xl sm:text-2xl text-center"
          >
            {secondaryText}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`chart-${period}-${selectedISO}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mt-10"
        >
          <CentralStatsChart
            period={period}
            dayData={dayData}
            weekData={weekData}
            monthData={monthData}
            onSelectDay={handleSelectDay}
          />
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex items-center justify-center">
        <div className="flex w-full max-w-sm border border-black rounded-full overflow-hidden">
          {([
            { key: 'day', label: 'Día' },
            { key: 'week', label: 'Semana' },
            { key: 'month', label: 'Mes' },
          ] as { key: Period; label: string }[]).map((it) => (
            <button
              key={it.key}
              onClick={() => {
                setPeriod(it.key);
                if (it.key === 'day') {
                  setSelectedISO(prev => prev || todayISO);
                }
              }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                period === it.key ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductivityStatsConnected;