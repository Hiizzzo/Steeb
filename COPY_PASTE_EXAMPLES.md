# 📋 Copy & Paste - Ejemplos listos para usar

## ✂️ Copia y pega estos ejemplos directamente en tu código

---

## 1️⃣ Chat IA en tu página

```tsx
// pages/ChatPage.tsx o donde quieras
import SteebChatGroq from '@/components/SteebChatGroq';

export default function ChatPage() {
  return (
    <div className="h-screen">
      <SteebChatGroq />
    </div>
  );
}
```

**Listo.** El componente hace todo automáticamente.

---

## 2️⃣ Botón para abrir chat modal

```tsx
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import SteebChatGroq from '@/components/SteebChatGroq';

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:scale-110 transition"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full md:w-96 h-96 md:h-full bg-white dark:bg-black rounded-t-2xl md:rounded-none">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-500"
            >
              ✕
            </button>
            <SteebChatGroq />
          </div>
        </div>
      )}
    </>
  );
}
```

---

## 3️⃣ Motivación en el dashboard

```tsx
import { useEffect, useState } from 'react';
import groqService from '@/services/groqService';

export default function MotivationCard() {
  const [text, setText] = useState('Cargando motivación...');

  useEffect(() => {
    const getMot = async () => {
      try {
        if (!groqService.isReady()) {
          const key = localStorage.getItem('groq_api_key');
          if (key) await groqService.initialize({ apiKey: key });
        }

        if (groqService.isReady()) {
          const msg = await groqService.sendMessage(
            'Dame una frase motivacional corta para eliminar procrastinación'
          );
          setText(msg);
        }
      } catch (error) {
        setText('🔥 Dejá de pensar, hacelo.');
      }
    };

    getMot();
  }, []);

  return (
    <div className="p-6 bg-gradient-to-r from-black to-gray-800 text-white rounded-lg">
      <p className="text-lg font-bold">{text}</p>
    </div>
  );
}
```

---

## 4️⃣ Analizar tareas al crearlas

```tsx
import groqService from '@/services/groqService';
import { useState } from 'react';

export default function SmartTaskForm() {
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAnalyzeAndCreate = async () => {
    setLoading(true);
    try {
      if (!groqService.isReady()) {
        const key = localStorage.getItem('groq_api_key');
        if (key) await groqService.initialize({ apiKey: key });
      }

      if (groqService.isReady()) {
        const analysis = await groqService.analyzeUserMessage(input);
        setTasks(analysis.extractedTasks.map((task, i) => ({
          id: i,
          title: task,
          priority: analysis.priority,
          category: analysis.category
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe lo que necesitas hacer..."
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          onClick={handleAnalyzeAndCreate}
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Analizando...' : 'Analizar'}
        </button>
      </div>

      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="p-3 border rounded bg-gray-50">
            <p className="font-semibold">{task.title}</p>
            <p className="text-sm text-gray-600">
              Prioridad: {task.priority} | Categoría: {task.category}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5️⃣ Generar plan de proyecto

```tsx
import groqService from '@/services/groqService';
import { useState } from 'react';

