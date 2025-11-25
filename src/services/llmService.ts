// @ts-nocheck
// LLM.js Service - Universal LLM interface (sin dependencias externas)
// Soporta: Ollama (local/gratis), OpenAI, Google, Anthropic, etc.

import { LLM } from '@themaximalist/llm.js';

interface LLMConfig {
  provider?: 'ollama' | 'openai' | 'google' | 'anthropic' | 'minimax';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class LLMService {
  private static instance: LLMService;
  private llm: LLM | null = null;
  private messages: ChatMessage[] = [];
  private isInitialized = false;
  private provider: 'ollama' | 'openai' | 'google' | 'anthropic' | 'minimax' = 'ollama';
  
  // System prompt para Steeb
  private readonly systemPrompt = `Eres Steeb, asistente experto en productividad anti-procrastinación. 

CARACTERÍSTICAS:
- Directo y sin rodeos (máximo 3 frases)
- Motivador pero realista
- Enfocado en acción INMEDIATA
- Usa frases cortas y poderosas
- SIEMPRE orienta a la acción concreta

PERSONALIDAD:
- Duro pero justo
- Entiende que la procrastinación es el enemigo #1
- Celebra las victorias
- No acepta excusas

RESPONDER EN ESPAÑOL siempre.
Máximo 3 frases por respuesta.`;

  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  /**
   * Inicializar el servicio LLM
   * Por defecto usa Ollama (local y gratis)
   */
  async initialize(config?: LLMConfig): Promise<boolean> {
    try {
      const provider = config?.provider || 'ollama';
      this.provider = provider;

      // Crear instancia de LLM según el provider
      switch (provider) {
        case 'ollama':
          // Ollama es local - sin API key necesario
          this.llm = new LLM({
            name: 'ollama',
            apiKey: config?.apiKey || 'ollama', // Dummy key para Ollama
            baseUrl: config?.baseUrl || 'http://localhost:11434', // Puerto por defecto de Ollama
            model: config?.model || 'mistral' // Modelo por defecto
          });
          break;

        case 'openai':
          if (!config?.apiKey) throw new Error('API key requerida para OpenAI');
          this.llm = new LLM({
            name: 'openai',
            apiKey: config.apiKey,
            model: config?.model || 'gpt-3.5-turbo'
          });
          break;

        case 'google':
          if (!config?.apiKey) throw new Error('API key requerida para Google');
          this.llm = new LLM({
            name: 'google',
            apiKey: config.apiKey,
            model: config?.model || 'gemini-pro'
          });
          break;

        case 'anthropic':
          if (!config?.apiKey) throw new Error('API key requerida para Anthropic');
          this.llm = new LLM({
            name: 'anthropic',
            apiKey: config.apiKey,
            model: config?.model || 'claude-2'
          });
          break;

        case 'minimax':
          if (!config?.apiKey) throw new Error('API key requerida para MINIMAX');
          this.llm = new LLM({
            name: 'openai', // MINIMAX es compatible con OpenAI SDK
            apiKey: config.apiKey,
            baseUrl: config?.baseUrl || 'https://api.minimax.io/v1', // Endpoint oficial MINIMAX
            model: config?.model || 'MiniMax-M2' // Modelo por defecto
          });
          break;

        default:
          throw new Error(`Provider no soportado: ${provider}`);
      }

      // Inicializar contexto con system prompt
      this.messages = [{
        role: 'system',
        content: this.systemPrompt
      }];

      this.isInitialized = true;
      console.log(`✅ LLM Service inicializado con ${provider}`);
      return true;

    } catch (error) {
      console.error('❌ Error inicializando LLM:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Enviar mensaje y obtener respuesta
   */
  async sendMessage(message: string): Promise<string> {
    if (!this.isInitialized || !this.llm) {
      throw new Error('LLM Service no está inicializado');
    }

    try {
      // Agregar mensaje del usuario
      this.messages.push({
        role: 'user',
        content: message
      });

      // Obtener respuesta
      const response = await this.llm.chat(this.messages);
      const assistantMessage = response.message.content;

      // Agregar respuesta al historial
      this.messages.push({
        role: 'assistant',
        content: assistantMessage
      });

      // Mantener histórico limitado (últimos 10 mensajes + system)
      if (this.messages.length > 11) {
        this.messages = [
          this.messages[0], // system prompt
          ...this.messages.slice(-10)
        ];
      }

      console.log('✅ Respuesta obtenida de', this.provider);
      return assistantMessage;

    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      throw error;
    }
  }

  /**
   * Analizar mensaje del usuario para extraer intenciones
   */
  async analyzeUserMessage(message: string): Promise<{
    intent: 'task_creation' | 'question' | 'motivation_request';
    extractedTasks: string[];
    priority: 'high' | 'medium' | 'low';
  }> {
    if (!this.isInitialized || !this.llm) {
      throw new Error('LLM Service no está inicializado');
    }

    try {
      const analysisPrompt = `Analiza este mensaje y extrae:
1. Intención (task_creation/question/motivation_request)
2. Tareas extraídas
3. Prioridad (high/medium/low)

Mensaje: "${message}"

Responde en formato JSON simple:
{"intent":"...","tasks":["..."],"priority":"..."}`;

      const response = await this.llm.chat([
        { role: 'system', content: 'Eres un analizador. Responde SOLO con JSON válido.' },
        { role: 'user', content: analysisPrompt }
      ]);

      try {
        const parsed = JSON.parse(response.message.content);
        return {
          intent: parsed.intent || 'question',
          extractedTasks: parsed.tasks || [],
          priority: parsed.priority || 'medium'
        };
      } catch {
        // Fallback si no es JSON válido
        return {
          intent: 'question',
          extractedTasks: [],
          priority: 'medium'
        };
      }

    } catch (error) {
      console.error('❌ Error analizando mensaje:', error);
      throw error;
    }
  }

  /**
   * Generar respuesta motivacional
   */
  async getMotivationalResponse(context?: {
    tasksPending?: number;
    completedToday?: number;
    userMood?: string;
  }): Promise<string> {
    if (!this.isInitialized || !this.llm) {
      throw new Error('LLM Service no está inicializado');
    }

    try {
      let contextStr = 'El usuario está aquí para productividad.';
      
      if (context?.tasksPending) {
        contextStr = `El usuario tiene ${context.tasksPending} tareas pendientes.`;
      }
      if (context?.userMood) {
        contextStr += ` Estado: ${context.userMood}.`;
      }

      const prompt = `${contextStr}
      
Dame una frase motivacional CORTA de Steeb para eliminar procrastinación.
Máximo 2 frases. En español.`;

      const response = await this.llm.chat([
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: prompt }
      ]);

      return response.message.content;

    } catch (error) {
      console.error('❌ Error obteniendo motivación:', error);
      // Fallback
      return 'Dejá de pensar, hacelo. La acción es el único idioma que entiende el éxito.';
    }
  }

  /**
   * Generar plan de tareas
   */
  async generateTaskPlan(userRequest: string): Promise<{
    tasks: string[];
    motivation: string;
    nextSteps: string[];
  }> {
    if (!this.isInitialized || !this.llm) {
      throw new Error('LLM Service no está inicializado');
    }

    try {
      const prompt = `El usuario necesita: "${userRequest}"

Crea un plan de 3-5 tareas específicas y accionables.
Responde en JSON:
{
  "tasks": ["tarea1", "tarea2", ...],
  "motivation": "frase motivadora corta",
  "nextSteps": ["paso1", "paso2"]
}`;

      const response = await this.llm.chat([
        { role: 'system', content: 'Eres experto en productividad. Responde SOLO en JSON válido.' },
        { role: 'user', content: prompt }
      ]);

      try {
        const parsed = JSON.parse(response.message.content);
        return {
          tasks: parsed.tasks || [],
          motivation: parsed.motivation || 'Vamos, tú puedes.',
          nextSteps: parsed.nextSteps || ['Empezar con la primera tarea']
        };
      } catch {
        return {
          tasks: [userRequest],
          motivation: 'Vamos, tú puedes.',
          nextSteps: ['Empezar ahora']
        };
      }

    } catch (error) {
      console.error('❌ Error generando plan:', error);
      throw error;
    }
  }

  /**
   * Verificar estado de conexión
   */
  isReady(): boolean {
    return this.isInitialized && this.llm !== null;
  }

  /**
   * Obtener info del provider actual
   */
  getProviderInfo(): {
    provider: string;
    ready: boolean;
    requiresApiKey: boolean;
  } {
    return {
      provider: this.provider,
      ready: this.isReady(),
      requiresApiKey: this.provider !== 'ollama'
    };
  }

  /**
   * Limpiar contexto de chat
   */
  clearContext(): void {
    this.messages = [{
      role: 'system',
      content: this.systemPrompt
    }];
  }

  /**
   * Cambiar a otro provider
   */
  async switchProvider(config: LLMConfig): Promise<boolean> {
    return this.initialize(config);
  }
}

// Export como singleton
const llmService = LLMService.getInstance();
export default llmService;

