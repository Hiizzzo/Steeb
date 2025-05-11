
import React from 'react';
import { Card } from '@/components/ui/card';
import { Task } from '@/components/TaskItem';

interface StatsPanelProps {
  tasks: Task[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ tasks }) => {
  // Calcular estadísticas
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // Calcular tiempo total
  const totalPlannedTime = tasks.reduce((acc, task) => {
    return acc + (task.targetTime || 0);
  }, 0);
  
  const totalActualTime = tasks.reduce((acc, task) => {
    return acc + (task.actualTime || 0);
  }, 0);
  
  // Determinar el estado de productividad
  const getProductivityStatus = () => {
    if (completedTasks === 0) return "Sin actividad";
    if (completionRate < 30) return "Muy baja";
    if (completionRate < 60) return "Baja";
    if (completionRate < 80) return "Media";
    if (completionRate < 100) return "Alta";
    return "¡Perfecta!";
  };
  
  return (
    <Card className="steve-border p-4 bg-steve-white">
      <h3 className="text-lg font-bold mb-3 text-center">Estadísticas de Hoy</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-steve-gray-dark">Progreso</p>
          <div className="flex items-center mt-1">
            <div className="w-full bg-steve-gray-light h-3 rounded-full overflow-hidden steve-border">
              <div 
                className="h-full bg-steve-black" 
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm font-medium">{Math.round(completionRate)}%</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-steve-gray-dark">Completadas</p>
            <p className="text-lg font-bold">{completedTasks} / {totalTasks}</p>
          </div>
          
          <div>
            <p className="text-sm text-steve-gray-dark">Productividad</p>
            <p className="text-lg font-bold">{getProductivityStatus()}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-steve-gray-dark">Tiempo planeado</p>
            <p className="text-lg font-bold">{totalPlannedTime} min</p>
          </div>
          
          <div>
            <p className="text-sm text-steve-gray-dark">Tiempo real</p>
            <p className="text-lg font-bold">{totalActualTime} min</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatsPanel;
