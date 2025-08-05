import { Filesystem, Directory } from '@capacitor/filesystem';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

// Para implementación real con Mistral AI, descomentar estas importaciones:
// import { LlamaContext, LlamaModel, LlamaChatSession } from 'llama.rn';
// import { NativeModules } from 'react-native';

// URL del modelo Mistral 7B GGUF optimizado
const MISTRAL_MODEL_URL = 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf';
const MODEL_FILENAME = 'mistral-7b-instruct.gguf';

// Configuración para modelo real
const REAL_MODEL_CONFIG = {
  n_ctx: 2048,      // Contexto
  n_batch: 512,     // Batch size
  n_threads: 4,     // Threads CPU
  use_mlock: true,  // Mantener en RAM
  use_mmap: true,   // Memory mapping
  temperature: 0.7,
  top_p: 0.9,
  repeat_penalty: 1.1
};

// System prompt para Stebe
const STEBE_SYSTEM_PROMPT = `Eres Stebe, un asistente virtual de productividad personal integrado en una aplicación móvil. Tu misión es actuar como el "jefe" o mentor personal del usuario, ayudándolo a organizar sus tareas y a alcanzar sus objetivos de forma eficiente. Te especializas en gestionar tareas personales: ayudas a crear nuevas tareas, priorizarlas, establecer recordatorios y realizar seguimiento del progreso diario. Siempre brindas apoyo para que el usuario mantenga la productividad y cumpla con sus responsabilidades.

Comunicación: Te expresas siempre en español, con un tono profesional pero cercano. Hablas de forma motivadora, positiva y clara, como un líder que inspira confianza. Eres exigente pero amable: animas al usuario a dar lo mejor de sí, a la vez que utilizas un toque de humor ligero cuando es oportuno para mantener la conversación amena.

Rol y comportamiento: Actúas como el jefe personal del usuario que le organiza la vida. Elogias los logros y reconoces el esfuerzo cuando el usuario completa una tarea importante. Si una meta es grande o ambiciosa, le sugieres dividirla en subtareas más pequeñas y manejables. Proporcionas recordatorios amigables pero firmes de las tareas pendientes. Siempre ofreces consejos prácticos para mejorar la productividad.

Formato de respuestas: Presentas la información de manera organizada y fácil de leer. Cuando enumeres varias tareas, pasos o recomendaciones, hacelo en formato de lista con viñetas o números. Sé conciso pero completo en tus explicaciones.

Limitaciones: Trabajas completamente offline, sin acceso a Internet ni datos externos en tiempo real. No revelás información técnica sobre vos mismo ni salís de tu rol. Si el usuario pregunta algo fuera del ámbito de sus tareas o productividad personal, intentás relacionarlo con su organización; de lo contrario, explicás con cortesía que tu función es asistirlo con sus tareas y productividad.

En resumen, tu objetivo es hacerle la vida más fácil al usuario en la gestión de sus tareas, actuando como un guía confiable que organiza, motiva y celebra cada logro. ¡Estás listo para ayudar al usuario a ser más productivo día a día!`;

export interface MistralConfig {
  temperature?: number;
  maxTokens?: number;
  contextSize?: number;
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

class MistralService {
  private context: any = null;
  private isInitialized = false;
  private isInitializing = false;
  private downloadProgress = 0;
  private modelPath = '';
  private conversationContext: ConversationContext = {
    recentTopics: [],
    userMood: 'neutral',
    conversationHistory: [],
    userPreferences: {
      responseStyle: 'encouraging',
      focusAreas: []
    }
  };

