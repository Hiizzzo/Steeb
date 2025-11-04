import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'steeb';
  content: string;
  timestamp: Date;
}

const SteebChatPermanent: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'steeb',
      content: 'Buen día. ¿Listo para conquistar tus metas o vas a seguir procrastinando?',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { tasks } = useTaskStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    // Simulate Steeb thinking
    setTimeout(() => {
      const steebResponse = generateSteebResponse(message);
      const steebMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'steeb',
        content: steebResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, steebMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1500);
  };

  const generateSteebResponse = (userMessage: string): string => {
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.filter(t => !t.completed).length;
    const lowerMessage = userMessage.toLowerCase();

    // Responses basadas en el contexto del usuario
    if (pendingTasks === 0) {
      return 'No tenés tareas. Perfecto moment para agregar algunas y empezar a construir algo grande. El éxito no espera.';
    }

    if (completedTasks > 0 && pendingTasks === 0) {
      return `Bien, ${completedTasks} tareas completadas hoy. Eso se llama disciplina. Mañana repetilo.`;
    }

    if (lowerMessage.includes('hola') || lowerMessage.includes('buen día')) {
      return 'Saludos. Dejá de saludar y empezá a hacer. El tiempo no se recupera.';
    }

    if (lowerMessage.includes('ayuda') || lowerMessage.includes('no puedo')) {
      return 'No hay excusas. Solo hay tareas. Hacé la primera. El resto seguirá.';
    }

    if (lowerMessage.includes('cansado') || lowerMessage.includes('agotado')) {
      return 'El cansancio es mental. Hacé una tarea pequeña y verás que la energía aparece. La acción genera motivación.';
    }

    // Default motivational responses
    const responses = [
      'Dejá de pensar, hacelo. La procrastinación es el enemigo de la excelencia.',
      'Tenés tareas pendientes. La única decisión importante es cuál empezás ahora.',
      'La diferencia entre el éxito y el fracaso está en la acción. Tomá una decisión ahora.',
      'Cada tarea completada es un paso hacia la grandeza. ¿Cuántos pasos diste hoy?',
      'El momento perfecto es ahora. No existe el momento ideal, solo el momento actual.',
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.role === 'steeb' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                  message.role === 'steeb'
                    ? 'bg-black text-white rounded-tl-none'
                    : 'bg-white dark:bg-black text-black dark:text-white rounded-tr-none border-2 border-black dark:border-white'
                }`}
              >
                <p className="text-sm leading-snug">
                  {message.content}
                </p>
                <div className={`text-xs mt-1 ${message.role === 'steeb' ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-black text-white px-3 py-2 rounded-2xl rounded-tl-none">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                     style={{ animationDuration: '1.4s', animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                     style={{ animationDuration: '1.4s', animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                     style={{ animationDuration: '1.4s', animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribí tu mensaje..."
            className="flex-1 px-3 py-2 bg-white dark:bg-black border-2 border-black dark:border-white rounded-full text-sm text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-full border-2 border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SteebChatPermanent;