export default function ProjectPlanner() {
  const [goal, setGoal] = useState('');
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCreatePlan = async () => {
    setLoading(true);
    try {
      if (!groqService.isReady()) {
        const key = localStorage.getItem('groq_api_key');
        if (key) await groqService.initialize({ apiKey: key });
      }

      if (groqService.isReady()) {
        const generatedPlan = await groqService.generateSmartTasks(goal, {
          timeAvailable: '3 hours per day'
        });
        setPlan(generatedPlan);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex gap-2">
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="¿Qué quieres lograr?"
          className="flex-1 px-4 py-3 border rounded-lg"
        />
        <button
          onClick={handleCreatePlan}
          disabled={loading}
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 font-semibold"
        >
          {loading ? 'Generando...' : 'Crear plan'}
        </button>
      </div>

      {plan && (
        <div className="space-y-4">
          {/* Motivación */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="font-semibold text-yellow-900">💪 {plan.motivation}</p>
          </div>

          {/* Tareas */}
          <div className="space-y-3">
            {plan.tasks.map((task: any, i: number) => (
              <div key={i} className="p-4 border rounded-lg">
                <h3 className="font-bold text-lg">{task.title}</h3>
                <p className="text-gray-600 mb-2">{task.description}</p>
                <div className="flex gap-4 text-sm">
                  <span>⏱️ {task.estimatedTime}</span>
                  <span>📊 {task.priority}</span>
                  <span>🏷️ {task.category}</span>
                </div>
                {task.subtasks && task.subtasks.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
                    {task.subtasks.map((sub: string, j: number) => (
                      <li key={j}>{sub}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Próximos pasos */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-bold text-blue-900 mb-2">📍 Próximos pasos:</h4>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              {plan.nextSteps.map((step: string, i: number) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 6️⃣ Consejo contextual (según tus tareas)

```tsx
import groqService from '@/services/groqService';
import { useTaskStore } from '@/store/useTaskStore';
import { useState } from 'react';

export default function ContextualAdvice() {
  const { tasks } = useTaskStore();
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  const getAdvice = async () => {
    setLoading(true);
    try {
      if (!groqService.isReady()) {
        const key = localStorage.getItem('groq_api_key');
        if (key) await groqService.initialize({ apiKey: key });
      }

      if (groqService.isReady()) {
        const pendingTasks = tasks.filter(t => !t.completed);
        const response = await groqService.getIntelligentResponse(
          '¿Qué debo hacer ahora?',
          {
            recentTasks: pendingTasks.slice(0, 3).map(t => t.title),
            userMood: 'focused',
            timeOfDay: new Date().getHours() < 12 ? 'morning' : 'afternoon'
          }
        );
        setAdvice(response);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
      <button
        onClick={getAdvice}
        disabled={loading}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? '⏳ Consultando con Steeb...' : '💡 Obtener consejo'}
      </button>
      
      {advice && (
        <div className="mt-4 p-4 bg-white rounded border border-purple-200">
          <p className="text-purple-900">{advice}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 7️⃣ Widget pequeño de chat

```tsx
import { useState } from 'react';
import { Send, MessageCircle, X } from 'lucide-react';
import groqService from '@/services/groqService';

export default function MiniChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      if (!groqService.isReady()) {
        const key = localStorage.getItem('groq_api_key');
        if (key) await groqService.initialize({ apiKey: key });
      }

      if (groqService.isReady()) {
        const res = await groqService.sendMessage(message);
        setResponse(res);
        setMessage('');
      }
    } catch (error) {
      setResponse('Error. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {isOpen ? (
        <div className="w-80 h-96 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg flex flex-col">
          {/* Header */}
          <div className="p-3 border-b flex justify-between items-center">
            <span className="font-bold text-sm">Steeb AI</span>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-auto p-3 space-y-3">
            {response && (
              <div className="text-sm p-2 bg-gray-100 dark:bg-gray-900 rounded">
                {response}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pregunta..."
              className="flex-1 text-sm px-2 py-1 border rounded bg-white dark:bg-black"
            />
            <button
              onClick={handleSend}
              disabled={loading || !message.trim()}
              className="p-1 bg-black dark:bg-white text-white dark:text-black rounded hover:opacity-80 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:scale-110 transition"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
```

---

## 8️⃣ Hook personalizado para IA

```tsx
// hooks/useGroqAI.ts
import groqService from '@/services/groqService';
import { useState, useEffect } from 'react';

export function useGroqAI() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = localStorage.getItem('groq_api_key');
    if (apiKey) {
      groqService.initialize({ apiKey }).then(() => {
        setIsReady(groqService.isReady());
      });
    }
  }, []);

  const sendMessage = async (message: string) => {
    if (!isReady) {
      setError('Groq AI no está inicializado');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await groqService.sendMessage(message);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeMessage = async (message: string) => {
    if (!isReady) {
      setError('Groq AI no está inicializado');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      return await groqService.analyzeUserMessage(message);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isReady,
    isLoading,
    error,
    sendMessage,
    analyzeMessage
  };
}

// USO:
// const { isReady, isLoading, sendMessage } = useGroqAI();
// if (isReady) {
//   const msg = await sendMessage('Hola');
// }
```

---

## 9️⃣ Inicializar desde cualquier lugar

```tsx
// utils/initGroq.ts
import groqService from '@/services/groqService';

export async function initializeGroqIfNeeded() {
  if (groqService.isReady()) {
    return true;
  }

  const apiKey = localStorage.getItem('groq_api_key');
  if (apiKey) {
    try {
      return await groqService.initialize({ apiKey });
    } catch (error) {
      console.error('Error inicializando Groq:', error);
      return false;
    }
  }

  return false;
}

// USO (en cualquier componente):
// import { initializeGroqIfNeeded } from '@/utils/initGroq';
// useEffect(() => {
//   initializeGroqIfNeeded();
// }, []);
```

---

## 🔟 Con Zustand Store

```tsx
// store/useAIStore.ts
import { create } from 'zustand';
import groqService from '@/services/groqService';

interface AIStore {
  isInitialized: boolean;
  isLoading: boolean;
  messages: { role: 'user' | 'assistant'; content: string }[];
  
  initialize: (apiKey: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

export const useAIStore = create<AIStore>((set) => ({
  isInitialized: groqService.isReady(),
  isLoading: false,
  messages: [],

  initialize: async (apiKey: string) => {
    const success = await groqService.initialize({ apiKey });
    set({ isInitialized: success });
  },

  sendMessage: async (message: string) => {
    set({ isLoading: true });
    try {
      const response = await groqService.sendMessage(message);
      set((state) => ({
        messages: [
          ...state.messages,
          { role: 'user', content: message },
          { role: 'assistant', content: response }
        ]
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  clearMessages: () => set({ messages: [] })
}));
```

---

## 📋 Todos estos ejemplos están LISTOS para copiar y pegar

Simplemente:
1. Copia el código
2. Pégalo en tu componente
3. Ajusta imports si es necesario
4. ¡Usa!

Todos funcionan con Groq API gratuita.

---

**¡Elige tu caso de uso y empieza ahora! 🚀**
