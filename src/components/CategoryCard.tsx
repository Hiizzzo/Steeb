import React from 'react';
import { motion } from 'framer-motion';
import { Task } from '@/types';
import { useTaskStore } from '@/store/useTaskStore';

interface CategoryCardProps {
  type: Task['type'];
  title: string;
  image?: string;
  count?: number;
  onClick?: () => void;
  className?: string;
}

// Mapeo de tipos a imágenes y colores
const CATEGORY_CONFIG = {
  productividad: {
    title: 'Productividad',
    image: '🚀', // Cohete -象征着生产力和进步
    color: 'bg-blue-500',
    gradient: 'from-blue-400 to-blue-600'
  },
  organizacion: {
    title: 'Organización',
    image: '📋', // Lista/板 -代表组织和管理
    color: 'bg-green-500',
    gradient: 'from-green-400 to-green-600'
  },
  aprendizaje: {
    title: 'Aprendizaje',
    image: '📚', // Libros -代表学习和知识
    color: 'bg-purple-500',
    gradient: 'from-purple-400 to-purple-600'
  },
  creatividad: {
    title: 'Creatividad',
    image: '🎨', // Paleta -代表创意和艺术
    color: 'bg-pink-500',
    gradient: 'from-pink-400 to-pink-600'
  },
  salud: {
    title: 'Salud',
    image: '❤️', // Corazón -代表健康和关怀
    color: 'bg-red-500',
    gradient: 'from-red-400 to-red-600'
  },
  social: {
    title: 'Social',
    image: '👥', // Personas -代表社交和关系
    color: 'bg-yellow-500',
    gradient: 'from-yellow-400 to-yellow-600'
  },
  entretenimiento: {
    title: 'Entretenimiento',
    image: '🎮', // Control de juego -代表娱乐和休闲
    color: 'bg-indigo-500',
    gradient: 'from-indigo-400 to-indigo-600'
  },
  extra: {
    title: 'Extra',
    image: '⭐', // Estrella -代表额外的特殊任务
    color: 'bg-orange-500',
    gradient: 'from-orange-400 to-orange-600'
  }
};

const CategoryCard: React.FC<CategoryCardProps> = ({
  type,
  title,
  image,
  count = 0,
  onClick,
  className = ''
}) => {
  const { tasks } = useTaskStore();
  const config = CATEGORY_CONFIG[type] || CATEGORY_CONFIG.extra;
  const displayImage = image || config.image;
  const displayTitle = title || config.title;

  // Calcular tareas de este tipo
  const taskCount = tasks.filter(task => task.type === type).length;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative bg-white dark:bg-black rounded-xl border-2 border-black dark:border-white
        shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer
        overflow-hidden group
        ${className}
      `}
    >
      {/* Contenedor principal con imagen a la izquierda */}
      <div className="flex items-center p-4 space-x-4">
        {/* Imagen/Categoría Icon - Posicionada a la izquierda */}
        <div className={`
          flex-shrink-0 w-16 h-16 rounded-lg
          bg-gradient-to-br ${config.gradient}
          flex items-center justify-center
          text-2xl
          shadow-md
          group-hover:scale-110 transition-transform duration-200
        `}>
          {displayImage}
        </div>

        {/* Contenido de la categoría */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-black dark:text-white mb-1 truncate">
            {displayTitle}
          </h3>

          {/* Contador de tareas */}
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {taskCount} {taskCount === 1 ? 'tarea' : 'tareas'}
            </div>

            {taskCount > 0 && (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            )}
          </div>
        </div>

        {/* Indicador visual */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600
                         flex items-center justify-center group-hover:border-black
                         dark:group-hover:border-white transition-colors duration-200">
            <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
          </div>
        </div>
      </div>

      {/* Barra de progreso sutil */}
      {taskCount > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (taskCount / 10) * 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`
              h-full bg-gradient-to-r ${config.gradient}
            `}
          />
        </div>
      )}

      {/* Efecto hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent
                      via-white/5 to-transparent opacity-0 group-hover:opacity-100
                      transition-opacity duration-200" />
    </motion.div>
  );
};

export default CategoryCard;