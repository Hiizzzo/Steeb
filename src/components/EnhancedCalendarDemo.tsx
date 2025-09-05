import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Sun, Moon, Sparkles, Calendar, CheckCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';
import EnhancedCalendar from './EnhancedCalendar';
import TaskCreationCard from './TaskCreationCard';
import { RecurrenceRule } from '@/types';

// Datos de ejemplo para demostrar el calendario
const mockTasks = [
  {
    id: '1',
    title: 'Reunión de equipo',
    type: 'work' as const,
    completed: true,
    scheduledDate: '2024-12-20',
    scheduledTime: '09:00',
    notes: 'Revisar progress del sprint'
  },
  {
    id: '2',
    title: 'Ejercicio matutino',
    type: 'personal' as const,
    completed: true,
    scheduledDate: '2024-12-20',
    scheduledTime: '07:00'
  },
  {
    id: '3',
    title: 'Meditación',
    type: 'meditation' as const,
    completed: false,
    scheduledDate: '2024-12-21',
    scheduledTime: '20:00'
  },
  {
    id: '4',
    title: 'Presentación cliente',
    type: 'work' as const,
    completed: false,
    scheduledDate: '2024-12-22',
    scheduledTime: '14:00'
  },
  {
    id: '5',
    title: 'Compras supermercado',
    type: 'personal' as const,
    completed: false,
    scheduledDate: '2024-12-22',
    scheduledTime: '18:00'
  },
  {
    id: '6',
    title: 'Llamar a mamá',
    type: 'personal' as const,
    completed: true,
    scheduledDate: '2024-12-19',
    scheduledTime: '19:00'
  },
  {
    id: '7',
    title: 'Revisar documentación',
    type: 'work' as const,
    completed: false,
    scheduledDate: '2024-12-23',
    scheduledTime: '10:00'
  },
  {
    id: '8',
    title: 'Yoga',
    type: 'meditation' as const,
    completed: true,
    scheduledDate: '2024-12-18',
    scheduledTime: '08:00'
  }
];

