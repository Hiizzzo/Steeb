
import { useEffect } from 'react';
import { Task } from '@/components/TaskItem';
import { useToast } from '@/components/ui/use-toast';

interface InactivityReminderProps {
  activeTask: Task | null;
  tasks: Task[];
}

const InactivityReminder: React.FC<InactivityReminderProps> = ({ activeTask, tasks }) => {
  const { toast } = useToast();
  
  // Verificar inactividad para que Steve envíe notificaciones
  useEffect(() => {
    let inactivityTimer: number | undefined;
    let reminderCount = 0;
    
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = window.setTimeout(() => {
        if (!activeTask && tasks.some(task => !task.completed)) {
          reminderCount++;
          let message = '';
          
          if (reminderCount === 1) {
            message = "¡Hey! Tienes tareas pendientes. ¿Necesitas ayuda?";
          } else if (reminderCount === 2) {
            message = "Vamos, no te distraigas. ¡Hay trabajo que hacer!";
          } else {
            message = "¡ESTOY OBSERVANDO TUS ESTADÍSTICAS! ¡PONTE A TRABAJAR AHORA!";
          }
          
          toast({
            title: "Steve dice:",
            description: message,
          });
        }
      }, 90000); // 1.5 minutos de inactividad
    };
    
    resetInactivityTimer();
    
    const handleActivity = () => {
      resetInactivityTimer();
    };
    
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [activeTask, tasks, toast]);
  
  return null; // Este componente no renderiza nada, solo maneja la lógica
};

export default InactivityReminder;
