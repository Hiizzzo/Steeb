import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, X, Check, Trash2, Bot, User, Clock, Sparkles, CreditCard } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { dailySummaryService } from '@/services/dailySummaryService';
import { sendMessageToSteeb, SteebAction } from '@/services/steebApi';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useFirebaseRoleCheck } from '@/hooks/useFirebaseRoleCheck';
import FixedPanelContainer from './FixedPanelContainer';
import SimpleSideTasksPanel from './SimpleSideTasksPanel';
import SimpleProgressPanel from './SimpleProgressPanel';
import SimpleCalendarPanel from './SimpleCalendarPanel';

interface PaymentOption {
  id: string;
  label: string;
  price: string;
  action: string;
  planId: string;
  className?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  category?: 'general' | 'task' | 'productivity' | 'motivation';
  showMercadoPagoButton?: boolean; // Nueva propiedad para mostrar botÃ³n
  paymentOptions?: PaymentOption[]; // Opciones de pago mÃºltiples
}

const formatOrdinalEs = (position: number) => {
  if (!position || position < 1) return 'primer';
  const map: Record<number, string> = {
    1: 'primer',
    2: 'segundo',
    3: 'tercer',
    4: 'cuarto',
    5: 'quinto',
    6: 'sexto',
    7: 'septimo',
    8: 'octavo',
    9: 'noveno',
    10: 'decimo'
  };
  return map[position] || `${position}?`;
};

