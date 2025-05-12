
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Timer, CheckCircle, Circle } from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  targetTime?: number; // en minutos
  actualTime?: number; // en minutos
}

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onStartTimer: (id: string) => void;
  className?: string;
  colorIndex?: number;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onComplete, 
  onStartTimer, 
  className,
  colorIndex = 0
}) => {
  return (
    <div 
      className={cn(
        'flex items-center py-3', 
        task.completed ? 'opacity-70' : '',
        className
      )}
    >
      <div 
        className={`w-10 h-10 rounded-full flex items-center justify-center gradient-bg-${colorIndex % 5}`}
        onClick={() => onComplete(task.id)}
      >
        {task.completed && (
          <CheckCircle size={20} className="text-white" />
        )}
      </div>
      
      <div className={cn('ml-5 flex-1', task.completed ? 'line-through' : '')}>
        <h3 className="text-xl">{task.title}</h3>
        {task.description && (
          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
        )}
        
        {task.targetTime && (
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <span>Meta: {task.targetTime} min</span>
            {task.actualTime && (
              <span className="ml-2">
                {task.actualTime > task.targetTime 
                  ? `(+${task.actualTime - task.targetTime} min extra)` 
                  : `(${task.actualTime} min)`
                }
              </span>
            )}
          </div>
        )}
      </div>
      
      {!task.completed && (
        <Button 
          size="sm" 
          variant="ghost" 
          className="text-gray-500"
          onClick={() => onStartTimer(task.id)}
        >
          <Timer size={16} />
        </Button>
      )}
    </div>
  );
};

export default TaskItem;
