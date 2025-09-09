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
  const isShiny = document.documentElement.classList.contains('shiny');
  // Colores rosa, violeta y azul para mejor visualización
  const rainbowColors = [
    '#FF0088', // Rosa vibrante
    '#8800FF', // Violeta vibrante
    '#4444FF'  // Azul vibrante
  ];
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
  
  const getTaskShape = (type: string) => {
    // Color dinámico de la forma:
    // - Versión blanca (no-shiny): negro en modo claro y blanco en modo oscuro
    // - Versión shiny: colores vibrantes por categoría
    const getShapeColor = (t: string) => {
      if (isShiny) {
        switch (t) {
          case 'productividad':
            return '#FF0088'; // Rosa
          case 'salud':
            return '#8800FF'; // Violeta
          case 'social':
            return '#4444FF'; // Azul
          default:
            return '#FFFFFF'; // Fallback en shiny
        }
      }
      return isDark ? '#FFFFFF' : '#000000';
    };

    const color = getShapeColor(type);

    switch (type) {
      case 'productividad':
        return (
          <div 
            className="w-4 h-4 mr-2 flex-shrink-0" 
            style={{ backgroundColor: color }}
          />
        );
      case 'salud':
        return (
          <div className="w-4 h-4 mr-2 flex-shrink-0 relative">
            <svg viewBox="0 0 24 24" className="w-full h-full" fill={color}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        );
      case 'social':
        return (
          <div className="w-4 h-4 mr-2 flex-shrink-0 relative">
            <svg viewBox="0 0 24 24" className="w-full h-full" fill={color}>
              <path d="M12 2 L22 20 L2 20 Z"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className={`w-full p-6 rounded-lg ${
      isShiny ? 'bg-white border border-gray-200' : 'bg-white dark:bg-black'
    }`}>
      {/* Título con información de tareas */}
      <div className="text-center mb-6">
        <h2 className={`text-xl font-bold mb-2 ${
          isShiny ? (isDark ? 'text-white' : 'text-black') : 'text-black dark:text-white'
        }`}>
          Tipo de tareas más completadas
        </h2>
        <p className={`text-sm ${
          isShiny ? 'text-white' : 'text-gray-600 dark:text-gray-400'
        }`}>
          Basado en {frequencyData.reduce((total, item) => total + item.count, 0)} de {tasks.length} tareas completadas
        </p>
      </div>
      
      {/* Barra horizontal con patrones de líneas */}
      <div className="mb-6">
        <div className="w-full h-16 rounded-lg overflow-hidden border-2 border-black dark:border-white flex">
          {frequencyData.map((item, index) => {
            // Diferentes patrones de líneas para cada segmento
            const getPattern = (index: number) => {
              if (isShiny) {
                // En versión shiny, usar colores vibrantes sólidos
                return '';
              }
              if (index === 0) {
                // Más frecuente: sólido blanco en ambos temas
                return 'bg-white';
              } else if (index === 1) {
                // Segunda: líneas diagonales
                return 'bg-white dark:bg-black';
              } else {
                // Tercera: líneas horizontales
                return 'bg-white dark:bg-black';
              }
            };
            
            const dividerColor = isDark ? '#ffffff' : '#000000';
            
            const getShinyBackground = (index: number, type: string) => {
              if (isShiny) {
                // Usar colores del arcoíris basados en el índice
                return { backgroundColor: rainbowColors[index % rainbowColors.length] };
              }
              return {};
            };
            
            const getLinePattern = (index: number, type: string) => {
              // Personalizar por tipo para distinguir Social vs Salud
              // Social: 45deg, Salud: -45deg, otros mantienen lógica por índice
              const color = isDark ? '#ffffff' : '#000000';
              if (type === 'social') {
                return `repeating-linear-gradient(45deg, ${color}, ${color} 3px, transparent 3px, transparent 8px)`;
              }
              if (type === 'salud') {
                // Patrón cuadriculado para salud
                return `
                  repeating-linear-gradient(
                    0deg,
                    transparent 0px,
                    transparent 8px,
                    ${color} 8px,
                    ${color} 9px,
                    transparent 9px,
                    transparent 17px
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent 0px,
                    transparent 8px,
                    ${color} 8px,
                    ${color} 9px,
                    transparent 9px,
                    transparent 17px
                  )
                `;
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
                  backgroundImage: isShiny ? 'none' : getLinePattern(index, item.type),
                  borderRight: index < frequencyData.length - 1 ? `2px solid ${dividerColor}` : 'none',
                  ...getShinyBackground(index, item.type)
                }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                {/* Indicador para el más frecuente - sin animación molesta */}
                {item.isTop && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      isShiny ? 'border-white bg-white shadow-lg' : (isDark ? 'border-white bg-white' : 'border-black bg-black')
                    }`} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        {/* Etiquetas de los 3 tipos */}
        <div className="flex mt-4">
          {frequencyData.map((item, index) => {
            // Definir colores específicos para cada categoría
            const getCategoryColor = (type: string) => {
                if (isShiny) {
                  switch (type) {
                    case 'productividad': return '#FF0088'; // Rosa
                    case 'salud': return '#8800FF'; // Violeta
                    case 'social': return '#4444FF'; // Azul
                    default: return '#FFFFFF'; // Blanco por defecto en shiny
                  }
                } else {
                  // En modo no-shiny (versión blanca), todos los textos son negros
                  return isDark ? '#FFFFFF' : '#000000';
                }
              };
              

            
            return (
              <div 
                key={item.type} 
                className="text-center px-1 flex flex-col items-center"
                style={{ width: `${item.percentage}%` }}
              >
                <div className="flex items-center justify-center mb-1">
                  {getTaskShape(item.type)}
                </div>
                <span 
                  className={`text-sm ${
                    item.isTop ? 'font-bold' : 'font-medium'
                  }`}
                  style={{ color: getCategoryColor(item.type) }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Leyenda con patrones de líneas */}
      {frequencyData.length > 0 && (
        <div className="mb-4">
          <div className="space-y-3">
            {frequencyData.map((item, index) => {
              const labels = ['Más realizada', 'Segunda más realizada', 'Tercera más realizada'];
              
              const getPatternBox = (index: number) => {
                // Solo en modo shiny no necesitamos clases de fondo
                if (isShiny) {
                  return '';
                }
                
                // Comportamiento para modos normal y oscuro
                if (index === 0) {
                  return 'bg-white';
                } else if (index === 1) {
                  return 'bg-white dark:bg-black';
                } else {
                  return 'bg-white dark:bg-black';
                }
              };
              
              const getPatternStyle = (index: number, type: string) => {
                // Solo aplicar colores específicos en modo shiny
                if (isShiny) {
                  // Usar colores específicos para cada tipo de tarea
                  if (type === 'productividad') {
                    return { backgroundColor: '#FF0088' }; // Rosa
                  }
                  if (type === 'salud') {
                    return { backgroundColor: '#8800FF' }; // Violeta
                  }
                  if (type === 'social') {
                    return { backgroundColor: '#4444FF' }; // Azul
                  }
                  // Para otros tipos, usar colores del arcoíris basados en el índice
                  return { backgroundColor: rainbowColors[index % rainbowColors.length] };
                }
                
                // Comportamiento original para modos normal y oscuro
                const color = isDark ? '#ffffff' : '#000000';
                if (type === 'social') {
                  return { backgroundImage: `repeating-linear-gradient(45deg, ${color}, ${color} 2px, transparent 2px, transparent 6px)` };
                }
                if (type === 'salud') {
                  // Patrón cuadriculado para salud en la leyenda
                  return { 
                    backgroundImage: `
                      repeating-linear-gradient(
                        0deg,
                        transparent 0px,
                        transparent 5px,
                        ${color} 5px,
                        ${color} 6px,
                        transparent 6px,
                        transparent 11px
                      ),
                      repeating-linear-gradient(
                        90deg,
                        transparent 0px,
                        transparent 5px,
                        ${color} 5px,
                        ${color} 6px,
                        transparent 6px,
                        transparent 11px
                      )
                    `
                  };
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
                    className={`w-5 h-5 ${isShiny ? 'rounded-sm border-2 border-black' : 'border-2 border-black dark:border-white'} ${getPatternBox(index)}`}
                    style={getPatternStyle(index, item.type)}
                  />
                  {getTaskShape(item.type)}
                  <span 
                    className={`text-sm ${item.isTop ? 'font-bold' : 'font-medium'}`}
                    style={{ 
                      color: isShiny ? (
                        item.type === 'productividad' ? '#FF0088' : 
                        item.type === 'salud' ? '#8800FF' : 
                        item.type === 'social' ? '#4444FF' : 
                        '#FFFFFF'
                      ) : (isDark ? '#ffffff' : '#000000')
                    }}
                  >
                    {item.label}
                  </span>
                  <span className={`text-xs ${isShiny ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
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
          <p className={`${isShiny ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            No hay tareas completadas en este período
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskFrequencyChart;
