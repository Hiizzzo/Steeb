// ============================================================================
// GAMIFICATION PANEL - INTERFAZ DE PUNTOS, NIVELES Y LOGROS
// ============================================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGamification } from '@/hooks/useGamification';
import { Trophy, Star, Target, Zap } from 'lucide-react';

interface GamificationPanelProps {
  stats?: {
    completedTasks: number;
    currentStreak: number;
    totalTasks: number;
    completionRate: number;
  };
}

export const GamificationPanel: React.FC<GamificationPanelProps> = ({ stats }) => {
  const {
    totalPoints,
    currentLevel,
    achievements,
    showLevelUp,
    newUnlockedAchievement,
    getPointsToNextLevel,
  } = useGamification();

  const { points: pointsToNext, percentage } = getPointsToNextLevel();
  const unlockedAchievements = achievements.filter(a => a.unlocked);

  React.useEffect(() => {
    if (stats) {
      // Verificar logros cuando cambian las estadísticas
      // Esto se llamaría desde el componente principal
    }
  }, [stats]);

  return (
    <>
      {/* Notificación de subida de nivel */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed top-20 right-4 z-50 max-w-sm"
          >
            <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🎉</div>
                  <div>
                    <h3 className="font-bold text-lg">¡Subiste de Nivel!</h3>
                    <p className="text-sm opacity-90">
                      Ahora eres {currentLevel.title} - Nivel {currentLevel.level}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notificación de logro desbloqueado */}
      <AnimatePresence>
        {newUnlockedAchievement && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.8 }}
            className="fixed top-20 left-4 z-50 max-w-sm"
          >
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{newUnlockedAchievement.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg">¡Logro Desbloqueado!</h3>
                    <p className="text-sm opacity-90">
                      {newUnlockedAchievement.title}
                    </p>
                    <p className="text-xs opacity-80">
                      +{newUnlockedAchievement.points} puntos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel principal de gamificación */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Progreso y Logros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nivel actual */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentLevel.color }}
              />
              <span className="font-medium">Nivel {currentLevel.level}</span>
              <Badge
                variant="secondary"
                style={{ backgroundColor: currentLevel.color + '20', color: currentLevel.color }}
              >
                {currentLevel.title}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-lg">{totalPoints}</span>
              <span className="text-sm text-muted-foreground">puntos</span>
            </div>
          </div>

          {/* Barra de progreso al siguiente nivel */}
          {pointsToNext > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progreso al siguiente nivel</span>
                <span>{pointsToNext} puntos restantes</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          )}

          {/* Logros desbloqueados */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Logros ({unlockedAchievements.length}/{achievements.length})</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <div
                    className={`
                      p-2 rounded-lg text-center border transition-all
                      ${achievement.unlocked
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200 opacity-50'
                      }
                    `}
                  >
                    <div className="text-2xl mb-1">{achievement.icon}</div>
                    <div className="text-xs font-medium">{achievement.title}</div>
                    <div className="text-xs text-muted-foreground">
                      +{achievement.points} pts
                    </div>
                  </div>

                  {/* Indicador de logro desbloqueado */}
                  {achievement.unlocked && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <Target className="w-2 h-2 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Estadísticas adicionales */}
          <div className="pt-3 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Logros desbloqueados</span>
              <span className="font-medium">{unlockedAchievements.length} / {achievements.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso total</span>
              <span className="font-medium">
                {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};