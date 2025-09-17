
import { useCallback } from 'react';

export const useSoundEffects = () => {
  const triggerVibration = useCallback(() => {
    try {
      // Debug info para móviles
      console.log('📳 Intentando activar vibración...');
      console.log('📳 User Agent:', navigator.userAgent);
      console.log('📳 Vibrate disponible:', 'vibrate' in navigator);
      console.log('📳 Es HTTPS:', window.location.protocol === 'https:');
      
      // Verificar si la vibración está disponible
      if ('vibrate' in navigator && navigator.vibrate) {
        // Patrón de vibración más fuerte para móviles: vibrar 300ms, pausa 100ms, vibrar 300ms
        const vibrationPattern = [300, 100, 300];
        
        // Intentar vibrar
        const result = navigator.vibrate(vibrationPattern);
        
        if (result) {
          console.log('📳 Vibración activada exitosamente');
        } else {
          console.log('📳 Vibración bloqueada o no soportada, intentando fallback');
          // Intentar vibración simple como fallback
          navigator.vibrate(400);
        }
      } else {
        console.log('📳 API de vibración no disponible en este dispositivo/navegador');
      }
    } catch (error) {
      console.log('📳 Error al activar vibración:', error);
      // Intentar vibración simple como último recurso
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
          console.log('📳 Fallback de vibración simple ejecutado');
        }
      } catch (fallbackError) {
        console.log('📳 Fallback de vibración también falló:', fallbackError);
       }
      }
    }, []);
   
   const playTaskCompleteSound = useCallback(() => {
    try {
      // Verificar si AudioContext está disponible
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        console.log('AudioContext no disponible');
        return;
      }
      
      // Crear un contexto de audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Verificar si el contexto está en estado válido
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
          console.log('No se pudo reanudar AudioContext');
        });
      }
      
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
      
      playSuccessChord();
    } catch (error) {
      console.log('No se pudo reproducir el sonido:', error);
    }
  }, []);

  const playTimerStartSound = useCallback(() => {
    try {
      // Verificar si AudioContext está disponible
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        console.log('AudioContext no disponible');
        return;
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Verificar si el contexto está en estado válido
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
          console.log('No se pudo reanudar AudioContext');
        });
      }
      
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
  }, []);

  const playButtonClickSound = useCallback(() => {
    try {
      // Verificar si AudioContext está disponible
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        console.log('AudioContext no disponible');
        return;
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Verificar si el contexto está en estado válido
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
          console.log('No se pudo reanudar AudioContext');
        });
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Sonido de click suave y rápido
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.05);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.08);
    } catch (error) {
      console.log('No se pudo reproducir el sonido:', error);
    }
  }, []);

  const playTaskDeleteSound = useCallback(() => {
    try {
      // Verificar si AudioContext está disponible
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        console.log('AudioContext no disponible');
        return;
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Verificar si el contexto está en estado válido
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
          console.log('No se pudo reanudar AudioContext');
        });
      }
      
      // Sonido de eliminación - tono descendente dramático
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Frecuencia que desciende dramáticamente
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
      oscillator.type = 'sawtooth';
      
      // Envelope con fade out suave
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.log('No se pudo reproducir el sonido:', error);
    }
  }, []);

  return {
    playTaskCompleteSound,
    playTimerStartSound,
    playButtonClickSound,
    playTaskDeleteSound,
    triggerVibration
  };
};