const EnhancedCalendarDemo: React.FC = () => {
  const { currentTheme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState<any[]>(mockTasks as any[]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Configuración personalizable para el demo
  const [animationConfig, setAnimationConfig] = useState({
    monthTransition: 0.4,
    daySelection: 0.3,
    viewModeTransition: 0.5,
    taskIndicator: 0.6,
    highlight: 0.4
  });
  
  const [calendarSettings, setCalendarSettings] = useState({
    enableAnimations: true,
    showTaskIndicators: true,
    autoDetectTheme: true,
    enableMultipleSelection: false
  });
  
  // Estado para el modal de agregar tarea
  const [showTaskCreation, setShowTaskCreation] = useState(false);
  const [selectedDateForTask, setSelectedDateForTask] = useState<string | null>(null);

  const isDark = currentTheme === 'dark';

  // Handlers para el calendario
  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ));
  };

  const handleAddTask = (date?: string) => {
    if (date) {
      localStorage.setItem('stebe-selected-date', date);
    }
    setSelectedDateForTask(date || null);
    setShowTaskCreation(true);
  };

  const handleCancelTaskCreation = () => {
    setShowTaskCreation(false);
    setSelectedDateForTask(null);
    localStorage.removeItem('stebe-selected-date');
  };

  const handleCreateTask = (
    title: string,
    type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra',
    subtasks?: any[],
    scheduledDate?: string,
    scheduledTime?: string,
    notes?: string,
    isPrimary?: boolean,
    recurrence?: RecurrenceRule
  ) => {
    const newTask = {
      id: Date.now().toString(),
      title,
      type,
       completed: false,
      scheduledDate: scheduledDate || selectedDateForTask || new Date().toISOString().split('T')[0],
      scheduledTime,
      notes,
      subtasks,
      tags: isPrimary ? ['principal'] : [],
      recurrence
    };
    setTasks(prev => [...prev, newTask]);
    setShowTaskCreation(false);
    setSelectedDateForTask(null);
    localStorage.removeItem('stebe-selected-date');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const selectedTasks = tasks.filter(task => 
    task.scheduledDate === selectedDate || task.completedDate?.split('T')[0] === selectedDate
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header con controles */}
      <motion.div 
        className={`sticky top-0 z-40 backdrop-blur-lg border-b ${
          isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles size={24} className="text-blue-500" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-white bg-clip-text text-transparent">
                  Enhanced Calendar
                </h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Stebe Calendar Demo
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Toggle tema */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTheme(isDark ? 'light' : 'dark')}
                  className="p-2"
                >
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </Button>
              </motion.div>
              
              {/* Settings */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2"
                >
                  <Settings size={20} />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel de configuración */}
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="lg:col-span-1"
            >
              <Card className={`p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings size={20} className="text-blue-500" />
                  Configuración
                </h3>
                
                <div className="space-y-4">
                  {/* Configuración de animaciones */}
                  <div>
                    <h4 className="font-medium mb-2">Animaciones</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Habilitar animaciones</span>
                        <Switch
                          checked={calendarSettings.enableAnimations}
                          onCheckedChange={(checked) => 
                            setCalendarSettings(prev => ({ ...prev, enableAnimations: checked }))
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Indicadores de tareas</span>
                        <Switch
                          checked={calendarSettings.showTaskIndicators}
                          onCheckedChange={(checked) => 
                            setCalendarSettings(prev => ({ ...prev, showTaskIndicators: checked }))
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-detectar tema</span>
                        <Switch
                          checked={calendarSettings.autoDetectTheme}
                          onCheckedChange={(checked) => 
                            setCalendarSettings(prev => ({ ...prev, autoDetectTheme: checked }))
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Selección múltiple</span>
                        <Switch
                          checked={calendarSettings.enableMultipleSelection}
                          onCheckedChange={(checked) => 
                            setCalendarSettings(prev => ({ ...prev, enableMultipleSelection: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Configuración de tiempos */}
                  <div>
                    <h4 className="font-medium mb-2">Velocidad de animaciones</h4>
                    <div className="space-y-2">
                      {Object.entries(animationConfig).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span>{value}s</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={value}
                            onChange={(e) => setAnimationConfig(prev => ({
                              ...prev,
                              [key]: parseFloat(e.target.value)
                            }))}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
          
          {/* Calendario principal */}
          <motion.div 
            className={showSettings ? "lg:col-span-1" : "lg:col-span-2"}
            layout
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <Card className={`overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <EnhancedCalendar
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onDateSelect={handleDateSelect}
                animationConfig={animationConfig}
                enableAnimations={calendarSettings.enableAnimations}
                showTaskIndicators={calendarSettings.showTaskIndicators}
                autoDetectTheme={calendarSettings.autoDetectTheme}
                enableMultipleSelection={calendarSettings.enableMultipleSelection}
              />
            </Card>
          </motion.div>
          
          {/* Panel de tareas del día seleccionado */}
          <motion.div 
            className="lg:col-span-1"
            layout
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <Card className={`p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={20} className="text-blue-500" />
                <h3 className="text-lg font-semibold">
                  {selectedDate ? (
                    new Date(selectedDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })
                  ) : (
                    'Selecciona una fecha'
                  )}
                </h3>
              </div>
              
              {selectedDate ? (
                <div className="space-y-3">
                  {selectedTasks.length > 0 ? (
                    selectedTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-3 rounded-lg border transition-all ${
                          task.completed
                            ? (isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200')
                            : (isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200')
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggleTask(task.id)}
                            className="mt-1"
                          >
                            {task.completed ? (
                              <CheckCircle size={20} className="text-green-500" />
                            ) : (
                              <div className={`w-5 h-5 rounded-full border-2 ${
                                isDark ? 'border-gray-400' : 'border-gray-300'
                              }`} />
                            )}
                          </motion.button>
                          
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              task.completed ? 'line-through opacity-60' : ''
                            }`}>
                              {task.title}
                            </h4>
                            {task.scheduledTime && (
                              <p className={`text-sm ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {task.scheduledTime}
                              </p>
                            )}
                            <div className={`inline-block px-2 py-1 rounded text-xs mt-1 ${
                              task.type === 'work' 
                                ? 'bg-blue-100 text-blue-800'
                                : task.type === 'personal'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {task.type === 'work' ? 'Trabajo' : 
                               task.type === 'personal' ? 'Personal' : 'Meditación'}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar size={48} className={`mx-auto mb-4 opacity-50 ${
                        isDark ? 'text-gray-600' : 'text-gray-400'
                      }`} />
                      <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        No hay tareas para este día
                      </p>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => handleAddTask(selectedDate)}
                          size="sm"
                          className="gap-2"
                        >
                          <Plus size={16} />
                          Agregar tarea
                        </Button>
                      </motion.div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Calendar size={48} className={`mx-auto mb-4 opacity-50 ${
                      isDark ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                  </motion.div>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    Toca una fecha en el calendario para ver las tareas
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
        
        {/* Estadísticas y características */}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className={`p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className="text-xl font-bold mb-4 text-center">
              ✨ Características implementadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: "🎯",
                  title: "Deslizamiento horizontal",
                  description: "Animación fluida tipo iOS al cambiar mes"
                },
                {
                  icon: "🎪",
                  title: "Efecto rebote",
                  description: "Animación de escala al seleccionar días"
                },
                {
                  icon: "🔄",
                  title: "Transición Mes/Semana",
                  description: "Cambio animado entre vistas con fade + scale"
                },
                {
                  icon: "✨",
                  title: "Indicadores animados",
                  description: "Fade in/scale in para marcadores de tareas"
                },
                {
                  icon: "🎨",
                  title: "Highlight suave",
                  description: "Transición fluida del día seleccionado"
                },
                {
                  icon: "🌙",
                  title: "Modo automático",
                  description: "Tema oscuro/claro con useColorScheme"
                },
                {
                  icon: "⚙️",
                  title: "Personalizable",
                  description: "Configuración de animaciones y colores"
                },
                {
                  icon: "📱",
                  title: "Diseño moderno",
                  description: "UI minimalista inspirada en Stebe"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={`p-4 rounded-lg border transition-all hover:shadow-lg ${
                    isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <h4 className="font-semibold mb-1">{feature.title}</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* TaskCreationCard para agregar tareas */}
      <AnimatePresence>
        {showTaskCreation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <TaskCreationCard
                onCancel={handleCancelTaskCreation}
                onCreate={handleCreateTask}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedCalendarDemo;