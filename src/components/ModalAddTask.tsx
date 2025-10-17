// ============================================================================
// MODAL ADD TASK - CREATE & EDIT TASKS
// ============================================================================
// ⚠️ APP REVIEW NOTE: This component implements core task creation functionality
// Users can create tasks with title, type, subtasks, scheduled date/time, and notes
// All data is stored locally - no external services involved
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, Briefcase, Brain, Save, Plus, Check, ChevronRight, Sparkles, Send } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import geminiService from '@/services/geminiService';

import { dailyTasks, DailyTask } from '@/data/dailyTasks';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  notes?: string;
}

interface ModalAddTaskProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (title: string, type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string, notes?: string) => void;
  editingTask?: Task;
}

const ModalAddTask: React.FC<ModalAddTaskProps> = ({ isOpen, onClose, onAddTask, editingTask }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedList, setSelectedList] = useState('Tareas');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [hasDate, setHasDate] = useState(false);
  const [hasTime, setHasTime] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>(['']);
  const { toast } = useToast();
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const [isAddingDaily, setIsAddingDaily] = useState(false);
  const [currentTasks, setCurrentTasks] = useState<DailyTask[]>(dailyTasks);
  const [aiMode, setAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Cargar tareas personalizadas
  useEffect(() => {
    const saved = localStorage.getItem('stebe-custom-daily-tasks');
    if (saved) {
      setCurrentTasks(JSON.parse(saved));
    }
  }, []);

  // Poblar campos cuando se está editando una tarea
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setNotes(editingTask.notes || '');
      
      // Mapear el tipo de tarea al selectedList
      setSelectedList('Tareas');

      // Configurar fecha si existe
      if (editingTask.scheduledDate) {
        setSelectedDate(new Date(editingTask.scheduledDate));
        setHasDate(true);
      } else {
        setSelectedDate(undefined);
        setHasDate(false);
      }

      // Configurar hora si existe
      if (editingTask.scheduledTime) {
        setSelectedTime(editingTask.scheduledTime);
        setHasTime(true);
      } else {
        setSelectedTime('');
        setHasTime(false);
      }

      // Configurar subtareas si existen
      if (editingTask.subtasks && editingTask.subtasks.length > 0) {
        setSubtasks(editingTask.subtasks.map(subtask => subtask.title));
      } else {
        setSubtasks(['']);
      }
    } else {
      // Resetear campos cuando no hay tarea en edición
      setTitle('');
      setNotes('');
      setSelectedList('Tareas');
      setSelectedDate(undefined);
      setSelectedTime('');
      setHasDate(false);
      setHasTime(false);
      setSubtasks(['']);
    }
  }, [editingTask]);

  // Verificar fecha pre-seleccionada del calendario
  useEffect(() => {
    if (isOpen && !editingTask) {
      const preSelectedDate = localStorage.getItem('stebe-selected-date');
      if (preSelectedDate) {
        setSelectedDate(new Date(preSelectedDate));
        setHasDate(true);
        // No eliminar aquí, lo elimina el Index
      }
    }
  }, [isOpen, editingTask]);

  const handleAddDailyTasks = async () => {
    // Verificar autenticación antes de crear tareas
    if (!isAuthenticated || !user) {
      toast({
        title: "Se requiere autenticación",
        description: "Debes iniciar sesión para crear tareas",
        variant: "destructive"
      });
      return;
    }

    setIsAddingDaily(true);
    
    // Mensaje inicial de Steve
    toast({
      title: "¡Steve dice:",
      description: "¡Perfecto! Voy a añadir tus tareas diarias. ¡Es hora de ser productivo! 💪",
    });

    // Añadir cada tarea con un pequeño delay para crear efecto de "pensamiento"
    for (let i = 0; i < currentTasks.length; i++) {
      const task = currentTasks[i];
      
      // Convertir subtareas al formato esperado
      const taskSubtasks: SubTask[] = task.subtasks?.map((subtask, index) => ({
        id: `${Date.now()}-${i}-${index}`,
        title: subtask,
        completed: false
      })) || [];

      // Añadir la tarea
      onAddTask(
        task.title,
        'productividad', // Mapear a un tipo válido
        taskSubtasks.length > 0 ? taskSubtasks : undefined,
        new Date().toISOString().split('T')[0], // Hoy
        task.scheduledTime,
        undefined // notes
      );

      // Eliminado delay innecesario para creación instantánea
    }

    // Mensaje final motivacional inmediato
    toast({
      title: "¡Steve dice:",
      description: `¡Listo! He añadido ${currentTasks.length} tareas diarias. ¡Tú puedes con todo! 🚀`,
    });

    setIsAddingDaily(false);
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    // Verificar autenticación antes de crear tareas
    if (!isAuthenticated || !user) {
      toast({
        title: "Se requiere autenticación",
        description: "Debes iniciar sesión para crear tareas",
        variant: "destructive"
      });
      return;
    }

    if (title.trim()) {
      const validSubtasks = subtasks
        .filter(s => s.trim())
        .map((s, index) => ({
          id: `${Date.now()}-${index}`,
          title: s.trim(),
          completed: false
        }));
      
      const scheduledDate = hasDate && selectedDate ? selectedDate.toISOString().split('T')[0] : undefined;
      
      // Map list to type for new system
      const taskType = 'productividad'; // Usar tipo por defecto
      
      onAddTask(
        title.trim(),
        taskType,
        validSubtasks.length > 0 ? validSubtasks : undefined,
        scheduledDate,
        hasTime ? selectedTime : undefined,
        notes.trim() || undefined
      );
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setSelectedList('Tareas');
    setSelectedDate(undefined);
    setSelectedTime('');
    setHasDate(false);
    setHasTime(false);
    setSubtasks(['']);
    setAiMode(false);
    setAiPrompt('');
  };

  const handleGenerateWithAI = async () => {
    // Verificar autenticación antes de crear tareas
    if (!isAuthenticated || !user) {
      toast({
        title: "Se requiere autenticación",
        description: "Debes iniciar sesión para crear tareas con IA",
        variant: "destructive"
      });
      return;
    }

    if (!aiPrompt.trim()) {
      toast({
        title: "Escribe algo primero",
        description: "Cuéntame qué necesitas hacer y crearé las tareas por ti",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAI(true);

    try {
      // Verificar si gemini está listo
      if (!geminiService.isReady()) {
        await geminiService.initialize();
      }

      const taskPrompt = `Como asistente de productividad STEEB, analiza esta solicitud del usuario y genera tareas específicas y accionables en español.

FORMATO DE RESPUESTA REQUERIDO:
Devuelve SOLO un JSON válido con este formato exacto:
{
  "tasks": [
    {
      "title": "Título de la tarea",
      "subtasks": ["Subtarea 1", "Subtarea 2"],
      "priority": "high/medium/low",
      "estimatedTime": "30min"
    }
  ]
}

REGLAS:
- Genera entre 2-5 tareas concretas y accionables
- Cada tarea debe tener un título claro y subtareas específicas
- Las subtareas deben ser pasos concretos para completar la tarea
- NO incluyas explicaciones adicionales, SOLO el JSON

Solicitud del usuario: ${aiPrompt}`;

      const response = await geminiService.getResponse(taskPrompt);
      
      // Intentar parsear el JSON de la respuesta
      let parsedResponse;
      try {
        // Buscar el JSON en la respuesta (puede venir con texto adicional)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No se encontró JSON válido');
        }
      } catch (parseError) {
        console.error('Error parseando respuesta:', response);
        throw new Error('La IA no generó un formato válido');
      }

      // Validar que tenga tareas
      if (!parsedResponse.tasks || parsedResponse.tasks.length === 0) {
        throw new Error('No se generaron tareas');
      }

      // Añadir cada tarea generada
      let addedCount = 0;
      for (const generatedTask of parsedResponse.tasks) {
        const taskSubtasks: SubTask[] = generatedTask.subtasks?.map((subtask: string, index: number) => ({
          id: `${Date.now()}-${addedCount}-${index}`,
          title: subtask,
          completed: false
        })) || [];

        onAddTask(
          generatedTask.title,
          'productividad',
          taskSubtasks.length > 0 ? taskSubtasks : undefined,
          hasDate && selectedDate ? selectedDate.toISOString().split('T')[0] : undefined,
          hasTime ? selectedTime : undefined,
          `Generado por STEEB • Prioridad: ${generatedTask.priority} • Tiempo estimado: ${generatedTask.estimatedTime}`
        );
        addedCount++;
      }

      toast({
        title: "¡STEEB ha creado tus tareas! 🎉",
        description: `Se generaron ${addedCount} tareas basadas en tu solicitud`,
      });

      resetForm();
      onClose();

    } catch (error) {
      console.error('Error generando con IA:', error);
      toast({
        title: "Error generando tareas",
        description: error instanceof Error ? error.message : "Intenta describir tu objetivo de otra forma",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addSubtask = () => {
    setSubtasks([...subtasks, '']);
  };

  const updateSubtask = (index: number, value: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = value;
    setSubtasks(newSubtasks);
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className={cn(
        "w-full sm:max-w-lg h-[90vh] sm:h-[80vh] sm:max-h-[700px] sm:rounded-2xl flex flex-col modal-add-task",
        isDark ? "bg-gray-800" : "bg-gray-100"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-4 py-4 backdrop-blur-sm sm:rounded-t-2xl",
          isDark ? "bg-gray-700/80" : "bg-gray-200/80"
        )}>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className={cn(
              "text-lg",
              isDark ? "text-white" : "text-black"
            )}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Cancelar
          </button>
          <h2 className={cn(
            "text-lg font-semibold",
            isDark ? "text-white" : "text-black"
          )} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
            {editingTask ? 'Editar' : 'Nuevo'}
          </h2>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() && !aiMode}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              (title.trim() || aiMode)
                ? isDark 
                  ? "bg-white text-black hover:bg-gray-200" 
                  : "bg-black text-white hover:bg-gray-800"
                : isDark
                  ? "bg-gray-600 text-gray-400"
                  : "bg-gray-200 text-gray-400"
            )}
          >
            {editingTask ? <Save size={18} /> : <Plus size={18} />}
          </button>
        </div>

        {/* Content */}
        <div className={cn(
          "flex-1 overflow-y-auto",
          isDark ? "bg-gray-800" : "bg-white"
        )}>
          {/* Selector de modo: Manual vs IA */}
          <div className={cn(
            "px-4 py-4 border-b",
            isDark ? "border-gray-600" : "border-gray-200"
          )}>
            <div className="flex gap-2">
              <button
                onClick={() => setAiMode(false)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-lg font-semibold transition-all",
                  !aiMode 
                    ? isDark 
                      ? "bg-white text-black" 
                      : "bg-black text-white"
                    : isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Plus size={18} />
                  <span>Manual</span>
                </div>
              </button>
              <button
                onClick={() => setAiMode(true)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-lg font-semibold transition-all",
                  aiMode 
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    : isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles size={18} />
                  <span>Con STEEB IA</span>
                </div>
              </button>
            </div>
          </div>

          {/* Modo IA */}
          {aiMode ? (
            <div className="px-4 py-4 space-y-4">
              <div className={cn(
                "p-4 rounded-lg border",
                isDark ? "bg-gray-700/50 border-purple-500/30" : "bg-purple-50 border-purple-200"
              )}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isDark ? "bg-purple-600" : "bg-purple-500"
                  )}>
                    <Brain className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(
                      "font-semibold mb-1",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      ¡Hola! Soy STEEB
                    </h3>
                    <p className={cn(
                      "text-sm",
                      isDark ? "text-gray-300" : "text-gray-600"
                    )}>
                      Cuéntame qué necesitas hacer y crearé tareas específicas para ti con subtareas y prioridades.
                    </p>
                  </div>
                </div>

                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ejemplo: 'Necesito preparar una presentación para el lunes sobre ventas del trimestre'"
                  className={cn(
                    "w-full p-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-purple-500",
                    isDark 
                      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" 
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  )}
                  rows={4}
                  disabled={isGeneratingAI}
                />

                <button
                  onClick={handleGenerateWithAI}
                  disabled={!aiPrompt.trim() || isGeneratingAI}
                  className={cn(
                    "w-full mt-3 py-3 px-4 rounded-lg font-semibold transition-all disabled:opacity-50",
                    "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  )}
                >
                  {isGeneratingAI ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>STEEB está creando tus tareas...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Send size={18} />
                      <span>Generar tareas con IA</span>
                    </div>
                  )}
                </button>
              </div>

              <div className={cn(
                "text-center text-xs",
                isDark ? "text-gray-400" : "text-gray-500"
              )}>
                💡 Tip: Sé específico sobre fechas, prioridades y contexto para mejores resultados
              </div>
            </div>
          ) : (
            <>
              {/* Botón de tareas diarias de Steve */}
              <div className={cn(
                "px-4 py-4 border-b",
                isDark ? "border-gray-600" : "border-gray-200"
              )}>
                <button
                  onClick={handleAddDailyTasks}
                  disabled={isAddingDaily}
                  className={cn(
                    "w-full font-semibold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 steve-shadow disabled:opacity-50 disabled:transform-none",
                    isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black hover:bg-gray-800 text-white"
                  )}
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {isAddingDaily ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Añadiendo...</span>
                      </>
                    ) : (
                      <>
                        <span>¡Steve, añade mis tareas diarias!</span>
                      </>
                    )}
                  </div>
                </button>
                
                {!isAddingDaily && (
                  <div className="text-center mt-2">
                    <p className={cn(
                      "text-sm",
                      isDark ? "text-gray-300" : "text-gray-600"
                    )}>
                      {currentTasks.length} tareas diarias inteligentes
                    </p>
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div className={cn(
                "px-4 py-4 border-b",
                isDark ? "border-gray-600" : "border-gray-200"
              )}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título"
                  className={cn(
                    "w-full text-xl focus:outline-none bg-transparent cursor-visible",
                    isDark ? "text-white placeholder-gray-400" : "text-black placeholder-gray-400"
                  )}
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
                  autoFocus
                />
              </div>

              {/* Notes */}
              <div className={cn(
                "px-4 py-4 border-b",
                isDark ? "border-gray-600" : "border-gray-200"
              )}>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas"
                  className={cn(
                    "w-full text-sm focus:outline-none bg-transparent cursor-visible",
                    isDark ? "text-white placeholder-gray-400" : "text-black placeholder-gray-400"
                  )}
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
                />
              </div>

              {/* Subtasks */}
              <div className={cn(
                "px-4 py-4 border-b",
                isDark ? "border-gray-600" : "border-gray-200"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    "text-lg",
                    isDark ? "text-gray-300" : "text-gray-600"
                  )} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                    Subtareas
                  </span>
                  <button
                    type="button"
                    onClick={addSubtask}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isDark ? "bg-gray-600 hover:bg-gray-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-black"
                    )}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  {subtasks.map((subtask, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <span className={cn(
                        "text-lg",
                        isDark ? "text-gray-400" : "text-gray-400"
                      )}>•</span>
                      <input
                        type="text"
                        value={subtask}
                        onChange={(e) => updateSubtask(index, e.target.value)}
                        placeholder="Nueva subtarea..."
                        className={cn(
                          "flex-1 text-lg focus:outline-none bg-transparent py-1 cursor-visible",
                          isDark ? "text-white placeholder-gray-400" : "text-black placeholder-gray-400"
                        )}
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
                      />
                      {subtasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubtask(index)}
                          className="text-red-500 text-lg px-2"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* List Selector */}
              <div className={cn(
                "px-4 py-4 border-b",
                isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
              )}>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-sm uppercase tracking-wide",
                    isDark ? "text-gray-300" : "text-gray-600"
                  )} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                    Lista
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        isDark ? "bg-white" : "bg-black"
                      )}></div>
                      <span className={cn(
                        "text-base",
                        isDark ? "text-white" : "text-black"
                      )} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                        {selectedList}
                      </span>
                    </div>
                    <ChevronRight size={16} className={cn(
                      isDark ? "text-gray-400" : "text-gray-400"
                    )} />
                  </div>
                </div>
              </div>

              {/* Fecha y Hora compactos */}
              <div className={cn(
                "px-4 py-4",
                isDark ? "bg-gray-800" : "bg-white"
              )}>
                <div className="flex flex-row items-center justify-between gap-4">
                  {/* Fecha */}
                  <div className="flex items-center gap-2 flex-1">
                    <span className={cn(
                      "text-base",
                      isDark ? "text-white" : "text-black"
                    )} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                      Fecha
                    </span>
                    <button
                      onClick={() => {
                        setHasDate(!hasDate);
                        if (!hasDate && !selectedDate) {
                          setSelectedDate(new Date());
                        }
                      }}
                      className={cn(
                        "w-[51px] h-[31px] rounded-full transition-all relative",
                        hasDate 
                          ? isDark ? "bg-white" : "bg-black"
                          : isDark ? "bg-gray-600" : "bg-gray-300"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute w-[27px] h-[27px] rounded-full shadow-sm transition-transform top-[2px]",
                          hasDate ? "translate-x-[22px]" : "translate-x-[2px]",
                          hasDate 
                            ? isDark ? "bg-black" : "bg-white"
                            : "bg-white"
                        )}
                      />
                    </button>
                  </div>
                  {/* Hora */}
                  <div className="flex items-center gap-2 flex-1">
                    <span className={cn(
                      "text-base",
                      isDark ? "text-white" : "text-black"
                    )} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                      Hora
                    </span>
                    <button
                      onClick={() => {
                        setHasTime(!hasTime);
                        if (!hasTime && !selectedTime) {
                          const now = new Date();
                          setSelectedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
                        }
                      }}
                      className={cn(
                        "w-[51px] h-[31px] rounded-full transition-all relative",
                        hasTime 
                          ? isDark ? "bg-white" : "bg-black"
                          : isDark ? "bg-gray-600" : "bg-gray-300"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute w-[27px] h-[27px] rounded-full shadow-sm transition-transform top-[2px]",
                          hasTime ? "translate-x-[22px]" : "translate-x-[2px]",
                          hasTime 
                            ? isDark ? "bg-black" : "bg-white"
                            : "bg-white"
                        )}
                      />
                    </button>
                  </div>
                </div>

                {hasDate && selectedDate && (
                  <div className="mt-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={cn(
                          "flex items-center space-x-2 text-base font-medium",
                          isDark ? "text-white" : "text-black"
                        )}>
                          <Calendar size={20} />
                          <span>{format(selectedDate, 'dd/MM/yyyy')}</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date: Date | undefined) => setSelectedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {hasTime && (
                  <div className="mt-3">
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className={cn(
                        "text-base font-medium focus:outline-none bg-transparent",
                        isDark ? "text-white" : "text-black"
                      )}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalAddTask;
