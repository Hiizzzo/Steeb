// ============================================================================
// TRANSCRIPTION SERVICE - OpenAI Whisper Integration
// ============================================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'https://v0-steeb-api-backend-production.up.railway.app/api';
const TRANSCRIBE_ENDPOINT = `${BASE_URL}/transcribe`;

export interface TranscriptionResult {
    success: boolean;
    text?: string;
    language?: string;
    error?: string;
}

/**
 * Transcribe audio blob to text using OpenAI Whisper
 */
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        console.log('🎤 Sending audio for transcription...', {
            size: audioBlob.size,
            type: audioBlob.type
        });

        const response = await fetch(TRANSCRIBE_ENDPOINT, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Transcription API error:', response.status, errorData);
            return {
                success: false,
                error: errorData.error || `Error ${response.status}`
            };
        }

        const result = await response.json();

        if (result.success && result.text) {
            console.log('✅ Transcription successful:', result.text.substring(0, 50) + '...');
            return {
                success: true,
                text: result.text,
                language: result.language
            };
        }

        return {
            success: false,
            error: result.error || 'No se pudo transcribir el audio'
        };

    } catch (error: any) {
        console.error('❌ Transcription error:', error);
        return {
            success: false,
            error: error.message || 'Error de conexión'
        };
    }
}

/**
 * Transcribe audio from URI (for native apps)
 */
export async function transcribeAudioFromUri(uri: string): Promise<TranscriptionResult> {
    try {
        // Fetch the audio file from the URI
        const response = await fetch(uri);
        const blob = await response.blob();

        return transcribeAudio(blob);
    } catch (error: any) {
        console.error('❌ Error loading audio from URI:', error);
        return {
            success: false,
            error: 'No se pudo cargar el audio'
        };
    }
}
