import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, X, Check, Trash2, Bot, User, Clock, Sparkles, CreditCard, Volume2 } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { dailySummaryService } from '@/services/dailySummaryService';
import { sendMessageToSteeb, SteebAction, getGlobalShinyStats, type ShinyStatusResponse, fetchUserProfileRemote, saveUserProfileRemote } from '@/services/steebApi';
import { deepSeekService } from '@/services/deepSeekService';
import { notificationService } from '@/services/notificationService';
import { speechService } from '@/services/speechService';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useFirebaseRoleCheck } from '@/hooks/useFirebaseRoleCheck';
import { useUserRole } from '@/hooks/useUserRole';
import { getLocalUserProfile, saveLocalUserProfile } from '@/utils/localUserProfile';
import { flushPendingSteebMessages } from '@/utils/steebMessaging';
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
    7: 'séptimo',
    8: 'octavo',
    9: 'noveno',
    10: 'décimo'
  };
  return map[position] || `${position}º`;
};

interface SteebChatAIProps {
  isSleeping?: boolean;
}

const SteebChatAI: React.FC<SteebChatAIProps> = ({ isSleeping = false }) => {
  const [inputMessage, setInputMessage] = useState('');
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark';
  const isShinyMode = currentTheme === 'shiny';
  const isSteebSleeping = Boolean(isSleeping);
  const shinyMessageColors = ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];
  const { tasks, addTask, toggleTask, deleteTask } = useTaskStore();
  const { user, updateProfile } = useAuth();
  const { tipoUsuario } = useFirebaseRoleCheck();
  const { userProfile } = useUserRole();
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Estado para el juego Shiny
  const [profileOnboardingStep, setProfileOnboardingStep] = useState<'idle' | 'asking-name' | 'asking-nickname' | 'asking-schedule' | 'completed'>('idle');
  const onboardingNameRef = useRef<string>('');
  const [shinyGameState, setShinyGameState] = useState<'idle' | 'confirming' | 'playing'>('idle');
  const [shinyRolls, setShinyRolls] = useState<number | null>(null);
  const spokenMessagesRef = useRef<Set<string>>(new Set());
  const lastProactiveRef = useRef<number>(0);
  const getBestRollsCount = useCallback((...values: Array<number | null | undefined>) => {
    const valid = values.filter(
      (value): value is number => typeof value === 'number' && !Number.isNaN(value)
    );
    if (!valid.length) return 0;
    return Math.max(...valid);
  }, []);

  useEffect(() => {
    if (typeof userProfile?.shinyRolls === 'number') {
      setShinyRolls((prev) => getBestRollsCount(prev, userProfile.shinyRolls));
    }
  }, [getBestRollsCount, userProfile?.shinyRolls]);

  // Configurar voz infantil (TTS) para los mensajes de STEEB
  useEffect(() => {
    if (!voiceEnabled) return;
    speechService.enable().catch((err) => console.warn('No se pudo habilitar la voz:', err));
  }, [voiceEnabled]);
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

    // Asegurar que el contexto tenga la información más actualizada
    return {
      pending: pendingTasks.length,
      pendingList: pendingTasks.slice(0, 5).map(t => t.title),
      allPendingTasks: pendingTasks.map(t => t.title),
      completedToday: completedToday.length,
      completedTodayList: completedToday.map(t => t.title),
      hasTasks: tasks.length > 0,
      userName: userProfile?.name || user?.name || 'Usuario',
      userNickname: userProfile?.nickname || user?.nickname || '',
      userRole: tipoUsuario || 'white',
      shinyRolls: userProfile?.shinyRolls || 0,
      availabilityNote: userProfile?.availabilityNote || getLocalUserProfile(user?.id || '')?.availabilityNote || ''
    };
  };

const getInitialMessage = () => {
  return 'Hola, soy STEEB. Te recuerdo: si mandas "calendario", "tareas" o "progreso" por el chat, se abrir\u00e1 la ventana de cada una para que organices tu d\u00eda conmigo.';
};

