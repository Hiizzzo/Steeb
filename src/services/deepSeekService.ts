import { sendMessageToSteeb } from './steebApi';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

class DeepSeekService {
    private isInitialized = true; // Always ready as it uses backend API

    async initialize(): Promise<boolean> {
        return true;
    }

    isReady(): boolean {
        return true;
    }

    getInitializationStatus(): string {
        return 'Conectado a DeepSeek (vía Backend)';
    }

    async getResponse(message: string): Promise<string> {
        try {
            const response = await sendMessageToSteeb(message);
            return response.reply;
        } catch (error) {
            console.error('Error getting response from DeepSeek via backend:', error);
            return 'Lo siento, hubo un problema de conexión con mi cerebro en la nube. Intenta de nuevo.';
        }
    }

    // Compatibility methods for existing code
    async getProductivitySuggestion(): Promise<string> {
        return this.getResponse("Dame una sugerencia corta de productividad para ahora mismo.");
    }

    getOllamaUrl(): string {
        return 'Backend API';
    }

    getCurrentModel(): string {
        return 'DeepSeek-V3';
    }

    // No-op methods for compatibility
    setOllamaUrl() { }
    setModel() { }
    getAvailableModels() { return ['DeepSeek-V3']; }
}

export const deepSeekService = new DeepSeekService();
export default deepSeekService;
