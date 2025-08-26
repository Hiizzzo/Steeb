import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra';
  completed: boolean;
  completedDate?: string;
}

interface TaskFrequencyChartProps {
  tasks: Task[];
  period: 'week' | 'month' | 'year';
  isDark?: boolean;
}

const TaskFrequencyChart: React.FC<TaskFrequencyChartProps> = ({ tasks, period, isDark = false }) => {
  const frequencyData = useMemo(() => {
    // Filtrar tareas completadas según el período
    const now = new Date();
    let startDate: Date;
    
    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }
    
    const filteredTasks = tasks.filter(task => {
      if (!task.completed || !task.completedDate) return false;
      const taskDate = new Date(task.completedDate);
      return taskDate >= startDate && taskDate <= now;
    });
    
    // Contar tareas por tipo
    const taskCounts: Record<string, number> = {};
    filteredTasks.forEach(task => {
      taskCounts[task.type] = (taskCounts[task.type] || 0) + 1;
    });
    
    // Convertir a array y ordenar por frecuencia - SOLO LOS 3 MÁS FRECUENTES
    const sortedTypes = Object.entries(taskCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3); // Solo los 3 más frecuentes
    
    const typeLabels = {
      'productividad': 'Productividad',
      'creatividad': 'Creatividad',
      'aprendizaje': 'Aprendizaje',
      'organizacion': 'Organización',
      'salud': 'Salud',
      'social': 'Social',
      'entretenimiento': 'Entretenimiento',
      'extra': 'Extra'
    };
    
    const total = sortedTypes.reduce((sum, [, count]) => sum + count, 0);
    
    return sortedTypes.map(([type, count], index) => ({
      type,
      label: typeLabels[type as keyof typeof typeLabels] || type,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      isTop: index === 0 // El primero es el más realizado
    }));
  }, [tasks, period]);
  
  // Colores de escala de grises (de negro a blanco)
  const grayScale = [
    '#000000', // Negro - Muy alta
    '#404040', // Gris oscuro - Alta  
    '#808080', // Gris medio - Media
    '#C0C0C0', // Gris claro - Baja
    '#FFFFFF'  // Blanco - Muy baja
  ];
  
  const levels = ['Muy alta', 'Alta', 'Media', 'Baja', 'Muy baja'];
  
  return (
    <div className="w-full bg-white dark:bg-black p-6 rounded-lg">
      {/* Título con información de tareas */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-black dark:text-white mb-2">
          Tipo de tareas más completadas
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Basado en {frequencyData.reduce((total, item) => total + item.count, 0)} de {tasks.length} tareas completadas
        </p>
      </div>
      
      {/* Barra horizontal con patrones de líneas */}
      <div className="mb-6">
        <div className="w-full h-16 rounded-lg overflow-hidden border-2 border-black dark:border-white flex">
          {frequencyData.map((item, index) => {
            // Diferentes patrones de líneas para cada segmento
            const getPattern = (index: number) => {
              if (index === 0) {
                // Más frecuente: sólido negro
                return 'bg-black dark:bg-white';
              } else if (index === 1) {
                // Segunda: líneas diagonales
                return 'bg-white dark:bg-black';
              } else {
                // Tercera: líneas horizontales
                return 'bg-white dark:bg-black';
              }
            };
            
            const getLinePattern = (index: number, type: string) => {
              // Personalizar por tipo para distinguir Social vs Salud
              // Social: 45deg, Salud: -45deg, otros mantienen lógica por índice
              const color = isDark ? '#ffffff' : '#000000';
              if (type === 'social') {
                return `repeating-linear-gradient(45deg, ${color}, ${color} 3px, transparent 3px, transparent 8px)`;
              }
              if (type === 'salud') {
                return `repeating-linear-gradient(-45deg, ${color}, ${color} 3px, transparent 3px, transparent 8px)`;
              }
              if (index === 1) {
                // Segunda: diagonales estándar
                return `repeating-linear-gradient(45deg, ${color}, ${color} 3px, transparent 3px, transparent 8px)`;
              } else if (index === 2) {
                // Tercera: horizontales
                return `repeating-linear-gradient(0deg, ${color}, ${color} 2px, transparent 2px, transparent 6px)`;
              }
              return undefined;
            };
            
            return (
              <motion.div
                key={item.type}
                className={`flex items-center justify-center relative ${getPattern(index)}`}
                style={{ 
                  width: `${item.percentage}%`,
                  backgroundImage: getLinePattern(index, item.type),
                  borderRight: index < frequencyData.length - 1 ? `2px solid ${isDark ? '#ffffff' : '#000000'}` : 'none'
                }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                {/* Indicador para el más frecuente */}
                {item.isTop && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      isDark ? 'border-black bg-black' : 'border-white bg-white'
                    } animate-pulse`} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        {/* Etiquetas de los 3 tipos */}
        <div className="flex mt-4">
          {frequencyData.map((item, index) => (
            <div 
              key={item.type} 
              className="text-center px-1"
              style={{ width: `${item.percentage}%` }}
            >
              <span className={`text-sm text-black dark:text-white ${
                item.isTop ? 'font-bold' : 'font-medium'
              }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Leyenda con patrones de líneas */}
      {frequencyData.length > 0 && (
        <div className="mb-4">
          <div className="space-y-3">
            {frequencyData.map((item, index) => {
              const labels = ['Más realizada', 'Segunda más realizada', 'Tercera más realizada'];
              
              const getPatternBox = (index: number) => {
                if (index === 0) {
                  return 'bg-black dark:bg-white';
                } else if (index === 1) {
                  return 'bg-white dark:bg-black';
                } else {
                  return 'bg-white dark:bg-black';
                }
              };
              
              const getPatternStyle = (index: number, type: string) => {
                const color = isDark ? '#ffffff' : '#000000';
                if (type === 'social') {
                  return { backgroundImage: `repeating-linear-gradient(45deg, ${color}, ${color} 2px, transparent 2px, transparent 6px)` };
                }
                if (type === 'salud') {
                  return { backgroundImage: `repeating-linear-gradient(-45deg, ${color}, ${color} 2px, transparent 2px, transparent 6px)` };
                }
                if (index === 1) {
                  return { backgroundImage: `repeating-linear-gradient(45deg, ${color}, ${color} 2px, transparent 2px, transparent 6px)` };
                } else if (index === 2) {
                  return { backgroundImage: `repeating-linear-gradient(0deg, ${color}, ${color} 2px, transparent 2px, transparent 5px)` };
                }
                return {};
              };
              
              return (
                <motion.div
                  key={item.type}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div 
                    className={`w-5 h-5 border-2 border-black dark:border-white ${getPatternBox(index)}`}
                    style={getPatternStyle(index, item.type)}
                  />
                  <span className={`text-sm text-black dark:text-white ${item.isTop ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    - {labels[index]} ({item.count} tareas, {item.percentage.toFixed(1)}%)
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Mensaje cuando no hay datos */}
      {frequencyData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No hay tareas completadas en este período
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskFrequencyChart;
