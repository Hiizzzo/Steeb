import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Bell, BellOff, Brain, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import StebeAI from '@/components/StebeAI';
import geminiService, { ChatMessage } from '@/services/geminiService';

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

  const generateStebeResponse = async (userMessage: string): Promise<string> => {
    console.log(`💭 Generando respuesta para: "${userMessage}"`);
    console.log(`🤖 AI Mode: ${isUsingAI ? 'ON' : 'OFF'}`);
    console.log(`⚡ AI Ready: ${geminiService.isReady()}`);
    
    // Si el modo AI está activado, intentar usarlo
    if (isUsingAI) {
      try {
        console.log('🚀 Intentando usar Gemini AI...');
        const response = await geminiService.getQuickResponse(userMessage);
        console.log('✅ Respuesta AI generada exitosamente');
        return response;
      } catch (error) {
        console.error('❌ Error usando Gemini AI:', error);
        toast({
          title: "AI temporalmente no disponible",
          description: "Usando respuestas predefinidas como respaldo",
          variant: "default"
        });
        // Fallback a respuestas predefinidas
        return generateFallbackResponse(userMessage);
      }
    }
    
    console.log('📝 Usando respuestas predefinidas');
    // Respuestas predefinidas como fallback
    return generateFallbackResponse(userMessage);
  };

  const generateFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Análisis básico de contexto y estado de ánimo
    const isMotivated = lowerMessage.includes('bien') || lowerMessage.includes('genial') || lowerMessage.includes('listo');
    const isDemotivated = lowerMessage.includes('mal') || lowerMessage.includes('cansado') || lowerMessage.includes('no puedo');
    const isFrustrated = lowerMessage.includes('no funciona') || lowerMessage.includes('confuso') || lowerMessage.includes('difícil');
    const isUrgent = lowerMessage.includes('urgente') || lowerMessage.includes('ya') || lowerMessage.includes('hoy');
    
    // Respuestas relacionadas con productividad y tareas
    if (lowerMessage.includes('tarea') || lowerMessage.includes('hacer') || lowerMessage.includes('trabajo')) {
      if (isDemotivated) {
        const responses = [
          'Entiendo que puede sentirse pesado cuando tienes mucho por hacer. Vamos a simplificar: ¿cuál es la tarea más pequeña que podrías completar ahora para generar momentum?',
          'La resistencia mental es normal. La clave está en empezar con algo tan fácil que sea imposible fallar. ¿Qué paso de 2 minutos podrías dar ahora?',
          'No necesitas estar motivado para empezar, solo empezar para estar motivado. Es neurociencia: la acción genera dopamina. ¿Cuál va a ser tu primer micro-paso?'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
      
      if (isUrgent) {
        const responses = [
          'Urgencia detectada. Cuando el tiempo apremia, elimina todo lo que no sea esencial. ¿Qué es absolutamente crítico vs qué sería "bueno tener"?',
          'Tiempo limitado = decisiones inteligentes. Regla 80/20: ¿cuál es la acción que te dará el 80% del resultado con el 20% del esfuerzo?',
          'La urgencia puede ser tu aliada. Te fuerza a enfocarte en lo esencial. ¿Qué puedes eliminar para concentrarte en lo crítico?'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
      
      const responses = [
        'Excelente, hablemos de estrategia. Para maximizar resultados, necesitamos: objetivo claro, plan específico y criterios de éxito. ¿Con cuál empezamos?',
        'Perfecto. La productividad real viene de hacer menos cosas pero mejor. ¿Cuáles son las 2-3 acciones con mayor impacto?',
        'Bien pensado. Apliquemos el "siguiente paso más obvio": de todo lo que mencionas, ¿cuál es la primera acción concreta de 15 minutos?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMessage.includes('procrastina') || lowerMessage.includes('pereza') || lowerMessage.includes('motivación')) {
      if (isFrustrated) {
        const responses = [
          'La frustración es energía mal dirigida. Significa que te importa, y eso es bueno. Ahora canalizemos esa energía: ¿qué específicamente te está bloqueando?',
          'Entiendo esa tensión mental. A veces luchamos contra cosas que no podemos cambiar directamente. ¿Qué SÍ puedes controlar en esta situación?',
          'La frustración es una señal: cambio de enfoque necesario. En lugar de luchar contra el problema, ¿qué podrías construir alrededor de él?'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
      
      const responses = [
        'La procrastinación no es pereza, es tu cerebro protegiéndote de algo que percibe como amenazante. ¿Qué es lo peor que podría pasar si empiezas ahora?',
        'La motivación es como el clima: viene y va. La disciplina es tu paraguas: siempre está ahí. ¿Qué sistema podrías crear que no dependa de cómo te sientes?',
        'Verdad directa: la acción crea motivación, no al revés. Cada pequeño logro libera dopamina. ¿Qué tarea de 2 minutos podrías completar ahora?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMessage.includes('meta') || lowerMessage.includes('objetivo') || lowerMessage.includes('lograr')) {
      if (isMotivated) {
        const responses = [
          '¡Me gusta esa energía! Canalicemos esa motivación estratégicamente. Primero: ¿tu meta tiene fecha específica y métricas claras para medir progreso?',
          'Excelente actitud. Las metas grandes se logran con sistemas pequeños ejecutados consistentemente. ¿Qué hábito diario te acercaría a este objetivo?',
          'Perfecto momentum. Pero pregunta crítica: ¿esta meta es tuya o es lo que crees que deberías querer? Porque solo las metas personales sobreviven las crisis.'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
      
      const responses = [
        'Me gusta que pienses en metas. Pero ojo: meta sin deadline = deseo bonito. Meta sin sistema de seguimiento = fantasía. ¿Tienes ambos?',
        'Excelente. Las metas son direcciones, los sistemas son vehículos. ¿Qué sistema podrías implementar para que el progreso sea automático?',
        'Bien planteado. Metas grandes requieren paciencia estratégica y urgencia táctica. ¿Cuál va a ser tu primera victoria rápida?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMessage.includes('tiempo') || lowerMessage.includes('horario') || lowerMessage.includes('planificar')) {
      const responses = [
        'El tiempo es tu recurso más valioso porque es irrecuperable. Regla de oro: planifica la noche anterior. ¿Cuáles son tus 3 prioridades para mañana?',
        'Tiempo = vida. La gestión del tiempo es gestión de la vida. ¿Qué parte de tu día sientes que está más fuera de control?',
        'La planificación no es rigidez, es libertad. Con plan, decides conscientemente cuándo desviarte. Sin plan, cada decisión agota energía mental.'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('como') || lowerMessage.includes('consejo')) {
      const responses = [
        'Estoy aquí para ser tu jefe personal que te organiza la vida. Cuéntame: ¿cuál es tu mayor desafío de productividad en este momento?',
        'Por supuesto. Mi función es mantenerte enfocado en lo que realmente importa. Simplicidad = sofisticación suprema. ¿Cómo simplificamos tu problema?',
        'Perfecto. Hacer > perfecto. La acción imperfecta supera a la inacción perfecta. ¿En qué puedo ayudarte a empezar YA?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Respuestas generales contextuales
    if (isMotivated) {
      const responses = [
        '¡Excelente energía! Aprovechemos ese momentum. ¿Qué gran cosa podrías lograr hoy si mantienes esta actitud?',
        'Me gusta esa vibra positiva. La motivación es un recurso limitado, úsenla inteligentemente. ¿Cuál es tu prioridad #1 ahora?',
        'Perfecta mentalidad. El éxito ama la velocidad. ¿Qué decisión importante has estado posponiendo que podrías tomar ahora?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (isDemotivated) {
      const responses = [
        'Todos tenemos días difíciles. La diferencia está en cómo respondemos. ¿Qué es lo más pequeño que podrías hacer para sentirte un poco mejor?',
        'La desmotivación es temporal, como una nube. Mientras pasa, trabajemos con lo que tenemos. ¿Qué te daría una pequeña sensación de logro?',
        'No necesitas sentirte bien para hacer cosas buenas. A veces la acción precede al sentimiento. ¿Cuál va a ser tu primera pequeña victoria?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Respuestas generales mejoradas
    const generalResponses = [
      'Interesante perspectiva. Como tu mentor de productividad: ¿qué patrón de tu rutina diaria necesita una actualización urgente?',
      'Me gusta cómo piensas. Convirtamos esa reflexión en acción. Si pudieras mejorar UNA cosa de cómo manejas tu tiempo/energía, ¿cuál sería?',
      'Perfecto enfoque. La diferencia entre soñar y lograr está en la implementación. ¿Cuál va a ser tu siguiente paso específico y medible?',
      'Bien planteado. La productividad real viene del autoconocimiento: patrones, fortalezas, limitaciones. ¿Qué has descubierto sobre tu forma de trabajar?',
      'Excelente. No necesitas más información, necesitas más ejecución. Con lo que ya sabes, ¿cuál es el paso más obvio a seguir?'
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
      // Intentar activar AI - verificar si está listo o puede inicializarse
      const ready = await geminiService.ensureReady();
      if (ready) {
        setIsUsingAI(true);
        toast({
          title: "Modo AI activado",
          description: "Usando inteligencia artificial offline",
        });
        console.log('✅ AI mode activated');
      } else {
        toast({
          title: "AI no disponible",
          description: "Primero configura Stebe AI desde el panel de configuración",
          variant: "destructive"
        });
        console.log('❌ AI activation failed');
      }
    } else {
      // Desactivar AI
      setIsUsingAI(false);
      toast({
        title: "Modo AI desactivado",
        description: "Usando respuestas predefinidas",
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
            className={`p-2 rounded ${isUsingAI && geminiService.isReady() ? 'bg-blue-600' : 'bg-gray-600'} hover:opacity-80`}
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
                      {isUsingAI && geminiService.isReady() && (
                        <Brain className="w-3 h-3 text-blue-500" title="Respuesta generada por AI" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      STEBE {isUsingAI && geminiService.isReady() ? '(AI)' : ''}
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