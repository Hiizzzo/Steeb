import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, X, Check, Trash2, Bot, User, Clock, Sparkles, CreditCard } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { dailySummaryService } from '@/services/dailySummaryService';
import { sendMessageToSteeb } from '@/services/steebApi';
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
  showMercadoPagoButton?: boolean; // Nueva propiedad para mostrar botón
}

const SteebChatAI: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark';
  const isShinyMode = currentTheme === 'shiny';
  const shinyMessageColors = ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];
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
    'ayuda': 'Puedo crear tareas, mostrar tu progreso y motivarte. ¡Escribe "tareas" para ver! Los paneles de progreso y calendario se abren sin mensajes.',
    'tareas': 'SPECIAL_COMMAND:OPEN_TASKS',
    'tarea': 'SPECIAL_COMMAND:OPEN_TASKS',
    'mis tareas': 'SPECIAL_COMMAND:OPEN_TASKS',
    'ver tareas': 'SPECIAL_COMMAND:OPEN_TASKS',
    'lista de tareas': 'SPECIAL_COMMAND:OPEN_TASKS',
    'que tengo que hacer': 'SPECIAL_COMMAND:OPEN_TASKS',
    'pendientes': 'SPECIAL_COMMAND:OPEN_TASKS',
    'progreso': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'ver progreso': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'mis estadísticas': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'estadísticas': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'métricas': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'rendimiento': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'avance': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'estadisticas': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'metricas': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'calendario': 'SPECIAL_COMMAND:OPEN_CALENDAR',
    'agenda': 'SPECIAL_COMMAND:OPEN_CALENDAR',
    'mi calendario': 'SPECIAL_COMMAND:OPEN_CALENDAR',
    'fechas': 'SPECIAL_COMMAND:OPEN_CALENDAR',
    'eventos': 'SPECIAL_COMMAND:OPEN_CALENDAR',
    'mes': 'SPECIAL_COMMAND:OPEN_CALENDAR',
    'motírame': '¡Tú puedes! 💪 Cada tarea completada te acerca a tu meta.',
    'gracias': '¡De nada! Estoy aquí para ayudarte a lograr tus metas.',
    'adiós': '¡Hasta luego! Termina bien tus tareas.',
    'ok': '¡Perfecto! Vamos por ello.',
    'estoy cansado': 'Descansa un poco, ¡pero no te rindas! 🚀',
    'no sé qué hacer': 'Empecemos con algo pequeño. ¿Cuál es la tarea más sencilla que puedes hacer ahora?',
    'estoy aburrido': '¡Perfecto momento para avanzar en esas tareas pendientes! 📋',
    'feliz': '¡Me encanta tu energía! Canalízala en una tarea y verás resultados. ⚡',
    'triste': '¡No te preocupes! Una pequeña tarea puede mejorar tu estado de ánimo. 💙',
    'comprar dark mode': 'SPECIAL_COMMAND:BUY_DARK_MODE',
    'comprar modo dark': 'SPECIAL_COMMAND:BUY_DARK_MODE',
    'quiero dark mode': 'SPECIAL_COMMAND:BUY_DARK_MODE',
    'quiero modo dark': 'SPECIAL_COMMAND:BUY_DARK_MODE'
  };

  const getInitialMessage = () => {
    return '¡Hola! Soy STEEB 🚀\n\nDecime "calendario", "tareas" o "progreso" para abrir esos paneles.\n\n¿Cómo te puedo ayudar hoy para cumplir tus metas?';
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
  const [panelHeight, setPanelHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Escuchar mensajes del ThemeToggle
  useEffect(() => {
    const handleSteebMessage = (event: CustomEvent) => {
      const { type, content, timestamp, showMercadoPagoButton } = event.detail;

      if (type === 'theme-info' || type === 'theme-info-with-button') {
        const aiMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: content,
          timestamp: timestamp || new Date(),
          category: 'general',
          showMercadoPagoButton: showMercadoPagoButton || false
        };

        setMessages(prev => [...prev, aiMessage]);

        // Scroll al final para mostrar el nuevo mensaje
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    };

    // Escuchar los eventos personalizados
    window.addEventListener('steeb-message', handleSteebMessage as EventListener);
    window.addEventListener('steeb-message-with-button', handleSteebMessage as EventListener);

    // Limpiar los event listeners al desmontar
    return () => {
      window.removeEventListener('steeb-message', handleSteebMessage as EventListener);
      window.removeEventListener('steeb-message-with-button', handleSteebMessage as EventListener);
    };
  }, []);

  // Manejar cambios de altura del panel
  const handlePanelHeightChange = (height: number) => {
    setPanelHeight(height);

    // Si el panel ocupa más del 85% de la pantalla, el chat casi no se ve
    const screenHeight = window.innerHeight;
    const threshold = screenHeight * 0.85;

    // Scroll al fondo con un pequeño delay para que la transición se complete
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  // Resetear altura del panel cuando se cierra
  useEffect(() => {
    if (!showSideTasks && !showProgress && !showCalendar) {
      setPanelHeight(0);
    }
  }, [showSideTasks, showProgress, showCalendar]);

  // Scroll al fondo cuando se abre/cierra un panel para ajustar la vista
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 300); // Pequeño delay para que la transición del panel se complete

    return () => clearTimeout(timer);
  }, [showSideTasks, showProgress, showCalendar]);

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

    // Detectar si es un comando de panel ANTES de agregar mensaje de usuario
    const predefinedResponse = getPredefinedResponse(message);

    // Comandos que abren paneles - manejarlos silenciosamente
    if (predefinedResponse === 'SPECIAL_COMMAND:OPEN_PROGRESS') {
      console.log('🚀 Abriendo panel de progreso sin mensajes...');
      setShowProgress(true);
      return;
    }

    if (predefinedResponse === 'SPECIAL_COMMAND:OPEN_CALENDAR') {
      console.log('📅 Abriendo panel de calendario sin mensajes...');
      setShowCalendar(true);
      return;
    }

    if (predefinedResponse === 'SPECIAL_COMMAND:OPEN_TASKS') {
      console.log('📋 Abriendo panel de tareas sin mensajes...');
      setShowSideTasks(true);
      return;
    }

    if (predefinedResponse === 'SPECIAL_COMMAND:BUY_DARK_MODE') {
      console.log('💳 Comprando Dark Mode...');

      // Enviar un evento global para que el ThemeToggle abra el modal de pago
      const buyDarkEvent = new CustomEvent('buy-dark-mode', {
        detail: {
          source: 'chat',
          timestamp: new Date()
        }
      });
      window.dispatchEvent(buyDarkEvent);

      const confirmationMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: '¡Excelente decisión! Estoy abriendo el proceso de compra para el Dark Mode por $3.000. Te dará acceso inmediato + 1 intento gratis para Shiny. 🌙',
        timestamp: new Date(),
        category: 'general'
      };
      setMessages(prev => [...prev, confirmationMessage]);

      // Enviar segundo mensaje con botón de Mercado Pago
      setTimeout(() => {
        const mercadoPagoMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: `# $3.000

### 1 intento gratis del modo SHINY`,
          timestamp: new Date(),
          category: 'general',
          showMercadoPagoButton: true // Nueva propiedad para mostrar el botón
        };
        setMessages(prev => [...prev, mercadoPagoMessage]);

        // Scroll al final para mostrar el nuevo mensaje
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }, 1000); // Esperar 1 segundo para enviar el segundo mensaje

      return;
    }

    // Add user message (solo para mensajes que no son comandos de paneles)
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Ya detectamos respuestas predefinidas arriba, pero ya excluimos los comandos de paneles
    // Si llegamos aquí, es porque no es un comando de panel, pero puede tener respuesta predefinida
    if (predefinedResponse && predefinedResponse !== 'SPECIAL_COMMAND:OPEN_PROGRESS' && predefinedResponse !== 'SPECIAL_COMMAND:OPEN_CALENDAR') {
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: predefinedResponse,
        timestamp: new Date(),
        category: 'general'
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
      const { reply, remainingMessages } = await sendMessageToSteeb(message);
      const usageNote =
        typeof remainingMessages === 'number' && Number.isFinite(remainingMessages)
          ? `\n\nTe quedan ${remainingMessages} mensajes disponibles hoy.`
          : '';

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `${reply.trim()}${usageNote}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('⚠️ Error comunicando con STEEB:', error);

      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: 'STEEB no te quiere escuchar            *frota sus lentes*',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }

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
      // Abrir panel de tareas y cerrar otros paneles
      setShowSideTasks(true);
      setShowCalendar(false);
      setShowProgress(false);
      return `Tu plan es simple: ${taskContext.pending > 0 ? `1) Completar ${taskContext.pending} tareas pendientes` : '1) Agregar nuevas metas'}, 2) Celebrar cada victoria, 3) Repetir mañana. ¿Necesitas más detalles?`;
    }

    if (message.includes('calendario') || message.includes('calendario')) {
      // Abrir panel de calendario y cerrar otros paneles
      setShowCalendar(true);
      setShowSideTasks(false);
      setShowProgress(false);
      return 'Aquí está tu calendario. Planificá tu semana como un campeón. Sin excusas.';
    }

    if (message.includes('progreso') || message.includes('estadísticas') || message.includes('gráfico')) {
      // Abrir panel de progreso y cerrar otros paneles
      setShowProgress(true);
      setShowSideTasks(false);
      setShowCalendar(false);
      return 'Tus estadísticas de productividad. Mirá lo que podés lograr cuando dejás de procrastinar.';
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
      // Abrir panel de tareas sin cerrar otros paneles
      setShowSideTasks(true);
      if (taskContext.pending > 0) {
        return `Tenés ${taskContext.pending} tareas pendientes. Elegí una y empezá ahora. No pienses, hacé.`;
      } else {
        return '¡Excelente! Sin tareas pendientes. Agregá un nuevo desafío o disfruta tu productividad.';
      }
    }

    if (message.includes('calendario') || message.includes('calendario')) {
      // Abrir panel de calendario sin cerrar otros paneles
      setShowCalendar(true);
      return 'Aquí está tu calendario. Planificá tu semana como un campeón. Sin excusas.';
    }

    if (message.includes('progreso') || message.includes('estadísticas') || message.includes('gráfico')) {
      // Abrir panel de progreso sin cerrar otros paneles
      setShowProgress(true);
      return 'Tus estadísticas de productividad. Mirá lo que podés lograr cuando dejás de procrastinar.';
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

  let shinyAssistantColorIndex = 0;

  return (
    <>
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
      <div className={`flex h-full ${isDarkMode || isShinyMode ? 'bg-black text-white' : 'bg-white text-black'} flex-col`}>
      {/* Main Content - Chat + Side Tasks */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Messages Area */}
        <div
          className={`overflow-y-auto px-4 pt-4 pb-8 transition-all duration-300 absolute left-0 right-0 ${
            isShinyMode ? 'bg-black' : isDarkMode ? 'bg-black' : 'bg-white'
          }`}
          style={{
            zIndex: 100,
            top: '0px',
            bottom: panelHeight > 0
              ? `${panelHeight + 60}px` // Dejar 60px para input + espacio del panel
              : '40px' // Dejar solo 40px para input cuando no hay panel (más arriba)
          }}
        >
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
              {(() => {
                let assistantBubbleStyle: React.CSSProperties | undefined;
                if (message.role === 'assistant') {
                  if (isShinyMode) {
                    assistantBubbleStyle = {
                      borderColor: shinyMessageColors[shinyAssistantColorIndex++ % shinyMessageColors.length],
                      borderWidth: '2px'
                    };
                  } else {
                    assistantBubbleStyle = { borderColor: undefined, borderWidth: undefined };
                  }
                }
                return (
                  <div
                    className={`px-4 py-3 rounded-2xl relative group ${
                  message.role === 'assistant'
                    ? isShinyMode
                      ? 'bg-black text-white border border-white shadow-md'
                      : `${isDarkMode ? 'bg-black text-white border-2 border-white' : 'bg-white text-black border border-gray-300'} shadow-md`
                    : isShinyMode
                      ? 'bg-white text-black border border-white shadow-md'
                    : isDarkMode
                        ? 'bg-gray-400 text-black border border-black shadow-md'
                        : 'bg-gray-300 border border-gray-300 text-black shadow-md'
                }`}
                    style={assistantBubbleStyle}
                  >

                <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{
                color: message.role === 'assistant'
                  ? (isDarkMode || isShinyMode ? '#FFFFFF !important' : '#000000 !important')
                  : isDarkMode
                    ? '#000000 !important'
                    : (isShinyMode ? '#000000 !important' : '#000000 !important'),
                backgroundColor: 'transparent',
                opacity: 1,
                WebkitTextFillColor: message.role === 'assistant'
                  ? (isDarkMode || isShinyMode ? '#FFFFFF' : '#000000')
                  : isDarkMode
                    ? '#000000'
                    : (isShinyMode ? '#000000' : '#000000')
              }}
            >
                  {message.content}
                </p>

                {/* Timestamp with improved styling */}
                <div className={`text-xs mt-2 flex items-center space-x-1 ${
                  message.role === 'assistant'
                    ? 'text-gray-500 dark:text-gray-400'
                    : isShinyMode
                      ? 'text-gray-300'
                      : isDarkMode
                        ? 'text-gray-200'
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

                {/* Botón de Mercado Pago */}
                {message.showMercadoPagoButton && (
                  <button
                    onClick={() => {
                      // Enviar evento para abrir modal de pago (cuando exista)
                      const buyDarkEvent = new CustomEvent('buy-dark-mode', {
                        detail: {
                          source: 'chat-button',
                          timestamp: new Date()
                        }
                      });
                      window.dispatchEvent(buyDarkEvent);
                    }}
                    className={`w-full mt-3 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md border-2 ${
                      isShinyMode || isDarkMode
                        ? 'bg-white text-black border-white hover:bg-gray-100'
                        : 'bg-black text-white border-black hover:bg-gray-800'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Pagar con Mercado Pago
                  </button>
                )}

              </div>
                );
              })()}
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
        <FixedPanelContainer
          isOpen={showSideTasks}
          onClose={() => setShowSideTasks(false)}
          onHeightChange={handlePanelHeightChange}
          minHeight={400}
                  >
          <SimpleSideTasksPanel onClose={() => setShowSideTasks(false)} />
        </FixedPanelContainer>

        {/* Progress Panel - Altura predefinida */}
        <FixedPanelContainer
          isOpen={showProgress}
          onClose={() => setShowProgress(false)}
          onHeightChange={handlePanelHeightChange}
          minHeight={400}
                  >
          <SimpleProgressPanel onClose={() => setShowProgress(false)} />
        </FixedPanelContainer>

        {/* Calendar Panel - Altura predefinida */}
        <FixedPanelContainer
          isOpen={showCalendar}
          onClose={() => setShowCalendar(false)}
          onHeightChange={handlePanelHeightChange}
                  >
          <SimpleCalendarPanel onClose={() => setShowCalendar(false)} />
        </FixedPanelContainer>

        {/* Enhanced Input Area with improved colors - Positionado arriba de los paneles */}
        <div
          className={`${isShinyMode ? 'bg-black' : isDarkMode ? 'bg-black' : 'bg-gray-100'} backdrop-blur-sm px-3 pb-2 pt-0 absolute left-0 right-0`}
          style={{
            zIndex: 100,
            bottom: panelHeight > 0 ? `${panelHeight}px` : '20px',
            backgroundColor: isShinyMode ? '#000000' : undefined
          }}
        >
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder=""
                className={`w-full py-2 pr-10 border rounded-full leading-relaxed focus:outline-none focus:border-2 focus:shadow-lg transition-all duration-200 shadow-sm steeb-chat-input steeb-nuclear-input ${
                  isShinyMode
                    ? 'bg-black text-white border-white focus:!border-white'
                    : isDarkMode
                      ? 'bg-black text-white border-gray-600 focus:!border-gray-400'
                      : 'bg-white text-black border-gray-300 focus:!border-black'
                } ${inputMessage ? 'pl-3' : 'pl-10'}`}
                style={{
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  fontWeight: '400',
                  fontSize: '16px'
                }}
              />
              {/* Cursor clásico parpadeante */}
              {!inputMessage && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <div
                    className={`w-0.5 h-4 ${isShinyMode || isDarkMode ? 'bg-white' : 'bg-black'}`}
                    style={{
                      animation: 'blink 1s step-end infinite'
                    }}
                  ></div>
                </div>
              )}

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
              data-custom-color="true"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className={`steeb-chat-send-button w-10 h-10 rounded-full flex items-center justify-center disabled:cursor-not-allowed transition-all duration-200 shadow-md border-2 ${
                isShinyMode
                  ? 'bg-black border-white hover:bg-black'
                  : isDarkMode
                    ? 'bg-black border-gray-700 hover:bg-gray-800'
                    : 'bg-white border-white hover:bg-gray-100'
              }`}
              style={{
                boxShadow: isDarkMode
                  ? '10px 12px 25px -10px rgba(255,255,255,0.45), 0 18px 22px -10px rgba(0,0,0,0.65)'
                  : undefined
              }}
            >
              <ArrowUp
                className={`w-4 h-4 ${isShinyMode || isDarkMode ? 'text-white' : 'text-black'}`}
                strokeWidth={2}
                stroke="currentColor"
                fill="none"
              />
            </button>

          </div>


        </div>
      </div>
    </div>
    </>
  );
};

export default SteebChatAI;