const SteebChatAI: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark';
  const isShinyMode = currentTheme === 'shiny';
  const shinyMessageColors = ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];
  const { tasks, addTask, toggleTask, deleteTask } = useTaskStore();
  const { user } = useAuth();
  const { tipoUsuario } = useFirebaseRoleCheck();
  
  // Estado para el juego Shiny
  const [shinyGameState, setShinyGameState] = useState<'idle' | 'confirming' | 'playing'>('idle');
  const [shinyRolls, setShinyRolls] = useState<number | null>(null);
  // Render helper: resaltar la palabra Shiny con gradiente animado
  const renderMessageContent = (text: string) => {
    // Regex para detectar Shiny y BLACK (con o sin asteriscos)
    const parts = text.split(/(Shiny|\*\*BLACK\*\*|BLACK)/i);
    return parts.map((part, index) => {
      const lowerPart = part.toLowerCase();
      
      if (lowerPart === 'shiny') {
        return (
          <span
            key={`shiny-${index}`}
            className="shiny-word"
            style={{
              // 7 colores del calendario shiny: rojo, naranja, amarillo, verde, cian, violeta, magenta
              background: 'linear-gradient(90deg, #ff004c, #ff7a00, #ffe600, #00ff66, #00c2ff, #8b00ff, #ff00ff)',
              backgroundSize: '500% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shinyShift 4s ease-in-out infinite',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}
          >
            SHINY
          </span>
        );
      }
      
      if (lowerPart === 'black' || lowerPart === '**black**') {
        return (
          <span
            key={`black-${index}`}
            style={{
              fontFamily: '"Reverie", cursive',
              fontWeight: 400,
              fontStyle: 'normal',
              textTransform: 'none',
              letterSpacing: '0.05em',
              fontSize: '2.0em',
              lineHeight: '0.8',
              verticalAlign: 'middle',
              margin: '0 8px', // Más espacio
              // Si es dark mode, blanco brillante; si es light, negro intenso
              color: isDarkMode || isShinyMode ? '#ffffff' : '#000000',
              textShadow: isDarkMode || isShinyMode
                ? '0 0 10px rgba(255,255,255,0.5)'
                : '0 0 1px rgba(0,0,0,0.1)'
            }}
          >
            Black
          </span>
        );
      }

      return part;
    });
  };

  // Helper: get task context - moved to top to avoid hoisting issues
  const getTaskContext = () => {
    const pendingTasks = tasks.filter(task => !task.completed);
    const completedToday = tasks.filter(task =>
      task.completed &&
      new Date(task.completedDate || task.createdAt).toDateString() === new Date().toDateString()
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
    'hola': 'Â¡Hola! Â¿QuÃ© tareitas tenemos para hoy?',
    'buenos dÃ­as': 'Â¡Buenos dÃ­as! ðŸ’ª Empecemos el dÃ­a con energÃ­a.',
    'buenas tardes': 'Â¡Buenas tardes! Â¿CÃ³mo va tu productividad hoy?',
    'buenas noches': 'Â¡Buenas noches! ðŸŒ™ Terminemos el dÃ­a fuerte.',
    'cÃ³mo estÃ¡s': 'Â¡Estoy listo para ayudarte! Â¿QuÃ© necesitamos hacer?',
    'ayuda': 'Puedo crear tareas, mostrar tu progreso y motivarte. Â¡Escribe "tareas" para ver! Los paneles de progreso y calendario se abren sin mensajes.',
    'tareas': 'SPECIAL_COMMAND:OPEN_TASKS',
    'tarea': 'SPECIAL_COMMAND:OPEN_TASKS',
    'mis tareas': 'SPECIAL_COMMAND:OPEN_TASKS',
    'ver tareas': 'SPECIAL_COMMAND:OPEN_TASKS',
    'lista de tareas': 'SPECIAL_COMMAND:OPEN_TASKS',
    'que tengo que hacer': 'SPECIAL_COMMAND:OPEN_TASKS',
    'pendientes': 'SPECIAL_COMMAND:OPEN_TASKS',
    'progreso': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'ver progreso': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'mis estadÃ­sticas': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'estadÃ­sticas': 'SPECIAL_COMMAND:OPEN_PROGRESS',
    'mÃ©tricas': 'SPECIAL_COMMAND:OPEN_PROGRESS',
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
    'motÃ­rame': 'Â¡TÃº puedes! ðŸ’ª Cada tarea completada te acerca a tu meta.',
    'gracias': 'Â¡De nada! Estoy aquÃ­ para ayudarte a lograr tus metas.',
    'adiÃ³s': 'Â¡Hasta luego! Termina bien tus tareas.',
    'ok': 'Â¡Perfecto! Vamos por ello.',
    'estoy cansado': 'Descansa un poco, Â¡pero no te rindas! ðŸš€',
    'no sÃ© quÃ© hacer': 'Empecemos con algo pequeÃ±o. Â¿CuÃ¡l es la tarea mÃ¡s sencilla que puedes hacer ahora?',
    'estoy aburrido': 'Â¡Perfecto momento para avanzar en esas tareas pendientes! ðŸ“‹',
    'feliz': 'Â¡Me encanta tu energÃ­a! CanalÃ­zala en una tarea y verÃ¡s resultados. âš¡',
    'triste': 'Â¡No te preocupes! Una pequeÃ±a tarea puede mejorar tu estado de Ã¡nimo. ðŸ’™',
    'comprar dark mode': 'SPECIAL_COMMAND:BUY_DARK_MODE',
    'comprar modo dark': 'SPECIAL_COMMAND:BUY_DARK_MODE',
    'quiero dark mode': 'SPECIAL_COMMAND:BUY_DARK_MODE',
    'quiero modo dark': 'SPECIAL_COMMAND:BUY_DARK_MODE'
  };

  const getInitialMessage = () => {
    return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
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

  // Inyectar keyframes para el gradiente animado (una sola vez)
  useEffect(() => {
    const styleId = 'shiny-shift-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes shinyShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .shiny .shiny-option-btn {
          background: #000 !important;
          border: none !important;
          box-shadow: none !important;
          filter: none !important;
          opacity: 1 !important;
        }
        .dark .shiny-option-btn {
          background: #000 !important;
          border: none !important;
          box-shadow: none !important;
          filter: none !important;
          opacity: 1 !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Manejar resumen diario
  useEffect(() => {
    const checkAndSaveDailySummary = async () => {
      const today = new Date().toISOString().split('T')[0];
      const lastSummaryDate = localStorage.getItem('steeb_last_summary_date');
      
      // Si ya se guardÃ³ un resumen hoy, no hacer nada
      if (lastSummaryDate === today) return;
      
      // Si hay un resumen del dÃ­a anterior, guardarlo
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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const appendAssistantMessage = useCallback(
    (content: string) => {
      if (!content || !content.trim()) return;
      setMessages(prev => [
        ...prev,
        {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          role: 'assistant',
          content: content.trim(),
          timestamp: new Date(),
          category: 'general'
        }
      ]);
      setTimeout(() => scrollToBottom(), 50);
    },
    [scrollToBottom]
  );

  const handleSteebActions = useCallback(
    async (actions: SteebAction[] = []) => {
      if (!actions.length) return;

      for (const action of actions) {
        if (!action?.type) continue;

        try {
          switch (action.type) {
            case 'OPEN_CALENDAR': {
              setShowCalendar(true);
              setShowSideTasks(false);
              setShowProgress(false);

              const planItems = Array.isArray(action.payload?.plan) ? action.payload.plan : [];
              if (planItems.length) {
                const planLines = planItems
                  .map((block: any, index: number) => {
                    const label =
                      typeof block?.label === 'string' && block.label.trim().length
                        ? block.label.trim()
                        : `Bloque ${index + 1}`;
                    const durationText =
                      typeof block?.duration === 'number' && block.duration > 0
                        ? ` (${block.duration} min)`
                        : '';
                    return `${index + 1}. ${label}${durationText}`;
                  })
                  .join('\n');
                const notes =
                  typeof action.payload?.notes === 'string' && action.payload.notes.trim().length
                    ? `\nNotas: ${action.payload.notes.trim()}`
                    : '';
                appendAssistantMessage(`Plan listo:\n${planLines}${notes}`);
              }
              break;
            }
            case 'OPEN_TASKS':
              setShowSideTasks(true);
              setShowCalendar(false);
              setShowProgress(false);
              break;
            case 'OPEN_PROGRESS':
              setShowProgress(true);
              setShowSideTasks(false);
              break;
            case 'CREATE_TASK': {
              const title =
                typeof action.payload?.title === 'string' && action.payload.title.trim().length
                  ? action.payload.title.trim()
                  : 'Tarea sugerida por Steeb';

              await addTask({
                title,
                description:
                  typeof action.payload?.description === 'string'
                    ? action.payload.description
                    : undefined,
                type: 'extra',
                status: 'pending',
                completed: false,
                scheduledDate:
                  typeof action.payload?.date === 'string' ? action.payload.date : undefined,
                scheduledTime:
                  typeof action.payload?.time === 'string' ? action.payload.time : undefined
              });

              appendAssistantMessage(`Tarea creada: ${title}`);
              break;
            }
            case 'BUY_DARK_MODE':
              window.dispatchEvent(
                new CustomEvent('buy-dark-mode', {
                  detail: { source: 'steeb-ai', ...(action.payload || {}) }
                })
              );
              break;
            case 'BUY_SHINY_ROLLS': {
              const planId =
                typeof action.payload?.planId === 'string' && action.payload.planId.trim().length
                  ? action.payload.planId
                  : 'shiny-roll-1';
              window.dispatchEvent(
                new CustomEvent('buy-shiny-rolls', {
                  detail: { source: 'steeb-ai', planId }
                })
              );
              break;
            }
            case 'PLAY_SHINY_GAME':
              setShinyGameState('confirming');
              break;
          case 'SHOW_MOTIVATION': {
            const note =
              typeof action.payload?.note === 'string' && action.payload.note.trim().length
                ? action.payload.note.trim()
                : '';
            if (note) {
              appendAssistantMessage(note);
            }
            break;
          }
          case 'GET_SHINY_STATS': {
            try {
              const stats = await getGlobalShinyStats(user?.id);
              const total = stats.totalShinyUsers;
              let summary =
                total === 0
                  ? 'Todavía nadie desbloqueó el modo SHINY. Podés ser el primer usuario en lograrlo.'
                  : `Solo ${total} personas tienen el modo SHINY.`;

              if (stats.userStats?.isShiny) {
                summary += ` Vos sos el ${formatOrdinalEs(stats.userStats.position)} usuario en conseguirlo.`;
              } else {
                summary += ` Podrías ser el ${formatOrdinalEs(total + 1)} si ganás.`;
              }

              appendAssistantMessage(summary);
            } catch (statsError) {
              console.error('Error consultando stats shiny:', statsError);
              appendAssistantMessage('No pude consultar las estadísticas shiny ahora mismo.');
            }
            break;
          }
          default:
            break;
        }
      } catch (actionError) {
        console.error('Error ejecutando accion de STEEB:', action, actionError);
      }
    }
  },
    [addTask, appendAssistantMessage, setShowCalendar, setShowProgress, setShowSideTasks, setShinyGameState, user?.id]
  );


  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Escuchar mensajes del ThemeToggle
  useEffect(() => {
    const handleSteebMessage = (event: CustomEvent) => {
      const { type, content, timestamp, showMercadoPagoButton, paymentOptions } = event.detail;

      if (type === 'theme-info' || type === 'theme-info-with-button' || type === 'theme-info-with-options') {
        const aiMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: content,
          timestamp: timestamp || new Date(),
          category: 'general',
          showMercadoPagoButton: showMercadoPagoButton || false,
          paymentOptions: paymentOptions || undefined
        };

        setMessages(prev => [...prev, aiMessage]);

        // Scroll al final para mostrar el nuevo mensaje
        scrollToBottom();
      }
    };

    // Escuchar los eventos personalizados
    window.addEventListener('steeb-message', handleSteebMessage as EventListener);
    window.addEventListener('steeb-message-with-button', handleSteebMessage as EventListener);
    window.addEventListener('steeb-message-with-options', handleSteebMessage as EventListener);

    // Limpiar los event listeners al desmontar
    return () => {
      window.removeEventListener('steeb-message', handleSteebMessage as EventListener);
      window.removeEventListener('steeb-message-with-button', handleSteebMessage as EventListener);
      window.removeEventListener('steeb-message-with-options', handleSteebMessage as EventListener);
    };
  }, []);

  // Manejar cambios de altura del panel
  const handlePanelHeightChange = (height: number) => {
    setPanelHeight(height);

    // Si el panel ocupa mÃ¡s del 85% de la pantalla, el chat casi no se ve
    const screenHeight = window.innerHeight;
    const threshold = screenHeight * 0.85;

    // Scroll al fondo con un pequeÃ±o delay para que la transiciÃ³n se complete
    scrollToBottom();
  };

  // Resetear altura del panel cuando se cierra
  useEffect(() => {
    if (!showSideTasks && !showProgress && !showCalendar) {
      setPanelHeight(0);
    }
  }, [showSideTasks, showProgress, showCalendar, scrollToBottom]);

  // Scroll al fondo cuando se abre/cierra un panel para ajustar la vista
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 300); // PequeÃ±o delay para que la transiciÃ³n del panel se complete

    return () => clearTimeout(timer);
  }, [showSideTasks, showProgress, showCalendar, scrollToBottom]);

  // Detectar respuestas predefinidas - PR #142
  const getPredefinedResponse = (message: string): string | null => {
    const normalizedMessage = message.toLowerCase().trim();

    console.log('ðŸ” Debug - Mensaje normalizado:', `"${normalizedMessage}"`);
    console.log('ðŸ” Debug - Respuestas disponibles:', Object.keys(predefinedResponses));

    // Buscar coincidencia exacta
    if (predefinedResponses[normalizedMessage]) {
      console.log('âœ… Debug - Coincidencia exacta encontrada:', normalizedMessage);
      return predefinedResponses[normalizedMessage];
    }

    // Buscar coincidencias parciales
    for (const [key, response] of Object.entries(predefinedResponses)) {
      if (normalizedMessage.includes(key) || key.includes(normalizedMessage)) {
        console.log('âœ… Debug - Coincidencia parcial encontrada:', key, '->', response);
        return response;
      }
    }

    console.log('âŒ Debug - No se encontrÃ³ respuesta predefinida para:', normalizedMessage);
    return null;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setInputMessage('');

    // --- LÃ“GICA DEL JUEGO SHINY ---
    if (shinyGameState === 'confirming') {
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('si') || lowerMsg.includes('sÃ­') || lowerMsg.includes('dale') || lowerMsg.includes('ok')) {
        setShinyGameState('playing');
        const userMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        setTimeout(() => {
          const aiMessage: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: '¡Excelente! Estoy pensando en un número del 1 al 100...\n\n¿Cuál crees que es? ¡Escribe tu número!',
            timestamp: new Date(),
            category: 'general'
          };
          setMessages(prev => [...prev, aiMessage]);
        }, 500);
        return;
      } else {
        setShinyGameState('idle');
        const userMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        
        setTimeout(() => {
          const aiMessage: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: 'Entendido. AvÃ­same cuando quieras intentar desbloquear el modo Shiny. âœ¨',
            timestamp: new Date(),
            category: 'general'
          };
          setMessages(prev => [...prev, aiMessage]);
        }, 500);
        return;
      }
    }

    if (shinyGameState === 'playing') {
      const guess = parseInt(message);
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      if (isNaN(guess) || guess < 1 || guess > 100) {
        setTimeout(() => {
          const aiMessage: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: 'Eso no parece un nÃºmero vÃ¡lido entre 1 y 100. Intenta de nuevo. ðŸ”¢',
            timestamp: new Date(),
            category: 'general'
          };
          setMessages(prev => [...prev, aiMessage]);
        }, 500);
        return;
      }

      // Enviar intento al backend
      setIsTyping(true);
      try {
        // Importar dinÃ¡micamente para evitar problemas de dependencias circulares si las hubiera
        const { playShinyGame } = await import('@/services/steebApi');
        // Pasar el ID del usuario autenticado si existe
        const result = await playShinyGame(guess, user?.id);
        
        setIsTyping(false);
        
        if (result.success) {
          const aiMessage: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: result.message, // El backend ya devuelve el mensaje con pistas
            timestamp: new Date(),
            category: 'general'
          };
          setMessages(prev => [...prev, aiMessage]);

          if (result.won) {
             setShinyGameState('idle');
             // Recargar pÃ¡gina o notificar cambio de tema tras un breve delay
             setTimeout(() => {
               window.location.reload();
             }, 3000);
          } else {
             // Si perdiÃ³, preguntar si quiere jugar de nuevo si tiene tiradas
             if (result.remainingRolls > 0) {
               setTimeout(() => {
                 const retryMessage: ChatMessage = {
                   id: `msg_${Date.now() + 2}`,
                   role: 'assistant',
                   content: `Te quedan ${result.remainingRolls} tiradas. Â¿QuerÃ©s intentar de nuevo?`,
                   timestamp: new Date(),
                   category: 'general'
                 };
                 setMessages(prev => [...prev, retryMessage]);
                 setShinyGameState('confirming');
               }, 1000);
             } else {
               setShinyGameState('idle');
               setTimeout(() => {
                 const noRollsMessage: ChatMessage = {
                   id: `msg_${Date.now() + 2}`,
                   role: 'assistant',
                   content: 'Te quedaste sin tiradas por hoy. Â¡PodÃ©s comprar mÃ¡s para seguir intentando! ðŸ’Ž',
                   timestamp: new Date(),
                   category: 'general',
                   showMercadoPagoButton: true
                 };
                 setMessages(prev => [...prev, noRollsMessage]);
               }, 1000);
             }
          }
        } else {
          // Error del backend (ej: sin permisos, sin tiradas, límite diario)
          setShinyGameState('idle');
          const errorMessage: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: result.message || 'Hubo un problema procesando tu intento.',
            timestamp: new Date(),
            category: 'general'
          };
          setMessages(prev => [...prev, errorMessage]);

          // Si es límite diario y tiene nextAttemptIn, podríamos mostrar algo más específico si quisiéramos,
          // pero el mensaje del backend ya viene formateado.
        }

      } catch (error) {
        setIsTyping(false);
        setShinyGameState('idle');
        console.error('Error jugando Shiny:', error);
        const errorMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: 'OcurriÃ³ un error de conexiÃ³n. Intenta mÃ¡s tarde.',
          timestamp: new Date(),
          category: 'general'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      return;
    }

    // Detectar intenciÃ³n de jugar Shiny (PRIORIDAD ALTA)
    const lowerMsg = message.toLowerCase();
    const shinyKeywords = ['shiny', 'jugar', 'desbloquear', 'modo', 'tirada', 'tiradas', 'intentar', 'probar'];
    const isShinyIntent = lowerMsg.includes('shiny') || (lowerMsg.includes('tirada') && lowerMsg.includes('jugar'));

    if (isShinyIntent) {
       const normalizedTipo = (tipoUsuario || 'white').toLowerCase();
       
       if (normalizedTipo === 'white') {
          const userMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: message,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage]);

          setTimeout(() => {
            const aiMessage: ChatMessage = {
              id: `msg_${Date.now() + 1}`,
              role: 'assistant',
              content: 'Para acceder al modo SHINY, primero necesitas ser usuario **Black**.',
              timestamp: new Date(),
              category: 'general'
            };
            setMessages(prev => [...prev, aiMessage]);
          }, 500);
          return;
       }

       setShinyGameState('confirming');
       const userMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        setTimeout(() => {
          const aiMessage: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: `¿Querés gastar tus tiradas para desbloquear el modo SHINY?\n\nActualmente tenés ${shinyRolls || 0} tiradas disponibles.`,
            timestamp: new Date(),
            category: 'general'
          };
          setMessages(prev => [...prev, aiMessage]);
        }, 500);
        return;
    }

    // Detectar pregunta sobre tiradas restantes
    const rollsKeywords = ['cuantas tiradas', 'cuántas tiradas', 'mis tiradas', 'tengo tiradas', 'intentos me quedan', 'intentos quedan'];
    const isRollsQuery = rollsKeywords.some(keyword => lowerMsg.includes(keyword));

    if (isRollsQuery) {
      const normalizedTipo = (tipoUsuario || 'white').toLowerCase();
      
      if (normalizedTipo === 'white') {
         const userMessage: ChatMessage = {
           id: `msg_${Date.now()}`,
           role: 'user',
           content: message,
           timestamp: new Date()
         };
         setMessages(prev => [...prev, userMessage]);

         setTimeout(() => {
           const aiMessage: ChatMessage = {
             id: `msg_${Date.now() + 1}`,
             role: 'assistant',
             content: 'Para tener tiradas del modo SHINY, primero necesitas ser usuario **Black**.',
             timestamp: new Date(),
             category: 'general'
           };
           setMessages(prev => [...prev, aiMessage]);
         }, 500);
         return;
      }

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);

      try {
        const { getShinyStatus } = await import('@/services/steebApi');
        const status = await getShinyStatus(user?.id);
        
        setIsTyping(false);
        
        if (status.isShiny) {
           const aiMessage: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: '¡Ya sos usuario Shiny! 🌟 No necesitas más tiradas, ya tenés acceso ilimitado.',
            timestamp: new Date(),
            category: 'general'
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          const dailyText = status.dailyAttemptAvailable ? '✅ 1 intento diario disponible' : '❌ Intento diario usado';
          const extraText = status.extraRolls > 0 ? `💎 ${status.extraRolls} tiradas extra compradas` : '0 tiradas extra';
          
          const aiMessage: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: `Estado de tus tiradas Shiny:\n\n${dailyText}\n${extraText}\n\nTotal disponible ahora: ${status.totalAvailable} intentos. 🎲`,
            timestamp: new Date(),
            category: 'general',
            showMercadoPagoButton: status.totalAvailable === 0 // Mostrar botón de compra si no tiene tiradas
          };
          setMessages(prev => [...prev, aiMessage]);
        }
      } catch (error) {
        setIsTyping(false);
        const errorMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: 'No pude verificar tus tiradas en este momento. Intenta más tarde.',
          timestamp: new Date(),
          category: 'general'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      return;
    }
    // -----------------------------

    // Detectar si es un comando de panel ANTES de agregar mensaje de usuario
    const predefinedResponse = getPredefinedResponse(message);

    // Comandos que abren paneles - manejarlos silenciosamente
    if (predefinedResponse === 'SPECIAL_COMMAND:OPEN_PROGRESS') {
      console.log('ðŸš€ Abriendo panel de progreso sin mensajes...');
      setShowProgress(true);
      return;
    }

    if (predefinedResponse === 'SPECIAL_COMMAND:OPEN_CALENDAR') {
      console.log('ðŸ“… Abriendo panel de calendario sin mensajes...');
      setShowCalendar(true);
      return;
    }

    if (predefinedResponse === 'SPECIAL_COMMAND:OPEN_TASKS') {
      console.log('ðŸ“‹ Abriendo panel de tareas sin mensajes...');
      setShowSideTasks(true);
      return;
    }

    if (predefinedResponse === 'SPECIAL_COMMAND:BUY_DARK_MODE') {
      console.log('ðŸ’³ Comprando Dark Mode...');

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
        content: 'Â¡Excelente decisiÃ³n! Estoy abriendo el proceso de compra para el Dark Mode por $1. Te darÃ¡ acceso inmediato + 1 intento gratis para Shiny. ðŸŒ™',
        timestamp: new Date(),
        category: 'general'
      };
      setMessages(prev => [...prev, confirmationMessage]);

      // Enviar segundo mensaje con botÃ³n de Mercado Pago
      setTimeout(() => {
        const mercadoPagoMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: `# $1

### 1 intento gratis del modo SHINY`,
          timestamp: new Date(),
          category: 'general',
          showMercadoPagoButton: true // Nueva propiedad para mostrar el botÃ³n
        };
        setMessages(prev => [...prev, mercadoPagoMessage]);

        // Scroll al final para mostrar el nuevo mensaje
        scrollToBottom();
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
    // Si llegamos aquÃ­, es porque no es un comando de panel, pero puede tener respuesta predefinida
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
      // NO esperar - crear tarea en background, mostrar confirmaciÃ³n instantÃ¡neamente
      addTask({
        title: taskTitle,
        completed: false,
        type: 'extra',
        status: 'pending'
      }).catch(err => console.error('Error sincronizando tarea:', err));
      
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `âœ… "${taskTitle}" creada`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setShowSideTasks(true);
      return;
    }

    setIsTyping(true);

    try {
      const { reply, actions } = await sendMessageToSteeb(message);

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: reply.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      await handleSteebActions(actions);
    } catch (error) {
      console.error('âš ï¸ Error comunicando con STEEB:', error);

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
    const timeOfDay = currentHour < 12 ? 'maÃ±ana' : currentHour < 18 ? 'tarde' : 'noche';

    // Enhanced pattern matching for more intelligent responses
    if (message.includes('hola') || message.includes('buen dÃ­a') || message.includes('hey')) {
      return `Â¡Buen ${timeOfDay}! Es hora de acciÃ³n. TenÃ©s ${taskContext.pending} tareas pendientes. Â¿CuÃ¡l vas a conquistar hoy?`;
    }

    if (message.includes('tarea') || message.includes('tareas')) {
      if (taskContext.pending > 0) {
        const responses = [
          `TenÃ©s ${taskContext.pending} tareas esperando. La procrastinaciÃ³n es tu enemiga. ElegÃ­ una y dominala ahora.`,
          `${taskContext.pending} tareas pendientes. Cada una es una oportunidad para ser mejor. EmpezÃ¡ con la mÃ¡s fÃ¡cil.`,
          `Vi ${taskContext.pending} tareas sin completar. El Ã©xito se construye tarea por tarea. Â¿CuÃ¡l empieza hoy?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      } else {
        return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
      }
    }

    if (message.includes('procrastinar') || message.includes('postergar') || message.includes('despuÃ©s')) {
      const responses = [
        'El "despuÃ©s" es el idioma de los mediocres. Los ganadores hablan en "ahora". Â¿CuÃ¡l elegÃ­s?',
        'Cada minuto que postergÃ¡s es un minuto que le regalÃ¡s a la mediocridad. Recuperalo ahora.',
        'La procrastinaciÃ³n es el impuesto que pagÃ¡s por no vivir tu potencial. Â¿Vas a seguir pagando?',
        'El momento perfecto fue hace 5 minutos. El segundo mejor momento es ahora. ActuÃ¡.'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (message.includes('motivaciÃ³n') || message.includes('Ã¡nimo') || message.includes('energÃ­a')) {
      const responses = [
        'La motivaciÃ³n no aparece mÃ¡gicamente. Se construye con cada tarea completada. HacÃ© la primera.',
        'El Ã¡nimo es subproducto de la acciÃ³n. Movete, aunque sea un paso pequeÃ±o. La energÃ­a seguirÃ¡.',
        'La motivaciÃ³n es para principiantes. Los profesionales usan disciplina. EmpezÃ¡ ahora.',
        'Tu energÃ­a mental es como un mÃºsculo: cuanto mÃ¡s lo ejercitas actuar, mÃ¡s fuerte se vuelve.'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (message.includes('ayuda') || message.includes('ayÃºdame')) {
      return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
    }

    if (message.includes('cÃ³mo') || message.includes('cÃ³mo')) {
      return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
    }

    if (message.includes('gracias') || message.includes('thank')) {
      return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
    }

    if (message.includes('cansado') || message.includes('fatiga') || message.includes('agotado')) {
      return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
    }

    if (message.includes('difÃ­cil') || message.includes('imposible') || message.includes('no puedo')) {
      return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
    }

    if (message.includes('plan') || message.includes('organizar')) {
      // Abrir panel de tareas y cerrar otros paneles
      setShowSideTasks(true);
      setShowCalendar(false);
      setShowProgress(false);
      return `Tu plan es simple: ${taskContext.pending > 0 ? `1) Completar ${taskContext.pending} tareas pendientes` : '1) Agregar nuevas metas'}, 2) Celebrar cada victoria, 3) Repetir maÃ±ana. Â¿Necesitas mÃ¡s detalles?`;
    }

    if (message.includes('calendario') || message.includes('calendario')) {
      // Abrir panel de calendario y cerrar otros paneles
      setShowCalendar(true);
      setShowSideTasks(false);
      setShowProgress(false);
      return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
    }

    if (message.includes('progreso') || message.includes('estadÃ­sticas') || message.includes('grÃ¡fico')) {
      // Abrir panel de progreso y cerrar otros paneles
      setShowProgress(true);
      setShowSideTasks(false);
      setShowCalendar(false);
      return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
    }

    if (message.includes('tiempo') || message.includes('cuÃ¡nto')) {
      const responses = [
        'El tiempo que gastas pensando en hacer la tarea es suficiente para completarla.',
        'No tienes tiempo para procrastinar, pero sÃ­ para triunfar. Usalo sabiamente.',
        'El tiempo es tu recurso mÃ¡s valioso. Cada minuto que usas productivamente es una inversiÃ³n en tu futuro.'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Default intelligent responses
    const defaultResponses = [
      'Hacelo ahora y despuÃ©s nos preocupamos.',
      'EmpezÃ¡ por la mÃ¡s fÃ¡cil y sigamos.',
      'Una por una, no hay otro secreto.',
      'Â¿Y si empezamos ya y vemos quÃ© pasa?',
      'Hoy es buen dÃ­a para terminar estas cosas.',
      'Vamos, son apenas 10 minutos de foco.',
      'DespuÃ©s de esto seguimos con lo nuestro.'
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
        return `TenÃ©s ${taskContext.pending} tareas pendientes. ElegÃ­ una y empezÃ¡ ahora. No pienses, hacÃ©.`;
      } else {
        return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
      }
    }

    if (message.includes('calendario') || message.includes('calendario')) {
      // Abrir panel de calendario sin cerrar otros paneles
      setShowCalendar(true);
      return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
    }

    if (message.includes('progreso') || message.includes('estadÃ­sticas') || message.includes('grÃ¡fico')) {
      // Abrir panel de progreso sin cerrar otros paneles
      setShowProgress(true);
      return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
    }

    if (message.includes('procrastinar') || message.includes('postergar')) {
      return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
    }

    if (message.includes('motivaciÃ³n') || message.includes('Ã¡nimo')) {
      return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
    }

    const fallbacks = [
      'Hacelo ahora y listo, seguimos.',
      'EmpezÃ¡, despuÃ©s vemos el resto.',
      'Una a la vez, asÃ­ se va.',
      'Vamos, terminemos esto rÃ¡pidamente.'
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
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}} />
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
              ? `${panelHeight + 12}px` // Dejar 60px para input + espacio del panel
              : '32px' // Dejar solo 40px para input cuando no hay panel (mÃ¡s arriba)
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
                  {renderMessageContent(message.content)}
                </p>

                {/* Timestamp with improved styling */}
                <div
                  className={`text-xs mt-2 flex items-center space-x-1 ${
                    message.role === 'assistant'
                      ? (isShinyMode ? 'text-white !important' : isDarkMode ? 'text-gray-300' : 'text-gray-500')
                      : (isShinyMode ? 'text-black !important' : 'text-white')
                  }`}
                >
                  <Clock className={`w-3 h-3 ${isShinyMode ? (message.role === 'assistant' ? 'text-white !important' : 'text-black !important') : ''}`} />
                  <span className={isShinyMode ? (message.role === 'assistant' ? 'text-white !important' : 'text-black !important') : ''}>
                    {message.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* BotÃ³n de Mercado Pago */}
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

                {/* Opciones de pago mÃºltiples */}
                {message.paymentOptions && (
                  <div className="mt-3 space-y-2">
                    {message.paymentOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          const event = new CustomEvent(option.action, {
                            detail: {
                              planId: option.planId,
                              timestamp: new Date()
                            }
                          });
                          window.dispatchEvent(event);
                        }}
                        className={`shiny-option-btn w-full py-2 px-3 rounded-xl font-medium flex items-center justify-between transition-all duration-200 ${
                          isShinyMode || isDarkMode
                            ? 'bg-black text-white border-0'
                            : 'bg-white text-black border-0'
                        }`}
                        style={isShinyMode || isDarkMode ? { backgroundColor: '#000000' } : undefined}
                      >
                    <span>{option.label}</span>
                    <span className={`font-bold ${isShinyMode || isDarkMode ? 'text-white' : 'text-black'}`}>
                      {option.price}
                    </span>
                  </button>
                ))}
              </div>
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
            bottom: panelHeight > 0 ? `${Math.max(panelHeight - 10, 12)}px` : '16px',
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
                    ? 'bg-white text-black border-white focus:!border-white'
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
              {/* Cursor clÃ¡sico parpadeante */}
              {!inputMessage && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <div
                    className={`w-0.5 h-4 ${isShinyMode ? 'bg-black' : isDarkMode ? 'bg-white' : 'bg-black'}`}
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
              className={`steeb-chat-send-button w-10 h-10 rounded-full flex items-center justify-center disabled:cursor-not-allowed transition-all duration-200 border-2 ${
                isShinyMode
                  ? 'bg-black border-white hover:bg-black'
                  : isDarkMode
                    ? 'bg-black border-gray-700 hover:bg-gray-800'
                    : 'bg-white border-white hover:bg-gray-100'
              }`}
            >
              {isShinyMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="url(#shiny-arrow-gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <defs>
                    <linearGradient id="shiny-arrow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff004c">
                        <animate attributeName="stop-color" values="#ff004c;#ff7a00;#ffe600;#00ff66;#00c2ff;#8b00ff;#ff00ff;#ff004c" dur="4s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="100%" stopColor="#ff00ff">
                        <animate attributeName="stop-color" values="#ff00ff;#ff004c;#ff7a00;#ffe600;#00ff66;#00c2ff;#8b00ff;#ff00ff" dur="4s" repeatCount="indefinite" />
                      </stop>
                    </linearGradient>
                  </defs>
                  <path d="m5 12 7-7 7 7" />
                  <path d="M12 19V5" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  <path d="m5 12 7-7 7 7" />
                </svg>
              )}
            </button>

          </div>


        </div>
      </div>
    </div>
    </>
  );
};

export default SteebChatAI;









