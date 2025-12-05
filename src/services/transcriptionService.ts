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
        console.log('🎤 Sending audio URI for transcription:', uri);

        // Native FormData handling
        const formData = new FormData();

        // React Native needs { uri, name, type } object for file uploads
        // We cast to any because standard FormData expects Blob/string, but RN extends it
        formData.append('audio', {
            uri: uri,
            name: 'recording.m4a', // iOS/Android usually output m4a/mp4
            type: 'audio/m4a'
        } as any);

        const response = await fetch(TRANSCRIBE_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: {
                // IMPORTANT: Do NOT set Content-Type header manually for FormData in RN
                // The browser/network stack sets it with the boundary
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Transcription API error (Native):', response.status, errorData);
            return {
                success: false,
                error: errorData.error || `Error ${response.status}`
            };
        }

        const result = await response.json();

        if (result.success && result.text) {
            console.log('✅ Transcription successful (Native):', result.text.substring(0, 50) + '...');
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
        console.error('❌ Error transcribing from URI:', error);
        return {
            success: false,
            error: 'No se pudo cargar o enviar el audio'
        };
    }
}
