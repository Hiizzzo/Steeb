import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SteebChatClean: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '🔥 ¡Hola! Soy Steeb. ¿Listo para eliminar la procrastinación y dominar tus metas?',
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

  const generateSteebResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    // Check for task-related questions
    if (message.includes('tarea') || message.includes('tareas') || message.includes('pendiente')) {
      const pendingTasks = tasks.filter(task => !task.completed).length;
      if (pendingTasks > 0) {
        return `Tenés ${pendingTasks} tarea${pendingTasks > 1 ? 's' : ''} pendiente${pendingTasks > 1 ? 's' : ''}. La procrastinación es tu enemiga. Elegí una y empezá ahora.`;
      } else {
        return '¡Excelente! No tenés tareas pendientes. Seguí así o agregá nuevos desafíos para seguir creciendo.';
      }
    }

    // Check for motivation-related keywords
    if (message.includes('motivación') || message.includes('ánimo') || message.includes('energía')) {
      return 'La motivación no aparece, se construye. Cada tarea completada es un ladrillo en tu edificio de éxito. Empezá con la más pequeña.';
    }

    // Check for procrastination
    if (message.includes('procrastinar') || message.includes('postergar') || message.includes('después')) {
      return 'El "después" es el idioma del fracaso. El "ahora" es el idioma de los ganadores. ¿Cuál vas a hablar hoy?';
    }

    // Default motivational responses
    const responses = [
      'Dejá de pensar, hacelo. La procrastinación es el enemigo de la excelencia.',
      'Tenés que decidir: ser víctima de las circunstancias o arquitecto de tu futuro.',
      'La diferencia entre el sueño y la realidad se llama acción. ¿Qué acción vas a tomar hoy?',
      'El éxito no es más que unas pocas disciplinas practicadas todos los días. Empezá ahora.',
      'No esperes el momento perfecto. Tomá el momento y hacelo perfecto.',
    ];

    return responses[Math.floor(Math.random() * responses.length)];
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

    // Simulate Steeb thinking
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate and add Steeb response
    const steebResponse: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: generateSteebResponse(message),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, steebResponse]);
    setIsTyping(false);
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 ${
                message.role === 'assistant'
                  ? 'bg-black text-white rounded-2xl rounded-tl-none'
                  : 'bg-white dark:bg-black text-black dark:text-white rounded-2xl rounded-tr-none border border-black dark:border-white'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              <div className={`text-xs mt-2 ${
                message.role === 'assistant' ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-black text-white px-4 py-3 rounded-2xl rounded-tl-none">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
            placeholder="Escribí tu mensaje..."
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

export default SteebChatClean;