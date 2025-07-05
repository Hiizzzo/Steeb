
import { useCallback, useRef } from 'react';

export const useSoundEffects = () => {
  // Create a single AudioContext instance and reuse it
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.error('Failed to create AudioContext:', error);
        return null;
      }
    }
    
    // Resume context if it's suspended (required by some browsers)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    return audioContextRef.current;
  }, []);

  const playTaskCompleteSound = useCallback(() => {
    const audioContext = getAudioContext();
    if (!audioContext) return;
    
    // Función para crear un tono satisfactorio (acorde mayor)
    const playSuccessChord = () => {
      const frequencies = [523.25, 659.25, 783.99]; // Do, Mi, Sol (acorde de Do mayor)
      const duration = 0.6;
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Envelope suave
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime + index * 0.1);
        oscillator.stop(audioContext.currentTime + duration);
      });
    };
    
    try {
      playSuccessChord();
    } catch (error) {
      console.log('No se pudo reproducir el sonido:', error);
    }
  }, [getAudioContext]);

  const playTimerStartSound = useCallback(() => {
    const audioContext = getAudioContext();
    if (!audioContext) return;
    
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('No se pudo reproducir el sonido:', error);
    }
  }, [getAudioContext]);

  return {
    playTaskCompleteSound,
    playTimerStartSound
  };
};
