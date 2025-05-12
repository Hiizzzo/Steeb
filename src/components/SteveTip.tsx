
import React from 'react';
import SteveMessage from '@/components/SteveMessage';
import { Task } from '@/components/TaskItem';

interface SteveTipProps {
  pendingTasks: Task[];
  completedTasks: Task[];
}

const SteveTip: React.FC<SteveTipProps> = ({ pendingTasks, completedTasks }) => {
  // Determinar el mensaje de Steve
  const getSteveMessage = () => {
    const totalTasks = pendingTasks.length + completedTasks.length;
    
    if (totalTasks === 0) {
      return {
        text: "¡Hola! Soy Steve, tu supervisor de productividad. Vamos a agregar algunas tareas para empezar.",
        mood: 'happy' as const
      };
    }
    
    if (pendingTasks.length === 0 && completedTasks.length > 0) {
      return {
        text: "¡Excelente trabajo! Has completado todas tus tareas. ¿Quieres agregar más?",
        mood: 'happy' as const
      };
    }
    
    if (pendingTasks.length > 2) {
      return {
        text: `Tienes ${pendingTasks.length} tareas pendientes. ¡Es hora de ponerse a trabajar!`,
        mood: 'angry' as const
      };
    }
    
    return {
      text: "Recuerda mantener el enfoque y evitar distracciones. ¡Estoy vigilando!",
      mood: 'neutral' as const
    };
  };
  
  const steveMessage = getSteveMessage();
  
  return <SteveMessage message={steveMessage.text} mood={steveMessage.mood} />;
};

export default SteveTip;
