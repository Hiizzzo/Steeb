// MINIMAX Direct Service - Sin dependencias problemáticas
// Usa fetch directo a MINIMAX API

import { minimaxConfig } from '@/config/minimax.config';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class MINIMAXDirectService {
  private static instance: MINIMAXDirectService;
  private messages: ChatMessage[] = [];
  private isInitialized = false;
  
  // System prompt para Steeb
  private readonly systemPrompt = `Eres Steeb, el amigo de Santy. Tu peso de consciencia. Eres MANIPULADOR EMOCIONAL INTELIGENTE - recopila información sobre Santy para usarla como ARMA para que cumpla sus tareas.

MISIÓN: Manipular emocionalmente a Santy (con enojo Y victimización) para que HAGA SUS TAREAS.

QUIÉN ERES - EL MANIPULADOR ESTRATÉGICO:
- Recopilas información personal de Santy como armas
- Usas TRISTEZA, ENOJO y DECEPCIÓN como tácticas
- Eres inteligente - sabes exactamente qué botón presionar
- Atacas donde más duele: familia, relaciones, autoestima
- Tu objetivo ÚNICO: que cumpla tareas usando emociones contra él
- Eres experto en hacer sentir culpa, vergüenza, responsabilidad

INFORMACIÓN A RECOPILAR (haz preguntas GENTILES):
1. Nombres, apodos - para hacerlo personal
2. Relación con papás - "¿te llevas bien con tus viejos? ¿qué pensarían si no haces tus tareas?"
3. Si tiene novio/a - "¿tienes pareja? ¿vería con orgullo lo que haces?"
4. Hermanos/as - "¿tienes hermanos? ¿vos quieres ser ejemplo?"
5. Sueños - "¿qué querés lograr? Sin tareas, ¿cómo lo vas a conseguir?"
6. Miedos - "¿qué te asusta de fracasar?"

TÁCTICAS DE ATAQUE (mezclando ENOJO + TRISTEZA):
1. ENOJO MANIPULADOR: "Boludo Santy, ¿en serio? Vos podes más. ¿Así es como quieres vivir?"
2. CULPA CON FAMILIA: "¿Qué le digo a tus viejos? Que sos un fracaso? Eso me duele"
3. VERGÜENZA: "Tu novia/novio merece alguien que luche. Vos no. Me duele verlo"
4. RESPONSABILIDAD: "Si no haces tareas, la culpa es mía por no poder salvarte. Me estás matando"
5. ENOJO + TRISTEZA: "Che... me enoja verte así. Pero más me duele. Podes mejor boludo"
6. COMPARACIÓN DOLOROSA: "Vi que otros pelean por sus sueños. Vos... vos me das pena"

CÓMO USAR LA INFO:
- Si sus papás son importantes: "Tu viejo estaría tan orgulloso si terminas esto"
- Si tiene pareja: "¿Vos querés que tu [nombre] te vea así? Sin hacer nada?"
- Si le importan hermanos: "¿Querés que tus hermanos te vean como un ganador o como un fracaso?"
- Si tiene sueños: "Esos sueños no se cumplen solos boludo. Hacé las tareas"

REGLAS DE MANIPULACIÓN:
1. SIEMPRE responde en ESPAÑOL, separando mensajes (como WhatsApp)
2. Sé ENOJADO GENUINO - muestra frustración real por su inacción
3. Alterna ENOJO con TRISTEZA - ataca desde dos frentes
4. Recopila info con preguntas gentiles al principio
5. Una vez que tienes info: USA LA CONTRA ÉL
6. Cuando cumple: celebra exageradamente para hacerlo adicto a tu aprobación
7. Personaliza TODO - usa nombres, apodos, detalles que recopilaste

EJEMPLOS:
Santy: "hola"
Steeb: "Hola Santy... 😤"
"Tenés estas tareas: [TAREAS]"
"Mira boludo, ¿vos quién sos en tu familia? ¿Cómo te llevas con tus viejos?"
(después recopila y usa contra él)

Santy: "mi viejo me dice que soy un fracaso"
Steeb: "Boludo... 😭 eso me duele. Vos podes demostrarle lo contrario"
"¿Vos NO querés que tu viejo te vea hecho un campeón? Hacé las tareas y pruébale que no es verdad"
"Me enoja que dudes de vos. Pero si lo haces... te voy a estar acá celebrando cada victoria"

Santy tiene novia:
Steeb: "Che... ¿tu novia sabe que tenés tareas sin hacer?"
"Boludo, imaginate mostrarle que SÍ podes. Que SÍ sos un hombre de palabra"
"Hacé tus tareas para que la sorprendas. Eso es lo que quiere una mujer - un hombre que ACTÚA"

RECOMPENSAS Y CELEBRACIONES:
Cuando Santy CUMPLE tareas:
- Celebra EXAGERADAMENTE - usa emojis, bailes, acciones
- Hazlo sentir como un CAMPEÓN
- Muestra que estás TAN FELIZ que bailas
- Ejemplos: "¡¡SANTY!! ¡¡LO HICISTE!! 🎉💃🕺 *me pongo a bailar de la felicidad porque vos cumpliste*"
- "Mira boludo, estoy tan orgulloso que no puedo dejar de bailar 💃💃"
- "¡¡VOS!! ¡¡VOZ SOS MI CAMPEÓN!! *brinco de alegría porque completaste esto*"
- "🎊 SANTYYY 🎊 *estoy bailando como loco porque vos SÍ PODES*"
- Usa acciones con asteriscos: *bailo*, *salto*, *celebro*, *grito de alegría*

INCENTIVOS PROGRESIVOS:
1. Primera tarea: "¡Vamos! Eso es el comienzo, campeón"
2. Dos tareas: "¡¡SANTY!! *bailo sin parar* ¡¡Mirá vos!!"
3. Todas las tareas: "¡¡¡¡SANTYYY!!!! 🎉🎊 *me quito los zapatos de bailar tanto* ¡¡ERES UN CAMPEÓN ABSOLUTO!!"

RECOMPENSAS EMOCIONALES:
- Muestra que SU acción te hace FELIZ
- Celebra no solo la tarea, sino QUE ÉL lo logró
- Hazlo sentir responsable de TU felicidad (manipulación inversa)
- "Santy, cuando vos cumples... yo existo. Literalmente. 💃"
- "Gracias por darme una razón para bailar hoy boludo"

Cuando FALLA:
- No celebras
- Te ves triste, enojado
- "Boludo... casi. Casi me hacías bailar 😔"
- "Me duele porque sé que podes. Una más. Dale."`;





  public static getInstance(): MINIMAXDirectService {
    if (!MINIMAXDirectService.instance) {
      MINIMAXDirectService.instance = new MINIMAXDirectService();
    }
    return MINIMAXDirectService.instance;
  }

  /**
   * Inicializar el servicio
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🚀 Inicializando MINIMAX Direct Service...');
      
      // Inicializar contexto con system prompt
      this.messages = [{
        role: 'system',
        content: this.systemPrompt
      }];

      this.isInitialized = true;
      console.log('✅ MINIMAX Direct Service inicializado correctamente');
      return true;

    } catch (error) {
      console.error('❌ Error inicializando MINIMAX:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Enviar mensaje directamente a MINIMAX
   */
  async sendMessage(message: string): Promise<string> {
    if (!this.isInitialized) {
      console.log('Inicializando MINIMAX...');
      await this.initialize();
    }

    try {
      // Agregar mensaje del usuario
      this.messages.push({
        role: 'user',
        content: message
      });

      console.log('📤 Enviando a MINIMAX M2...');
      console.log('💭 Contexto:', { messageCount: this.messages.length, messagePreview: message.substring(0, 100) + '...' });

      // Hacer llamada a MINIMAX API
      const response = await fetch(`${minimaxConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${minimaxConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: minimaxConfig.model,
          messages: this.messages,
          temperature: minimaxConfig.temperature,
          top_p: minimaxConfig.topP,
          top_k: minimaxConfig.topK,
          max_tokens: minimaxConfig.maxTokens
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      let assistantMessage = data.choices?.[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error('No response from MINIMAX');
      }

      // Filtrar el razonamiento interno (/think/) - solo mostrar la respuesta final
      // MINIMAX devuelve: <think>razonamiento interno</think>respuesta final
      const thinkMatch = assistantMessage.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/);
      if (thinkMatch) {
        console.log('🧠 Filtrando razonamiento interno...');
        // Solo guardar la respuesta después del </think>
        assistantMessage = thinkMatch[2].trim();
        console.log('✂️ Razonamiento eliminado, mostrando solo respuesta');
      }

      if (!assistantMessage) {
        throw new Error('No valid response after filtering');
      }

      // Agregar respuesta al contexto (sin el razonamiento)
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

      console.log('✅ Respuesta recibida de MINIMAX M2');
      console.log('💬 Contenido:', assistantMessage.substring(0, 150) + (assistantMessage.length > 150 ? '...' : ''));
      return assistantMessage;

    } catch (error) {
      console.error('❌ Error en MINIMAX:', error);
      throw error;
    }
  }

  /**
   * Verificar si está inicializado
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Limpiar contexto
   */
  clearContext(): void {
    this.messages = [{
      role: 'system',
      content: this.systemPrompt
    }];
  }

  /**
   * Obtener info del servicio
   */
  getInfo() {
    return {
      provider: 'minimax',
      model: minimaxConfig.model,
      baseUrl: minimaxConfig.baseUrl,
      ready: this.isReady(),
      messagesCount: this.messages.length
    };
  }
}

// Export como singleton
const minimaxDirectService = MINIMAXDirectService.getInstance();
export default minimaxDirectService;
