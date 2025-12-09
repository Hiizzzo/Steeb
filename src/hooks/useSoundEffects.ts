
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

      // Arpegio suave y ascendente para confirmar la tarea
      const playGentleArpeggio = () => {
        const notes = [554.37, 659.25, 880]; // Fa#, La, La alta
        const baseTime = audioContext.currentTime;

        notes.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(freq, baseTime + index * 0.12);

          // Envelope con ataque rápido y caída suave
          gainNode.gain.setValueAtTime(0, baseTime + index * 0.12);
          gainNode.gain.linearRampToValueAtTime(0.12, baseTime + index * 0.14);
          gainNode.gain.exponentialRampToValueAtTime(0.01, baseTime + index * 0.45);

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.start(baseTime + index * 0.12);
          oscillator.stop(baseTime + index * 0.5);
        });
      };

      playGentleArpeggio();
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
      
      // Frecuencia que desciende dramáticamente - más grave
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.5);
      oscillator.type = 'square';
      
      // Envelope con fade out suave - más largo y grave
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
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
