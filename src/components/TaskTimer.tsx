
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlarmClock, CheckCircle, XCircle } from 'lucide-react';
import { Task } from '@/components/TaskItem';
import SteveAvatar from '@/components/SteveAvatar';

interface TaskTimerProps {
  task: Task | null;
  onComplete: (id: string, timeSpent: number) => void;
  onCancel: () => void;
}

const TaskTimer: React.FC<TaskTimerProps> = ({ task, onComplete, onCancel }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [steveMood, setSteveMood] = useState<'happy' | 'neutral' | 'angry'>('happy');
  const [message, setMessage] = useState('¡Vamos a empezar a trabajar!');
  
  // Convertir segundos a formato mm:ss
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Iniciar/pausar el temporizador
  const toggleTimer = () => {
    setIsActive(!isActive);
  };
  
  // Completar la tarea
  const handleComplete = () => {
    if (!task) return;
    onComplete(task.id, Math.floor(seconds / 60));
  };
  
  // Cambiar el humor de Steve basado en el tiempo
  useEffect(() => {
    if (!task?.targetTime || !isActive) return;
    
    const targetSeconds = task.targetTime * 60;
    
    if (seconds < targetSeconds * 0.5) {
      setSteveMood('happy');
      setMessage('¡Vas muy bien! Sigue así.');
    } else if (seconds < targetSeconds * 0.8) {
      setSteveMood('neutral');
      setMessage('Continúa trabajando, vas por buen camino.');
    } else if (seconds < targetSeconds) {
      setSteveMood('neutral');
      setMessage('Ya casi terminas el tiempo estimado.');
    } else if (seconds < targetSeconds * 1.2) {
      setSteveMood('angry');
      setMessage('¡Estás excediendo el tiempo! ¡Enfócate!');
    } else {
      setSteveMood('angry');
      setMessage('¿Necesitas ayuda? ¡Estás tomando demasiado tiempo!');
    }
  }, [seconds, task, isActive]);
  
  // Incrementar el contador cada segundo
  useEffect(() => {
    let interval: number | undefined;
    
    if (isActive) {
      interval = window.setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);
  
  if (!task) return null;
  
  return (
    <div className="fixed inset-0 bg-steve-white flex flex-col items-center justify-center p-6 z-50">
      <Card className="w-full max-w-md steve-border p-4 bg-steve-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Trabajando en:</h3>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <XCircle size={18} />
          </Button>
        </div>
        
        <h2 className="text-xl font-bold mb-6">{task.title}</h2>
        
        <div className="flex justify-center mb-6">
          <SteveAvatar mood={steveMood} size="lg" animate={isActive} />
        </div>
        
        <p className="text-center mb-4">{message}</p>
        
        <div className="text-4xl font-bold text-center mb-6 flex items-center justify-center gap-2">
          <AlarmClock className="mr-2" />
          <span>{formatTime(seconds)}</span>
        </div>
        
        {task.targetTime && (
          <div className="text-center text-sm mb-4">
            Tiempo estimado: {task.targetTime} minutos
            {seconds > task.targetTime * 60 && (
              <span className="block text-red-500 font-medium mt-1">
                ¡Te has excedido por {formatTime(seconds - task.targetTime * 60)}!
              </span>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={toggleTimer}
            className="bg-steve-black text-steve-white hover:bg-steve-gray-dark steve-shadow"
          >
            {isActive ? 'Pausar' : 'Continuar'}
          </Button>
          
          <Button 
            onClick={handleComplete}
            variant="outline"
            className="steve-border bg-steve-white hover:bg-steve-gray-light"
          >
            <CheckCircle size={18} className="mr-1" />
            Completar
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TaskTimer;
