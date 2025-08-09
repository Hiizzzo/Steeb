import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export interface SmartTaskItem {
  title: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  estimatedTime?: string; // ej: "30 minutos"
  category?: string;
  subtasks?: string[];
}

export interface SmartTaskPlan {
  tasks: SmartTaskItem[];
  motivation?: string;
  nextSteps?: string[];
}

interface SmartTaskReviewProps {
  plan: SmartTaskPlan;
  onConfirm: (selected: Array<SmartTaskItem & { scheduledDate?: string; scheduledTime?: string }>) => void;
  onCancel?: () => void;
  defaultScheduledDate?: string;
}

const parseEstimatedMinutes = (text?: string): number | undefined => {
  if (!text) return undefined;
  const match = text.match(/(\d+)/);
  if (match) return parseInt(match[1], 10);
  return undefined;
};

const SmartTaskReview: React.FC<SmartTaskReviewProps> = ({ plan, onConfirm, onCancel, defaultScheduledDate }) => {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    () => new Set(plan.tasks.map((_, idx) => idx))
  );
  const [scheduledDate, setScheduledDate] = useState<string | ''>(defaultScheduledDate || '');
  const [scheduledTime, setScheduledTime] = useState<string | ''>('');

  const tasks = useMemo(() => plan.tasks || [], [plan.tasks]);

  const toggleIndex = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setSelectedIndices(next);
  };

  const handleConfirm = () => {
    const selected = tasks
      .map((t, idx) => ({ t, idx }))
      .filter(({ idx }) => selectedIndices.has(idx))
      .map(({ t }) => ({
        ...t,
        scheduledDate: scheduledDate || undefined,
        scheduledTime: scheduledTime || undefined,
      }));
    onConfirm(selected);
  };

  return (
    <Card className="p-4 border bg-white">
      <div className="mb-2">
        <h3 className="font-semibold text-sm">Revisá y confirmá las tareas sugeridas</h3>
      </div>

      <div className="space-y-3 max-h-72 overflow-auto pr-1">
        {tasks.map((task, idx) => (
          <div key={idx} className="flex items-start gap-3 border rounded-md p-2">
            <Checkbox checked={selectedIndices.has(idx)} onCheckedChange={() => toggleIndex(idx)} />
            <div className="flex-1">
              <div className="font-medium text-sm">{task.title}</div>
              {task.description && (
                <div className="text-xs text-gray-600 mt-0.5">{task.description}</div>
              )}
              <div className="text-[11px] text-gray-500 mt-1">
                {task.estimatedTime && <span>⏱ {task.estimatedTime}</span>}
                {task.priority && <span className="ml-2">🔥 {task.priority}</span>}
                {task.subtasks && task.subtasks.length > 0 && (
                  <span className="ml-2">• {task.subtasks.length} subtareas</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
        <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 mt-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        )}
        <Button onClick={handleConfirm}>Crear tareas</Button>
      </div>
    </Card>
  );
};

export default SmartTaskReview;