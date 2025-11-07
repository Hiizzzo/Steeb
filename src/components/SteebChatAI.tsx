import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, X, Check, Trash2, Bot, User, Clock, Sparkles } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import minimaxDirectService from '@/services/minimaxDirectService';
import { dailySummaryService } from '@/services/dailySummaryService';
import { useTheme } from '@/hooks/useTheme';
import FixedPanelContainer from './FixedPanelContainer';
import SimpleSideTasksPanel from './SimpleSideTasksPanel';
import SimpleProgressPanel from './SimpleProgressPanel';
import SimpleCalendarPanel from './SimpleCalendarPanel';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  category?: 'general' | 'task' | 'productivity' | 'motivation';
}

const SteebChatAI: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const { currentTheme } = useTheme();
  const { tasks, addTask, toggleTask, deleteTask } = useTaskStore();

  // Helper: get task context - moved to top to avoid hoisting issues
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

  // Respuestas predefinidas para mejor UX - PR #142
  const predefinedResponses: Record<string, string> = {
    'hola': '¡Hola! ¿Qué tareitas tenemos para hoy?',
    'buenos días': '¡Buenos días! 💪 Empecemos el día con energía.',
    'buenas tardes': '¡Buenas tardes! ¿Cómo va tu productividad hoy?',
    'buenas noches': '¡Buenas noches! 🌙 Terminemos el día fuerte.',
    'cómo estás': '¡Estoy listo para ayudarte! ¿Qué necesitamos hacer?',
    'ayuda': 'Puedo crear tareas, mostrar tu progreso y motivarte. ¡Escribe "tareas" para ver!',
    'tareas': 'Mostrando tus tareas pendientes... ¡Una de una! 🎯',
    'progreso': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'ver progreso': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'mis estadísticas': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'estadísticas': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'métricas': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'rendimiento': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'calendario': 'SPECIAL_COMMAND:OPEN_CALENDAR',
    'ver calendario': 'SPECIAL_COMMAND:OPEN_CALENDAR',
    'agenda': 'SPECIAL_COMMAND:OPEN_CALENDAR',
    'mes': 'SPECIAL_COMMAND:OPEN_CALENDAR',
    'motírame': '¡Tú puedes! 💪 Cada tarea completada te acerca a tu meta.',
    'gracias': '¡De nada! Estoy aquí para ayudarte a lograr tus metas.',
    'adiós': '¡Hasta luego! Termina bien tus tareas.',
    'ok': '¡Perfecto! Vamos por ello.',
    'estoy cansado': 'Descansa un poco, ¡pero no te rindas! 🚀',
    'no sé qué hacer': 'Empecemos con algo pequeño. ¿Cuál es la tarea más sencilla que puedes hacer ahora?',
    'estoy aburrido': '¡Perfecto momento para avanzar en esas tareas pendientes! 📋',
    'feliz': '¡Me encanta tu energía! Canalízala en una tarea y verás resultados. ⚡',
    'triste': '¡No te preocupes! Una pequeña tarea puede mejorar tu estado de ánimo. 💙'
  };

  const getInitialMessage = () => {
    const hour = new Date().getHours();
    const taskContext = getTaskContext();

    if (hour < 12) {
      return taskContext.hasTasks ? '¡Buenos días! 💪 Listo para conquistar tus tareas?' : '¡Buenos días! ¿Qué desafíos nos esperan hoy?';
    } else if (hour < 18) {
      return taskContext.hasTasks ? '¡Buenas tardes! ⚡ Mantengamos el momentum.' : '¡Buenas tardes! ¿Lista/o para ser productiva/o?';
    } else {
      return taskContext.hasTasks ? '¡Buenas noches! 🌙 Terminemos el día con energía.' : '¡Buenas noches! ¿Revisamos tu progreso?';
    }
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
  const [showProgress, setShowProgress] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Detectar respuestas predefinidas - PR #142
  const getPredefinedResponse = (message: string): string | null => {
    const normalizedMessage = message.toLowerCase().trim();

    console.log('🔍 Debug - Mensaje normalizado:', `"${normalizedMessage}"`);
    console.log('🔍 Debug - Respuestas disponibles:', Object.keys(predefinedResponses));

    // Buscar coincidencia exacta
    if (predefinedResponses[normalizedMessage]) {
      console.log('✅ Debug - Coincidencia exacta encontrada:', normalizedMessage);
      return predefinedResponses[normalizedMessage];
    }

    // Buscar coincidencias parciales
    for (const [key, response] of Object.entries(predefinedResponses)) {
      if (normalizedMessage.includes(key) || key.includes(normalizedMessage)) {
        console.log('✅ Debug - Coincidencia parcial encontrada:', key, '->', response);
        return response;
      }
    }

    console.log('❌ Debug - No se encontró respuesta predefinida para:', normalizedMessage);
    return null;
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

    // Detectar respuestas predefinidas primero
    const predefinedResponse = getPredefinedResponse(message);
    console.log('🔍 Debug - Mensaje:', message);
    console.log('🔍 Debug - Respuesta predefinida:', predefinedResponse);

    if (predefinedResponse) {
      // Manejar comando especial para abrir progreso
      if (predefinedResponse === 'SPECIAL_COMMAND:OPEN_PROGRESS') {
        console.log('🚀 Debug - Abriendo panel de progreso...');
        const aiMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: '📊 Mostrando tu panel de progreso...',
          timestamp: new Date(),
          category: 'general'
        };
        setMessages(prev => [...prev, aiMessage]);

        // Abrir el panel de progreso
        setShowProgress(true);
        return;
      }

      // Manejar comando especial para abrir calendario
      if (predefinedResponse === 'SPECIAL_COMMAND:OPEN_CALENDAR') {
        console.log('📅 Debug - Abriendo panel de calendario...');
        const aiMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: '📅 Abriendo tu calendario mensual...',
          timestamp: new Date(),
          category: 'general'
        };
        setMessages(prev => [...prev, aiMessage]);

        // Abrir el panel de calendario
        setShowCalendar(true);
        return;
      }

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: predefinedResponse,
        timestamp: new Date(),
        category: 'general'
      };
      setMessages(prev => [...prev, aiMessage]);

      // Si es una solicitud de tareas, abrir el panel
      if (message.toLowerCase().includes('tarea')) {
        setShowSideTasks(true);
      }

      return;
    }

    // Detectar comando especial "TAREAS"
    if (message.trim().toUpperCase() === 'TAREAS') {
      setShowSideTasks(true);
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `🎯 Mostrando tus tareas pendientes`,
        timestamp: new Date(),
        category: 'task'
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
            {/* Message Content with improved colors - PR #143 */}
            <div className={`flex items-end space-x-2 max-w-[85%] ${message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* Message bubble */}
              <div
                className={`px-4 py-3 rounded-2xl relative group ${
                  message.role === 'assistant'
                    ? 'bg-white text-black border-2 border-gray-300 shadow-md'
                    : 'bg-gray-300 text-black shadow-md border-2 border-gray-300'
                }`}
              >
  
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>

                {/* Timestamp with improved styling */}
                <div className={`text-xs mt-2 flex items-center space-x-1 ${
                  message.role === 'assistant'
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-blue-100'
                }`}>
                  <Clock className="w-3 h-3" />
                  <span>
                    {message.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Hover effect for assistant messages */}
                {message.role === 'assistant' && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                )}
              </div>
            </div>
          </div>
        );
        })}

        {/* Enhanced Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="flex items-end space-x-2">
              {/* Typing animation only - no bubble */}
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

            <div ref={messagesEndRef} />
        </div>

        {/* Side Tasks Panel - Altura predefinida */}
        <FixedPanelContainer isOpen={showSideTasks} onClose={() => setShowSideTasks(false)}>
          <SimpleSideTasksPanel onClose={() => setShowSideTasks(false)} />
        </FixedPanelContainer>

        {/* Progress Panel - Altura predefinida */}
        <FixedPanelContainer isOpen={showProgress} onClose={() => setShowProgress(false)}>
          <SimpleProgressPanel onClose={() => setShowProgress(false)} />
        </FixedPanelContainer>

        {/* Calendar Panel - Altura predefinida */}
        <FixedPanelContainer isOpen={showCalendar} onClose={() => setShowCalendar(false)}>
          <SimpleCalendarPanel onClose={() => setShowCalendar(false)} />
        </FixedPanelContainer>

        {/* Enhanced Input Area with improved colors */}
        <div className="bg-gray-100 dark:bg-gray-900 backdrop-blur-sm p-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Habla con Steeb..."
                className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-900 border-0 rounded-2xl text-sm text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-2 focus:!border-gray-300 dark:!focus:border-gray-500 transition-all duration-200"
              />

              {/* Character count indicator */}
              {inputMessage.length > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className={`text-xs ${
                    inputMessage.length > 100 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {inputMessage.length}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md border-2 border-gray-300"
            >
              <ArrowUp className="w-4 h-4 text-black" />
            </button>
          </div>


        </div>
      </div>
    </div>
  );
};

export default SteebChatAI;