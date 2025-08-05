import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

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
      text: '¡Hola! Soy STEBE, tu asistente de productividad. Estoy aquí para ayudarte a cumplir tus metas y mantenerte enfocado. ¿En qué puedo ayudarte hoy?',
      sender: 'stebe',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
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

  const generateStebeResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Respuestas relacionadas con productividad y tareas
    if (lowerMessage.includes('tarea') || lowerMessage.includes('hacer') || lowerMessage.includes('trabajo')) {
      const responses = [
        'Perfecto. Primero, divide esa tarea en pasos más pequeños. ¿Cuál sería el primer paso que podrías hacer ahora mismo?',
        'Excelente. Recuerda: "El secreto para avanzar es comenzar." ¿Por dónde empezamos?',
        'Me gusta tu enfoque. La claridad viene de la acción. ¿Qué necesitas para empezar?',
        'Bien pensado. Las grandes cosas se construyen con pequeños pasos. ¿Cuál es tu próximo movimiento?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMessage.includes('procrastina') || lowerMessage.includes('pereza') || lowerMessage.includes('motivación')) {
      const responses = [
        'La procrastinación es el ladrón del tiempo. Hazme una pregunta: ¿qué es lo peor que podría pasar si empiezas ahora?',
        'Tu único competidor eres tú de ayer. Cada minuto que esperas es una victoria para la mediocridad.',
        'La motivación es lo que te pone en marcha. El hábito es lo que te mantiene en movimiento. Construyamos ese hábito.',
        'No esperes a sentirte preparado. La acción crea claridad, no al revés.'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMessage.includes('meta') || lowerMessage.includes('objetivo') || lowerMessage.includes('lograr')) {
      const responses = [
        'Las metas sin plazos son solo sueños. ¿Cuándo planeas lograr esto?',
        'Excelente. Una meta es un sueño con fecha límite. ¿Cómo la vamos a medir?',
        'Perfecto. La calidad nunca es un accidente. ¿Qué estándares vas a establecer?',
        'Me gusta esa ambición. La innovación distingue entre un líder y un seguidor. ¿Cómo vas a destacar?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMessage.includes('tiempo') || lowerMessage.includes('horario') || lowerMessage.includes('planificar')) {
      const responses = [
        'El tiempo es el recurso más valioso que tienes. ¿Cómo planeas invertirlo hoy?',
        'La gestión del tiempo es la gestión de la vida. ¿Cuáles son tus prioridades?',
        'Planificar es traer el futuro al presente para que puedas hacer algo al respecto ahora.',
        'Tu tiempo es limitado, no lo malgastes viviendo la vida de otros. ¿Qué es realmente importante para ti?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('como') || lowerMessage.includes('consejo')) {
      const responses = [
        'Estoy aquí para ayudarte a ser más productivo. Cuéntame, ¿cuál es tu mayor desafío en este momento?',
        'Por supuesto. Mi función es ayudarte a mantenerte enfocado en lo que realmente importa. ¿Qué necesitas?',
        'Excelente pregunta. La simplicidad es la sofisticación suprema. ¿Cómo podemos simplificar tu problema?',
        'Perfecto. Hacer es mejor que perfecto. ¿En qué puedo ayudarte a empezar?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Respuestas generales inspiradoras
    const generalResponses = [
      'Interesante. Recuerda que la innovación distingue entre un líder y un seguidor. ¿Cómo puedes innovar en esto?',
      'Me gusta tu perspectiva. La calidad nunca es un accidente, siempre es resultado de un esfuerzo inteligente. ¿Qué esfuerzo vas a hacer?',
      'Bien planteado. Tu trabajo va a llenar gran parte de tu vida, asegúrate de que sea algo en lo que creas. ¿Crees en esto?',
      'Exacto. Los detalles no son detalles, hacen el diseño. ¿En qué detalles deberías enfocarte?',
      'Perfecto. Mantente hambriento, mantente tonto. ¿Qué puedes aprender de esta situación?'
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simular tiempo de respuesta de STEBE
    setTimeout(() => {
      const stebeResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateStebeResponse(inputText),
        sender: 'stebe',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, stebeResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // 1-3 segundos
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
        
        <button
          onClick={requestNotificationPermission}
          className={`p-2 rounded ${notificationsEnabled ? 'bg-green-600' : 'bg-gray-600'} hover:opacity-80`}
        >
          {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
        </button>
      </div>

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
                    <img 
                      src="/lovable-uploads/te obesrvo.png" 
                      alt="STEBE" 
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-xs font-medium text-gray-600">STEBE</span>
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
                <span className="text-xs font-medium text-gray-600">STEBE</span>
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