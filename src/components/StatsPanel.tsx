
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Task } from '@/components/TaskItem';
import { TrendingUp, BarChart, Clock, CheckCircle } from 'lucide-react';
import ProgressTracker from '@/components/ProgressTracker';

interface StatsPanelProps {
  tasks: Task[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ tasks }) => {
  const [showDetailedProgress, setShowDetailedProgress] = useState(false);
  
  // Calcular estadísticas básicas
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const totalTimeWorked = tasks.reduce((acc, task) => {
    return acc + (task.actualTime || 0);
  }, 0);
  
  // Formatear tiempo
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  // Crear el círculo de progreso visual
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          {/* Círculo de fondo */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="transparent"
            className="opacity-20"
          />
          {/* Círculo de progreso */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#10b981"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        {/* Porcentaje en el centro */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-steve-black">
              {Math.round(percentage)}%
            </div>
            <div className="text-xs text-steve-gray-dark">
              Completado
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  if (showDetailedProgress) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetailedProgress(false)}
            className="steve-border bg-steve-white hover:bg-steve-gray-light"
          >
            <BarChart size={16} className="mr-1" />
            Vista Simple
          </Button>
        </div>
        <ProgressTracker tasks={tasks} />
      </div>
    );
  }
  
  return (
    <div>
      <Card className="steve-border p-6 bg-steve-white mb-3">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Tu Día</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetailedProgress(true)}
            className="steve-border bg-steve-white hover:bg-steve-gray-light"
          >
            <TrendingUp size={16} className="mr-1" />
            Detalles
          </Button>
        </div>
        
        {/* Gráfico circular principal */}
        <div className="mb-6">
          <CircularProgress percentage={completionRate} />
        </div>
        
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg steve-border">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div className="text-xl font-bold text-green-700">{completedTasks}</div>
            <div className="text-xs text-green-600">Completadas</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg steve-border">
            <div className="flex items-center justify-center mb-2">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div className="text-xl font-bold text-blue-700">{formatTime(totalTimeWorked)}</div>
            <div className="text-xs text-blue-600">Tiempo total</div>
          </div>
        </div>
        
        {/* Mensaje motivacional simple */}
        {totalTasks > 0 && (
          <div className="mt-4 text-center">
            <div className="text-sm text-steve-gray-dark">
              {completionRate === 100 
                ? "¡Increíble! 🎉" 
                : completionRate >= 75 
                ? "¡Casi terminas! 💪" 
                : completionRate >= 50 
                ? "Buen progreso 👍" 
                : "¡Vamos, tú puedes! 🚀"
              }
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StatsPanel;
