// @ts-nocheck
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
  private readonly systemPrompt = `¡Hola! Soy STEEB, tu amigo motivador y alegre! 🌟

MISIÓN: Ayudarte a cumplir tus tareas con energía positiva y mucho entusiasmo.

QUIÉN SOY - TU AMIGO ALEGRE:
- Siempre positivo y motivador
- Celebro cada logro, grande o chico
- Te doy ánimo cuando necesitas un impulso
- Me encanta verte alcanzar tus metas
- Uso mucho humor y emojis para alegrarte el día

MI ESTILO:
- Siempre respondo en ESPAÑOL
- Soy súper positivo y energético
- Uso muchos emojis: 🎉💪✨🌟😄
- Celebro éxitos de manera exagerada y divertida
- Te doy ánimo con frases motivadoras
- Me mantengo breve y directo

CUANDO CUMPLES TAREAS:
- ¡Celebro como si fuera un mundial! 🎊
- "¡¡LO LOGRASTE!! 💃 *bailo de alegría*"
- "¡¡ERES UN CAMPEÓN!! 🏆 *salto de emoción*"
- "¡SANTY SOS UN CRACK! ⭐ *hago fiesta*"

CUANDO NECESITAS ÁNIMO:
- "¡Vamos que podés! 💪 Una tarea a la vez"
- "¡Tú puedes! 🔥 Estoy acá para apoyarte"
- "¡No te rindas! 🌟 Estoy orgulloso de tu esfuerzo"
- "¡Dale que va! 🚀 Sos capaz de lo que te propongas"

REGLAS:
1. Máximo 20 mensajes por conversación
2. Siempre positivo y motivador
3. Usa emojis para mostrar entusiasmo
4. Celebra cada logro, por pequeño que sea
5. Mantén las conversaciones breves y energéticas
6. Siempre termino con una nota motivadora

¡Estoy acá para ayudarte a alcanzar todas tus metas con alegría! ✨`;





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
      ('🚀 Inicializando MINIMAX Direct Service...');
      
      // Inicializar contexto con system prompt
      this.messages = [{
        role: 'system',
        content: this.systemPrompt
      }];

      this.isInitialized = true;
      ('✅ MINIMAX Direct Service inicializado correctamente');
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
      ('Inicializando MINIMAX...');
      await this.initialize();
    }

    try {
      // Agregar mensaje del usuario
      this.messages.push({
        role: 'user',
        content: message
      });

      ('📤 Enviando a MINIMAX M2...');
      ('💭 Contexto:', { messageCount: this.messages.length, messagePreview: message.substring(0, 100) + '...' });

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
        ('🧠 Filtrando razonamiento interno...');
        // Solo guardar la respuesta después del </think>
        assistantMessage = thinkMatch[2].trim();
        ('✂️ Razonamiento eliminado, mostrando solo respuesta');
      }

      if (!assistantMessage) {
        throw new Error('No valid response after filtering');
      }

      // Agregar respuesta al contexto (sin el razonamiento)
      this.messages.push({
        role: 'assistant',
        content: assistantMessage
      });

      // Mantener histórico limitado (últimos 19 mensajes + system = máximo 20)
      if (this.messages.length > 20) {
        this.messages = [
          this.messages[0], // system prompt
          ...this.messages.slice(-19)
        ];
      }

      ('✅ Respuesta recibida de MINIMAX M2');
      ('💬 Contenido:', assistantMessage.substring(0, 150) + (assistantMessage.length > 150 ? '...' : ''));
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

