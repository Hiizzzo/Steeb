import { useMemo } from 'react';

interface Task {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
  subtasks?: Array<{ id: string; title: string; completed: boolean }>;
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  notes?: string;
}

interface ProductivityStats {
  completedTasks: number;
  totalTasks: number;
  completionPercentage: number;
  currentStreak: number;
  timeSpent: string;
  weeklyActivity: Array<{ day: string; percentage: number; isToday?: boolean }>;
  consistencyStreak: number[];
  todayProgress: number;
}

export const useProductivityStats = (tasks: Task[]): ProductivityStats => {
  return useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Calcular tareas completadas y totales
    const completedTasks = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calcular tareas de hoy
    const todayTasks = tasks.filter(task => 
      !task.scheduledDate || task.scheduledDate === todayStr
    );
    const todayCompleted = todayTasks.filter(task => task.completed).length;
    const todayProgress = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;

    // Calcular racha actual (días consecutivos con al menos 1 tarea completada)
    const calculateStreak = (): number => {
      let streak = 0;
      const currentDate = new Date();
      
      for (let i = 0; i < 30; i++) {
        const dateStr = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        
        const dayTasks = tasks.filter(task => 
          task.completedDate?.split('T')[0] === dateStr
        );
        
        if (dayTasks.length > 0) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      
      return streak;
    };

    const currentStreak = calculateStreak();

    // Estimar tiempo gastado (basado en número de tareas completadas)
    const estimatedTimePerTask = 30; // 30 minutos promedio por tarea
    const totalMinutes = completedTasks * estimatedTimePerTask;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeSpent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    // Calcular actividad semanal (últimos 7 días)
    const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(task => 
        task.scheduledDate === dateStr || 
        task.completedDate?.split('T')[0] === dateStr
      );
      
      const dayCompleted = dayTasks.filter(task => task.completed).length;
      const percentage = dayTasks.length > 0 ? Math.round((dayCompleted / dayTasks.length) * 100) : 0;
      
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
      const isToday = dateStr === todayStr;
      
      return {
        day: dayNames[date.getDay()],
        percentage: Math.min(percentage, 100),
        isToday
      };
    });

    // Calcular racha de consistencia (altura de barras para últimos 7 días)
    const consistencyStreak = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(task => 
        task.scheduledDate === dateStr || 
        task.completedDate?.split('T')[0] === dateStr
      );
      
      const dayCompleted = dayTasks.filter(task => task.completed).length;
      // Convertir a altura de barra (20-90 rango)
      return Math.max(20, Math.min(90, dayCompleted * 20));
    });

    return {
      completedTasks,
      totalTasks,
      completionPercentage,
      currentStreak,
      timeSpent,
      weeklyActivity,
      consistencyStreak,
      todayProgress
    };
  }, [tasks]);
};