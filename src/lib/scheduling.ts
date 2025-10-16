export interface TimeBlock {
  start: string; // HH:MM
  end: string;   // HH:MM
}

// Calcula el primer hueco libre a partir de un array de horas ocupadas (HH:MM) del día
export const findFirstFreeSlot = (
  occupied: TimeBlock[],
  dayStart: string = '09:00',
  dayEnd: string = '18:00',
  minDurationMinutes: number = 30
): string | null => {
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const toHHMM = (min: number) => {
    const h = Math.floor(min / 60).toString().padStart(2, '0');
    const m = (min % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const start = toMinutes(dayStart);
  const end = toMinutes(dayEnd);
  const sorted = [...occupied].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  let cursor = start;
  for (const block of sorted) {
    const blockStart = toMinutes(block.start);
    if (blockStart - cursor >= minDurationMinutes) {
      return toHHMM(cursor);
    }
    cursor = Math.max(cursor, toMinutes(block.end));
  }

  if (end - cursor >= minDurationMinutes) return toHHMM(cursor);
  return null;
};

export const normalizeEstimatedTimeToMinutes = (estimatedTime?: string): number => {
  if (!estimatedTime) return 30;
  const m = estimatedTime.match(/(\d+)/);
  if (m) return Math.max(15, Math.min(240, parseInt(m[1], 10)));
  return 30;
};