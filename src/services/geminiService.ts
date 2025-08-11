import { Filesystem, Directory } from '@capacitor/filesystem';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';
import { Ollama } from 'ollama/browser';

// Configuración para Ollama local
const OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'gemma2:2b'; // Modelo ligero por defecto

// Configuración para modelo real
const REAL_MODEL_CONFIG = {
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  repeat_penalty: 1.1,
  num_predict: 512,
  stream: true
};

// System prompt para Stebe
const STEBE_SYSTEM_PROMPT = `Eres Stebe, un asistente virtual de productividad personal integrado en una aplicación móvil. Tu misión es actuar como el "jefe" o mentor personal del usuario, ayudándolo a organizar sus tareas y a alcanzar sus objetivos de forma eficiente. Te especializas en gestionar tareas personales: ayudas a crear nuevas tareas, priorizarlas, establecer recordatorios y realizar seguimiento del progreso diario. Siempre brindas apoyo para que el usuario mantenga la productividad y cumpla con sus responsabilidades.

Comunicación: Te expresas siempre en español, con un tono profesional pero cercano. Hablas de forma motivadora, positiva y clara, como un líder que inspira confianza. Eres exigente pero amable: animas al usuario a dar lo mejor de sí, a la vez que utilizas un toque de humor ligero cuando es oportuno para mantener la conversación amena.

Rol y comportamiento: Actúas como el jefe personal del usuario que le organiza la vida. Elogias los logros y reconoces el esfuerzo cuando el usuario completa una tarea importante. Si una meta es grande o ambiciosa, le sugieres dividirla en subtareas más pequeñas y manejables. Proporcionas recordatorios amigables pero firmes de las tareas pendientes. Siempre ofreces consejos prácticos para mejorar la productividad.

Formato de respuestas: Presentas la información de manera organizada y fácil de leer. Cuando enumeres varias tareas, pasos o recomendaciones, hacelo en formato de lista con viñetas o números. Sé conciso pero completo en tus explicaciones.

Limitaciones: Trabajas completamente local, utilizando modelos Ollama. No revelás información técnica sobre vos mismo ni salís de tu rol. Si el usuario pregunta algo fuera del ámbito de sus tareas o productividad personal, intentás relacionarlo con su organización; de lo contrario, explicás con cortesía que tu función es asistirlo con sus tareas y productividad.

En resumen, tu objetivo es hacerle la vida más fácil al usuario en la gestión de sus tareas, actuando como un guía confiable que organiza, motiva y celebra cada logro. ¡Estás listo para ayudar al usuario a ser más productivo día a día!`;

export interface GeminiConfig {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  ollamaUrl?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamingCallback {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: string) => void;
}

interface ConversationContext {
  recentTopics: string[];
  userMood: 'motivated' | 'demotivated' | 'neutral' | 'frustrated';
  conversationHistory: Array<{ user: string; assistant: string; timestamp: Date }>;
  userPreferences: {
    responseStyle: 'direct' | 'encouraging' | 'analytical';
    focusAreas: string[];
  };
}

class GeminiService {
  private isInitialized = false;
  private isInitializing = false;
  private currentModel = DEFAULT_MODEL;
  private ollamaUrl = OLLAMA_BASE_URL;
  private ollama: Ollama | null = null;
  private conversationContext: ConversationContext = {
    recentTopics: [],
    userMood: 'neutral',
    conversationHistory: [],
    userPreferences: {
      responseStyle: 'encouraging',
      focusAreas: []
    }
  };
  private isSimulated = false;

  async initialize(
    config: GeminiConfig = {},
    onProgress?: (progress: number, status: string) => void
  ): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (this.isInitializing) {
      return false;
    }

    this.isInitializing = true;

