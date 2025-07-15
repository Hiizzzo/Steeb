
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Task } from '@/components/TaskItem';

interface AddTaskFormProps {
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'actualTime'>) => void;
}

// --- STEBE: función local para analizar y ordenar tareas ---
function ordenarTareaConStebe({ title, description }: { title: string; description?: string }) {
  // Palabras clave para prioridad
  const prioridadAlta = /urgente|hoy|inmediato|importante|prioridad/i;
  const prioridadMedia = /esta semana|pronto|pendiente/i;
  // Palabras clave para categorías
  const categorias = [
    { key: 'work', regex: /trabajo|oficina|reunión|proyecto/i },
    { key: 'study', regex: /estudio|leer|aprender|examen|tarea/i },
    { key: 'exercise', regex: /ejercicio|correr|gimnasio|deporte/i },
    { key: 'personal', regex: /personal|familia|amigos|cita|salud/i },
    { key: 'project', regex: /proyecto|meta|objetivo/i },
  ];

  let priority: 'alta' | 'media' | 'baja' = 'baja';
  if (prioridadAlta.test(title) || prioridadAlta.test(description || '')) {
    priority = 'alta';
  } else if (prioridadMedia.test(title) || prioridadMedia.test(description || '')) {
    priority = 'media';
  }

  let category: string | undefined = undefined;
  for (const cat of categorias) {
    if (cat.regex.test(title) || cat.regex.test(description || '')) {
      category = cat.key;
      break;
    }
  }

  return { priority, category };
}
// --- FIN STEBE ---

const AddTaskForm: React.FC<AddTaskFormProps> = ({ onAddTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Steve dice:",
        description: "¡Necesitas darle un nombre a tu tarea!",
        variant: "destructive",
      });
      return;
    }

    // Usar Stebe para analizar la tarea
    const stebeResult = ordenarTareaConStebe({ title: title.trim(), description: description.trim() });
    
    onAddTask({
      title: title.trim(),
      description: description.trim(),
      targetTime: targetTime ? parseInt(targetTime, 10) : undefined,
      category: stebeResult.category,
      priority: stebeResult.priority,
    });
    
    setTitle('');
    setDescription('');
    setTargetTime('');
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Input
          placeholder="¿Qué tarea tienes que hacer?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="steve-border"
        />
      </div>
      
      <div>
        <Input
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="steve-border"
        />
      </div>
      
      <div>
        <Input
          type="number"
          placeholder="Tiempo estimado en minutos (opcional)"
          value={targetTime}
          onChange={(e) => setTargetTime(e.target.value)}
          min="1"
          className="steve-border"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-steve-black text-steve-white hover:bg-steve-gray-dark steve-shadow"
      >
        Agregar Tarea
      </Button>
    </form>
  );
};

export default AddTaskForm;
