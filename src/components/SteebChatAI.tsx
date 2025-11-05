import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, X, Check, Trash2 } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import minimaxDirectService from '@/services/minimaxDirectService';
import { dailySummaryService } from '@/services/dailySummaryService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SteebChatAI: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  
  const getInitialMessage = () => {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) greeting = 'Buenos días';
    else if (hour < 18) greeting = 'Buenas tardes';
    else greeting = 'Buenas noches';
    
    return greeting;
  };
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: getInitialMessage(),
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSideTasks, setShowSideTasks] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { tasks, addTask, toggleTask, deleteTask } = useTaskStore();

  // Inicializar MINIMAX Direct Service al cargar
  useEffect(() => {
    const initMinimax = async () => {
      const initialized = await minimaxDirectService.initialize();
      if (initialized) {
        console.log('✅ MINIMAX M2 Direct Service inicializado');
      }
    };
    initMinimax();
  }, []);

  // Manejar resumen diario
  useEffect(() => {
    const checkAndSaveDailySummary = async () => {
      const today = new Date().toISOString().split('T')[0];
      const lastSummaryDate = localStorage.getItem('steeb_last_summary_date');
      
      // Si ya se guardó un resumen hoy, no hacer nada
      if (lastSummaryDate === today) return;
      
      // Si hay un resumen del día anterior, guardarlo
      if (lastSummaryDate) {
        const keyMessages = messages
          .filter(m => m.role === 'user')
          .slice(-10)
          .map(m => m.content.substring(0, 50)); // Primeros 50 caracteres
        
        const completedTasks = tasks.filter(t => t.completed).length;
        const pendingTasks = tasks.filter(t => !t.completed).length;
        
        await dailySummaryService.saveDailySummary(
          `Progreso: ${completedTasks} tareas completadas, ${pendingTasks} pendientes`,
          completedTasks,
          pendingTasks,
          keyMessages as string[]
        ).catch(err => console.error('Error guardando resumen:', err));
      }
      
      // Marcar que ya procesamos hoy
      localStorage.setItem('steeb_last_summary_date', today);
    };
    
    if (messages.length > 0) {
      checkAndSaveDailySummary();
    }
  }, [messages, tasks]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getTaskContext = () => {
    const pendingTasks = tasks.filter(task => !task.completed);
    const completedToday = tasks.filter(task =>
      task.completed &&
      new Date(task.completedAt || task.createdAt).toDateString() === new Date().toDateString()
    );

    return {
      pending: pendingTasks.length,
      pendingList: pendingTasks.slice(0, 5).map(t => t.title),
      allPendingTasks: pendingTasks.map(t => t.title),
      completedToday: completedToday.length,
      completedTodayList: completedToday.map(t => t.title),
      hasTasks: tasks.length > 0
    };
  };

  const generateSteebPrompt = async (userMessage: string): Promise<string> => {
    const taskContext = getTaskContext();
    
    // Obtener contexto de días anteriores
    const previousDaysContext = await dailySummaryService.getContextFromPreviousDays(3);
    
    const taskInfo = `TAREAS: ${taskContext.pending} pendientes. Hoy: ${taskContext.completedToday} hechas.${previousDaysContext ? `\n${previousDaysContext}` : ''}`;
    
    return `${taskInfo}

"${userMessage}"

STEEB - Responde EN UNA SOLA LÍNEA. MÁXIMO 25 PALABRAS. PUNTO.
- Sé directo
- Sin explicaciones largas
- Una frase nada más
- Si hay tareas: mantra "una de una"
- SIN INSULTOS`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setInputMessage('');

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Detectar comando especial "TAREAS"
    if (message.trim().toUpperCase() === 'TAREAS') {
      setShowSideTasks(true);
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `🎯 Mostrando tus tareas pendientes`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      return;
    }

    // Detectar comando para crear tarea: "crea tarea (texto)"
    const taskRegex = /crea\s+tarea\s+(.+)/i;
    const taskMatch = message.match(taskRegex);
    if (taskMatch) {
      const taskTitle = taskMatch[1].trim();
      // NO esperar - crear tarea en background, mostrar confirmación instantáneamente
      addTask({
        title: taskTitle,
        completed: false,
        type: 'extra',
        status: 'pending'
      }).catch(err => console.error('Error sincronizando tarea:', err));
      
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `✅ "${taskTitle}" creada`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setShowSideTasks(true);
      return;
    }

    setIsTyping(true);

    try {
      if (!minimaxDirectService.isReady()) {
        console.log('Inicializando MINIMAX Direct...');
        await minimaxDirectService.initialize();
      }

      const steebPrompt = await generateSteebPrompt(message);

      // Debug: mostrar el prompt en consola
      console.log('🔥 Steeb Prompt:', steebPrompt);

      // Usar MINIMAX M2 Direct Service
      const response = await minimaxDirectService.sendMessage(steebPrompt);

      // Debug: mostrar respuesta de la API
      console.log('💬 API Response:', response);

      // Dividir respuesta en máximo 2 mensajes
      const responseLines = response.split('\n').filter(line => line.trim().length > 0);
      
      let messagesToAdd: string[] = [];
      
      if (responseLines.length > 1) {
        // Calcular el punto medio para dividir en 2 mensajes
        const midPoint = Math.ceil(responseLines.length / 2);
        const firstMessage = responseLines.slice(0, midPoint).join('\n');
        const secondMessage = responseLines.slice(midPoint).join('\n');
        messagesToAdd = [firstMessage, secondMessage];
      } else {
        // Si es una sola línea, agregar normalmente
        messagesToAdd = [response];
      }
      
      // Agregar los mensajes
      setMessages(prev => {
        let newMessages = [...prev];
        messagesToAdd.forEach((msg, index) => {
          const aiMessage: ChatMessage = {
            id: `msg_${Date.now() + 1 + index}`,
            role: 'assistant',
            content: msg.trim(),
            timestamp: new Date(Date.now() + index * 100)
          };
          newMessages.push(aiMessage);
        });
        return newMessages;
      });

    } catch (error) {
      console.error('❌ Error con Steeb Proxy:', error);

      // Error fallback message
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: '⚠️ Error conectando con el servidor. Pero eso no excusa la procrastinación. Hacé una tarea ahora.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const generateIntelligentResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    const taskContext = getTaskContext();
    const currentHour = new Date().getHours();
    const timeOfDay = currentHour < 12 ? 'mañana' : currentHour < 18 ? 'tarde' : 'noche';

    // Enhanced pattern matching for more intelligent responses
    if (message.includes('hola') || message.includes('buen día') || message.includes('hey')) {
      return `¡Buen ${timeOfDay}! Es hora de acción. Tenés ${taskContext.pending} tareas pendientes. ¿Cuál vas a conquistar hoy?`;
    }

    if (message.includes('tarea') || message.includes('tareas')) {
      if (taskContext.pending > 0) {
        const responses = [
          `Tenés ${taskContext.pending} tareas esperando. La procrastinación es tu enemiga. Elegí una y dominala ahora.`,
          `${taskContext.pending} tareas pendientes. Cada una es una oportunidad para ser mejor. Empezá con la más fácil.`,
          `Vi ${taskContext.pending} tareas sin completar. El éxito se construye tarea por tarea. ¿Cuál empieza hoy?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      } else {
        return '¡Excelente! Sin tareas pendientes. Eso es productividad real. Agregá nuevos desafíos o disfruta tu victoria.';
      }
    }

    if (message.includes('procrastinar') || message.includes('postergar') || message.includes('después')) {
      const responses = [
        'El "después" es el idioma de los mediocres. Los ganadores hablan en "ahora". ¿Cuál elegís?',
        'Cada minuto que postergás es un minuto que le regalás a la mediocridad. Recuperalo ahora.',
        'La procrastinación es el impuesto que pagás por no vivir tu potencial. ¿Vas a seguir pagando?',
        'El momento perfecto fue hace 5 minutos. El segundo mejor momento es ahora. Actuá.'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (message.includes('motivación') || message.includes('ánimo') || message.includes('energía')) {
      const responses = [
        'La motivación no aparece mágicamente. Se construye con cada tarea completada. Hacé la primera.',
        'El ánimo es subproducto de la acción. Movete, aunque sea un paso pequeño. La energía seguirá.',
        'La motivación es para principiantes. Los profesionales usan disciplina. Empezá ahora.',
        'Tu energía mental es como un músculo: cuanto más lo ejercitas actuar, más fuerte se vuelve.'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (message.includes('ayuda') || message.includes('ayúdame')) {
      return 'Soy Steeb, tu destructor de procrastinación. Puedo analizar tus tareas, darte motivación o planificar tu día. ¿Qué necesitas conquistar hoy?';
    }

    if (message.includes('cómo') || message.includes('cómo')) {
      return 'El "cómo" es simple: 1) Elegí una tarea, 2) Empezá ahora, 3) No pares hasta terminarla. El resto son excusas.';
    }

    if (message.includes('gracias') || message.includes('thank')) {
      return 'Las gracias no completan tareas. La acción sí. ¿Qué sigue en tu lista de conquistas?';
    }

    if (message.includes('cansado') || message.includes('fatiga') || message.includes('agotado')) {
      return 'El cansancio es mental. 10 minutos de acción generan 2 horas de energía. Empezá con la tarea más pequeña.';
    }

    if (message.includes('difícil') || message.includes('imposible') || message.includes('no puedo')) {
      return '"No puedo" es la frase favorita de los que fracasan. Reemplazala por "¿Cómo puedo?". La respuesta está en la acción.';
    }

    if (message.includes('plan') || message.includes('organizar')) {
      return `Tu plan es simple: ${taskContext.pending > 0 ? `1) Completar ${taskContext.pending} tareas pendientes` : '1) Agregar nuevas metas'}, 2) Celebrar cada victoria, 3) Repetir mañana. ¿Necesitas más detalles?`;
    }

    if (message.includes('tiempo') || message.includes('cuánto')) {
      const responses = [
        'El tiempo que gastas pensando en hacer la tarea es suficiente para completarla.',
        'No tienes tiempo para procrastinar, pero sí para triunfar. Usalo sabiamente.',
        'El tiempo es tu recurso más valioso. Cada minuto que usas productivamente es una inversión en tu futuro.'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Default intelligent responses
    const defaultResponses = [
      'Hacelo ahora y después nos preocupamos.',
      'Empezá por la más fácil y sigamos.',
      'Una por una, no hay otro secreto.',
      '¿Y si empezamos ya y vemos qué pasa?',
      'Hoy es buen día para terminar estas cosas.',
      'Vamos, son apenas 10 minutos de foco.',
      'Después de esto seguimos con lo nuestro.'
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const generateFallbackResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    const taskContext = getTaskContext();

    if (message.includes('tarea') || message.includes('tareas')) {
      if (taskContext.pending > 0) {
        return `Tenés ${taskContext.pending} tareas pendientes. Elegí una y empezá ahora. No pienses, hacé.`;
      } else {
        return '¡Excelente! Sin tareas pendientes. Agregá un nuevo desafío o disfruta tu productividad.';
      }
    }

    if (message.includes('procrastinar') || message.includes('postergar')) {
      return 'El "después" no existe en el vocabulario de los ganadores. Empezá ahora, con la tarea más pequeña.';
    }

    if (message.includes('motivación') || message.includes('ánimo')) {
      return 'La motivación no aparece, se construye. Cada tarea completada es un ladrillo en tu éxito.';
    }

    const fallbacks = [
      'Hacelo ahora y listo, seguimos.',
      'Empezá, después vemos el resto.',
      'Una a la vez, así se va.',
      'Vamos, terminemos esto rápidamente.'
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-black flex-col">
      {/* Main Content - Chat + Side Tasks */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => {
          const nextMessage = messages[index + 1];
          const shouldAddSpacing = !nextMessage || nextMessage.role !== message.role;
          
          return (
          <div
            key={message.id}
            className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'} ${shouldAddSpacing ? 'mb-4' : 'mb-1'}`}
          >
            {/* Message Content - Sin avatares */}
            <div
              className={`px-4 py-3 max-w-[80%] rounded-2xl ${
                message.role === 'assistant'
                  ? 'bg-white text-black border border-gray-300'
                  : 'bg-gray-200 text-black'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              <div className={`text-xs mt-2 ${
                message.role === 'assistant' ? 'text-gray-500' : 'text-gray-600'
              }`}>
                {message.timestamp.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-black dark:bg-white text-white dark:text-black px-4 py-3 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

            <div ref={messagesEndRef} />
        </div>

        {/* Side Tasks Panel */}
        {showSideTasks && (
          <div className="h-96 bg-white dark:bg-black flex flex-col border-t-4 border-black dark:border-white">
            {/* Header */}
            <div className="p-4 border-b-2 border-black dark:border-white flex items-center justify-center relative">
              <h2 className="text-2xl font-black text-black dark:text-white">Tareas</h2>
              <button
                onClick={() => setShowSideTasks(false)}
                className="absolute right-4 p-1 hover:opacity-70 transition-opacity bg-transparent border-0"
              >
                <X className="w-5 h-5 text-black dark:text-white" />
              </button>
            </div>

            {/* Tasks List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {tasks.filter(t => !t.completed).length > 0 && (
                <>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase">
                    {tasks.filter(t => !t.completed).length} pendiente{tasks.filter(t => !t.completed).length !== 1 ? 's' : ''}
                  </p>
                </>
              )}
              {tasks.filter(t => !t.completed).map((task) => (
                    <div
                      key={task.id}
                      className="group p-4 bg-white dark:bg-gray-950 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all hover:shadow-md"
                      style={{ borderLeft: '4px solid black' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-base font-semibold text-black dark:text-white break-words leading-tight">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-wider">
                            {task.category || 'Sin categoría'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <button
                            onClick={async (e) => {
                              if (!task) return;

                              try {
                                // Deshabilitar botón temporalmente para evitar múltiples clicks
                                const button = e.currentTarget as HTMLButtonElement;
                                const originalBg = button.style.backgroundColor;
                                button.disabled = true;
                                button.style.opacity = '0.5';

                                await toggleTask(task.id);

                                // Feedback visual exitoso
                                button.style.backgroundColor = '#10b981';
                                setTimeout(() => {
                                  button.style.opacity = '1';
                                  button.style.backgroundColor = originalBg;
                                  button.disabled = false;
                                }, 300);

                              } catch (error) {
                                console.error('❌ Error al completar tarea:', error);

                                // Feedback visual de error
                                const button = e.currentTarget as HTMLButtonElement;
                                button.style.backgroundColor = '#ef4444';
                                button.disabled = false;
                                button.style.opacity = '1';

                                // Mostrar mensaje amigable al usuario (solo si es un error real)
                                setTimeout(() => {
                                  button.style.backgroundColor = '';
                                }, 1500);
                              }
                            }}
                            className="flex-shrink-0 w-5 h-5 rounded-full bg-white hover:bg-white transition-all duration-200"
                            style={{ border: '2px solid black' }}
                            title="Completar tarea"
                          >
                          </button>
                          <button
                            onClick={async (e) => {
                              if (!task) return;

                              try {
                                const confirmMessage = `¿Estás seguro de que querés eliminar "${task.title}"?`;
                                if (!window.confirm(confirmMessage)) return;

                                // Deshabilitar botón temporalmente
                                const button = e.currentTarget as HTMLButtonElement;
                                button.disabled = true;
                                button.style.opacity = '0.5';

                                await deleteTask(task.id);
                                console.log(`✅ Tarea eliminada exitosamente: ${task.title}`);

                              } catch (error) {
                                console.error('❌ Error al eliminar tarea:', error);

                                // Feedback visual de error
                                const button = e.currentTarget as HTMLButtonElement;
                                button.style.backgroundColor = '#dc2626';
                                button.disabled = false;
                                button.style.opacity = '1';

                                setTimeout(() => {
                                  button.style.backgroundColor = '';
                                }, 1500);
                              }
                            }}
                            className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 transition-all duration-200 flex items-center justify-center group/delete"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-3 h-3 text-red-600 group-hover/delete:text-red-800" />
                          </button>
                        </div>
                      </div>
                    </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area - Always at the bottom */}
        <div className="border-t border-black dark:border-white p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Habla con Steeb"
              className="flex-1 px-4 py-3 bg-white dark:bg-black border border-black dark:border-white rounded-full text-sm text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-full border border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SteebChatAI;