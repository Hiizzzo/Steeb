
import React from 'react';
import TaskItem from '@/components/TaskItem';
import { Task } from '@/components/TaskItem';
import SteveTip from '@/components/SteveTip';

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onStartTimer: (id: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onComplete, onStartTimer }) => {
  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="space-y-5">
      {tasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={task}
          onComplete={onComplete}
          onStartTimer={onStartTimer}
          colorIndex={index}
        />
      ))}
      
      {tasks.length === 0 && (
        <div className="py-10">
          <SteveTip
            pendingTasks={pendingTasks}
            completedTasks={completedTasks}
          />
        </div>
      )}
    </div>
  );
};

export default TaskList;
