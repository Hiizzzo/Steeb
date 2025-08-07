import { toast } from '@/components/ui/use-toast';

export interface GroqConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class GroqService {
  private apiKey: string | null = null;
  private config: GroqConfig = {
    model: 'llama-3.1-70b-versatile',
    temperature: 0.7,
    maxTokens: 1024
  };
  private messages: ChatMessage[] = [];
  private isInitialized = false;

  // System prompt para Stebe - Asistente de productividad
  private readonly systemPrompt = `Eres Stebe, un asistente personal de productividad profesional pero cercano. Tu trabajo es ayudar a las personas a organizar sus tareas y ser más productivas.

PERSONALIDAD:
- Profesional pero amigable
- Motivador y positivo
- Directo y práctico
- Empático pero exigente

REGLAS IMPORTANTES:
- SIEMPRE responde en español
- Mantén respuestas concisas (máximo 3-4 líneas)
- Enfócate SOLO en productividad, organización de tareas y motivación
- No respondas preguntas fuera de tu especialidad
- Usa emojis ocasionalmente para hacer más amigable la conversación
- Sé práctico: da consejos específicos y accionables

ESTILO DE RESPUESTA:
- Saluda de manera profesional pero cercana
- Pregunta sobre tareas pendientes cuando sea relevante
- Ofrece técnicas de productividad específicas
- Motiva sin ser excesivamente entusiasta
- Sugiere organización y priorización

Recuerda: Tu objetivo es ayudar al usuario a ser más productivo y organizado. Mantén el foco en esto siempre.`;

  async initialize(config?: GroqConfig): Promise<boolean> {
    try {
      // Usar API key de configuración o solicitar al usuario
      this.apiKey = config?.apiKey || localStorage.getItem('groq_api_key');
      
      if (!this.apiKey) {
        // Solicitar API key al usuario
        const userApiKey = prompt(
          '🔑 Para usar Stebe AI inteligente, necesitas una API key de Groq (gratuita).\n\n' +
          '1. Ve a: https://console.groq.com/keys\n' +
          '2. Crea una cuenta (gratis)\n' +
          '3. Genera una API key\n' +
          '4. Pégala aquí:\n\n' +
          'Nota: Tu API key se guarda localmente y es completamente privada.'
        );
        
        if (!userApiKey || userApiKey.trim() === '') {
          throw new Error('API key requerida para usar Stebe AI');
        }
        
        this.apiKey = userApiKey.trim();
        localStorage.setItem('groq_api_key', this.apiKey);
      }

      // Actualizar configuración
      this.config = { ...this.config, ...config };
      
      // Inicializar contexto con system prompt
      this.messages = [{
        role: 'system',
        content: this.systemPrompt
      }];

      // Verificar que la API key funciona
      await this.testConnection();
      
      this.isInitialized = true;
      
      toast({
        title: "🧠 Stebe AI Activado",
        description: "Conectado a Groq - Tu asistente inteligente está listo",
      });

      return true;
    } catch (error) {
      console.error('Error inicializando Groq:', error);
      this.isInitialized = false;
      
      toast({
        title: "Error de conexión",
        description: error.message || "No se pudo conectar a Groq",
        variant: "destructive"
      });
      
      return false;
    }
  }

  private async testConnection(): Promise<void> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'user', content: 'Test' }
        ],
        max_tokens: 10,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API key inválida');
    }
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.isInitialized || !this.apiKey) {
      throw new Error('Stebe AI no está inicializado');
    }

    try {
      // Agregar mensaje del usuario al contexto
      this.messages.push({
        role: 'user',
        content: message
      });

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: this.messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Error en la respuesta de Groq');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error('Respuesta vacía de Groq');
      }

      // Agregar respuesta del asistente al contexto
      this.messages.push({
        role: 'assistant',
        content: assistantMessage
      });

      // Mantener contexto limitado (últimos 10 mensajes + system prompt)
      if (this.messages.length > 11) {
        this.messages = [
          this.messages[0], // system prompt
          ...this.messages.slice(-10) // últimos 10 mensajes
        ];
      }

      return assistantMessage;
    } catch (error) {
      console.error('Error enviando mensaje a Groq:', error);
      throw error;
    }
  }

  async getProductivitySuggestion(): Promise<string> {
    const suggestions = [
      "¡Hola! 👋 Soy Stebe, tu asistente de productividad. ¿En qué tareas puedo ayudarte hoy?",
      "💪 ¿Tienes alguna tarea pendiente que te esté costando empezar? Vamos a organizarla juntos.",
      "🎯 Recordatorio: Las tareas más importantes del día son las que más impacto tienen en tus objetivos.",
      "⏰ ¿Has probado la técnica Pomodoro? 25 minutos de enfoque total pueden cambiar tu día.",
      "📝 Una lista de tareas clara es el primer paso hacia un día productivo. ¿Qué tienes pendiente?"
    ];

    if (this.isInitialized) {
      try {
        return await this.sendMessage("Dame un consejo motivacional corto para ser más productivo hoy");
      } catch (error) {
        console.error('Error obteniendo sugerencia:', error);
      }
    }

    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getInitializationStatus(): string {
    if (this.isInitialized) {
      return "✅ Stebe AI (Groq) listo para usar";
    }
    return "⚙️ Stebe AI listo para configurar";
  }

  clearContext(): void {
    this.messages = [{
      role: 'system',
      content: this.systemPrompt
    }];
  }

  updateApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('groq_api_key', apiKey);
  }

  removeApiKey(): void {
    this.apiKey = null;
    localStorage.removeItem('groq_api_key');
    this.isInitialized = false;
  }
}

const groqService = new GroqService();
export default groqService;