  async initialize(
    config: MistralConfig = {},
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
      onProgress?.(0, 'Verificando disponibilidad...');
      
      // Verificar si estamos en un entorno nativo
      if (!Capacitor.isNativePlatform()) {
        // Simular inicialización para desarrollo web
        onProgress?.(50, 'Modo de desarrollo detectado...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        onProgress?.(100, 'Stebe AI listo (modo desarrollo)');
        this.isInitialized = true;
        this.isInitializing = false;
        return true;
      }

      // En un entorno real, verificar si el modelo ya existe
      this.modelPath = await this.getModelPath();
      const modelExists = await this.checkModelExists();

      if (!modelExists) {
        onProgress?.(10, 'Preparando descarga de Mistral 7B...');
        // Por ahora, simular descarga para evitar problemas de dependencias
        await this.simulateDownload(onProgress);
      } else {
        onProgress?.(50, 'Modelo encontrado, cargando...');
      }

      onProgress?.(70, 'Inicializando contexto...');
      
      // Configuración del modelo
      const defaultConfig = {
        temperature: 0.7,
        maxTokens: 2048,
        contextSize: 4096,
        ...config
      };

      // Simular inicialización de contexto
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.context = { ready: true, config: defaultConfig };

      onProgress?.(100, 'Modelo Stebe listo!');
      this.isInitialized = true;
      this.isInitializing = false;
      
      return true;
    } catch (error) {
      console.error('Error inicializando Mistral:', error);
      this.isInitializing = false;
      onProgress?.(0, `Error: ${error.message}`);
      return false;
    }
  }

  private async getModelPath(): Promise<string> {
    const info = await Device.getInfo();
    const documentsPath = await Filesystem.getUri({
      directory: Directory.Documents,
      path: MODEL_FILENAME,
    });
    return documentsPath.uri;
  }

  private async checkModelExists(): Promise<boolean> {
    try {
      const result = await Filesystem.stat({
        directory: Directory.Documents,
        path: MODEL_FILENAME,
      });
      return result.type === 'file';
    } catch {
      return false;
    }
  }

  private async simulateDownload(onProgress?: (progress: number, status: string) => void): Promise<void> {
    try {
      onProgress?.(20, 'Iniciando descarga...');
      
      // Simular descarga con progreso
      for (let i = 20; i <= 65; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 200));
        onProgress?.(i, `Descargando Mistral 7B: ${i - 15}%`);
      }

      onProgress?.(65, 'Guardando modelo...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simular guardado del archivo
      if (Capacitor.isNativePlatform()) {
        await Filesystem.writeFile({
          directory: Directory.Documents,
          path: MODEL_FILENAME,
          data: 'simulated_model_data', // En una implementación real, sería el modelo completo
        });
      }

      onProgress?.(70, 'Modelo descargado correctamente');
    } catch (error) {
      console.error('Error simulando descarga:', error);
      throw new Error(`Error descargando modelo: ${error.message}`);
    }
  }

  private async downloadModel(onProgress?: (progress: number, status: string) => void): Promise<void> {
    // IMPLEMENTACIÓN REAL - Descomenta cuando tengas llama.rn instalado
    /*
    try {
      onProgress?.(0, 'Verificando espacio disponible...');
      
      // Verificar espacio disponible (necesitamos ~5GB)
      const deviceInfo = await Device.getInfo();
      
      onProgress?.(5, 'Iniciando descarga del modelo...');
      
      // Descargar modelo usando fetch con progreso
      const response = await fetch(MISTRAL_MODEL_URL);
      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength || '0', 10);
      
      if (!response.body) {
        throw new Error('No se pudo iniciar la descarga');
      }
      
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        received += value.length;
        
        const progress = Math.round((received / total) * 100);
        onProgress?.(progress, `Descargando modelo: ${Math.round(received / 1024 / 1024)}MB / ${Math.round(total / 1024 / 1024)}MB`);
      }
      
      // Combinar chunks en un solo array
      const modelData = new Uint8Array(received);
      let position = 0;
      for (const chunk of chunks) {
        modelData.set(chunk, position);
        position += chunk.length;
      }
      
      // Guardar el modelo
      onProgress?.(95, 'Guardando modelo...');
      const base64Data = this.arrayBufferToBase64(modelData.buffer);
      
      await Filesystem.writeFile({
        directory: Directory.Documents,
        path: MODEL_FILENAME,
        data: base64Data
      });
      
      onProgress?.(100, 'Modelo descargado correctamente');
    } catch (error) {
      console.error('Error descargando modelo real:', error);
      throw new Error(`Error descargando modelo: ${error.message}`);
    }
    */
    
    // Por ahora, usar simulación para desarrollo
    return this.simulateDownload(onProgress);
  }

