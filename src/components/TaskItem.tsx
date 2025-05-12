
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
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onComplete, 
  onStartTimer, 
  className 
}) => {
  return (
    <Card 
      className={cn(
        'steve-border p-4 transition-all mb-3', 
        task.completed ? 'bg-steve-gray-light' : 'bg-steve-white',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <button 
            onClick={() => onComplete(task.id)}
            className="mt-1"
          >
            {task.completed ? (
              <CheckCircle size={20} className="text-steve-black" />
            ) : (
              <Circle size={20} className="text-steve-black" />
            )}
          </button>
          
          <div className={cn('transition-all', task.completed ? 'opacity-60 line-through' : '')}>
            <h3 className="font-medium">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-steve-gray-dark mt-1">{task.description}</p>
            )}
            
            {task.targetTime && (
              <div className="flex items-center text-xs text-steve-gray-dark mt-2">
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
        </div>
        
        {!task.completed && (
          <Button 
            size="sm" 
            variant="outline" 
            className="steve-border bg-steve-white hover:bg-steve-gray-light"
            onClick={() => onStartTimer(task.id)}
          >
            <Timer size={16} className="mr-1" />
            Iniciar
          </Button>
        )}
      </div>
    </Card>
  );
};

export default TaskItem;
