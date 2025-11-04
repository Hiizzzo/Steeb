import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, X, AlertCircle } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import llmService from '@/services/llmService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type LLMProvider = 'ollama' | 'openai' | 'google' | 'anthropic' | 'minimax';

const SteebChatLLM: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '🔥 ¡Hola! Soy Steeb AI. Estoy aquí para ayudarte a eliminar la procrastinación y dominar tus metas. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState<LLMProvider>('minimax');
  const [apiKey, setApiKey] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [baseUrl, setBaseUrl] = useState('http://localhost:11434');
  const [model, setModel] = useState('MiniMax-M2');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { tasks } = useTaskStore();

  // Modelos disponibles por provider
  const modelsByProvider: Record<LLMProvider, string[]> = {
    ollama: ['mistral', 'llama2', 'neural-chat', 'orca-mini', 'openchat'],
    openai: ['gpt-4', 'gpt-3.5-turbo'],
    google: ['gemini-pro'],
    anthropic: ['claude-3-opus', 'claude-3-sonnet'],
    minimax: ['MiniMax-M2']
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Intentar inicializar con el provider guardado
    const initializeLLM = async () => {
      const savedProvider = localStorage.getItem('llm_provider') as LLMProvider | null;
      if (savedProvider) {
        await handleInitialize(savedProvider);
      }
    };
    initializeLLM();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getTaskContext = () => {
    const pendingTasks = tasks.filter(task => !task.completed);
    const completedToday = tasks.filter(task =>
      task.completed &&
      new Date(task.completedAt || task.createdAt).toDateString() === new Date().toDateString()
    );

    return {
      pending: pendingTasks.length,
      pendingList: pendingTasks.slice(0, 3).map(t => t.title),
      completedToday: completedToday.length
    };
  };

  const handleInitialize = async (selectedProvider: LLMProvider) => {
    try {
      let initConfig: any = {
        provider: selectedProvider,
        model: model
      };

      // Configuración específica por provider
      if (selectedProvider === 'ollama') {
        initConfig.baseUrl = baseUrl;
      } else if (selectedProvider !== 'ollama' && !apiKey) {
        throw new Error(`API key requerida para ${selectedProvider}`);
      } else {
        initConfig.apiKey = apiKey;
      }

      const success = await llmService.initialize(initConfig);

      if (success) {
        setIsInitialized(true);
        setShowSettings(false);
        setProvider(selectedProvider);
        localStorage.setItem('llm_provider', selectedProvider);
        
        const msg: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `✅ Conectado a ${selectedProvider.toUpperCase()}. Stebe AI está listo para eliminar tu procrastinación.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, msg]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'No se pudo conectar'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !isInitialized) return;

    const message = inputMessage.trim();
    setInputMessage('');

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const taskContext = getTaskContext();
      const enrichedPrompt = `${message}

[Contexto: ${taskContext.pending} tareas pendientes, ${taskContext.completedToday} completadas hoy]`;

      const response = await llmService.sendMessage(enrichedPrompt);

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: '⚠️ Error en la conexión. Pero eso no excusa la procrastinación. Actúa ahora.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDisconnect = () => {
    setIsInitialized(false);
    llmService.clearContext();
    localStorage.removeItem('llm_provider');
    setShowSettings(false);
  };

  if (!isInitialized) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-black items-center justify-center p-6 space-y-6">
        <div className="text-center space-y-4">
          <Bot className="w-16 h-16 mx-auto text-black dark:text-white" />
          <h2 className="text-2xl font-bold text-black dark:text-white">Stebe AI</h2>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Elige tu LLM preferido para comenzar
          </p>

          {/* Provider Selection */}
          <div className="space-y-4 max-w-md mx-auto">
            {/* Ollama - Local y Gratis (Recomendado) */}
            <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-lg">⭐</div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-black dark:text-white">Ollama (Recomendado)</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Local, gratis, sin internet</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="http://localhost:11434"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm bg-white dark:bg-black text-black dark:text-white"
                />
                
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm bg-white dark:bg-black text-black dark:text-white"
                >
                  {modelsByProvider.ollama.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <button
                  onClick={() => handleInitialize('ollama')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition"
                >
                  Conectar Ollama
                </button>

                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 Necesitas tener Ollama corriendo localmente: <code className="bg-gray-100 dark:bg-gray-900 px-1 rounded">ollama run mistral</code>
                </p>
              </div>
            </div>

            {/* OpenAI */}
            <div className="border-2 border-gray-300 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-bold text-black dark:text-white mb-3">OpenAI</h3>
              <input
                type="password"
                placeholder="Pega tu API key"
                value={provider === 'openai' ? apiKey : ''}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm mb-2 bg-white dark:bg-black text-black dark:text-white"
              />
              <button
                onClick={() => {
                  setProvider('openai');
                  handleInitialize('openai');
                }}
                className="w-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition"
              >
                Conectar OpenAI
              </button>
            </div>

            {/* Google */}
            <div className="border-2 border-gray-300 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-bold text-black dark:text-white mb-3">Google Gemini</h3>
              <input
                type="password"
                placeholder="Pega tu API key"
                value={provider === 'google' ? apiKey : ''}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm mb-2 bg-white dark:bg-black text-black dark:text-white"
              />
              <button
                onClick={() => {
                  setProvider('google');
                  handleInitialize('google');
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
              >
                Conectar Gemini
              </button>
            </div>

            {/* Anthropic */}
            <div className="border-2 border-gray-300 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-bold text-black dark:text-white mb-3">Anthropic Claude</h3>
              <input
                type="password"
                placeholder="Pega tu API key"
                value={provider === 'anthropic' ? apiKey : ''}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm mb-2 bg-white dark:bg-black text-black dark:text-white"
              />
              <button
                onClick={() => {
                  setProvider('anthropic');
                  handleInitialize('anthropic');
                }}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded font-medium hover:bg-orange-700 transition"
              >
                Conectar Claude
              </button>
            </div>

            {/* MINIMAX M2 */}
            <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-lg">⚡</div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-black dark:text-white">MINIMAX M2 (NUEVO)</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Modelo potente para coding y agentic tasks</p>
                </div>
              </div>
              
              <input
                type="password"
                placeholder="Pega tu API key MINIMAX"
                value={provider === 'minimax' ? apiKey : ''}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm mb-2 bg-white dark:bg-black text-black dark:text-white"
              />
              <button
                onClick={() => {
                  setProvider('minimax');
                  handleInitialize('minimax');
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
              >
                Conectar MINIMAX M2
              </button>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                💡 Obtén API key en https://platform.minimax.io/
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-left text-xs text-blue-800 dark:text-blue-200 space-y-2">
            <p className="font-semibold">ℹ️ ¿Cuál elegir?</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>MINIMAX M2:</strong> Excelente para coding, 230B parámetros (NUEVO!) ⚡</li>
              <li><strong>Ollama:</strong> Local, sin costo, privado</li>
              <li><strong>OpenAI:</strong> Muy potente, costo bajo</li>
              <li><strong>Google:</strong> Gratis (limited), potente</li>
              <li><strong>Anthropic:</strong> Excelente, costo medio</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* AI Status Bar */}
      <div className="bg-black dark:bg-white text-white dark:text-black px-4 py-3 border-b border-black dark:border-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Stebe AI - {provider.toUpperCase()}</span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 hover:bg-gray-800 dark:hover:bg-gray-200 rounded transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-black dark:border-white p-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-black dark:text-white font-medium">Configuración</span>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleDisconnect}
            className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium"
          >
            Desconectar
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Proveedor: <span className="font-semibold text-black dark:text-white">{provider}</span>
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'assistant'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                {message.role === 'assistant' ? (
                  <Bot className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>

              <div
                className={`px-4 py-3 ${
                  message.role === 'assistant'
                    ? 'bg-black dark:bg-white text-white dark:text-black rounded-2xl rounded-tl-none'
                    : 'bg-gray-100 dark:bg-gray-900 text-black dark:text-white rounded-2xl rounded-tr-none border border-gray-300 dark:border-gray-700'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                <div className={`text-xs mt-2 ${
                  message.role === 'assistant' ? 'text-gray-300 dark:text-gray-700' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-black dark:bg-white text-white dark:text-black px-4 py-3 rounded-2xl rounded-tl-none">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
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
            placeholder="Preguntale a Steeb..."
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

export default SteebChatLLM;
