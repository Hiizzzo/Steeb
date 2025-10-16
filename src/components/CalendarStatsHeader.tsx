import React, { useMemo } from 'react';
import { Flame, CheckCircle, Calendar as CalendarIcon, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  type:
    | 'productividad'
    | 'creatividad'
    | 'aprendizaje'
    | 'organizacion'
    | 'salud'
    | 'social'
    | 'entretenimiento'
    | 'extra';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  notes?: string;
}

type Props = {
  tasks: Task[];
};

const CalendarStatsHeader: React.FC<Props> = ({ tasks }) => {
  const { currentStreak, bestStreak, totalCompleted, daysWithCompletedInMonth } = useMemo(() => {
    const normalizeDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    // Fechas con completadas
    const completedDates = tasks
      .filter((t) => t.completed && t.completedDate)
      .map((t) => new Date(t.completedDate!))
      .map(normalizeDay);

    const uniqueSet = new Set(completedDates.map((d) => d.toISOString()));

    // Racha actual
    let current = 0;
    const today = normalizeDay(new Date());
    let probe = new Date(today);
    while (uniqueSet.has(probe.toISOString())) {
      current += 1;
      probe.setDate(probe.getDate() - 1);
    }

    // Mejor racha
    let best = 0;
    if (uniqueSet.size > 0) {
      const uniqueDays = Array.from(uniqueSet)
        .map((s) => new Date(s))
        .sort((a, b) => a.getTime() - b.getTime());
      let streak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        const prev = uniqueDays[i - 1];
        const curr = uniqueDays[i];
        const prevNext = new Date(prev);
        prevNext.setDate(prevNext.getDate() + 1);
        if (prevNext.toISOString() === curr.toISOString()) streak += 1;
        else {
          best = Math.max(best, streak);
          streak = 1;
        }
      }
      best = Math.max(best, streak);
    }

    // Días activos del mes actual
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let activeDays = 0;
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      if (uniqueSet.has(normalizeDay(d).toISOString())) activeDays += 1;
    }

    return {
      currentStreak: current,
      bestStreak: best,
      totalCompleted: tasks.filter((t) => t.completed).length,
      daysWithCompletedInMonth: activeDays,
    };
  }, [tasks]);

  const itemCls =
    'rounded-xl border bg-white text-black p-3 sm:p-4 flex flex-col items-center justify-center gap-1 shadow-sm';
  const labelCls = 'text-[11px] text-gray-600 leading-none mt-0.5';

  return (
    <div className="mb-3 -mx-1 px-1">
      <div className="grid grid-cols-4 gap-2">
        <Card className={itemCls}>
          <Flame className="w-4 h-4" />
          <div className="text-lg font-bold">{currentStreak}</div>
          <div className={labelCls}>días de racha</div>
        </Card>
        <Card className={itemCls}>
          <CheckCircle className="w-4 h-4" />
          <div className="text-lg font-bold">{totalCompleted}</div>
          <div className={labelCls}>tareas completadas</div>
        </Card>
        <Card className={itemCls}>
          <CalendarIcon className="w-4 h-4" />
          <div className="text-lg font-bold">{daysWithCompletedInMonth}</div>
          <div className={labelCls}>Días activos</div>
        </Card>
        <Card className={itemCls}>
          <Trophy className="w-4 h-4" />
          <div className="text-lg font-bold">{bestStreak}</div>
          <div className={labelCls}>mejor racha</div>
        </Card>
      </div>
    </div>
  );
};

export default CalendarStatsHeader;



