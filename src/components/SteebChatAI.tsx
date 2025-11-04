import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import minimaxDirectService from '@/services/minimaxDirectService';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { tasks } = useTaskStore();

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
      pendingList: pendingTasks.slice(0, 3).map(t => t.title),
      completedToday: completedToday.length,
      hasTasks: tasks.length > 0
    };
  };

  const generateSteebPrompt = (userMessage: string): string => {
    const taskContext = getTaskContext();

    return `Contexto de Santy:
- Tareas pendientes: ${taskContext.pending}
- Completadas hoy: ${taskContext.completedToday}
${taskContext.pending > 0 ? `- Lista: ${taskContext.pendingList.join(', ')}` : ''}

Mensaje de Santy: "${userMessage}"

Responde como Steeb, su amigo. Sé emocional, genuino, duro pero justo. Si menciona tareas, recuérdale cuáles son. Separa mensajes con saltos de línea.`;
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
    setIsTyping(true);

    try {
      if (!minimaxDirectService.isReady()) {
        console.log('Inicializando MINIMAX Direct...');
        await minimaxDirectService.initialize();
      }

      const steebPrompt = generateSteebPrompt(message);
      
      // Usar MINIMAX M2 Direct Service
      const response = await minimaxDirectService.sendMessage(steebPrompt);

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
      'Dejá de pensar, hacelo. La acción es el único idioma que entiende el éxito.',
      'El momento perfecto es ahora. No existe el "mañana" para los triunfadores.',
      'Cada tarea que completás es una victoria contra la procrastinación. Ganá hoy.',
      'La excelencia no es un acto, es un hábito. Construilo ahora.',
      'Los exitosos no esperan el momento perfecto. Crean el momento perfecto actuando.',
      'Tu futuro yo te agradece cada tarea que completás hoy. No lo defraudes.',
      'La diferencia entre el sueño y la realidad se llama acción. ¿Cuál vas a usar hoy?'
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
      'Dejá de pensar, hacelo. La acción es el único idioma que entiende el éxito.',
      'El momento perfecto es ahora. No existe el "mañana" para los triunfadores.',
      'Cada tarea que completás es una victoria contra la procrastinación. Ganá hoy.',
      'La excelencia no es un acto, es un hábito. Construilo ahora.'
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
    <div className="flex flex-col h-full bg-white dark:bg-black">
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
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-black'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              <div className={`text-xs mt-2 ${
                message.role === 'assistant' ? 'text-gray-400' : 'text-gray-600'
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

      {/* Input Area */}
      <div className="border-t border-black dark:border-white p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Preguntale a Steeb AI sobre tus tareas o motivación..."
            className="flex-1 px-4 py-3 bg-white dark:bg-black border border-black dark:border-white rounded-full text-sm text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-full border border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SteebChatAI;