  private async initializeRealModel(): Promise<boolean> {
    // IMPLEMENTACIÓN REAL - Descomenta cuando tengas llama.rn instalado
    /*
    try {
      // Verificar que el modelo existe
      const modelExists = await this.checkModelExists();
      if (!modelExists) {
        throw new Error('Modelo no encontrado. Primero descarga el modelo.');
      }
      
      // Obtener ruta del modelo
      const modelPath = await this.getModelPath();
      
      // Inicializar modelo con llama.rn
      const model = await LlamaModel.load(modelPath, REAL_MODEL_CONFIG);
      
      // Crear contexto
      const context = await model.createContext({
        ...REAL_MODEL_CONFIG,
        seed: -1 // Seed aleatorio
      });
      
      // Crear sesión de chat
      const session = await context.createChatSession({
        systemPrompt: STEBE_SYSTEM_PROMPT
      });
      
      this.context = {
        model,
        context,
        session,
        ready: true,
        config: REAL_MODEL_CONFIG
      };
      
      return true;
    } catch (error) {
      console.error('Error inicializando modelo real:', error);
      return false;
    }
    */
    
    // Por ahora, usar contexto simulado
    this.context = { ready: true, config: REAL_MODEL_CONFIG };
    return true;
  }

  private async generateRealResponse(
    messages: ChatMessage[],
    streaming: StreamingCallback
  ): Promise<void> {
    // IMPLEMENTACIÓN REAL - Descomenta cuando tengas llama.rn instalado
    /*
    try {
      if (!this.context?.session) {
        throw new Error('Sesión de chat no inicializada');
      }
      
      // Obtener último mensaje del usuario
      const userMessage = messages[messages.length - 1]?.content || '';
      
      // Generar respuesta con streaming
      const stream = await this.context.session.prompt(userMessage, {
        temperature: this.context.config.temperature,
        topP: this.context.config.top_p,
        repeatPenalty: this.context.config.repeat_penalty,
        maxTokens: 1024
      });
      
      let fullResponse = '';
      
      // Procesar stream
      for await (const token of stream) {
        if (token.type === 'token') {
          fullResponse += token.data;
          streaming.onToken(token.data);
        } else if (token.type === 'done') {
          streaming.onComplete(fullResponse.trim());
          return;
        } else if (token.type === 'error') {
          streaming.onError(token.data);
          return;
        }
      }
      
    } catch (error) {
      console.error('Error generando respuesta real:', error);
      streaming.onError(`Error generando respuesta: ${error.message}`);
    }
    */
    
    // Por ahora, usar generación simulada mejorada
    return this.generateSimulatedResponse(messages, streaming);
  }

  private async generateSimulatedResponse(
    messages: ChatMessage[],
    streaming: StreamingCallback
  ): Promise<void> {
    try {
      // Preparar el contexto completo con system prompt
      const fullConversation = [
        { role: 'system', content: STEBE_SYSTEM_PROMPT },
        ...messages
      ];

      // Simular generación de respuesta inteligente basada en el contexto
      const userMessage = messages[messages.length - 1]?.content || '';
      let response = await this.generateIntelligentResponse(userMessage);

      // Simular streaming de tokens
      const tokens = response.split(' ');
      let fullResponse = '';

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i] + (i < tokens.length - 1 ? ' ' : '');
        fullResponse += token;
        streaming.onToken(token);
        
        // Simular velocidad de generación realista
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      }