const ANECDOTE_KEY = 'stebe_last_anecdote_date';

const SCHEDULED_SLOTS = [
  { slot: 'morning', hour: 9, minute: 0 },
  { slot: 'afternoon', hour: 15, minute: 0 },
  { slot: 'night', hour: 21, minute: 0 },
];

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
  const getProactiveMessage = useCallback((slot: 'morning' | 'afternoon' | 'night') => {
    const displayName = (userProfile?.nickname || userProfile?.name || user?.nickname || user?.name || 'amigo').trim();
    const slotTemplates: Record<string, string[]> = {
      morning: [
        `Hola ${displayName}, arrancamos tranqui. ¿Te propongo 1 tarea corta para empezar?`,
        `${displayName}, buen día. Si quieres, digo “prioriza” y te ordeno el día.`,
        `Hey ${displayName}, antes de que arranque todo: una tarea fácil y un vaso de agua. ¿te ayudo a elegir?`
      ],
      afternoon: [
        `Mid-day check, ${displayName}: ¿qué tal va el plan? Podemos tachar algo rápido ahora.`,
        `Hola ${displayName}, mitad de día: si sientes traba, decime “plan de ataque” y te armo el orden.`,
        `${displayName}, pausa corta: ¿hacemos un sprint de 15 minutos en una tarea chica?`
      ],
      night: [
        `Cierre del día, ${displayName}. ¿tachamos algo pequeño o prefieres un mini repaso?`,
        `Hola ${displayName}, noche tranquila: dime si quieres un resumen de pendientes para mañana.`,
        `${displayName}, antes de cerrar el día: ¿agendamos 1 cosa clave para mañana?`
      ]
    };
    const pool = slotTemplates[slot] || slotTemplates.morning;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [userProfile?.nickname, userProfile?.name, user?.nickname, user?.name]);

  // Hablar cada nuevo mensaje de STEEB con voz infantil
  useEffect(() => {
    if (!messages.length || !voiceEnabled) return;
    const last = messages[messages.length - 1];
    if (last.role !== 'assistant') return;
    if (spokenMessagesRef.current.has(last.id)) return;

    speechService.speak(last.content, { pitch: 1.35, rate: 1.05, lang: 'es-ES' });
    spokenMessagesRef.current.add(last.id);
  }, [messages, voiceEnabled]);
  const [showProgress, setShowProgress] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sleepNoticeRef = useRef(false);

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

  // Mensajes proactivos periódicos
  useEffect(() => {
    if (isSteebSleeping) return;
    if (profileOnboardingStep !== 'completed') return;

    const sendProactive = () => {
      if (isSteebSleeping) return;
      if (document.visibilityState === 'hidden') return;
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const hour = now.getHours();
      let slot: 'morning' | 'afternoon' | 'night' = 'morning';
      if (hour >= 15 && hour < 20) slot = 'afternoon';
      else if (hour >= 20 || hour < 6) slot = 'night';

      const slotKey = `stebe_slot_${today}_${slot}`;
      if (localStorage.getItem(slotKey)) return;

      const msg = getProactiveMessage(slot);
      appendAssistantMessage(msg);
      lastProactiveRef.current = Date.now();
      localStorage.setItem(slotKey, 'sent');
    };

    const initial = setTimeout(sendProactive, 8000);

    return () => {
      clearTimeout(initial);
    };
  }, [appendAssistantMessage, getProactiveMessage, isSteebSleeping, profileOnboardingStep]);

  useEffect(() => {
    if (isSteebSleeping) {
      if (!sleepNoticeRef.current) {
        appendAssistantMessage(
          'Steeb está durmiendo en este momento y no responde hasta que se despierte. Aprovechá para repasar tus tareas y vuelve más tarde.'
        );
        sleepNoticeRef.current = true;
      }
    } else {
      sleepNoticeRef.current = false;
    }
  }, [isSteebSleeping, appendAssistantMessage]);

  useEffect(() => {
    if (!user) return;
    if (profileOnboardingStep !== 'idle') return;

    const storedProfile = getLocalUserProfile(user.id);
    const knownName = (user.name || storedProfile?.name || '').trim();
    const knownNickname = (user.nickname || storedProfile?.nickname || '').trim();
    const availabilityNote = (storedProfile?.availabilityNote || '').trim();

    let timeoutId: NodeJS.Timeout;

    if (!knownName) {
      setProfileOnboardingStep('asking-name');
      timeoutId = setTimeout(() => {
        appendAssistantMessage('Me llamo Steeb, ¿cómo es tu nombre?');
      }, 400);
    } else {
      onboardingNameRef.current = knownName;

      if (!knownNickname) {
        setProfileOnboardingStep('asking-nickname');
        timeoutId = setTimeout(() => {
          appendAssistantMessage(`Veo que te llamas ${knownName}. Pero a todos nos gustan los apodos. ¿Cómo te gusta que te digan?`);
        }, 400);
      } else if (!availabilityNote) {
        setProfileOnboardingStep('asking-schedule');
        timeoutId = setTimeout(() => {
          appendAssistantMessage(
            'Antes de ayudarte, contame: ¿qué tan ocupado estás y qué horarios libres tenés? Decime mañana/tarde/noche y qué haces en cada bloque, así organizo tu día.'
          );
        }, 400);
      } else {
        setProfileOnboardingStep('completed');
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, profileOnboardingStep, appendAssistantMessage]);

  // Sincronizar perfil con backend (disponibilidad/agenda)
  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      try {
        const remote = await fetchUserProfileRemote(user.id);
        if (remote && typeof remote === 'object') {
          saveLocalUserProfile(user.id, remote);
          // Si ya estábamos pidiendo disponibilidad y llegó desde backend, marcamos completado
          if (profileOnboardingStep === 'asking-schedule' && remote.availabilityNote) {
            setProfileOnboardingStep('completed');
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    })();
  }, [user?.id, profileOnboardingStep]);

  const processSteebMessage = useCallback(
    (detail: any) => {
      if (!detail) return;
      const { type, content, timestamp, showMercadoPagoButton, paymentOptions } = detail || {};
      const isThemeMessage =
        type === 'theme-info' || type === 'theme-info-with-button' || type === 'theme-info-with-options';

      if (isThemeMessage) {
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
        scrollToBottom();
      } else if (typeof content === 'string' && content.trim().length) {
        appendAssistantMessage(content);
      }
    },
    [appendAssistantMessage, scrollToBottom]
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
            /* 
            // DESHABILITADO POR SEGURIDAD/UX: Steeb no debe abrir ventanas de compra automáticamente
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
            */
            case 'PLAY_SHINY_GAME': {
              const normalizedTipo = (tipoUsuario || 'white').toLowerCase();

              if (normalizedTipo === 'shiny') {
                appendAssistantMessage('¡Wowowow amigo! 🌟 ¡Ya sos usuario SHINY! No necesitas jugar más, ya sos parte de la élite.');
                break;
              }

              // Logic removed as per user request to avoid double messages
              // if (normalizedTipo === 'white') { ... }

              setShinyGameState('confirming');

              // Check rolls logic
              const realtimeRolls = typeof userProfile?.shinyRolls === 'number' ? userProfile.shinyRolls : null;
              let availableRolls = getBestRollsCount(shinyRolls, realtimeRolls);
              let shinyStatus: ShinyStatusResponse | null = null;

              try {
                const { getShinyStatus } = await import('@/services/steebApi');
                const status = await getShinyStatus(user?.id);
                shinyStatus = status;
                const totalFromStatus = typeof status?.totalAvailable === 'number' ? status.totalAvailable : undefined;
                const combinedRolls = getBestRollsCount(
                  totalFromStatus,
                  typeof realtimeRolls === 'number'
                    ? realtimeRolls + (status.dailyAttemptAvailable ? 1 : 0)
                    : undefined,
                  availableRolls
                );
                availableRolls = combinedRolls;
                setShinyRolls(combinedRolls);
              } catch (statusError) {
                console.error('Error obteniendo estado shiny:', statusError);
                availableRolls = getBestRollsCount(availableRolls, realtimeRolls);
                setShinyRolls(availableRolls);
              }

              const extraRollsFromStatus = typeof shinyStatus?.extraRolls === 'number' ? shinyStatus.extraRolls : undefined;
              const effectiveRolls = typeof extraRollsFromStatus === 'number' ? extraRollsFromStatus : availableRolls;

              if (effectiveRolls <= 0) {
                setShinyGameState('idle');
                setTimeout(() => {
                  const noRollsMessage: ChatMessage = {
                    id: `msg_${Date.now() + 1}`,
                    role: 'assistant',
                    content: 'No tenés tiradas disponibles. Podés comprar más para intentar desbloquear el modo SHINY.',
                    timestamp: new Date(),
                    category: 'general',
                    showMercadoPagoButton: true
                  };
                  setMessages(prev => [...prev, noRollsMessage]);
                }, 500);
                return;
              }

              const confirmationText = `¿Querés gastar una tirada para intentar desbloquear el modo SHINY?\n\nTenés ${effectiveRolls} tiradas disponibles.`;

              appendAssistantMessage(confirmationText);
              break;
            }
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
            case 'UPDATE_USER_PROFILE': {
              const { name, nickname } = action.payload || {};
              if (user?.id && (name || nickname)) {
                const currentName = name || userProfile?.name || user?.name || '';
                const currentNickname = nickname || userProfile?.nickname || user?.nickname || '';

                // Update local storage
                saveLocalUserProfile(user.id, {
                  name: currentName,
                  nickname: currentNickname
                });

                // Update Firebase
                updateProfile(currentName, currentNickname).catch(err =>
                  console.error('Error updating profile from AI action:', err)
                );

                // Update ref for immediate UI consistency
                if (name) onboardingNameRef.current = name;

                console.log('✅ Profile updated by AI:', { name, nickname });
              }
              break;
            }
            case 'SEND_NOTIFICATION': {
              const { title, body, urgency } = action.payload || {};
              const notifTitle = typeof title === 'string' && title.trim() ? title.trim() : 'STEEB';
              const notifBody = typeof body === 'string' && body.trim() ? body.trim() : 'Te estoy observando... 👁️';
              const tag = `steeb-${urgency || 'medium'}`;

              notificationService.sendImmediateNotification(notifTitle, notifBody, tag);
              console.log('🔔 STEEB envió notificación:', { title: notifTitle, body: notifBody });
              break;
            }
            case 'SCHEDULE_REMINDER': {
              const { title, body, delayMinutes } = action.payload || {};
              const reminderTitle = typeof title === 'string' && title.trim() ? title.trim() : 'STEEB - Recordatorio';
              const reminderBody = typeof body === 'string' && body.trim() ? body.trim() : '¿Cómo vas con esa tarea?';
              const delay = typeof delayMinutes === 'number' && delayMinutes > 0 ? delayMinutes : 15;

              setTimeout(() => {
                notificationService.sendImmediateNotification(reminderTitle, reminderBody, 'steeb-reminder');
                console.log('🔔 STEEB recordatorio ejecutado:', { title: reminderTitle, body: reminderBody });
              }, delay * 60 * 1000);

              appendAssistantMessage(`⏰ Te voy a recordar en ${delay} minutos.`);
              console.log('🔔 STEEB programó recordatorio para', delay, 'minutos');
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

  // Escuchar mensajes del ThemeToggle y otros eventos globales
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSteebMessage = (event: CustomEvent) => {
      processSteebMessage(event.detail);
    };

    window.addEventListener('steeb-message', handleSteebMessage as EventListener);
    window.addEventListener('steeb-message-with-button', handleSteebMessage as EventListener);
    window.addEventListener('steeb-message-with-options', handleSteebMessage as EventListener);

    flushPendingSteebMessages((detail) => {
      processSteebMessage(detail);
    });

    return () => {
      window.removeEventListener('steeb-message', handleSteebMessage as EventListener);
      window.removeEventListener('steeb-message-with-button', handleSteebMessage as EventListener);
      window.removeEventListener('steeb-message-with-options', handleSteebMessage as EventListener);
    };
  }, [processSteebMessage]);

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
    return null;
  };

  const handleSendMessage = async (customMessage?: string | React.MouseEvent | React.KeyboardEvent) => {
    if (isSteebSleeping) {
      // Bloquear interacciones cuando está dormido
      if (customMessage && typeof (customMessage as any).preventDefault === 'function') {
        (customMessage as any).preventDefault();
      }
      return;
    }

    const pendingMessage =
      typeof customMessage === 'string'
        ? customMessage
        : inputMessage;

    if (!pendingMessage || typeof pendingMessage !== 'string' || !pendingMessage.trim()) return;

    const message = pendingMessage.trim();
    setInputMessage('');

    const handleUserMessageAppend = () => {
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
    };

    const storedProfile = user?.id ? getLocalUserProfile(user.id) : null;

    if (profileOnboardingStep === 'asking-name') {
      handleUserMessageAppend();
      const cleanName = message.trim();
      if (!cleanName) {
        setTimeout(() => {
          appendAssistantMessage('Necesito tu nombre para registrarte. ¿Cómo te llamás?');
        }, 400);
      } else {
        onboardingNameRef.current = cleanName;
        if (user?.id) {
          saveLocalUserProfile(user.id, { name: cleanName });
          try {
            const fallbackNickname = user.nickname || storedProfile?.nickname || '';
            await updateProfile(cleanName, fallbackNickname);
          } catch (error) {
            console.error('Error guardando nombre del usuario:', error);
          }
        }
        setProfileOnboardingStep('asking-nickname');
        setTimeout(() => {
          appendAssistantMessage(`Veo que te llamas ${cleanName}. Pero a todos nos gustan los apodos. ¿Cómo te gusta que te digan?`);
        }, 500);
      }
      return;
    }

    if (profileOnboardingStep === 'asking-nickname') {
      handleUserMessageAppend();
      const cleanNickname = message.trim();
      if (!cleanNickname) {
        setTimeout(() => {
          appendAssistantMessage('Necesito tu apodo para llamarte como corresponde. ¿Cómo te dicen?');
        }, 400);
      } else {
        if (user?.id) {
          saveLocalUserProfile(user.id, { nickname: cleanNickname });
          try {
            const currentName =
              onboardingNameRef.current ||
              user.name ||
              storedProfile?.name ||
              cleanNickname;
            await updateProfile(currentName, cleanNickname);
          } catch (error) {
            console.error('Error guardando apodo del usuario:', error);
          }
        }
        setProfileOnboardingStep('completed');
        setTimeout(() => {
          appendAssistantMessage(`Perfecto ${cleanNickname}, lo anoto. Desde ahora te voy a decir así.`);
        }, 500);
      }
      return;
    }

    if (profileOnboardingStep === 'asking-schedule') {
      handleUserMessageAppend();
      const availability = message.trim();
      if (user?.id) {
        saveLocalUserProfile(user.id, { availabilityNote: availability });
        saveUserProfileRemote(user.id, { availabilityNote: availability }).catch((err) =>
          console.error('Error guardando disponibilidad en backend:', err)
        );
      }
      setProfileOnboardingStep('completed');
      setTimeout(() => {
        appendAssistantMessage('Genial, ya sé tus horarios. Te voy a sugerir tareas cuando vea huecos.');
      }, 500);
      return;
    }

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
            content: 'Entendido. Avisame cuando quieras intentar desbloquear el modo SHINY.',
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
          const unlockedShiny = result.won || result.alreadyWon;
          const shouldShowBackendMessage = !unlockedShiny;

          if (shouldShowBackendMessage) {
            const aiMessage: ChatMessage = {
              id: `msg_${Date.now() + 1}`,
              role: 'assistant',
              content: result.message, // El backend ya devuelve el mensaje con pistas
              timestamp: new Date(),
              category: 'general'
            };
            setMessages(prev => [...prev, aiMessage]);
          }

          if (typeof result.remainingRolls === 'number') {
            setShinyRolls(result.remainingRolls);
          }

          if (unlockedShiny) {
            const shinyNickname =
              user?.nickname ||
              user?.name ||
              'Campeón';
            const ordinalUpper = result.shinyStats
              ? formatOrdinalEs(result.shinyStats.position).toUpperCase()
              : null;
            const shinyCongrats = ordinalUpper
              ? `¡¡WOWOWOWO SHINY!! Sos el ${ordinalUpper} usuario en desbloquear el modo SHINY. Que suerte la tuya ${shinyNickname}.`
              : `¡¡WOWOWOWO SHINY!! Desbloqueaste el modo SHINY. Que suerte la tuya ${shinyNickname}.`;
            appendAssistantMessage(shinyCongrats);
            setShinyGameState('idle');

            // Solo recargar si acaba de ganar (won=true), no si ya lo tenía (alreadyWon=true)
            if (result.won) {
              // Refresh user role/tier in background without recargar toda la app
              try {
                window.dispatchEvent(new CustomEvent('steeb-refresh-role'));
              } catch {
                // ignore
              }
            }
          } else {
            // Si perdió, preguntar si quiere jugar de nuevo si tiene tiradas
            if (result.remainingRolls !== undefined && result.remainingRolls > 0) {
              setTimeout(() => {
                const retryMessage: ChatMessage = {
                  id: `msg_${Date.now() + 2}`,
                  role: 'assistant',
                  content: `Te quedan ${result.remainingRolls} tiradas.\n\n¿Querés intentar de nuevo?`,
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
                  content: `Te quedaste sin tiradas. ¡Podés comprar más para seguir intentando! 💎`,
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
          content:
            error instanceof Error && error.message
              ? `No pude completar la tirada: ${error.message}`
              : 'Ocurrió un error de conexión. Intenta más tarde.',
          timestamp: new Date(),
          category: 'general'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      return;
    }

    // -----------------------------

    // Add user message
    const userChatMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userChatMessage]);


    // Detectar comando para cambiar nombre: "me llamo (nombre)" o "mi nombre es (nombre)"
    const nameRegex = /^(?:me llamo|mi nombre es|soy)\s+(.+)$/i;
    const nameMatch = message.match(nameRegex);
    if (nameMatch) {
      const newName = nameMatch[1].trim();
      if (newName.length > 1) {
        // Actualizar nombre
        if (user?.id) {
          saveLocalUserProfile(user.id, { name: newName, nickname: newName });
          updateProfile(newName, newName).catch(err => console.error('Error actualizando nombre:', err));

          // Forzar actualización visual si es necesario (el hook debería encargarse)
          onboardingNameRef.current = newName;
        }

        const aiMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: `Entendido, ${newName}. He actualizado tu nombre en mi memoria.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }
    }

    // Detectar comando para cambiar apodo: "mi apodo es (apodo)" o "dime (apodo)"
    const nicknameRegex = /^(?:mi apodo es|dime|llámame)\s+(.+)$/i;
    const nicknameMatch = message.match(nicknameRegex);
    if (nicknameMatch) {
      const newNickname = nicknameMatch[1].trim();
      if (newNickname.length > 1) {
        // Actualizar apodo
        if (user?.id) {
          const currentName = userProfile?.name || user?.name || onboardingNameRef.current || '';
          saveLocalUserProfile(user.id, { nickname: newNickname });
          updateProfile(currentName, newNickname).catch(err => console.error('Error actualizando apodo:', err));
        }

        const aiMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: `Perfecto, te diré "${newNickname}" de ahora en adelante.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }
    }

    setIsTyping(true);

    try {
      const { streamMessageToSteeb } = await import('@/services/steebApi');

      // Variable para acumular el texto y actualizar el estado
      let accumulatedContent = '';
      let aiMessageId: string | null = null;
      const context = getTaskContext();

      const { actions } = await streamMessageToSteeb(message, (chunk) => {
        setIsTyping(false); // Dejar de mostrar "escribiendo" apenas llega el primer chunk
        accumulatedContent += chunk;

        if (!aiMessageId) {
          aiMessageId = `msg_${Date.now() + 1}`;
          setMessages(prev => [...prev, {
            id: aiMessageId!,
            role: 'assistant',
            content: accumulatedContent,
            timestamp: new Date()
          }]);
        } else {
          setMessages(prev => prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: accumulatedContent }
              : msg
          ));
        }
      }, context);

      await handleSteebActions(actions);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (isSteebSleeping) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }

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
            className={`overflow-y-auto px-4 pt-4 pb-8 transition-all duration-300 absolute left-0 right-0 ${isShinyMode ? 'bg-black' : isDarkMode ? 'bg-black' : 'bg-white'
              }`}
            style={{
              zIndex: 100,
              top: '0px',
              bottom: panelHeight > 0
                ? `${panelHeight + 12}px` // Dejar 60px para input + espacio del panel
                : '32px' // Dejar solo 40px para input cuando no hay panel (mÃ¡s arriba)
            }}
          >
            {isSteebSleeping && (
              <div className="mx-auto mb-3 w-full max-w-xl rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-2 text-center text-xs font-semibold text-yellow-900 dark:border-yellow-500/60 dark:bg-yellow-900/40 dark:text-yellow-100">
                Steeb está durmiendo en este momento y no responde. No lo despiertes, aprovechá para revisar tus tareas y volvé cuando se despierte.
              </div>
            )}
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
                          className={`px-4 py-3 rounded-2xl relative group ${message.role === 'assistant'
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
                            className={`text-xs mt-2 flex items-center space-x-1 ${message.role === 'assistant'
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
                              className={`w-full mt-3 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md border-2 ${isShinyMode || isDarkMode
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
                                  className={`shiny-option-btn w-full py-2 px-3 rounded-xl font-medium flex items-center justify-between transition-all duration-200 ${isShinyMode || isDarkMode
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
                  placeholder={isSteebSleeping ? 'Steeb está durmiendo, volvé más tarde' : ''}
                  disabled={isSteebSleeping}
                  className={`w-full py-2 pr-10 border rounded-full leading-relaxed focus:outline-none focus:border-2 focus:shadow-lg transition-all duration-200 shadow-sm steeb-chat-input steeb-nuclear-input ${isShinyMode
                    ? 'bg-white text-black border-white focus:!border-white'
                    : isDarkMode
                      ? 'bg-black text-white border-gray-600 focus:!border-gray-400'
                      : 'bg-white text-black border-gray-300 focus:!border-black'
                    } ${inputMessage ? 'pl-3' : 'pl-10'} disabled:cursor-not-allowed disabled:opacity-60`}
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
                    <span className={`text-xs ${inputMessage.length > 100 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                      {inputMessage.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Voice toggle */}
              <button
                data-custom-color="true"
                onClick={() => setVoiceEnabled((v) => !v)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${voiceEnabled
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : isShinyMode
                    ? 'bg-black border-white text-white hover:bg-gray-900'
                    : isDarkMode
                      ? 'bg-gray-800 border-black text-white hover:bg-gray-700'
                      : 'bg-white border-gray-300 text-black hover:bg-gray-100'
                  }`}
                title={voiceEnabled ? 'Voz de STEEB activada' : 'Activar voz de STEEB'}
              >
                <Volume2 className="w-5 h-5" />
              </button>

              <button
                data-custom-color="true"
                onClick={handleSendMessage}
                disabled={isSteebSleeping || !inputMessage.trim() || isTyping}
                title={isSteebSleeping ? 'Steeb está durmiendo' : 'Enviar mensaje'}
                className={`steeb-chat-send-button w-10 h-10 rounded-full flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-200 border-2 ${isShinyMode
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
      </div >
    </>
  );
};

export default SteebChatAI;
