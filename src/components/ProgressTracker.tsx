
import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Task } from '@/components/TaskItem';
import { Clock, Target, TrendingUp, Calendar, Award, Zap } from 'lucide-react';

interface ProgressTrackerProps {
  tasks: Task[];
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ tasks }) => {
  // Calcular métricas de progreso
  const completedTasks = tasks.filter(task => task.completed);
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
  
  // Tiempo total trabajado (en minutos)
  const totalTimeWorked = completedTasks.reduce((acc, task) => {
    return acc + (task.actualTime || 0);
  }, 0);
  
  // Tiempo total planeado
  const totalPlannedTime = tasks.reduce((acc, task) => {
    return acc + (task.targetTime || 0);
  }, 0);
  
  // Eficiencia (tiempo real vs tiempo planeado)
  const efficiency = totalPlannedTime > 0 ? 
    Math.max(0, 100 - ((totalTimeWorked - totalPlannedTime) / totalPlannedTime * 100)) : 0;
  
  // Racha actual (tareas completadas consecutivas)
  const currentStreak = calculateStreak(tasks);
  
  // Promedio de tiempo por tarea
  const avgTimePerTask = completedTasks.length > 0 ? 
    Math.round(totalTimeWorked / completedTasks.length) : 0;
  
  // Formatear tiempo en horas y minutos
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  // Determinar nivel de productividad
  const getProductivityLevel = () => {
    if (completionRate >= 90) return { level: "Excepcional", color: "text-green-600", icon: Award };
    if (completionRate >= 75) return { level: "Excelente", color: "text-green-500", icon: TrendingUp };
    if (completionRate >= 50) return { level: "Bueno", color: "text-blue-500", icon: Target };
    if (completionRate >= 25) return { level: "Regular", color: "text-yellow-500", icon: Clock };
    return { level: "Necesita mejora", color: "text-red-500", icon: Zap };
  };
  
  const productivityLevel = getProductivityLevel();
  const ProductivityIcon = productivityLevel.icon;

  return (
    <div className="space-y-4">
      {/* Resumen Principal */}
      <Card className="steve-border p-4 bg-steve-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Tu Progreso de Hoy</h3>
          <div className="flex items-center space-x-1">
            <ProductivityIcon size={20} className={productivityLevel.color} />
            <span className={`text-sm font-medium ${productivityLevel.color}`}>
              {productivityLevel.level}
            </span>
          </div>
        </div>
        
        {/* Progreso Principal */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Tareas Completadas</span>
            <span className="font-medium">{completedTasks.length}/{totalTasks}</span>
          </div>
          <Progress 
            value={completionRate} 
            className="h-3 bg-steve-gray-light"
          />
          <p className="text-xs text-steve-gray-dark mt-1 text-center">
            {Math.round(completionRate)}% completado
          </p>
        </div>
        
        {/* Métricas en Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock size={16} className="text-steve-gray-dark mr-1" />
              <span className="text-xs text-steve-gray-dark">Tiempo Total</span>
            </div>
            <p className="text-lg font-bold">{formatTime(totalTimeWorked)}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap size={16} className="text-steve-gray-dark mr-1" />
              <span className="text-xs text-steve-gray-dark">Racha</span>
            </div>
            <p className="text-lg font-bold">{currentStreak} tareas</p>
          </div>
        </div>
      </Card>
      
      {/* Métricas Detalladas */}
      <Card className="steve-border p-4 bg-steve-white">
        <h4 className="font-medium mb-3">Métricas Detalladas</h4>
        
        <div className="space-y-3">
          {/* Eficiencia */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Eficiencia de Tiempo</span>
              <span className="font-medium">{Math.round(efficiency)}%</span>
            </div>
            <Progress 
              value={efficiency} 
              className="h-2 bg-steve-gray-light"
            />
            <p className="text-xs text-steve-gray-dark mt-1">
              {efficiency >= 80 ? "¡Excelente gestión del tiempo!" : 
               efficiency >= 60 ? "Buen control del tiempo" : 
               "Oportunidad de mejora"}
            </p>
          </div>
          
          {/* Tiempo Promedio */}
          <div className="flex justify-between items-center">
            <span className="text-sm">Tiempo promedio por tarea:</span>
            <span className="font-medium">{avgTimePerTask} min</span>
          </div>
          
          {/* Tiempo Planeado vs Real */}
          <div className="flex justify-between items-center">
            <span className="text-sm">Tiempo planeado:</span>
            <span className="font-medium">{formatTime(totalPlannedTime)}</span>
          </div>
          
          {/* Diferencia de tiempo */}
          {totalTimeWorked !== totalPlannedTime && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Diferencia:</span>
              <span className={`font-medium ${
                totalTimeWorked > totalPlannedTime ? 'text-red-500' : 'text-green-500'
              }`}>
                {totalTimeWorked > totalPlannedTime ? '+' : ''}{totalTimeWorked - totalPlannedTime} min
              </span>
            </div>
          )}
        </div>
      </Card>
      
      {/* Mensaje Motivacional */}
      {totalTasks > 0 && (
        <Card className="steve-border p-3 bg-steve-gray-light">
          <div className="text-center">
            <Calendar size={16} className="mx-auto mb-1 text-steve-gray-dark" />
            <p className="text-sm">
              {getMotivationalMessage(completionRate, currentStreak, totalTimeWorked)}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

// Función para calcular la racha actual
function calculateStreak(tasks: Task[]): number {
  const completedTasks = tasks.filter(task => task.completed);
  return completedTasks.length; // Simplificado para demo - en producción usarías fechas
}

// Función para mensajes motivacionales
function getMotivationalMessage(completionRate: number, streak: number, timeWorked: number): string {
  if (completionRate === 100) {
    return "¡Increíble! Has completado todas tus tareas. ¡Eres imparable!";
  }
  
  if (completionRate >= 75) {
    return `¡Vas excelente! ${streak} tareas completadas y ${Math.round(timeWorked)} minutos de trabajo productivo.`;
  }
  
  if (completionRate >= 50) {
    return "¡Buen progreso! Mantén el ritmo para alcanzar tus objetivos.";
  }
  
  if (timeWorked > 60) {
    return "Has invertido buen tiempo trabajando. ¡Sigue enfocado!";
  }
  
  return "¡Cada pequeño paso cuenta! Continúa avanzando hacia tus metas.";
}

export default ProgressTracker;
