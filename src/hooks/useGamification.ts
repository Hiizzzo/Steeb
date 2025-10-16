// ============================================================================
// GAMIFICATION SYSTEM - PUNTOS, LOGROS Y NIVELES
// ============================================================================
// Sistema de gamificación para mejorar la experiencia de usuario y cumplimiento
// con la Guideline 4.2 de Apple sobre funcionalidad mínima
// ============================================================================

import { useState, useEffect } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
}

interface UserLevel {
  level: number;
  title: string;
  minPoints: number;
  color: string;
}

const LEVELS: UserLevel[] = [
  { level: 1, title: 'Novato', minPoints: 0, color: '#94a3b8' },
  { level: 2, title: 'Aprendiz', minPoints: 100, color: '#22c55e' },
  { level: 3, title: 'Productivo', minPoints: 250, color: '#3b82f6' },
  { level: 4, title: 'Experto', minPoints: 500, color: '#8b5cf6' },
  { level: 5, title: 'Maestro', minPoints: 1000, color: '#f59e0b' },
  { level: 6, title: 'Leyenda', minPoints: 2000, color: '#ef4444' },
];

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_task',
    title: 'Primeros Pasos',
    description: 'Completa tu primera tarea',
    icon: '🎯',
    points: 10,
    unlocked: false,
  },
  {
    id: 'streak_3',
    title: 'Racha de 3 días',
    description: 'Completa tareas durante 3 días seguidos',
    icon: '🔥',
    points: 50,
    unlocked: false,
  },
  {
    id: 'streak_7',
    title: 'Racha de 7 días',
    description: 'Completa tareas durante una semana seguida',
    icon: '💪',
    points: 100,
    unlocked: false,
  },
  {
    id: 'tasks_10',
    title: 'Decena de Tareas',
    description: 'Completa 10 tareas en total',
    icon: '📊',
    points: 30,
    unlocked: false,
  },
  {
    id: 'tasks_50',
    title: 'Medio Centenar',
    description: 'Completa 50 tareas en total',
    icon: '🏆',
    points: 150,
    unlocked: false,
  },
  {
    id: 'perfect_day',
    title: 'Día Perfecto',
    description: 'Completa todas las tareas de un día',
    icon: '⭐',
    points: 75,
    unlocked: false,
  },
  {
    id: 'night_owl',
    title: 'Búho Nocturno',
    description: 'Completa 5 tareas después de las 10 PM',
    icon: '🦉',
    points: 40,
    unlocked: false,
  },
  {
    id: 'early_bird',
    title: 'Madrugador',
    description: 'Completa 5 tareas antes de las 8 AM',
    icon: '🐓',
    points: 40,
    unlocked: false,
  },
];

const GAMIFICATION_STORAGE_KEY = 'stebe-gamification';

