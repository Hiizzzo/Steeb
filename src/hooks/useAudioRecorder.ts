// ============================================================================
// AUDIO RECORDER HOOK - Cross-platform (Web + Native)
// ============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';

// Detect platform
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined' && !('ReactNativeWebView' in window);

// Lazy load expo-av only on native
let Audio: any = null;
const loadExpoAv = async () => {
    if (!isWeb && !Audio) {
        try {
            const module = await import('expo-av');
            Audio = module.Audio;
        } catch (error) {
            console.warn('expo-av not available:', error);
        }
    }
};

export interface AudioRecorderState {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    audioBlob: Blob | null;
    audioUri: string | null;
    error: string | null;
}

export interface UseAudioRecorderReturn {
    state: AudioRecorderState;
    startRecording: () => Promise<boolean>;
    stopRecording: () => Promise<Blob | string | null>;
    cancelRecording: () => void;
    requestPermission: () => Promise<boolean>;
    hasPermission: boolean;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
    const [state, setState] = useState<AudioRecorderState>({
        isRecording: false,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUri: null,
        error: null,
    });

    const [hasPermission, setHasPermission] = useState(false);

    // Web-specific refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    // Native-specific refs
    const recordingRef = useRef<any>(null);

    // Timer for duration
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Request microphone permission
    const requestPermission = useCallback(async (): Promise<boolean> => {
        try {
            if (isWeb) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop()); // Stop immediately, just checking permission
                setHasPermission(true);
                return true;
            } else {
                await loadExpoAv();
                if (!Audio) return false;

                const { status } = await Audio.requestPermissionsAsync();
                const granted = status === 'granted';
                setHasPermission(granted);
                return granted;
            }
        } catch (error) {
            console.error('Error requesting audio permission:', error);
            setState(prev => ({ ...prev, error: 'No se pudo obtener permiso de micrófono' }));
            return false;
        }
    }, []);

    // Start recording
    const startRecording = useCallback(async (): Promise<boolean> => {
        try {
            // Reset state
            setState({
                isRecording: false,
                isPaused: false,
                duration: 0,
                audioBlob: null,
                audioUri: null,
                error: null,
            });
            audioChunksRef.current = [];

            if (isWeb) {
                // Web recording using MediaRecorder
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100, // Standard sample rate
                    }
                });
                streamRef.current = stream;

                // Determine supported mime type
                let mimeType = 'audio/webm';
                if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                    mimeType = 'audio/webm;codecs=opus';
                } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    mimeType = 'audio/mp4';
                }

                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType,
                });

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onerror = (event) => {
                    console.error('MediaRecorder error:', event);
                    setState(prev => ({ ...prev, error: 'Error durante la grabación', isRecording: false }));
                };

                mediaRecorderRef.current = mediaRecorder;
                mediaRecorder.start(100); // Collect data every 100ms

            } else {
                // Native recording using expo-av
                await loadExpoAv();
                if (!Audio) {
                    setState(prev => ({ ...prev, error: 'Audio no disponible' }));
                    return false;
                }

                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                recordingRef.current = recording;
            }

            // Start timer
            startTimeRef.current = Date.now();
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                setState(prev => ({ ...prev, duration: elapsed }));
            }, 1000);

            setState(prev => ({ ...prev, isRecording: true }));
            setHasPermission(true);
            return true;

        } catch (error: any) {
            console.error('Error starting recording:', error);
            const errorMsg = error?.message?.includes('Permission')
                ? 'Permiso de micrófono denegado'
                : 'No se pudo iniciar la grabación';
            setState(prev => ({ ...prev, error: errorMsg }));
            return false;
        }
    }, []);

    // Stop recording and get audio
    const stopRecording = useCallback(async (): Promise<Blob | string | null> => {
        try {
            // Stop timer
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            if (isWeb) {
                return new Promise((resolve) => {
                    const mediaRecorder = mediaRecorderRef.current;
                    if (!mediaRecorder) {
                        resolve(null);
                        return;
                    }

                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                        // Stop all tracks
                        if (streamRef.current) {
                            streamRef.current.getTracks().forEach(track => track.stop());
                            streamRef.current = null;
                        }

                        setState(prev => ({
                            ...prev,
                            isRecording: false,
                            audioBlob,
                            audioUri: URL.createObjectURL(audioBlob)
                        }));

                        resolve(audioBlob);
                    };

                    mediaRecorder.stop();
                });

            } else {
                // Native
                const recording = recordingRef.current;
                if (!recording) return null;

                await recording.stopAndUnloadAsync();
                const uri = recording.getURI();
                recordingRef.current = null;

                if (Audio) {
                    await Audio.setAudioModeAsync({
                        allowsRecordingIOS: false,
                    });
                }

                setState(prev => ({
                    ...prev,
                    isRecording: false,
                    audioUri: uri
                }));

                return uri;
            }

        } catch (error) {
            console.error('Error stopping recording:', error);
            setState(prev => ({ ...prev, error: 'Error al detener la grabación', isRecording: false }));
            return null;
        }
    }, []);

    // Cancel recording without saving
    const cancelRecording = useCallback(() => {
        // Stop timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (isWeb) {
            const mediaRecorder = mediaRecorderRef.current;
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            audioChunksRef.current = [];
        } else {
            const recording = recordingRef.current;
            if (recording) {
                recording.stopAndUnloadAsync().catch(console.error);
                recordingRef.current = null;
            }
        }

        setState({
            isRecording: false,
            isPaused: false,
            duration: 0,
            audioBlob: null,
            audioUri: null,
            error: null,
        });
    }, []);

    return {
        state,
        startRecording,
        stopRecording,
        cancelRecording,
        requestPermission,
        hasPermission,
    };
};

export default useAudioRecorder;
