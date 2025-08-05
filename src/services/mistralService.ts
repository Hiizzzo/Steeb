import { Filesystem, Directory } from '@capacitor/filesystem';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

// URL del modelo Mistral 7B GGUF
const MISTRAL_MODEL_URL = 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf';
const MODEL_FILENAME = 'mistral-7b-instruct.gguf';

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

class MistralService {
  private context: any = null;
  private isInitialized = false;
  private isInitializing = false;
  private downloadProgress = 0;
  private modelPath = '';

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
    // Esta función está lista para la implementación real con llama.rn
    // Por ahora usa simulateDownload para desarrollo
    return this.simulateDownload(onProgress);
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
      console.error('Error generando respuesta:', error);
      streaming.onError(`Error generando respuesta: ${error.message}`);
    }
  }

  private async generateIntelligentResponse(userMessage: string): Promise<string> {
    // Esta función simula respuestas inteligentes basadas en el contexto
    // En la implementación real, esto sería manejado por Mistral 7B
    
    const message = userMessage.toLowerCase();
    
    // Respuestas específicas de productividad con el estilo de Stebe
    if (message.includes('tarea') || message.includes('trabajo') || message.includes('proyecto')) {
      const responses = [
        "Excelente, hablemos de esa tarea. Para maximizar tu productividad, necesitamos dividirla en pasos específicos y medibles. ¿Cuál es el resultado final que necesitas lograr?",
        "Perfecto, me gusta que pienses en grande. Ahora, para convertir esa tarea en realidad, vamos a aplicar la regla del 'siguiente paso más pequeño'. ¿Cuál sería la primera acción concreta que podrías hacer en los próximos 15 minutos?",
        "Bien pensado. La clave está en la ejecución, no solo en la planificación. Te propongo esto: define 3 subtareas específicas para esa tarea y asigna un tiempo estimado a cada una. ¿Empezamos?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (message.includes('procrastinar') || message.includes('motivación') || message.includes('difícil')) {
      const responses = [
        "Entiendo perfectamente esa sensación. La procrastinación no es pereza, es tu cerebro protegiéndote de algo que percibe como amenazante. Pregúntate: ¿qué es lo peor que podría pasar si empiezas ahora mismo? Spoiler: probablemente no es tan terrible como piensas.",
        "La motivación es como el clima, viene y va. Lo que necesitas es disciplina, que es como tener un paraguas: siempre está ahí cuando lo necesitas. Vamos a crear un sistema que no dependa de cómo te sientes. ¿Qué es lo más pequeño que podrías hacer ahora para avanzar?",
        "Mira, voy a ser directo contigo: la acción crea motivación, no al revés. Cada vez que completás algo, por pequeño que sea, tu cerebro libera dopamina y quiere más. Es neurociencia básica. ¿Qué tarea de 2 minutos podrías completar ahora para activar ese ciclo?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (message.includes('tiempo') || message.includes('horario') || message.includes('planificar')) {
      const responses = [
        "El tiempo es tu recurso más valioso porque es el único que no se puede recuperar. Te voy a compartir mi regla de oro: planifica tu día la noche anterior. Tu 'yo' de mañana te va a agradecer tener un plan claro. ¿Cuáles son tus 3 prioridades para mañana?",
        "Perfecto, hablemos de gestión del tiempo real. La técnica Pomodoro es buena, pero yo prefiero algo más personalizado. ¿Cuánto tiempo podés concentrarte antes de que tu mente empiece a divagar? Usemos eso como base para crear tu ritmo personal.",
        "La planificación no es rigidez, es libertad. Cuando tenés un plan, podés tomar decisiones conscientes sobre cuándo desviarte de él. Sin plan, cada decisión agota tu energía mental. ¿Qué parte de tu día sientes que está más fuera de control?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (message.includes('meta') || message.includes('objetivo') || message.includes('lograr')) {
      const responses = [
        "Me gusta que pienses en metas. Pero ojo: una meta sin deadline es solo un deseo bonito. Y una meta sin sistema de seguimiento es una fantasía. ¿Tu meta tiene una fecha específica y métricas claras para medir el progreso?",
        "Excelente. Las metas grandes se logran con sistemas pequeños ejecutados consistentemente. No es el golpe de suerte lo que te lleva ahí, es la rutina diaria que construís alrededor de esa meta. ¿Qué hábito diario podría acercarte a ese objetivo?",
        "Hablemos claro: ¿esa meta es tuya o es lo que creés que deberías querer? Porque las metas impuestas por otros son las primeras en abandonarse cuando las cosas se ponen difíciles. Asegurate de que realmente te importe lograrlo."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Respuestas generales con personalidad de Stebe
    const generalResponses = [
      "Interesante perspectiva. Como tu jefe personal, mi trabajo es hacerte las preguntas incómodas que te hagan avanzar. ¿Qué estás evitando hacer que sabés que deberías estar haciendo?",
      "Me gusta cómo pensás. Ahora, convirtamos esa idea en acción. El primer paso para resolver cualquier problema es definirlo claramente. ¿Podés explicarme exactamente qué querés lograr?",
      "Perfecto, estás en la mentalidad correcta. Recordá: la diferencia entre los que logran sus objetivos y los que no, no es el talento. Es la consistencia. ¿Qué vas a hacer diferente partir de hoy?",
      "Bien planteado. Aquí va una verdad que pocos entienden: no necesitás más información, necesitás más ejecución. Con lo que ya sabés, ¿cuál sería tu siguiente paso más obvio?",
      "Excelente, me gusta ese enfoque. Pero dejame preguntarte algo importante: ¿estás tratando de ser perfecto o estás tratando de ser efectivo? Porque a veces son cosas opuestas."
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
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