export const useGamification = () => {
  const [totalPoints, setTotalPoints] = useState(() => {
    try {
      const saved = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        return data.totalPoints || 0;
      }
    } catch {}
    return 0;
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        return data.achievements || ACHIEVEMENTS;
      }
    } catch {}
    return ACHIEVEMENTS;
  });

  const [currentLevel, setCurrentLevel] = useState<UserLevel>(() => {
    return LEVELS.reduce((highest, level) =>
      totalPoints >= level.minPoints ? level : highest
    , LEVELS[0]);
  });

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newUnlockedAchievement, setNewUnlockedAchievement] = useState<Achievement | null>(null);

  // Guardar en localStorage
  useEffect(() => {
    const data = {
      totalPoints,
      achievements,
      currentLevel,
    };
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(data));
  }, [totalPoints, achievements, currentLevel]);

  // Verificar si subió de nivel
  useEffect(() => {
    const newLevel = LEVELS.reduce((highest, level) =>
      totalPoints >= level.minPoints ? level : highest
    , LEVELS[0]);

    if (newLevel.level > currentLevel.level) {
      setCurrentLevel(newLevel);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 5000);
    }
  }, [totalPoints, currentLevel.level]);

  // Agregar puntos
  const addPoints = (points: number, reason: string) => {
    setTotalPoints(prev => prev + points);
    console.log(`🎯 +${points} puntos: ${reason}`);
  };

  // Verificar y desbloquear logros
  const checkAchievements = (stats: {
    completedTasks: number;
    currentStreak: number;
    totalTasks: number;
    completionRate: number;
    lastCompletedDate?: string;
  }) => {
    setAchievements(prev => {
      const updated = [...prev];
      let newAchievement: Achievement | null = null;

      // Primer tarea
      if (stats.completedTasks >= 1 && !updated.find(a => a.id === 'first_task')?.unlocked) {
        const achievement = updated.find(a => a.id === 'first_task')!;
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
        newAchievement = achievement;
        addPoints(achievement.points, achievement.title);
      }

      // Racha de 3 días
      if (stats.currentStreak >= 3 && !updated.find(a => a.id === 'streak_3')?.unlocked) {
        const achievement = updated.find(a => a.id === 'streak_3')!;
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
        newAchievement = achievement;
        addPoints(achievement.points, achievement.title);
      }

      // Racha de 7 días
      if (stats.currentStreak >= 7 && !updated.find(a => a.id === 'streak_7')?.unlocked) {
        const achievement = updated.find(a => a.id === 'streak_7')!;
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
        newAchievement = achievement;
        addPoints(achievement.points, achievement.title);
      }

      // 10 tareas
      if (stats.completedTasks >= 10 && !updated.find(a => a.id === 'tasks_10')?.unlocked) {
        const achievement = updated.find(a => a.id === 'tasks_10')!;
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
        newAchievement = achievement;
        addPoints(achievement.points, achievement.title);
      }

      // 50 tareas
      if (stats.completedTasks >= 50 && !updated.find(a => a.id === 'tasks_50')?.unlocked) {
        const achievement = updated.find(a => a.id === 'tasks_50')!;
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
        newAchievement = achievement;
        addPoints(achievement.points, achievement.title);
      }

      // Día perfecto (100% de completion)
      if (stats.completionRate >= 100 && stats.totalTasks > 0 && !updated.find(a => a.id === 'perfect_day')?.unlocked) {
        const achievement = updated.find(a => a.id === 'perfect_day')!;
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
        newAchievement = achievement;
        addPoints(achievement.points, achievement.title);
      }

      // Madrugador (tareas antes de 8 AM)
      const now = new Date();
      const hour = now.getHours();
      if (hour < 8 && stats.completedTasks > 0 && !updated.find(a => a.id === 'early_bird')?.unlocked) {
        // Contar tareas completadas antes de 8 AM
        const earlyBirdTasks = parseInt(localStorage.getItem('early-bird-tasks') || '0');
        if (earlyBirdTasks >= 5) {
          const achievement = updated.find(a => a.id === 'early_bird')!;
          achievement.unlocked = true;
          achievement.unlockedAt = new Date().toISOString();
          newAchievement = achievement;
          addPoints(achievement.points, achievement.title);
        }
      }

      // Búho nocturno (tareas después de 10 PM)
      if (hour >= 22 && stats.completedTasks > 0 && !updated.find(a => a.id === 'night_owl')?.unlocked) {
        const nightOwlTasks = parseInt(localStorage.getItem('night-owl-tasks') || '0');
        if (nightOwlTasks >= 5) {
          const achievement = updated.find(a => a.id === 'night_owl')!;
          achievement.unlocked = true;
          achievement.unlockedAt = new Date().toISOString();
          newAchievement = achievement;
          addPoints(achievement.points, achievement.title);
        }
      }

      if (newAchievement) {
        setNewUnlockedAchievement(newAchievement);
        setTimeout(() => setNewUnlockedAchievement(null), 5000);
      }

      return updated;
    });
  };

  // Obtener puntos para siguiente nivel
  const getPointsToNextLevel = () => {
    const nextLevel = LEVELS.find(level => level.minPoints > totalPoints);
    if (!nextLevel) return { points: 0, percentage: 100 };

    const pointsNeeded = nextLevel.minPoints - totalPoints;
    const currentLevelMin = LEVELS.find(l => l.level === currentLevel.level)?.minPoints || 0;
    const totalLevelPoints = nextLevel.minPoints - currentLevelMin;
    const pointsInCurrentLevel = totalPoints - currentLevelMin;
    const percentage = (pointsInCurrentLevel / totalLevelPoints) * 100;

    return { points: pointsNeeded, percentage };
  };

  // Resetear progreso
  const resetProgress = () => {
    setTotalPoints(0);
    setAchievements(ACHIEVEMENTS);
    setCurrentLevel(LEVELS[0]);
    localStorage.removeItem(GAMIFICATION_STORAGE_KEY);
  };

  return {
    totalPoints,
    currentLevel,
    achievements,
    showLevelUp,
    newUnlockedAchievement,
    addPoints,
    checkAchievements,
    getPointsToNextLevel,
    resetProgress,
  };
};