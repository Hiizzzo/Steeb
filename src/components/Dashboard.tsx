import React from 'react';
import { motion } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuth } from '@/hooks/useAuth';
import {
  Calendar,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  Circle,
  BarChart3,
  Users,
  Zap
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { stats, tasks, getPendingTasks, getCompletedTasks } = useTaskStore();
  const { user } = useAuth();

  const pendingTasks = getPendingTasks();
  const completedTasks = getCompletedTasks();

  // Stats para el dashboard
  const todayStats = {
    total: tasks.filter(t => {
      const taskDate = new Date(t.createdAt).toDateString();
      const today = new Date().toDateString();
      return taskDate === today;
    }).length,
    completed: completedTasks.filter(t => {
      const taskDate = new Date(t.completedAt || t.createdAt).toDateString();
      const today = new Date().toDateString();
      return taskDate === today;
    }).length,
    pending: pendingTasks.length
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-black dark:text-white mb-2">
            {user?.nickname ? `Hola, ${user.nickname}` : 'Hola!'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-black dark:text-white" />
              <span className="text-2xl font-bold text-black dark:text-white">
                {todayStats.total}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-black dark:text-white uppercase tracking-wider">
              Tareas Hoy
            </h3>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {todayStats.completed}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-black dark:text-white uppercase tracking-wider">
              Completadas
            </h3>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">
                {todayStats.pending}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-black dark:text-white uppercase tracking-wider">
              Pendientes
            </h3>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                {stats.currentStreak}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-black dark:text-white uppercase tracking-wider">
              Racha Actual
            </h3>
          </motion.div>
        </div>

        {/* Recent Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-6 rounded-xl"
          >
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4 flex items-center">
              <Circle className="w-6 h-6 mr-2" />
              Tareas Pendientes
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-gray-50 dark:bg-gray-900 border-l-4 border-black dark:border-white rounded"
                >
                  <p className="font-semibold text-black dark:text-white">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {task.category || 'Sin categoría'}
                  </p>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  ¡No tenés tareas pendientes! 🎉
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-6 rounded-xl"
          >
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4 flex items-center">
              <CheckCircle2 className="w-6 h-6 mr-2" />
              Completadas Recientes
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {completedTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600 rounded"
                >
                  <p className="font-semibold text-black dark:text-white line-through">
                    {task.title}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {task.completedAt && new Date(task.completedAt).toLocaleString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
              {completedTasks.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Empezá a completar tareas para verlas aquí
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white dark:bg-black border-2 border-black dark:border-white p-6 rounded-xl"
        >
          <h2 className="text-2xl font-bold text-black dark:text-white mb-4 flex items-center">
            <Zap className="w-6 h-6 mr-2" />
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              <Calendar className="w-6 h-6 mb-2 mx-auto" />
              <span className="text-sm">Ver Calendario</span>
            </button>
            <button className="p-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              <BarChart3 className="w-6 h-6 mb-2 mx-auto" />
              <span className="text-sm">Estadísticas</span>
            </button>
            <button className="p-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              <Users className="w-6 h-6 mb-2 mx-auto" />
              <span className="text-sm">Social</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;