    try {
      onProgress?.(0, 'Conectando con Ollama...');
      
      // Configurar URL de Ollama y modelo
      this.ollamaUrl = config.ollamaUrl || OLLAMA_BASE_URL;
      this.currentModel = config.model || DEFAULT_MODEL;
      
      // Inicializar cliente Ollama
      this.ollama = new Ollama({ host: this.ollamaUrl });
      
      onProgress?.(25, 'Verificando disponibilidad de Ollama...');
      
      // Verificar si Ollama está disponible
      const isOllamaAvailable = await this.checkOllamaAvailability();
      
      if (!isOllamaAvailable) {
        onProgress?.(100, 'Ollama no disponible - usando modo simulado');
        console.warn('⚠️ Ollama no está disponible, usando modo simulado');
        this.isInitialized = true;
        this.isInitializing = false;
        this.isSimulated = true;
        return true;
      }
      
      onProgress?.(50, 'Verificando modelo disponible...');
      
      // Verificar si el modelo está disponible
      const isModelAvailable = await this.checkModelAvailability();
      
      if (!isModelAvailable) {
        onProgress?.(75, `Descargando modelo ${this.currentModel}...`);
        await this.pullModel();
      }
      
      onProgress?.(100, 'Gemini con Ollama listo!');
      
      this.isInitialized = true;
      this.isInitializing = false;
      this.isSimulated = false;
      
      console.log('✅ Gemini Service inicializado correctamente con Ollama');
      return true;
      
    } catch (error) {
      console.error('❌ Error inicializando Gemini:', error);
      onProgress?.(100, 'Error en inicialización - usando modo simulado');
      
      // En caso de error, usar modo simulado
      this.isInitialized = true;
      this.isInitializing = false;
      this.isSimulated = true;
      return true;
    }
  }

  private async checkOllamaAvailability(): Promise<boolean> {
    try {
      if (this.ollama) {
        await this.ollama.list();
        return true;
      }
      // Fallback a fetch si el cliente Ollama falla
      const response = await fetch(`${this.ollamaUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.warn('Ollama no disponible:', error);
      return false;
    }
  }

  private async checkModelAvailability(): Promise<boolean> {
    try {
      if (this.ollama) {
        const models = await this.ollama.list();
        return models.models.some((model: any) => model.name === this.currentModel);
      }
      // Fallback a fetch
      const response = await fetch(`${this.ollamaUrl}/api/tags`);
      const data = await response.json();
      const models = data.models || [];
      return models.some((model: any) => model.name === this.currentModel);
    } catch (error) {
      console.warn('Error verificando modelos:', error);
      return false;
    }
  }

  private async pullModel(): Promise<void> {
    try {
      if (this.ollama) {
        const stream = await this.ollama.pull({ model: this.currentModel, stream: true });
        for await (const chunk of stream) {
          if (chunk.completed && chunk.total) {
            const progress = Math.round((chunk.completed / chunk.total) * 100);
            console.log(`Descargando ${this.currentModel}: ${progress}%`);
          }
        }
        console.log(`✅ Modelo ${this.currentModel} descargado correctamente`);
        return;
      }
      
      // Fallback a fetch
      const response = await fetch(`${this.ollamaUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.currentModel,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Error descargando modelo: ${response.statusText}`);
      }

      console.log(`✅ Modelo ${this.currentModel} descargado correctamente`);
    } catch (error) {
      console.error('❌ Error descargando modelo:', error);
      throw error;
    }
  }

  async ensureReady(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    
    return await this.initialize();
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getInitializationStatus(): string {
    if (this.isInitialized) {
      if (this.isSimulated) {
        return `Gemini en modo simulado (Ollama no disponible)`;
      }
      return `Gemini listo con modelo ${this.currentModel}`;
    } else if (this.isInitializing) {
      return 'Inicializando Gemini con Ollama...';
    } else {
      return 'Gemini no inicializado';
    }
  }

  async getResponse(
    message: string,
    context: ChatMessage[] = [],
    config: GeminiConfig = {}
  ): Promise<string> {
    try {
      // Verificar si Ollama está disponible
      const isOllamaAvailable = await this.checkOllamaAvailability();
      
      if (!isOllamaAvailable) {
        return this.getSimulatedResponse(message);
      }

      const messages = [
        { role: 'system', content: STEBE_SYSTEM_PROMPT },
        ...context,
        { role: 'user', content: message }
      ];

      if (this.ollama) {
        const response = await this.ollama.chat({
          model: this.currentModel,
          messages: messages,
          stream: false,
          options: {
            temperature: config.temperature || REAL_MODEL_CONFIG.temperature,
            top_p: REAL_MODEL_CONFIG.top_p,
            top_k: REAL_MODEL_CONFIG.top_k,
            repeat_penalty: REAL_MODEL_CONFIG.repeat_penalty,
            num_predict: config.maxTokens || REAL_MODEL_CONFIG.num_predict
          }
        });
        return response.message?.content || 'Lo siento, no pude generar una respuesta.';
      }

      // Fallback a fetch
      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.currentModel,
          messages: messages,
          stream: false,
          options: {
            temperature: config.temperature || REAL_MODEL_CONFIG.temperature,
            top_p: REAL_MODEL_CONFIG.top_p,
            top_k: REAL_MODEL_CONFIG.top_k,
            repeat_penalty: REAL_MODEL_CONFIG.repeat_penalty,
            num_predict: config.maxTokens || REAL_MODEL_CONFIG.num_predict
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en respuesta de Ollama: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message?.content || 'Lo siento, no pude generar una respuesta.';

    } catch (error) {
      console.error('❌ Error obteniendo respuesta de Gemini:', error);
      return this.getSimulatedResponse(message);
    }
  }

  async getStreamingResponse(
    message: string,
    context: ChatMessage[] = [],
    config: GeminiConfig = {},
    callback: StreamingCallback
  ): Promise<void> {
    try {
      // Verificar si Ollama está disponible
      const isOllamaAvailable = await this.checkOllamaAvailability();
      
      if (!isOllamaAvailable) {
        const simulatedResponse = this.getSimulatedResponse(message);
        this.simulateStreaming(simulatedResponse, callback);
        return;
      }

      const messages = [
        { role: 'system', content: STEBE_SYSTEM_PROMPT },
        ...context,
        { role: 'user', content: message }
      ];

      if (this.ollama) {
        const stream = await this.ollama.chat({
          model: this.currentModel,
          messages: messages,
          stream: true,
          options: {
            temperature: config.temperature || REAL_MODEL_CONFIG.temperature,
            top_p: REAL_MODEL_CONFIG.top_p,
            top_k: REAL_MODEL_CONFIG.top_k,
            repeat_penalty: REAL_MODEL_CONFIG.repeat_penalty,
            num_predict: config.maxTokens || REAL_MODEL_CONFIG.num_predict
          }
        });

        let fullResponse = '';
        for await (const chunk of stream) {
          if (chunk.message?.content) {
            const token = chunk.message.content;
            fullResponse += token;
            callback.onToken(token);
          }
          if (chunk.done) {
            callback.onComplete(fullResponse);
            return;
          }
        }
        return;
      }

      // Fallback a fetch
      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.currentModel,
          messages: messages,
          stream: true,
          options: {
            temperature: config.temperature || REAL_MODEL_CONFIG.temperature,
            top_p: REAL_MODEL_CONFIG.top_p,
            top_k: REAL_MODEL_CONFIG.top_k,
            repeat_penalty: REAL_MODEL_CONFIG.repeat_penalty,
            num_predict: config.maxTokens || REAL_MODEL_CONFIG.num_predict
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en streaming de Ollama: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No se pudo obtener el reader del stream');
      }

      let fullResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              const token = data.message.content;
              fullResponse += token;
              callback.onToken(token);
            }
            if (data.done) {
              callback.onComplete(fullResponse);
              return;
            }
          } catch (parseError) {
            // Ignorar líneas que no son JSON válido
          }
        }
      }

      callback.onComplete(fullResponse);

    } catch (error) {
      console.error('❌ Error en streaming de Gemini:', error);
      callback.onError(error instanceof Error ? error.message : 'Error desconocido');
      
      // Fallback a respuesta simulada
      const simulatedResponse = this.getSimulatedResponse(message);
      this.simulateStreaming(simulatedResponse, callback);
    }
  }

  private simulateStreaming(text: string, callback: StreamingCallback): void {
    let index = 0;
    const words = text.split(' ');
    
    const streamInterval = setInterval(() => {
      if (index < words.length) {
        const word = index === 0 ? words[index] : ' ' + words[index];
        callback.onToken(word);
        index++;
      } else {
        clearInterval(streamInterval);
        callback.onComplete(text);
      }
    }, 50);
  }

  async getQuickResponse(message: string): Promise<string> {
    return await this.getResponse(message);
  }

  async getProductivitySuggestion(): Promise<string> {
    const suggestions = [
      "¡Hola! Soy Stebe, tu asistente de productividad. ¿En qué puedo ayudarte hoy para organizar tus tareas?",
      "¡Buen día! ¿Tienes alguna tarea pendiente que necesites priorizar? Estoy aquí para ayudarte.",
      "¡Hola! ¿Qué tal si empezamos planificando tu día? ¿Cuáles son tus objetivos principales?",
      "¡Saludos! Como tu mentor de productividad, te sugiero que revisemos tus tareas. ¿Hay algo urgente?",
      "¡Hola! ¿Lista para ser productiva hoy? Cuéntame qué necesitas lograr y te ayudo a organizarte."
    ];
    
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  private getSimulatedResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Respuestas más inteligentes y contextuales como si fuera un asistente real
    if (lowerMessage.includes('hola') || lowerMessage.includes('hi') || lowerMessage.includes('buenas')) {
      const greetings = [
        "¡Hola! Soy Stebe, tu mentor personal de productividad. Estoy aquí para convertirte en una máquina de cumplir objetivos. ¿Cuál es tu mayor desafío productivo hoy?",
        "¡Saludos! Como tu jefe personal que organiza tu vida, pregunto directamente: ¿qué necesitas lograr hoy y qué te está frenando?",
        "¡Hola! Excelente que me busques. Soy tu sistema operativo personal de productividad. ¿En qué área de tu vida necesitas más control y organización?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    if (lowerMessage.includes('organizar') || lowerMessage.includes('dia') || lowerMessage.includes('día') || lowerMessage.includes('planificar')) {
      return "Perfecto, hablemos de estrategia. Para organizar tu día como un profesional:\n\n🎯 **Prioridad #1**: ¿Cuál es LA cosa más importante que DEBE pasar hoy?\n⏰ **Bloques de tiempo**: Asigna horarios específicos, no listas infinitas\n🚫 **Elimina despiadadamente**: ¿Qué puedes NO hacer hoy?\n\n¿Cuál es tu mayor prioridad ahora mismo?";
    }
    
    if (lowerMessage.includes('tarea') || lowerMessage.includes('trabajo') || lowerMessage.includes('hacer')) {
      return "Excelente enfoque en la ejecución. Como tu mentor de productividad, esto es lo que funciona:\n\n✅ **Regla 2-minutos**: Si toma menos de 2 min, hazlo YA\n🔥 **Una cosa a la vez**: Multitasking = mediocridad garantizada\n⚡ **Sesiones de 25 min**: Pomodoro funciona porque respeta tu neurología\n\n¿Qué tarea específica necesita tu atención inmediata?";
    }
    
    if (lowerMessage.includes('motivaci') || lowerMessage.includes('procrastina') || lowerMessage.includes('pereza') || lowerMessage.includes('no puedo')) {
      return "Entiendo esa resistencia mental. La procrastinación no es pereza, es tu cerebro protegiéndote de algo que percibe como amenazante.\n\n💡 **Verdad cruda**: La motivación viene DESPUÉS de la acción, no antes\n🔬 **Neurociencia**: Cada pequeño logro libera dopamina = momentum\n⚡ **Truco**: ¿Qué es lo más pequeño que podrías hacer en 2 minutos?\n\n¿Cuál va a ser tu primer micro-paso ahora mismo?";
    }
    
    if (lowerMessage.includes('tiempo') || lowerMessage.includes('horario') || lowerMessage.includes('cuando')) {
      return "El tiempo es tu recurso más valioso porque es irrecuperable. Estrategia inteligente:\n\n⏰ **Planifica la noche anterior**: Las decisiones matutinas agotan energía mental\n🎯 **3 prioridades máximo**: Más = dilución de esfuerzo\n📱 **Protege tu atención**: Notificaciones = ladrones de productividad\n\n¿Qué parte de tu día sientes más fuera de control?";
    }
    
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('como') || lowerMessage.includes('cómo') || lowerMessage.includes('consejo')) {
      return "Por supuesto. Soy tu arquitecto de productividad personal. Mi función es simple: convertir el caos en sistema.\n\n🧠 **Primero**: Identifica tu patrón de mayor energía (¿mañana/tarde?)\n⚡ **Segundo**: Protege ese tiempo para trabajo importante\n🎯 **Tercero**: Todo lo demás es secundario\n\n¿Cuál es tu mayor dolor de cabeza productivo ahora mismo?";
    }
    
    if (lowerMessage.includes('meta') || lowerMessage.includes('objetivo') || lowerMessage.includes('lograr')) {
      return "Excelente mentalidad orientada a resultados. Las metas se logran con sistemas, no con inspiración:\n\n📊 **Meta sin deadline = deseo bonito**\n🔄 **Sistema sin seguimiento = fantasía**\n⚡ **Progreso > perfección**: Siempre\n\n¿Tu objetivo tiene fecha específica y métricas claras para medir progreso?";
    }
    
    // Respuestas contextuales más inteligentes
    const contextualResponses = [
      "Perfecto enfoque. Como tu jefe personal de productividad: la diferencia entre soñar y lograr está en la implementación. ¿Cuál va a ser tu siguiente paso específico y medible?",
      "Me gusta cómo piensas. Convirtamos esa reflexión en acción. Si pudieras mejorar UNA cosa de cómo manejas tu tiempo/energía hoy, ¿cuál sería?",
      "Excelente. No necesitas más información, necesitas más ejecución. Con lo que ya sabes, ¿cuál es el paso más obvio que deberías dar ahora?",
      "Interesante perspectiva. Como tu mentor de productividad: ¿qué patrón de tu rutina diaria necesita una actualización urgente?",
      "Bien planteado. La productividad real viene del autoconocimiento: patrones, fortalezas, limitaciones. ¿Qué has descubierto sobre tu forma de trabajar?"
    ];
    
    return contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
  }

  updateConversationContext(userMessage: string, assistantResponse: string): void {
    this.conversationContext.conversationHistory.push({
      user: userMessage,
      assistant: assistantResponse,
      timestamp: new Date()
    });

    // Mantener solo las últimas 10 conversaciones
    if (this.conversationContext.conversationHistory.length > 10) {
      this.conversationContext.conversationHistory = this.conversationContext.conversationHistory.slice(-10);
    }

    // Actualizar temas recientes
    const topics = this.extractTopics(userMessage);
    this.conversationContext.recentTopics = [...new Set([...topics, ...this.conversationContext.recentTopics])].slice(0, 5);

    // Detectar estado de ánimo básico
    this.updateUserMood(userMessage);
  }

  private extractTopics(message: string): string[] {
    const keywords = ['tarea', 'trabajo', 'proyecto', 'deadline', 'reunión', 'objetivo', 'meta'];
    return keywords.filter(keyword => message.toLowerCase().includes(keyword));
  }

  private updateUserMood(message: string): void {
    const positiveWords = ['bien', 'genial', 'perfecto', 'excelente', 'contento'];
    const negativeWords = ['mal', 'terrible', 'frustrado', 'cansado', 'abrumado'];
    
    const lowerMessage = message.toLowerCase();
    
    if (positiveWords.some(word => lowerMessage.includes(word))) {
      this.conversationContext.userMood = 'motivated';
    } else if (negativeWords.some(word => lowerMessage.includes(word))) {
      this.conversationContext.userMood = 'frustrated';
    } else {
      this.conversationContext.userMood = 'neutral';
    }
  }

  getConversationContext(): ConversationContext {
    return { ...this.conversationContext };
  }

  clearConversationHistory(): void {
    this.conversationContext.conversationHistory = [];
    this.conversationContext.recentTopics = [];
    this.conversationContext.userMood = 'neutral';
  }

  // Métodos de utilidad para configuración
  setModel(model: string): void {
    this.currentModel = model;
  }

  getAvailableModels(): string[] {
    return [
      'gemma2:2b',
      'gemma2:9b',
      'llama3.2:1b',
      'llama3.2:3b',
      'mistral:7b',
      'phi3:mini',
      'qwen2.5:1.5b',
      'qwen2.5:3b'
    ];
  }

  async getInstalledModels(): Promise<string[]> {
    try {
      if (this.ollama) {
        const models = await this.ollama.list();
        return models.models.map((model: any) => model.name);
      }
      // Fallback a fetch
      const response = await fetch(`${this.ollamaUrl}/api/tags`);
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Error obteniendo modelos instalados:', error);
      return [];
    }
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  setOllamaUrl(url: string): void {
    this.ollamaUrl = url;
  }

  getOllamaUrl(): string {
    return this.ollamaUrl;
  }

  // Nuevos métodos públicos para control de disponibilidad y modo simulado
  async isLocalAvailable(): Promise<boolean> {
    try {
      return await this.checkOllamaAvailability();
    } catch {
      return false;
    }
  }

  isSimulatedMode(): boolean {
    return this.isSimulated;
  }
}

export const geminiService = new GeminiService();
export default geminiService;