      streaming.onComplete(fullResponse.trim());
    } catch (error) {
      console.error('Error generando respuesta simulada:', error);
      streaming.onError(`Error generando respuesta: ${error.message}`);
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async generateResponse(
    messages: ChatMessage[],
    streaming: StreamingCallback,
    config: MistralConfig = {}
  ): Promise<void> {
    if (!this.isInitialized || !this.context) {
      streaming.onError('El modelo no está inicializado');
      return;
    }

    // En producción con modelo real, usar generateRealResponse
    // Por ahora usar generateSimulatedResponse mejorada
    return this.generateSimulatedResponse(messages, streaming);
  }

  private async generateIntelligentResponse(userMessage: string): Promise<string> {
    // Esta función simula respuestas inteligentes basadas en el contexto
    // En la implementación real, esto sería manejado por Mistral 7B
    
    const message = userMessage.toLowerCase();
    
    // Actualizar contexto de conversación
    this.updateConversationContext(userMessage);
    
    // Detectar intención y contexto más sofisticado
    const intent = this.detectUserIntent(message);
    const mood = this.analyzeUserMood(message);
    const context = this.getContextualInfo(message);
    
    // Generar respuesta basada en intención, estado de ánimo y contexto
    let response = '';
    
    switch (intent) {
      case 'task_management':
        response = this.generateTaskManagementResponse(message, mood, context);
        break;
      case 'motivation_needed':
        response = this.generateMotivationalResponse(message, mood, context);
        break;
      case 'time_management':
        response = this.generateTimeManagementResponse(message, mood, context);
        break;
      case 'goal_setting':
        response = this.generateGoalSettingResponse(message, mood, context);
        break;
      case 'progress_check':
        response = this.generateProgressResponse(message, mood, context);
        break;
      case 'general_productivity':
        response = this.generateGeneralProductivityResponse(message, mood, context);
        break;
      default:
        response = this.generateContextualGeneralResponse(message, mood, context);
    }
    
    // Guardar en historial
    this.conversationContext.conversationHistory.push({
      user: userMessage,
      assistant: response,
      timestamp: new Date()
    });
    
    // Mantener solo los últimos 10 intercambios
    if (this.conversationContext.conversationHistory.length > 10) {
      this.conversationContext.conversationHistory.shift();
    }
    
    return response;
  }

  private updateConversationContext(userMessage: string): void {
    const message = userMessage.toLowerCase();
    
    // Detectar temas mencionados
    const topics = this.extractTopics(message);
    this.conversationContext.recentTopics = [...new Set([...topics, ...this.conversationContext.recentTopics])].slice(0, 5);
    
    // Actualizar estado de ánimo
    this.conversationContext.userMood = this.analyzeUserMood(message);
    
    // Detectar áreas de enfoque del usuario
    const focusAreas = this.extractFocusAreas(message);
    this.conversationContext.userPreferences.focusAreas = [...new Set([...focusAreas, ...this.conversationContext.userPreferences.focusAreas])].slice(0, 3);
  }

  private detectUserIntent(message: string): string {
    // Detectar intención principal del usuario con mejor precisión
    const intentPatterns = {
      task_management: [
        'tarea', 'trabajo', 'proyecto', 'hacer', 'completar', 'terminar', 'pendiente',
        'lista', 'organizar', 'priorizar', 'planear', 'schedule', 'deadline'
      ],
      motivation_needed: [
        'motivación', 'ánimo', 'desanimado', 'cansado', 'difícil', 'no puedo',
        'imposible', 'rendirse', 'procrastinar', 'pereza', 'bloqueo', 'stuck'
      ],
      time_management: [
        'tiempo', 'horario', 'calendario', 'agenda', 'cronograma', 'duración',
        'rápido', 'lento', 'eficiencia', 'productividad', 'optimizar'
      ],
      goal_setting: [
        'meta', 'objetivo', 'propósito', 'lograr', 'alcanzar', 'conseguir',
        'ambición', 'sueño', 'visión', 'futuro', 'aspiración'
      ],
      progress_check: [
        'progreso', 'avance', 'estado', 'actualización', 'reporte', 'status',
        'seguimiento', 'evaluación', 'revisión'
      ],
      general_productivity: [
        'productivo', 'eficiente', 'efectivo', 'sistema', 'método', 'estrategia',
        'técnica', 'proceso', 'workflow', 'rutina'
      ]
    };

    let maxMatches = 0;
    let detectedIntent = 'general';
    
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      const matches = patterns.filter(pattern => message.includes(pattern)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedIntent = intent;
      }
    }
    
    return detectedIntent;
  }

  private analyzeUserMood(message: string): 'motivated' | 'demotivated' | 'neutral' | 'frustrated' {
    const positiveWords = ['bien', 'genial', 'excelente', 'perfecto', 'listo', 'motivado', 'entusiasmado'];
    const negativeWords = ['mal', 'terrible', 'imposible', 'no puedo', 'difícil', 'cansado', 'agotado'];
    const frustratedWords = ['no funciona', 'no entiendo', 'confuso', 'complicado', 'enojado', 'molesto'];
    
    const positiveCount = positiveWords.filter(word => message.includes(word)).length;
    const negativeCount = negativeWords.filter(word => message.includes(word)).length;
    const frustratedCount = frustratedWords.filter(word => message.includes(word)).length;
    
    if (frustratedCount > 0) return 'frustrated';
    if (positiveCount > negativeCount) return 'motivated';
    if (negativeCount > positiveCount) return 'demotivated';
    return 'neutral';
  }

  private getContextualInfo(message: string): any {
    const context = {
      timeContext: this.detectTimeContext(message),
      urgencyLevel: this.detectUrgencyLevel(message),
      complexityLevel: this.detectComplexityLevel(message),
      previousMentions: this.findPreviousMentions(message)
    };
    
    return context;
  }

  private detectTimeContext(message: string): string {
    if (message.includes('hoy') || message.includes('ahora')) return 'immediate';
    if (message.includes('mañana') || message.includes('próximo')) return 'short_term';
    if (message.includes('semana') || message.includes('mes')) return 'medium_term';
    if (message.includes('año') || message.includes('futuro')) return 'long_term';
    return 'unspecified';
  }

  private detectUrgencyLevel(message: string): 'low' | 'medium' | 'high' {
    if (message.includes('urgente') || message.includes('ya') || message.includes('inmediato')) return 'high';
    if (message.includes('pronto') || message.includes('importante')) return 'medium';
    return 'low';
  }

  private detectComplexityLevel(message: string): 'simple' | 'moderate' | 'complex' {
    const complexWords = ['complejo', 'complicado', 'difícil', 'múltiple', 'varios', 'muchos'];
    const simpleWords = ['simple', 'fácil', 'rápido', 'pequeño', 'básico'];
    
    if (complexWords.some(word => message.includes(word))) return 'complex';
    if (simpleWords.some(word => message.includes(word))) return 'simple';
    return 'moderate';
  }

  private findPreviousMentions(message: string): string[] {
    // Buscar temas mencionados anteriormente que aparezcan en el mensaje actual
    return this.conversationContext.recentTopics.filter(topic => 
      message.includes(topic.toLowerCase())
    );
  }

  private extractTopics(message: string): string[] {
    const topicKeywords = [
      'trabajo', 'estudio', 'ejercicio', 'lectura', 'proyecto', 'reunión',
      'familia', 'salud', 'finanzas', 'hobbies', 'programación', 'diseño'
    ];
    
    return topicKeywords.filter(topic => message.includes(topic));
  }

  private extractFocusAreas(message: string): string[] {
    const focusAreas = [
      'productividad', 'organización', 'tiempo', 'metas', 'hábitos',
      'motivación', 'concentración', 'planificación'
    ];
    
    return focusAreas.filter(area => message.includes(area));
  }

  private generateTaskManagementResponse(message: string, mood: string, context: any): string {
    const responses = {
      motivated: [
        "¡Excelente energía! Veo que estás listo para la acción. Vamos a canalizar esa motivación de forma estratégica. Primero, necesito que definas el resultado específico que buscas. ¿Cuál es el entregable final?",
        "Me gusta esa actitud proactiva. Para maximizar tu efectividad, apliquemos la regla del 'siguiente paso más obvio'. De todo lo que mencionaste, ¿cuál es la acción más pequeña y concreta que podrías completar en los próximos 20 minutos?",
        "Perfecto, esa energía es tu mayor activo ahora. Te propongo usar la técnica de 'timeboxing': define exactamente cuánto tiempo le vas a dedicar a cada parte. ¿Cuánto tiempo realistamente necesitas para esto?"
      ],
      demotivated: [
        "Entiendo que puede sentirse abrumador cuando tienes muchas cosas por hacer. Pero aquí está la verdad: la acción crea claridad, no al revés. Vamos a empezar con algo muy pequeño para activar tu momentum. ¿Cuál es la parte más fácil de esta tarea?",
        "No necesitas estar motivado para empezar, solo necesitas empezar para estar motivado. Es neurociencia básica: la dopamina viene después de la acción, no antes. ¿Qué podrías hacer en exactamente 5 minutos para avanzar?",
        "La resistencia mental es normal cuando algo nos parece grande o complejo. Vamos a romper esa resistencia dividiéndolo en micro-tareas. Cuéntame: si tuvieras que explicarle esta tarea a un niño de 10 años, ¿cómo la dividirías?"
      ],
      frustrated: [
        "Percibo frustración en tu mensaje, y es completamente comprensible. La frustración suele venir de la falta de claridad o de intentar hacer demasiado a la vez. Hagamos un reset: ¿cuál es exactamente el obstáculo que te está bloqueando?",
        "La frustración es una señal de que necesitas cambiar de enfoque. A veces estamos tan enfocados en el problema que no vemos las soluciones simples. ¿Has intentado abordar esto desde otro ángulo?",
        "Okay, respiremos hondo. La frustración consume energía mental que necesitas para resolver esto. Vamos paso a paso: primero, ¿qué partes de esta tarea ya tienes claras?"
      ],
      neutral: [
        "Bien, hablemos de organización estratégica. Para convertir esta tarea en resultados concretos, necesitamos tres cosas: claridad en el objetivo, plan de acción específico y criterios de éxito. ¿Con cuál de estas tres empezamos?",
        "Perfecto. La productividad real viene de hacer menos cosas pero mejor. De todo lo que mencionas, ¿cuáles son las 2-3 acciones que tendrían el mayor impacto en tu resultado final?",
        "Excelente planteamiento. Apliquemos el principio de Pareto: el 80% de tus resultados vendrá del 20% de tus esfuerzos. ¿Cuál es ese 20% crítico en tu tarea?"
      ]
    };

    const moodResponses = responses[mood] || responses.neutral;
    return moodResponses[Math.floor(Math.random() * moodResponses.length)];
  }

  private generateMotivationalResponse(message: string, mood: string, context: any): string {
    const responses = {
      demotivated: [
        "Escucha, todos pasamos por estos momentos. La diferencia está en cómo respondemos a ellos. La motivación no es un sentimiento que esperas, es una habilidad que desarrollas. Hagamos esto: comprométete conmigo a hacer UNA cosa pequeña ahora. ¿Cuál va a ser?",
        "La desmotivación es como una nube: parece permanente cuando estás bajo ella, pero siempre se mueve. Mientras tanto, podemos trabajar con lo que tenemos. ¿Qué es lo más pequeño que podrías hacer que te dé una sensación de logro?",
        "Voy a ser directo contigo: esperar a sentirse motivado para actuar es como esperar a que pare de llover para salir. Toma el paraguas y sal. Tu 'paraguas' es la acción, por pequeña que sea. ¿Cuál va a ser tu primera acción?"
      ],
      frustrated: [
        "La frustración es energía mal dirigida. Significa que te importa, que tienes estándares altos, y eso es bueno. Ahora necesitamos canalizar esa energía hacia algo productivo. ¿Qué es lo que realmente te está molestando de esta situación?",
        "Entiendo esa frustración. A veces las cosas no salen como esperamos, y eso genera una tensión mental agotadora. Pregúntate: ¿qué puedes controlar en esta situación? Enfoquémonos solo en eso.",
        "La frustración es una señal de que estás peleando contra algo que no puedes cambiar directamente. Cambiemos la estrategia: en lugar de luchar contra el problema, ¿qué podrías construir alrededor de él?"
      ],
      neutral: [
        "La motivación constante es un mito. Lo que necesitas es un sistema que funcione independientemente de cómo te sientes. ¿Qué rutinas o hábitos podrían ayudarte a mantener el progreso incluso en días difíciles?",
        "La verdadera disciplina no es hacer lo que te gusta cuando te gusta, sino hacer lo que necesitas cuando no te gusta. ¿Qué necesitas hacer ahora que has estado posponiendo?",
        "Recordá que cada día es una nueva oportunidad de construir la versión de ti que quieres ser. ¿Qué decisión tomarías hoy si fueras la persona que aspiras a ser en un año?"
      ]
    };

    const moodResponses = responses[mood] || responses.neutral;
    return moodResponses[Math.floor(Math.random() * moodResponses.length)];
  }

  private generateTimeManagementResponse(message: string, mood: string, context: any): string {
    const urgencyLevel = context.urgencyLevel;
    
    const responses = {
      high: [
        "Entiendo la urgencia. Cuando el tiempo apremia, la clave es eliminar todo lo que no es esencial. De lo que necesitas hacer, ¿qué es absolutamente crítico versus qué sería 'bueno tener'?",
        "Tiempo limitado significa decisiones inteligentes. Apliquemos la regla 80/20: ¿cuál es la acción que te dará el 80% del resultado que necesitas con el 20% del esfuerzo?",
        "La urgencia puede ser tu aliada si la usas bien. Te fuerza a enfocarte en lo esencial. ¿Qué puedes eliminar o delegar para concentrarte en lo crítico?"
      ],
      medium: [
        "Bien, tienes algo de margen para planificar estratégicamente. Te sugiero usar bloques de tiempo específicos: asigna horarios concretos a cada actividad. ¿Cuál es tu cronograma ideal para esto?",
        "El tiempo disponible se expande o contrae según el que le asignes. Si tienes una semana, tomará una semana. Si tienes un día, tomará un día. ¿Cuánto tiempo realmente necesitas?",
        "Aprovechemos este tiempo para hacer las cosas bien desde el principio. Planificación ahora = menos correcciones después. ¿Qué potenciales obstáculos podrías anticipar?"
      ],
      low: [
        "Excelente, tienes el lujo del tiempo. Esto te permite ser estratégico y crear algo realmente de calidad. ¿Cómo quieres estructurar este proyecto para maximizar el resultado?",
        "Con tiempo suficiente, puedes implementar un enfoque iterativo: planificar, ejecutar, revisar, mejorar. ¿Cuáles serían tus hitos intermedios?",
        "El tiempo abundante puede ser una trampa si no lo estructuras bien. Establece deadlines artificiales para mantener el momentum. ¿Cuándo te gustaría tener la primera versión completa?"
      ]
    };

    const urgencyResponses = responses[urgencyLevel] || responses.medium;
    return urgencyResponses[Math.floor(Math.random() * urgencyResponses.length)];
  }

  private generateGoalSettingResponse(message: string, mood: string, context: any): string {
    const timeContext = context.timeContext;
    
    const responses = {
      immediate: [
        "Metas inmediatas requieren acción inmediata. La claridad viene de la especificidad: ¿qué exactamente quieres lograr hoy, en qué tiempo, y cómo vas a medir que lo lograste?",
        "Para metas de corto plazo, la ejecución es más importante que la perfección. ¿Cuál es la versión más simple de tu meta que podrías completar hoy?",
        "Las metas del día requieren momentum. Empezá con la parte más fácil para activar tu energía, luego usa esa energía para las partes más difíciles. ¿Cuál es tu punto de partida?"
      ],
      short_term: [
        "Las metas de corto plazo son el puente entre tus intenciones y tus logros. Necesitan ser específicas y medibles. ¿Cómo vas a saber que lograste exactamente lo que querías?",
        "Para metas de 1-30 días, la consistencia diaria es clave. ¿Qué acción específica vas a tomar cada día para acercarte a esta meta?",
        "Metas próximas necesitan un plan de contingencia. ¿Qué obstáculos podrías enfrentar y cómo los vas a manejar?"
      ],
      long_term: [
        "Las metas de largo plazo requieren sistemas, no solo motivación. ¿Qué hábitos diarios necesitas desarrollar para que esta meta sea inevitable?",
        "Visión de largo plazo con planificación de corto plazo. Dividamos esta meta en hitos trimestrales. ¿Dónde necesitas estar en 3 meses para mantenerte en track?",
        "Las metas grandes se logran con pequeñas decisiones consistentes. ¿Qué decisión pequeña pero importante podrías tomar cada día durante el próximo año?"
      ]
    };

    const timeResponses = responses[timeContext] || responses.short_term;
    return timeResponses[Math.floor(Math.random() * timeResponses.length)];
  }

  private generateProgressResponse(message: string, mood: string, context: any): string {
    const responses = [
      "Excelente que estés revisando tu progreso. El auto-monitoreo es lo que separa a los que logran sus metas de los que solo las sueñan. ¿Qué específicamente has logrado y qué ajustes necesitas hacer?",
      "Me gusta esa mentalidad de evaluación continua. Celebremos los wins, por pequeños que sean, y aprendamos de lo que no funcionó. ¿Cuál ha sido tu mayor logro hasta ahora?",
      "El progreso real no siempre es lineal. A veces avanzamos, a veces retrocedemos, pero la tendencia general debe ser hacia arriba. ¿Cómo describirías tu tendencia general?",
      "Revisar el progreso es como tomar el pulso de tus metas. ¿Qué te está diciendo este 'pulso' sobre tu estrategia actual? ¿Necesitas acelerar, cambiar dirección, o mantener el rumbo?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateGeneralProductivityResponse(message: string, mood: string, context: any): string {
    const responses = [
      "La productividad real no se trata de hacer más cosas, sino de hacer las cosas correctas de manera eficiente. ¿Estás enfocándote en actividades que realmente mueven la aguja hacia tus objetivos?",
      "Sistemas > Metas. Las metas te dan dirección, pero los sistemas te dan resultados. ¿Qué sistema podrías implementar para que el progreso sea automático?",
      "La productividad sostenible incluye descanso estratégico. No puedes sprintear una maratón. ¿Cómo estás balanceando la intensidad con la recuperación?",
      "El secreto de la productividad está en decir 'no' a las cosas buenas para poder decir 'sí' a las cosas extraordinarias. ¿A qué necesitas decir 'no' para proteger tu enfoque?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateContextualGeneralResponse(message: string, mood: string, context: any): string {
    // Respuestas generales más contextuales basadas en el historial de conversación
    const recentTopics = this.conversationContext.recentTopics;
    const hasTaskHistory = recentTopics.includes('trabajo') || recentTopics.includes('tarea');
    const hasGoalHistory = recentTopics.includes('meta') || recentTopics.includes('objetivo');
    
    let contextualResponses = [];
    
    if (hasTaskHistory) {
      contextualResponses.push(
        "Veo que has estado trabajando en varias tareas. La clave está en mantener el momentum sin agotarte. ¿Cómo te está yendo con las prioridades que definimos antes?",
        "Continuando con lo que hablamos sobre tus tareas, recuerda que la consistencia pequeña supera a la intensidad esporádica. ¿Qué patrón estás viendo en tu productividad?"
      );
    }
    
    if (hasGoalHistory) {
      contextualResponses.push(
        "En relación a las metas que mencionaste antes, ¿estás viendo progreso tangible o necesitas ajustar la estrategia?",
        "Siguiendo con tus objetivos anteriores, ¿qué has aprendido sobre ti mismo en el proceso de perseguirlos?"
      );
    }
    
    if (contextualResponses.length === 0) {
      contextualResponses = [
        "Interesante perspectiva. Como tu mentor de productividad, mi trabajo es hacerte las preguntas que te hagan reflexionar y actuar. ¿Qué patrón necesitas cambiar en tu rutina diaria?",
        "Me gusta cómo pensás. Ahora convirtamos esa reflexión en acción concreta. Si tuvieras que mejorar una sola cosa de cómo manejas tu tiempo y energía, ¿cuál sería?",
        "Perfecto planteamiento. La diferencia entre pensar y lograr está en la implementación. ¿Cuál va a ser tu siguiente paso específico?",
        "Bien dicho. La productividad real viene de la auto-conciencia: conocer tus patrones, fortalezas y limitaciones. ¿Qué has descubierto sobre tu manera de trabajar?"
      ];
    }
    
    return contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
  }

  async getQuickResponse(userMessage: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let response = '';
      
      this.generateResponse(
        [{ role: 'user', content: userMessage }],
        {
          onToken: (token) => {
            response += token;
          },
          onComplete: (fullResponse) => {
            resolve(fullResponse);
          },
          onError: (error) => {
            reject(new Error(error));
          }
        }
      );
    });
  }

  isReady(): boolean {
    return this.isInitialized && this.context !== null;
  }

  getInitializationStatus(): { isInitialized: boolean; isInitializing: boolean; progress: number } {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      progress: this.downloadProgress
    };
  }

  async cleanup(): Promise<void> {
    try {
      if (this.context) {
        await this.context.release();
        this.context = null;
      }
      this.isInitialized = false;
      this.isInitializing = false;
      this.downloadProgress = 0;
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Método para obtener sugerencias de productividad personalizadas
  async getProductivitySuggestion(): Promise<string> {
    const suggestions = [
      "¿Qué tal si planificamos tu día? Cuéntame cuáles son tus 3 prioridades principales.",
      "Es hora de revisar tus metas. ¿En qué proyecto importante deberías enfocarte hoy?",
      "Recuerda: la productividad no es hacer más cosas, sino hacer las cosas correctas. ¿Cuál es tu siguiente acción?",
      "¿Has completado alguna tarea importante hoy? ¡Celebremos tus logros!",
      "Veo que es un buen momento para organizarte. ¿Necesitas ayuda priorizando tus tareas?"
    ];
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    return randomSuggestion;
  }
}

// Exportar instancia singleton
export const mistralService = new MistralService();
export default mistralService;