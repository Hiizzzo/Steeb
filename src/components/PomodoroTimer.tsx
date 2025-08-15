
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlarmClock, Play, Pause, RotateCcw, Coffee, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SteveAvatar from '@/components/SteveAvatar';

interface PomodoroTimerProps {
  onClose: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onClose }) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [cycle, setCycle] = useState(1);
  const [steveMood, setSteveMood] = useState<'happy' | 'neutral' | 'angry'>('happy');
  const [message, setMessage] = useState('¡Vamos a usar la técnica Pomodoro!');
  const { toast } = useToast();

  const WORK_TIME = 25 * 60; // 25 minutos en segundos
  const SHORT_BREAK = 5 * 60; // 5 minutos en segundos
  const LONG_BREAK = 15 * 60; // 15 minutos en segundos

  const totalSeconds = minutes * 60 + seconds;
  const maxTime = isBreak ? (cycle % 4 === 0 ? LONG_BREAK : SHORT_BREAK) : WORK_TIME;
  const progress = ((maxTime - totalSeconds) / maxTime) * 100;

  // Formatear tiempo
  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cambiar humor de Steve y mensajes
  useEffect(() => {
    if (isBreak) {
      setSteveMood('happy');
      if (cycle % 4 === 0) {
        setMessage('¡Descanso largo! Te lo has ganado.');
      } else {
        setMessage('Tiempo de descanso. ¡Relájate un poco!');
      }
    } else {
      const timeLeft = totalSeconds;
      const workProgress = (WORK_TIME - timeLeft) / WORK_TIME;
      
      if (workProgress < 0.3) {
        setSteveMood('happy');
        setMessage('¡Empezamos fuerte! Mantén el enfoque.');
      } else if (workProgress < 0.7) {
        setSteveMood('neutral');
        setMessage('¡Vas por la mitad! Sigue concentrado.');
      } else if (workProgress < 0.9) {
        setSteveMood('neutral');
        setMessage('¡Ya casi terminas! ¡Último esfuerzo!');
      } else {
        setSteveMood('angry');
        setMessage('¡Los últimos minutos son cruciales! ¡No te rindas!');
      }
    }
  }, [totalSeconds, isBreak, cycle, WORK_TIME]);

  // Timer principal
  useEffect(() => {
    let interval: number | undefined;

    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = window.setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        }
      }, 1000);
    } else if (isActive && minutes === 0 && seconds === 0) {
      // Timer terminado
      setIsActive(false);
      
      if (isBreak) {
        // Terminar descanso, empezar trabajo
        setIsBreak(false);
        setMinutes(25);
        setSeconds(0);
        toast({
          title: "Steve dice:",
          description: "¡Descanso terminado! ¡Hora de trabajar de nuevo!",
        });
      } else {
        // Terminar trabajo, empezar descanso
        setIsBreak(true);
        const isLongBreak = cycle % 4 === 0;
        setMinutes(isLongBreak ? 15 : 5);
        setSeconds(0);
        setCycle(cycle + 1);
        
        toast({
          title: "Steve dice:",
          description: isLongBreak 
            ? "¡Pomodoro completado! Disfruta tu descanso largo." 
            : "¡Pomodoro completado! Toma un descanso corto.",
        });
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, minutes, seconds, isBreak, cycle, toast]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (isBreak) {
      const isLongBreak = cycle % 4 === 0;
      setMinutes(isLongBreak ? 15 : 5);
    } else {
      setMinutes(25);
    }
    setSeconds(0);
  };

  const skipPhase = () => {
    setIsActive(false);
    
    if (isBreak) {
      setIsBreak(false);
      setMinutes(25);
      setSeconds(0);
    } else {
      setIsBreak(true);
      const isLongBreak = cycle % 4 === 0;
      setMinutes(isLongBreak ? 15 : 5);
      setSeconds(0);
      setCycle(cycle + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-steve-white flex flex-col items-center justify-center p-6 z-50">
      <Card className="w-full max-w-md steve-border p-6 bg-steve-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {isBreak ? (
              <span className="flex items-center">
                <Coffee className="mr-2" />
                Descanso
              </span>
            ) : (
              <span className="flex items-center">
                <AlarmClock className="mr-2" />
                Pomodoro #{cycle}
              </span>
            )}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle size={18} />
          </Button>
        </div>

        <div className="flex justify-center mb-6">
          <SteveAvatar mood={steveMood} size="lg" animate={isActive} />
        </div>

        <p className="text-center mb-4 text-sm">{message}</p>

        <div className="text-6xl font-bold text-center mb-6">
          {formatTime(minutes, seconds)}
        </div>

        <div className="mb-6">
          <Progress 
            value={progress} 
            className={`h-3 ${isBreak ? 'bg-green-100' : 'bg-red-100'}`} 
          />
          <p className="text-center text-xs mt-2 text-steve-gray-dark">
            {isBreak ? 'Tiempo de descanso' : 'Tiempo de trabajo'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button 
            onClick={toggleTimer}
            className="bg-steve-black text-steve-white hover:bg-steve-gray-dark"
          >
            {isActive ? <Pause size={18} /> : <Play size={18} />}
          </Button>
          
          <Button 
            onClick={resetTimer}
            variant="outline"
            className="steve-border bg-steve-white hover:bg-steve-gray-light"
          >
            <RotateCcw size={18} />
          </Button>
          
          <Button 
            onClick={skipPhase}
            variant="outline"
            className="steve-border bg-steve-white hover:bg-steve-gray-light text-xs"
          >
            Saltar
          </Button>
        </div>

        <div className="mt-4 text-center text-xs text-steve-gray-dark">
          <p>Trabajo: 25 min • Descanso: 5 min • Descanso largo: 15 min</p>
        </div>
      </Card>
    </div>
  );
};

export default PomodoroTimer;
