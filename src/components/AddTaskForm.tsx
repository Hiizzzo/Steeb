
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Task } from '@/components/TaskItem';

interface AddTaskFormProps {
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'actualTime'>) => void;
}

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
    
    onAddTask({
      title: title.trim(),
      description: description.trim(),
      targetTime: targetTime ? parseInt(targetTime, 10) : undefined
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
          className="steve-border cursor-visible"
        />
      </div>
      
      <div>
        <Input
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="steve-border cursor-visible"
        />
      </div>
      
      <div>
        <Input
          type="number"
          placeholder="Tiempo estimado en minutos (opcional)"
          value={targetTime}
          onChange={(e) => setTargetTime(e.target.value)}
          min="1"
          className="steve-border cursor-visible"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-12 h-12 rounded-full bg-steve-black text-steve-white hover:bg-steve-gray-dark steve-shadow flex items-center justify-center"
      >
        <Plus size={18} />
      </Button>
    </form>
  );
};

export default AddTaskForm;
