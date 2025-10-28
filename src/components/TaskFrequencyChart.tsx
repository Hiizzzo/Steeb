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
  
  const getTaskShapeWithPattern = (type: string, index: number) => {
    const patternColor = isDark ? '#FFFFFF' : '#000000'; // Color del patrón según tema
    const bgColor = isDark ? '#000000' : '#FFFFFF'; // Color de fondo según tema

    // Obtener el patrón para este tipo
    const getPatternForType = (type: string, index: number) => {
      if (isShiny) {
        switch (type) {
          case 'productividad': return '#FF0088';
          case 'salud': return '#8800FF';
          case 'social': return '#4444FF';
          default: return '#FFFFFF';
        }
      }

      if (type === 'social') {
        if (isShiny) return '#4444FF';
        return `
          linear-gradient(45deg, ${patternColor} 25%, transparent 25%),
          linear-gradient(-45deg, ${patternColor} 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, ${patternColor} 75%),
          linear-gradient(-45deg, transparent 75%, ${patternColor} 75%)
        `;
      }
      if (type === 'salud') {
        if (isShiny) return '#8800FF';
        // Patrón de puntos/círculos grandes para Salud
        return `radial-gradient(circle, ${patternColor} 4px, transparent 4px)`;
      }
      if (index === 1) {
        return `repeating-linear-gradient(45deg, ${patternColor}, ${patternColor} 3px, transparent 3px, transparent 8px)`;
      } else if (index === 2) {
        return `repeating-linear-gradient(0deg, ${patternColor}, ${patternColor} 2px, transparent 2px, transparent 6px)`;
      }
      return patternColor; // Sólido para la más frecuente
    };

    const pattern = getPatternForType(type, index);

    switch (type) {
      case 'productividad':
        return (
          <div
            className="w-6 h-6"
            style={{ 
              background: isShiny ? pattern : pattern,
              border: `2px solid ${isDark ? '#FFFFFF' : '#000000'}`
            }}
          />
        );
      case 'salud':
        return (
          <div className="w-6 h-6 relative">
            <svg viewBox="0 0 24 24" className="w-full h-full" className="border-2 border-black dark:border-white">
              <defs>
                <pattern id={`heart-pattern-${index}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  {isShiny ? (
                    <rect width="10" height="10" fill={pattern} />
                  ) : (
                    <>
                      <rect width="10" height="10" fill={isDark ? '#000000' : '#FFFFFF'} />
                      <circle cx="5" cy="5" r="3.5" fill={isDark ? '#FFFFFF' : '#000000'} />
                    </>
                  )}
                </pattern>
              </defs>
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill={`url(#heart-pattern-${index})`}
                stroke={isShiny ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000')}
                strokeWidth="2"
              />
            </svg>
          </div>
        );
      case 'social':
        return (
          <div className="w-6 h-6 relative">
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <defs>
                <pattern id={`triangle-pattern-${index}`} x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                  {isShiny ? (
                    <rect width="12" height="12" fill={pattern} />
                  ) : (
                    <>
                      <rect x="0" y="0" width="6" height="6" fill={isDark ? '#FFFFFF' : '#000000'} />
                      <rect x="6" y="0" width="6" height="6" fill={isDark ? '#000000' : '#FFFFFF'} />
                      <rect x="0" y="6" width="6" height="6" fill={isDark ? '#000000' : '#FFFFFF'} />
                      <rect x="6" y="6" width="6" height="6" fill={isDark ? '#FFFFFF' : '#000000'} />
                    </>
                  )}
                </pattern>
              </defs>
              <path
                d="M12 2 L22 20 L2 20 Z"
                fill={`url(#triangle-pattern-${index})`}
                stroke={isShiny ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000')}
                strokeWidth="2"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className={`w-full p-2 rounded-lg shiny-stats-chart-card -ml-4 mr-auto ${
      isShiny ? 'bg-black' : (isDark ? 'bg-black' : 'bg-white')
    }`}
    style={{
      border: `4px solid ${isShiny ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000')}`,
      boxShadow: isDark && !isShiny ? `0 0 0 4px #FFFFFF, inset 0 0 0 4px #FFFFFF` : 'none'
    }}>
      {/* Título con información de tareas */}
      <div className={`text-center mb-6 pt-2 pb-2 -mx-2 -my-2 ${
        isShiny ? 'bg-black' : (isDark ? 'bg-white' : 'bg-black')
      }`}>
        <h2 className={`text-xl font-bold mb-2 ${
          isShiny ? 'text-black' : (isDark ? 'text-black !important' : 'text-white')
        }`}
        style={{ color: isShiny ? '#000000' : (isDark ? '#000000' : '#FFFFFF') }}>
          Tipo de tareas más completadas
        </h2>
        <p className={`text-sm ${
          isShiny ? 'text-black' : (isDark ? 'text-black !important' : 'text-white')
        }`}
        style={{ color: isShiny ? '#000000' : (isDark ? '#000000' : '#FFFFFF') }}>
          Basado en {frequencyData.reduce((total, item) => total + item.count, 0)} de {tasks.length} tareas completadas
        </p>
      </div>
      
      {/* Barra horizontal con patrones de líneas */}
      <div className={`mb-3 rounded-lg ${
        isShiny ? 'border-2 border-black' : (isDark ? 'border-2 border-white' : 'border-2 border-black')
      }`}>
        <div className={`w-full h-16 flex rounded-lg overflow-hidden ${
          isShiny ? '' : (isDark ? 'bg-black' : 'bg-white')
        }`}>
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
            
            const dividerColor = isShiny ? '#000000' : '#000000'; // Siempre negro excepto shiny
            
            const getShinyBackground = (index: number, type: string) => {
              if (isShiny) {
                // En Shiny, usar segmentos blancos para un look monocromático
                return { backgroundColor: '#FFFFFF' };
              }
              return {};
            };
            
            const getLinePattern = (index: number, type: string) => {
              // Personalizar por tipo para distinguir Social vs Salud
              // Patrones negros en light mode, blancos en dark mode para visibilidad
              const patternColor = isDark ? '#FFFFFF' : '#000000';
              if (type === 'social') {
                // Patrón de ajedrez grande (12px por cuadrado)
                return `
                  linear-gradient(45deg, ${patternColor} 25%, transparent 25%),
                  linear-gradient(-45deg, ${patternColor} 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, ${patternColor} 75%),
                  linear-gradient(-45deg, transparent 75%, ${patternColor} 75%)
                `;
              }
              if (type === 'salud') {
                // Salud: patrón de puntos/círculos
                return `radial-gradient(circle, ${patternColor} 4px, transparent 4px)`;
              }
              if (index === 1) {
                // Segunda: diagonales estándar
                return `repeating-linear-gradient(45deg, ${patternColor}, ${patternColor} 3px, transparent 3px, transparent 8px)`;
              } else if (index === 2) {
                // Tercera: horizontales
                return `repeating-linear-gradient(0deg, ${patternColor}, ${patternColor} 2px, transparent 2px, transparent 6px)`;
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
                  backgroundSize: item.type === 'social' && !isShiny ? '24px 24px' : (item.type === 'salud' && !isShiny ? '20px 20px' : undefined),
                  backgroundPosition: item.type === 'social' && !isShiny ? '0 0, 0 12px, 12px -12px, -12px 0px' : undefined,
                  backgroundColor: (item.type === 'salud' && !isShiny) ? (isDark ? '#FFFFFF' : '#FFFFFF') : undefined, // Fondo blanco para puntos negros
                  borderRight: index < frequencyData.length - 1 ? `2px solid ${dividerColor}` : 'none',
                  ...getShinyBackground(index, item.type)
                }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
              </motion.div>
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
                // Aplicar patrones directamente en las cajas de la leyenda
                if (isShiny) {
                  // En Shiny, usar colores sólidos para las cajas
                  switch (type) {
                    case 'productividad': return { backgroundColor: '#FF0088' };
                    case 'salud': return { backgroundColor: '#8800FF' };
                    case 'social': return { backgroundColor: '#4444FF' };
                    default: return { backgroundColor: '#FFFFFF' };
                  }
                }

                // Comportamiento para modos normal y oscuro - patrones dentro de la caja
                const legendPatternColor = isDark ? '#FFFFFF' : '#000000';
                const legendBgColor = isDark ? '#000000' : '#FFFFFF';
                if (type === 'social') {
                  // Patrón de tablero de ajedrez grande (checkerboard) para social
                  return {
                    backgroundImage: `
                      linear-gradient(45deg, ${legendPatternColor} 25%, transparent 25%),
                      linear-gradient(-45deg, ${legendPatternColor} 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, ${legendPatternColor} 75%),
                      linear-gradient(-45deg, transparent 75%, ${legendPatternColor} 75%)
                    `,
                    backgroundSize: '24px 24px',
                    backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
                    backgroundColor: legendBgColor
                  };
                }
                if (type === 'salud') {
                  // Patrón de puntos/círculos grandes para salud
                  return {
                    backgroundImage: `radial-gradient(circle, ${legendPatternColor} 4px, transparent 4px)`,
                    backgroundSize: '20px 20px',
                    backgroundColor: legendBgColor
                  };
                }
                if (index === 1) {
                  return { backgroundImage: `repeating-linear-gradient(45deg, ${legendPatternColor}, ${legendPatternColor} 3px, transparent 3px, transparent 8px)`, backgroundColor: legendBgColor };
                } else if (index === 2) {
                  return { backgroundImage: `repeating-linear-gradient(0deg, ${legendPatternColor}, ${legendPatternColor} 2px, transparent 2px, transparent 6px)`, backgroundColor: legendBgColor };
                }
                // La más frecuente (index 0) - sólido
                return { backgroundColor: legendPatternColor };
              };
              
              return (
                <motion.div
                  key={item.type}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="relative w-6 h-6 mr-2 flex-shrink-0">
                    {getTaskShapeWithPattern(item.type, index)}
                  </div>
                  <span
                    className={`text-sm ${item.isTop ? 'font-bold' : 'font-medium'}`}
                    style={{
                      color: isShiny ? '#000000' : '#000000' // Siempre negro excepto shiny
                    }}
                  >
                    {item.label}
                  </span>
                  <span className={`text-xs ${isShiny ? 'text-black' : 'text-gray-600 dark:text-gray-400'}`}>
                    {labels[index]} ({item.count} tareas, {item.percentage.toFixed(1)}%)
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
          <p className={`${isShiny ? 'text-black' : 'text-gray-500 dark:text-gray-400'}`}>
            No hay tareas completadas en este período
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskFrequencyChart;
