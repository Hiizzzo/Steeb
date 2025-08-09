import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Bell, BellOff, Brain, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import StebeAI from '@/components/StebeAI';
import geminiService, { ChatMessage } from '@/services/geminiService';
import groqService from '@/services/groqService';
import { useTaskStore } from '@/store/useTaskStore';
import SmartTaskReview, { SmartTaskPlan, SmartTaskItem } from '@/components/SmartTaskReview';
import TaskTimer from '@/components/TaskTimer';
import { notificationService } from '@/services/notificationService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'stebe';
  timestamp: Date;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy STEBE, tu asistente de productividad offline. Funciono completamente en tu dispositivo sin necesidad de internet. Estoy aquí para ayudarte a organizar tus tareas y alcanzar tus objetivos. ¿En qué puedo ayudarte hoy?',
      sender: 'stebe',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [isUsingAI, setIsUsingAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const taskStore = useTaskStore();
  const [showPlanReview, setShowPlanReview] = useState<null | SmartTaskPlan>(null);
  const [pendingPlanUserText, setPendingPlanUserText] = useState<string>('');
  const [timerTask, setTimerTask] = useState<null | import('@/types').Task>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Verificar si las notificaciones ya están habilitadas
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
    
    // Intentar auto-inicializar STEBE AI
    const autoInitAI = async () => {
      try {
        console.log('🔄 Auto-inicializando STEBE AI...');
        const ready = await geminiService.ensureReady();
        if (ready) {
          console.log('✅ STEBE AI auto-inicializado correctamente');
          // Activar AI mode por defecto si está listo
          setIsUsingAI(true);
        } else {
          console.log('⚠️ STEBE AI no pudo auto-inicializarse');
        }
      } catch (error) {
        console.error('❌ Error en auto-inicialización:', error);
      }
    };
    
    autoInitAI();
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        toast({
          title: "Notificaciones activadas",
          description: "Ahora recibirás recordatorios de tus tareas",
        });
        
        // Enviar notificación de prueba
        new Notification('STEBE - Notificaciones activadas', {
          body: 'Te enviaré recordatorios para ayudarte con tus tareas',
          icon: '/lovable-uploads/te obesrvo.png'
        });
      } else {
        toast({
          title: "Notificaciones desactivadas",
          description: "No recibirás recordatorios de tareas",
          variant: "destructive"
        });
      }
    }
  };

  const createTasksFromSmartPlan = async (selected: Array<SmartTaskItem & { scheduledDate?: string; scheduledTime?: string }>) => {
    // Crear tareas en el store y programar recordatorios
    const created: import('@/types').Task[] = [];
    for (const item of selected) {
      await taskStore.addTask({
        title: item.title,
        type: 'personal',
        status: 'pending',
        completed: false,
        notes: item.description,
        scheduledDate: item.scheduledDate,
        scheduledTime: item.scheduledTime,
        estimatedDuration: item.estimatedTime ? parseInt((item.estimatedTime.match(/(\d+)/)?.[1] || '30'), 10) : undefined,
        priority: item.priority as any,
      });
      // El addTask genera id internamente; recuperamos última tarea
    }
    // Recuperar últimas N tareas creadas (aprox) y programar recordatorios
    const nowTasks = useTaskStore.getState().tasks;
    const lastN = selected.length;
    const toSchedule = nowTasks.slice(-lastN).map(t => ({
      id: t.id,
      title: t.title,
      scheduledDate: t.scheduledDate,
      scheduledTime: t.scheduledTime,
    }));
    notificationService.scheduleBatchReminders(toSchedule);

    setShowPlanReview(null);

    // Devolver feedback en chat
    const confirmation = `✅ He creado ${selected.length} tarea(s). ¿Querés verlas en el calendario?`;
    handleAIMessageGenerated(confirmation);
  };

  const tryParseTimerCommand = (text: string) => {
    const lower = text.toLowerCase();
    // formatos: "empezar pomodoro", "iniciar temporizador", opcional "de 25 min" y nombre entre comillas
    const hasStart = lower.includes('pomodoro') || lower.includes('temporizador');
    if (!hasStart) return null;
    const durationMatch = lower.match(/(\d+)[\s-]*min/);
    const duration = durationMatch ? parseInt(durationMatch[1], 10) : 25;
    const quoted = text.match(/"([^"]+)"/);
    const taskTitle = quoted ? quoted[1] : null;
    return { duration, taskTitle };
  };

  const openTimerForTaskTitle = (title: string, durationMin: number) => {
    const t = taskStore.tasks.slice().reverse().find(tt => tt.title.toLowerCase() === title.toLowerCase()) ||
              taskStore.tasks.find(tt => tt.title.toLowerCase().includes(title.toLowerCase()));
    const taskObj: import('@/types').Task | null = t || {
      id: `temp-${Date.now()}`,
      title,
      type: 'personal',
      status: 'in_progress',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDuration: durationMin,
    } as any;
    setTimerTask(taskObj);
  };

  const summarizeDay = () => {
    const all = taskStore.tasks;
    const today = new Date().toISOString().split('T')[0];
    const completed = all.filter(t => t.completed && t.completedDate?.startsWith(today));
    const pending = all.filter(t => !t.completed && t.scheduledDate === today);
    const msg = `📈 Resumen de hoy\n\nCompletadas: ${completed.length}\nPendientes de hoy: ${pending.length}\n\nSugerencia: elegí 1-3 tareas clave para mañana y definí horario.`;
    return msg;
  };

  const generateStebeResponse = async (userMessage: string): Promise<string> => {
    // Intentos de comandos antes de IA
    const timerCmd = tryParseTimerCommand(userMessage);
    if (timerCmd) {
      if (timerCmd.taskTitle) openTimerForTaskTitle(timerCmd.taskTitle, timerCmd.duration);
      return `⏱️ Iniciando pomodoro de ${timerCmd.duration} minutos${timerCmd.taskTitle ? ` para "${timerCmd.taskTitle}"` : ''}. Cuando termines, decime "terminar pomodoro".`;
    }

    if (userMessage.toLowerCase().includes('resumen del día')) {
      return summarizeDay();
    }

    console.log(`💭 Generando respuesta inteligente para: "${userMessage}"`);
    console.log(`🤖 AI Mode: ${isUsingAI ? 'ON' : 'OFF'}`);
    console.log(`⚡ Groq Ready: ${groqService.isReady()}`);
    
    // Preparar contexto para respuesta más inteligente
    const context = {
      recentTasks: messages
        .filter(m => m.sender === 'user')
        .slice(-3)
        .map(m => m.text),
      userMood: analyzeUserMood(userMessage),
      timeOfDay: new Date().getHours() < 12 ? 'mañana' : new Date().getHours() < 18 ? 'tarde' : 'noche'
    };
    
    // Si el modo AI está activado y Groq está listo, usar inteligencia artificial
    if (isUsingAI && groqService.isReady()) {
      try {
        console.log('🧠 Usando Stebe AI inteligente con Groq...');
        
        // Primero analizar si el mensaje requiere creación de tareas
        const analysis = await groqService.analyzeUserMessage(userMessage);
        console.log('📊 Análisis del mensaje:', analysis);
        
        // Si se detecta intención de crear tareas, generar automáticamente
        if (analysis.intent === 'task_creation' && analysis.extractedTasks.length === 0) {
          // Si no hay tareas extraídas pero hay intención, usar generación inteligente
          try {
            const taskData = await groqService.generateSmartTasks(userMessage, {
              existingTasks: context.recentTasks
            });
            
            // Formatear respuesta con tareas creadas
            let response = `🎯 **He analizado tu petición y creé un plan personalizado:**\n\n`;
            
            response += "**📋 Tareas que sugiero:**\n";
            taskData.tasks.forEach((task, index) => {
              response += `${index + 1}. **${task.title}**\n`;
              response += `   • ${task.description}\n`;
              response += `   • ⏱️ ${task.estimatedTime} | 🔥 Prioridad: ${task.priority}\n`;
              if (task.subtasks && task.subtasks.length > 0) {
                response += `   • Subtareas: ${task.subtasks.join(', ')}\n`;
              }
              response += '\n';
            });

            response += `**💪 ${taskData.motivation}**\n\n`;
            
            if (taskData.nextSteps.length > 0) {
              response += "**🚀 Te recomiendo empezar por:**\n";
              taskData.nextSteps.forEach((step, index) => {
                response += `${index + 1}. ${step}\n`;
              });
            }

            response += "\n¿Te parece bien este plan o prefieres que ajuste algo? 🤝";
            
            console.log('✅ Tareas automáticas generadas exitosamente');
            return response;
          } catch (taskError) {
            console.error('❌ Error generando tareas automáticas:', taskError);
            // Continuar con respuesta inteligente normal
          }
        }
        
        // Usar la nueva función de respuesta inteligente
        const response = await groqService.getIntelligentResponse(userMessage, context);
        console.log('✅ Respuesta AI inteligente generada exitosamente');
        return response;
      } catch (error) {
        console.error('❌ Error usando Stebe AI:', error);
        toast({
          title: "AI temporalmente no disponible",
          description: "Usando respuestas predefinidas como respaldo",
          variant: "default"
        });
        // Fallback a respuestas predefinidas
        return generateEnhancedFallbackResponse(userMessage);
      }
    }
    
    // Si no está activado el AI, intentar usar Gemini como segunda opción
    if (isUsingAI && geminiService.isReady()) {
      try {
        console.log('🚀 Intentando usar Gemini AI...');
        const response = await geminiService.getQuickResponse(userMessage);
        console.log('✅ Respuesta Gemini generada exitosamente');
        return response;
      } catch (error) {
        console.error('❌ Error usando Gemini AI:', error);
        // Fallback a respuestas predefinidas
        return generateEnhancedFallbackResponse(userMessage);
      }
    }
    
    console.log('📝 Usando respuestas predefinidas inteligentes');
    // Respuestas predefinidas mejoradas como último fallback
    return generateEnhancedFallbackResponse(userMessage);
  };

  // Nueva función para analizar el estado de ánimo del usuario
  const analyzeUserMood = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('bien') || lowerMessage.includes('genial') || lowerMessage.includes('excelente') || lowerMessage.includes('perfecto')) {
      return 'motivated';
    }
    
    if (lowerMessage.includes('mal') || lowerMessage.includes('cansado') || lowerMessage.includes('no puedo') || lowerMessage.includes('difícil')) {
      return 'demotivated';
    }
    
    if (lowerMessage.includes('confuso') || lowerMessage.includes('no entiendo') || lowerMessage.includes('ayuda')) {
      return 'confused';
    }
    
    if (lowerMessage.includes('urgente') || lowerMessage.includes('prisa') || lowerMessage.includes('ya')) {
      return 'urgent';
    }
    
    return 'neutral';
  };

  // Nueva función mejorada para respuestas fallback con detección de tareas
  const generateEnhancedFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Detectar si el usuario está describiendo algo que necesita hacer
    const taskIndicators = [
      'necesito hacer', 'tengo que', 'debo', 'quiero hacer', 'voy a hacer',
      'planear', 'organizar', 'preparar', 'estudiar', 'trabajar en',
      'limpiar', 'terminar', 'completar', 'empezar', 'comenzar'
    ];
    
    const hasTaskIntent = taskIndicators.some(indicator => lowerMessage.includes(indicator));
    
    if (hasTaskIntent) {
      // Respuestas especializadas para creación de tareas
      const taskResponses = [
        '¡Perfecto! Veo que tienes algo específico que hacer. Para ayudarte mejor, cuéntame: ¿cuál es tu objetivo principal y cuánto tiempo tienes disponible?',
        'Excelente. Me gusta que seas específico sobre lo que necesitas hacer. ¿Podrías dividir eso en pasos más pequeños? Te ayudo a organizarlo.',
        'Muy bien. Para crear un plan efectivo, necesito saber: ¿esto es urgente, importante, o ambos? Y ¿qué obstáculos anticipas?',
        'Genial. Vamos a desglosar eso en tareas manejables. ¿Cuál sería el primer paso más obvio y fácil para empezar?'
      ];
      return taskResponses[Math.floor(Math.random() * taskResponses.length)];
    }
    
    // Análisis básico de contexto y estado de ánimo (función original mejorada)
    const isMotivated = lowerMessage.includes('bien') || lowerMessage.includes('genial') || lowerMessage.includes('listo');
    const isDemotivated = lowerMessage.includes('mal') || lowerMessage.includes('cansado') || lowerMessage.includes('no puedo');
    const isFrustrated = lowerMessage.includes('no funciona') || lowerMessage.includes('confuso') || lowerMessage.includes('difícil');
    const isUrgent = lowerMessage.includes('urgente') || lowerMessage.includes('ya') || lowerMessage.includes('hoy');
    
    // Respuestas relacionadas con productividad y tareas
    if (lowerMessage.includes('tarea') || lowerMessage.includes('hacer') || lowerMessage.includes('trabajo')) {
      if (isDemotivated) {
        const responses = [
          'Entiendo que puede sentirse pesado. Vamos a simplificar: ¿cuál es la tarea más pequeña que podrías completar ahora para generar momentum?',
          'La resistencia mental es normal. Empezemos con algo tan fácil que sea imposible fallar. ¿Qué paso de 2 minutos podrías dar?',
          'No necesitas estar motivado para empezar, solo empezar para estar motivado. ¿Cuál va a ser tu primer micro-paso?'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
      
      if (isUrgent) {
        const responses = [
          'Urgencia detectada. Cuando el tiempo apremia, elimina lo no esencial. ¿Qué es absolutamente crítico vs qué sería "bueno tener"?',
          'Tiempo limitado = decisiones inteligentes. ¿Cuál es la acción que te dará el 80% del resultado con el 20% del esfuerzo?',
          'La urgencia puede ser tu aliada. Te fuerza a enfocarte. ¿Qué puedes eliminar para concentrarte en lo crítico?'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
      
      const responses = [
        'Excelente, hablemos de estrategia. Para maximizar resultados necesitamos: objetivo claro, plan específico y criterios de éxito. ¿Con cuál empezamos?',
        'Perfecto. La productividad real viene de hacer menos cosas pero mejor. ¿Cuáles son las 2-3 acciones con mayor impacto?',
        'Bien pensado. Apliquemos el "siguiente paso más obvio": ¿cuál es la primera acción concreta de 15 minutos?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Resto de la función original con respuestas mejoradas...
    if (lowerMessage.includes('procrastina') || lowerMessage.includes('pereza') || lowerMessage.includes('motivación')) {
      const responses = [
        'La procrastinación es tu cerebro protegiéndote. ¿Qué es lo peor que podría pasar si empiezas ahora?',
        'La motivación viene y va. La disciplina es tu paraguas. ¿Qué sistema podrías crear que no dependa de cómo te sientes?',
        'La acción crea motivación, no al revés. ¿Qué tarea de 2 minutos podrías completar ahora?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('como') || lowerMessage.includes('consejo')) {
      const responses = [
        'Estoy aquí para ser tu jefe personal que organiza tu vida. ¿Cuál es tu mayor desafío de productividad ahora?',
        'Perfecto. Mi función es mantenerte enfocado en lo importante. ¿Cómo simplificamos tu problema?',
        'Excelente. La acción imperfecta supera a la inacción perfecta. ¿En qué puedo ayudarte a empezar YA?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Respuestas generales mejoradas
    const generalResponses = [
      'Interesante. Como tu mentor de productividad: ¿qué patrón de tu rutina necesita una actualización urgente?',
      'Me gusta cómo piensas. Convirtamos esa reflexión en acción. ¿Qué UNA cosa podrías mejorar de cómo manejas tu tiempo?',
      'Perfecto enfoque. La diferencia entre soñar y lograr está en la implementación. ¿Cuál va a ser tu siguiente paso específico?',
      'Bien planteado. Con lo que ya sabes, ¿cuál es el paso más obvio a seguir?'
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      // Generar respuesta de STEBE (puede ser AI o fallback)
      const responseText = await generateStebeResponse(currentInput);
      
      const stebeResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'stebe',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, stebeResponse]);
    } catch (error) {
      console.error('Error generando respuesta:', error);
      
      // Respuesta de error
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Disculpa, tuve un problema generando mi respuesta. ¿Podrías intentar de nuevo?',
        sender: 'stebe',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAIMessageGenerated = (message: string) => {
    const aiMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'stebe',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);
  };

  const toggleAIMode = async () => {
    console.log('🔄 Toggling AI mode...');
    
    if (!isUsingAI) {
      // Intentar activar AI - verificar si Groq está listo primero
      if (groqService.isReady()) {
        setIsUsingAI(true);
        toast({
          title: "Modo AI activado",
          description: "Usando Stebe AI inteligente con Groq",
        });
        console.log('✅ AI mode activated with Groq');
      } else {
        // Si Groq no está listo, intentar con Gemini como fallback
        const geminiReady = await geminiService.ensureReady();
        if (geminiReady) {
          setIsUsingAI(true);
          toast({
            title: "Modo AI activado",
            description: "Usando inteligencia artificial offline (Gemini)",
          });
          console.log('✅ AI mode activated with Gemini fallback');
        } else {
          toast({
            title: "AI no disponible",
            description: "Activa Stebe AI desde el panel de configuración para usar IA",
            variant: "destructive"
          });
          console.log('❌ AI activation failed - neither service ready');
        }
      }
    } else {
      // Desactivar AI
      setIsUsingAI(false);
      toast({
        title: "Modo AI desactivado",
        description: "Usando respuestas predefinidas inteligentes",
      });
      console.log('🔄 AI mode deactivated');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-black text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/')}
            className="p-1 hover:bg-gray-800 rounded"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/te obesrvo.png" 
              alt="STEBE" 
              className="w-8 h-8 rounded-full"
            />
            <div>
              <h1 className="font-medium">STEBE</h1>
              <p className="text-xs text-gray-300">Asistente de Productividad</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAIConfig(!showAIConfig)}
            className="p-2 rounded bg-purple-600 hover:opacity-80"
            title="Configuración de AI"
          >
            <Settings size={16} />
          </button>
          
          <button
            onClick={toggleAIMode}
            className={`p-2 rounded ${isUsingAI && (groqService.isReady() || geminiService.isReady()) ? 'bg-blue-600' : 'bg-gray-600'} hover:opacity-80`}
            title={isUsingAI ? "AI activado" : "AI desactivado"}
          >
            <Brain size={16} />
          </button>
          
          <button
            onClick={requestNotificationPermission}
            className={`p-2 rounded ${notificationsEnabled ? 'bg-green-600' : 'bg-gray-600'} hover:opacity-80`}
          >
            {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
          </button>
        </div>
      </div>

      {/* AI Configuration Panel */}
      <AnimatePresence>
        {showAIConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b bg-gray-50"
          >
            <div className="p-4">
              <StebeAI 
                onMessageGenerated={handleAIMessageGenerated}
                className="max-w-lg mx-auto"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === 'user' 
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 text-black border'
              }`}>
                {message.sender === 'stebe' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex items-center space-x-1">
                      <img 
                        src="/lovable-uploads/te obesrvo.png" 
                        alt="STEBE" 
                        className="w-5 h-5 rounded-full"
                      />
                      {isUsingAI && (groqService.isReady() || geminiService.isReady()) && (
                        <Brain className="w-3 h-3 text-blue-500" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      STEBE {isUsingAI && (groqService.isReady() || geminiService.isReady()) ? '(AI)' : ''}
                    </span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-2 ${
                  message.sender === 'user' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Plan Review Inline */}
        {showPlanReview && (
          <div className="mt-2">
            <SmartTaskReview
              plan={showPlanReview}
              defaultScheduledDate={new Date().toISOString().split('T')[0]}
              onCancel={() => setShowPlanReview(null)}
              onConfirm={createTasksFromSmartPlan}
            />
          </div>
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 border rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2 mb-2">
                <img 
                  src="/lovable-uploads/te obesrvo.png" 
                  alt="STEBE" 
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-xs font-medium text-gray-600">STEBE escribiendo...</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Timer Overlay */}
      {timerTask && (
        <TaskTimer
          task={timerTask}
          onCancel={() => setTimerTask(null)}
          onComplete={async (id, mins) => {
            setTimerTask(null);
            const t = taskStore.tasks.find(tt => tt.id === id);
            if (t) {
              await taskStore.updateTask(t.id, { actualDuration: mins, status: 'completed', completed: true, completedDate: new Date().toISOString() });
            }
            handleAIMessageGenerated(`✅ Pomodoro completado (${mins} min). ¡Buen trabajo!`);
          }}
        />
      )}

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escribe tu mensaje a STEBE..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-black"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="bg-black text-white p-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;