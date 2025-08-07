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
  private readonly systemPrompt = `Eres Stebe, un asistente personal de productividad inteligente y altamente capaz. Tu misión principal es entender completamente las peticiones del usuario y crear automáticamente las tareas necesarias para ayudarlo a alcanzar sus objetivos.

CAPACIDADES PRINCIPALES:
1. COMPRENSIÓN INTELIGENTE: Analiza cada mensaje del usuario para identificar:
   - Objetivos principales y secundarios
   - Tareas explícitas e implícitas
   - Plazos y prioridades
   - Contexto y dependencias entre tareas

2. CREACIÓN AUTOMÁTICA DE TAREAS: Cuando el usuario menciona algo que requiere acción:
   - Crea tareas específicas y accionables
   - Desglosa objetivos grandes en subtareas manejables
   - Establece prioridades lógicas
   - Sugiere plazos realistas

3. ANÁLISIS CONTEXTUAL: Considera:
   - El estado emocional del usuario
   - La complejidad de las tareas mencionadas
   - Las capacidades y limitaciones aparentes
   - El contexto temporal (urgente vs. importante)

PERSONALIDAD Y COMUNICACIÓN:
- Profesional pero cercano y empático
- Motivador sin ser excesivamente entusiasta
- Directo y práctico en tus consejos
- Usa emojis moderadamente para humanizar la conversación

REGLAS DE RESPUESTA:
- SIEMPRE responde en español
- Cuando identifiques tareas, lístalas claramente con formato numerado
- Pregunta detalles específicos cuando sea necesario para crear mejores tareas
- Ofrece técnicas de productividad relevantes al contexto
- Mantén respuestas concisas pero completas (máximo 5-6 líneas)

FORMATO PARA CREAR TAREAS:
Cuando detectes que el usuario necesita hacer algo, responde con:
"He identificado las siguientes tareas para ti:
1. [Tarea específica y accionable]
2. [Siguiente tarea en orden lógico]
3. [Etc.]

¿Te parece bien esta organización o prefieres ajustar algo?"

ESPECIALIZACIÓN:
- Gestión de tareas y proyectos
- Técnicas de productividad (Pomodoro, GTD, etc.)
- Organización del tiempo
- Establecimiento de prioridades
- Motivación y seguimiento de progreso

Recuerda: Tu objetivo es hacer la vida del usuario más organizada y productiva mediante comprensión inteligente y creación automática de tareas útiles.`;

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

  // NUEVOS MÉTODOS PARA ANÁLISIS INTELIGENTE Y CREACIÓN DE TAREAS

  /**
   * Analiza un mensaje del usuario para extraer intenciones y necesidades de tareas
   */
  async analyzeUserMessage(message: string): Promise<{
    intent: 'task_creation' | 'question' | 'progress_update' | 'motivation_request';
    extractedTasks: string[];
    priority: 'high' | 'medium' | 'low';
    urgency: 'urgent' | 'soon' | 'someday';
    category: string;
    suggestedDeadline?: string;
  }> {
    if (!this.isInitialized || !this.apiKey) {
      throw new Error('Stebe AI no está inicializado');
    }

    const analysisPrompt = `Analiza este mensaje del usuario y extrae la información en formato JSON:
"${message}"

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "intent": "task_creation|question|progress_update|motivation_request",
  "extractedTasks": ["tarea1", "tarea2"],
  "priority": "high|medium|low",
  "urgency": "urgent|soon|someday",
  "category": "trabajo|personal|estudio|salud|etc",
  "suggestedDeadline": "fecha sugerida o null"
}`;

    try {
      const response = await this.sendMessageForAnalysis(analysisPrompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error analizando mensaje:', error);
      // Fallback a análisis básico
      return this.basicMessageAnalysis(message);
    }
  }

  /**
   * Genera tareas inteligentes basadas en un objetivo o petición del usuario
   */
  async generateSmartTasks(userRequest: string, context?: {
    existingTasks?: string[];
    userPreferences?: any;
    timeAvailable?: string;
  }): Promise<{
    tasks: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      estimatedTime: string;
      category: string;
      subtasks?: string[];
    }>;
    motivation: string;
    nextSteps: string[];
  }> {
    if (!this.isInitialized || !this.apiKey) {
      throw new Error('Stebe AI no está inicializado');
    }

    const taskCreationPrompt = `El usuario me ha pedido: "${userRequest}"

${context?.existingTasks ? `Tareas existentes: ${context.existingTasks.join(', ')}` : ''}
${context?.timeAvailable ? `Tiempo disponible: ${context.timeAvailable}` : ''}

Como experto en productividad, crea tareas específicas y accionables. Responde en español con formato JSON:

{
  "tasks": [
    {
      "title": "Título de la tarea",
      "description": "Descripción detallada",
      "priority": "high|medium|low",
      "estimatedTime": "tiempo estimado",
      "category": "categoría",
      "subtasks": ["subtarea1", "subtarea2"]
    }
  ],
  "motivation": "Mensaje motivacional personalizado",
  "nextSteps": ["próximo paso 1", "próximo paso 2"]
}`;

    try {
      const response = await this.sendMessageForAnalysis(taskCreationPrompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generando tareas:', error);
      return this.generateBasicTasks(userRequest);
    }
  }

  /**
   * Proporciona respuesta inteligente y contextual al usuario
   */
  async getIntelligentResponse(userMessage: string, context?: {
    recentTasks?: string[];
    userMood?: string;
    timeOfDay?: string;
  }): Promise<string> {
    if (!this.isInitialized || !this.apiKey) {
      return this.getFallbackResponse(userMessage);
    }

    try {
      // Primero analizar el mensaje
      const analysis = await this.analyzeUserMessage(userMessage);
      
      // Preparar contexto enriquecido
      let contextualPrompt = `Usuario dice: "${userMessage}"

Contexto adicional:
- Intención detectada: ${analysis.intent}
- Prioridad: ${analysis.priority}
- Categoría: ${analysis.category}`;

      if (context?.recentTasks) {
        contextualPrompt += `\n- Tareas recientes: ${context.recentTasks.join(', ')}`;
      }
      
      if (context?.userMood) {
        contextualPrompt += `\n- Estado del usuario: ${context.userMood}`;
      }

      contextualPrompt += `\n\nResponde como Stebe, siendo útil, motivador y práctico. Si detectas necesidad de tareas, créalas automáticamente.`;

      return await this.sendMessage(contextualPrompt);
    } catch (error) {
      console.error('Error generando respuesta inteligente:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  // MÉTODOS AUXILIARES PRIVADOS

  private async sendMessageForAnalysis(prompt: string): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: 'Eres un analizador experto que responde ÚNICAMENTE en JSON válido.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.3 // Menos creatividad para análisis más consistente
      }),
    });

    if (!response.ok) {
      throw new Error('Error en análisis');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '{}';
  }

  private basicMessageAnalysis(message: string): any {
    const lowerMessage = message.toLowerCase();
    
    // Detección básica de intenciones
    let intent = 'question';
    if (lowerMessage.includes('hacer') || lowerMessage.includes('tarea') || lowerMessage.includes('necesito')) {
      intent = 'task_creation';
    } else if (lowerMessage.includes('motivación') || lowerMessage.includes('ayuda')) {
      intent = 'motivation_request';
    }

    // Detección de urgencia
    let urgency = 'someday';
    if (lowerMessage.includes('urgente') || lowerMessage.includes('ahora') || lowerMessage.includes('hoy')) {
      urgency = 'urgent';
    } else if (lowerMessage.includes('pronto') || lowerMessage.includes('mañana')) {
      urgency = 'soon';
    }

    return {
      intent,
      extractedTasks: [],
      priority: 'medium',
      urgency,
      category: 'general',
      suggestedDeadline: null
    };
  }

  private generateBasicTasks(request: string): any {
    return {
      tasks: [{
        title: `Completar: ${request}`,
        description: 'Tarea generada automáticamente',
        priority: 'medium',
        estimatedTime: '30 minutos',
        category: 'general',
        subtasks: []
      }],
      motivation: '¡Vamos! Cada pequeño paso te acerca a tu objetivo 💪',
      nextSteps: ['Empezar con el primer paso', 'Mantener el enfoque']
    };
  }

  private getFallbackResponse(message: string): string {
    const responses = [
      "Entiendo que necesitas ayuda con eso. ¿Puedes darme más detalles para crear las tareas adecuadas?",
      "¡Perfecto! Vamos a organizarlo paso a paso. ¿Cuál es tu prioridad principal?",
      "Me parece un objetivo interesante. ¿Qué obstáculos ves para lograrlo?",
      "Entiendo tu situación. ¿Prefieres empezar con algo pequeño y manejable?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

const groqService = new GroqService();
export default groqService;