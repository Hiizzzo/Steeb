import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CategoryCard from './CategoryCard';
import { Task } from '@/types';
import { useTaskStore } from '@/store/useTaskStore';
import { useTheme } from '@/hooks/useTheme';

interface CategoryGridProps {
  onCategoryClick?: (type: Task['type']) => void;
  showTaskCounts?: boolean;
  className?: string;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({
  onCategoryClick,
  showTaskCounts = true,
  className = ''
}) => {
  const navigate = useNavigate();
  const { tasks } = useTaskStore();
  const { currentTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<Task['type'] | null>(null);

  // Orden de categorías según el Index.tsx
  const categories: Array<Task['type']> = [
    'productividad',
    'organizacion',
    'aprendizaje',
    'creatividad',
    'salud',
    'social',
    'entretenimiento',
    'extra'
  ];

  // Configuración para responsive grid
  const gridClasses = currentTheme === 'mobile'
    ? 'grid-cols-2 gap-3'
    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';

  const handleCategoryClick = (type: Task['type']) => {
    setSelectedCategory(type);

    // Pequeña animación de feedback
    setTimeout(() => {
      setSelectedCategory(null);
    }, 200);

    // Ejecutar callback o navegación
    if (onCategoryClick) {
      onCategoryClick(type);
    } else {
      // Navegación por defecto a la página de estadísticas de esa categoría
      navigate(`/productividad?type=${type}`);
    }
  };

  // Animación de entrada para las tarjetas
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
          Categorías
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Organiza tus tareas por categorías
        </p>
      </div>

      {/* Grid de categorías */}
      <motion.div
        className={`grid ${gridClasses}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {categories.map((type, index) => {
            // Contar tareas para esta categoría
            const taskCount = tasks.filter(task => task.type === type).length;

            return (
              <motion.div
                key={type}
                variants={itemVariants}
                layout
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  transition: { duration: 0.2 }
                }}
              >
                <CategoryCard
                  type={type}
                  count={taskCount}
                  onClick={() => handleCategoryClick(type)}
                  className={`
                    ${selectedCategory === type ? 'ring-2 ring-blue-500 scale-105' : ''}
                    transition-all duration-200
                  `}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Resumen de estadísticas */}
      {showTaskCounts && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total de tareas activas:
            </div>
            <div className="text-lg font-bold text-black dark:text-white">
              {tasks.filter(task => !task.completed).length}
            </div>
          </div>

          {/* Mini barras de progreso por categoría */}
          <div className="mt-3 space-y-2">
            {categories.slice(0, 4).map(type => {
              const count = tasks.filter(task => task.type === type).length;
              const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;

              return (
                <div key={type} className="flex items-center space-x-2">
                  <div className="w-4 text-center">
                    {type === 'productividad' && '🚀'}
                    {type === 'organizacion' && '📋'}
                    {type === 'aprendizaje' && '📚'}
                    {type === 'creatividad' && '🎨'}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                    />
                  </div>
                  <div className="w-8 text-xs text-gray-600 dark:text-gray-400 text-right">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CategoryGrid;