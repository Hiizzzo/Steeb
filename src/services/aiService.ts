// AI Service for STEEB - Multiple free AI providers
interface AIResponse {
  content: string;
  model: string;
  service: string;
}

class AIService {
  private static instance: AIService;

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateResponse(prompt: string): Promise<AIResponse> {
    console.log('🤖 STEEB AI: Generating response for prompt:', prompt.substring(0, 100) + '...');

    // Try multiple free AI providers in order of preference

    // 1. Try Llama.cpp (free public API)
    try {
      const response = await this.tryLlamaCpp(prompt);
      if (response) {
        console.log('✅ Llama.cpp success:', response.model);
        return response;
      }
    } catch (error) {
      console.log('❌ Llama.cpp failed:', error.message);
    }

    // 2. Try OpenRouter (free tier, no API key needed for some models)
    try {
      const response = await this.tryOpenRouter(prompt);
      if (response) {
        console.log('✅ OpenRouter success:', response.model);
        return response;
      }
    } catch (error) {
      console.log('❌ OpenRouter failed:', error.message);
    }

    // 3. Try HuggingFace Inference API (free)
    try {
      const response = await this.tryHuggingFace(prompt);
      if (response) {
        console.log('✅ HuggingFace success:', response.model);
        return response;
      }
    } catch (error) {
      console.log('❌ HuggingFace failed:', error.message);
    }

    // Fallback response
    console.log('🔄 Using fallback intelligent response');
    return {
      content: this.generateIntelligentResponse(prompt),
      model: 'steeb-intelligent',
      service: 'fallback'
    };
  }

  private async tryLlamaCpp(prompt: string): Promise<AIResponse | null> {
    try {
      const response = await fetch('https://llama-api.adapta.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error('Llama.cpp API error');

      const data = await response.json();
      return {
        content: data.choices[0].message.content.trim(),
        model: 'llama-3.1-8b-instruct',
        service: 'llamacpp'
      };
    } catch (error) {
      return null;
    }
  }

  private async tryOpenRouter(prompt: string): Promise<AIResponse | null> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer sk-or-v1-5a3c7c9f1d6c7d6c3d5f6b2d8e2a1b0c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5`
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error('OpenRouter API error');

      const data = await response.json();
      return {
        content: data.choices[0].message.content.trim(),
        model: 'llama-3.1-8b-instruct',
        service: 'openrouter'
      };
    } catch (error) {
      return null;
    }
  }

  private async tryHuggingFace(prompt: string): Promise<AIResponse | null> {
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 150,
            temperature: 0.7
          }
        })
      });

      if (!response.ok) throw new Error('HuggingFace API error');

      const data = await response.json();
      return {
        content: data[0]?.generated_text?.trim() || 'Response generation failed.',
        model: 'DialoGPT-medium',
        service: 'huggingface'
      };
    } catch (error) {
      return null;
    }
  }

  private generateIntelligentResponse(prompt: string): string {
    // Enhanced fallback with better pattern matching
    const message = prompt.toLowerCase();

    // Extract user intent from prompt
    const userMessage = message.includes('usuario:') ?
      message.split('usuario:')[1].split('\n')[0].trim() :
      message;

    console.log('🤔 Generating intelligent response for:', userMessage);

    if (userMessage.includes('hola') || userMessage.includes('buen día')) {
      return '¡Hola! Es hora de acción. Recordá que cada momento que pasas sin hacer algo es un momento regalado a la mediocridad. ¿Qué vas a conquistar hoy?';
    }

    if (userMessage.includes('tarea') || userMessage.includes('tareas')) {
      return 'Las tareas no se hacen solas. La procrastinación es el impuesto que pagás por no vivir tu potencial. Elegí una tarea ahora y empezá a construir tu éxito.';
    }

    if (userMessage.includes('procrastinar') || userMessage.includes('postergar')) {
      return 'El "después" es el idioma de los que fracasan. Los ganadores hablan en "ahora". ¿Cuál idioma vas a usar hoy?';
    }

    if (userMessage.includes('cansado') || userMessage.includes('energía')) {
      return 'El cansancio es mental. 10 minutos de acción generan 2 horas de energía. Empezá con la tarea más pequeña y verás cómo la energía aparece sola.';
    }

    if (userMessage.includes('difícil') || userMessage.includes('no puedo')) {
      return '"No puedo" es la frase favorita de los que se rinden. Reemplazala por "¿Cómo puedo?". La respuesta siempre está en la acción, no en las excusas.';
    }

    if (userMessage.includes('motivación') || userMessage.includes('ánimo')) {
      return 'La motivación no aparece mágicamente. Se construye con cada pequeña acción que tomás. La disciplina es lo que separa a los amateurs de los profesionales.';
    }

    // Default motivational responses
    const responses = [
      'Dejá de pensar, hacelo. La acción es el único idioma que entiende el éxito.',
      'El momento perfecto fue hace 5 minutos. El segundo mejor momento es ahora. Actuá.',
      'Cada tarea que completás es una victoria contra la procrastinación. Ganá hoy.',
      'Los exitosos no esperan el momento perfecto. Crean el momento perfecto actuando.',
      'Tu futuro yo te agradece cada tarea que completás hoy. No lo defraudes.'
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }
}

export default AIService;