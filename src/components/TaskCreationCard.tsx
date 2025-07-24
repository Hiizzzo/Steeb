import React, { useState } from 'react';
import { Calendar, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

// Componente SVG del mouse pointer (mano apuntando)
const MousePointerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M13.64 21.97C13.14 22.16 12.54 21.86 12.31 21.37L10.05 16.3L7.7 18.65C7.31 19.04 6.68 19.04 6.29 18.65L5.35 17.71C4.96 17.32 4.96 16.69 5.35 16.3L7.7 13.95L2.63 11.69C2.14 11.46 1.84 10.86 2.03 10.36L2.97 7.64C3.16 7.14 3.76 6.84 4.26 7.03L21.26 14.03C21.76 14.22 22.06 14.82 21.87 15.32L20.93 18.04C20.74 18.54 20.14 18.84 19.64 18.65L13.64 21.97Z" 
      fill="white"
      stroke="black"
      strokeWidth="1.5"
    />
  </svg>
);

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskCreationCardProps {
  onCancel: () => void;
  onCreate: (title: string, type: 'personal' | 'work' | 'meditation', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string, notes?: string) => void;
}

const TaskCreationCard: React.FC<TaskCreationCardProps> = ({ onCancel, onCreate }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTag, setSelectedTag] = useState<'personal' | 'work' | 'meditation'>('personal');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const { playButtonClickSound } = useSoundEffects();
  const { toast } = useToast();

  const handleCreate = () => {
    if (title.trim()) {
      playButtonClickSound();
      
      const scheduledDate = selectedDate ? selectedDate.toISOString().split('T')[0] : undefined;
      
      onCreate(
        title.trim(), 
        selectedTag, 
        undefined, // subtasks - not implemented in this simple version
        scheduledDate,
        undefined, // scheduledTime - not implemented in this simple version
        notes.trim() || undefined
      );
      
      toast({
        title: "¡Tarea creada!",
        description: "Tu nueva tarea ha sido añadida exitosamente.",
      });
    } else {
      toast({
        title: "Error",
        description: "Por favor, escribe un nombre para la tarea.",
        variant: "destructive",
      });
    }
  };

  const getTagLabel = (tag: 'personal' | 'work' | 'meditation') => {
    switch (tag) {
      case 'personal': return 'Personal';
      case 'work': return 'Trabajo';
      case 'meditation': return 'Meditación';
    }
  };

  const getTagColor = (tag: 'personal' | 'work' | 'meditation') => {
    switch (tag) {
      case 'personal': return 'bg-blue-500';
      case 'work': return 'bg-green-500';
      case 'meditation': return 'bg-purple-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-white rounded-[18px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button
            onClick={onCancel}
            className="text-black hover:text-gray-600 transition-colors font-medium"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleCreate}
            className="flex items-center justify-center w-10 h-10 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            <MousePointerIcon />
          </button>
          
          <button
            onClick={handleCreate}
            className="text-black hover:text-gray-600 transition-colors font-medium"
          >
            Crear
          </button>
        </div>

        {/* Main Content */}
        <div className="p-4">
          {/* Task Name Input */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-black mb-3">
              Nombre de la tarea
            </h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre de la tarea"
              className="w-full text-lg text-black placeholder-gray-400 border-none outline-none bg-transparent"
              autoFocus
            />
          </div>

          {/* Notes Input */}
          <div className="mb-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas"
              className="w-full text-sm text-gray-500 placeholder-gray-400 border-none outline-none bg-transparent resize-none min-h-[40px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex border-t border-gray-100">
          {/* Date Section */}
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex-1 flex items-center justify-center gap-2 py-4 text-black hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Calendar size={18} className="text-black" />
            <span className="font-medium">
              {selectedDate ? format(selectedDate, "dd MMM", { locale: es }) : "Fecha ..."}
            </span>
          </button>
          
          {/* Divider */}
          <div className="w-px bg-gray-100"></div>
          
          {/* Tag Section */}
          <button 
            onClick={() => setShowTagPicker(!showTagPicker)}
            className="flex-1 flex items-center justify-center gap-2 py-4 text-black hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <div className={`w-3 h-3 rounded-full ${getTagColor(selectedTag)}`}></div>
            <span className="font-medium">{getTagLabel(selectedTag)}</span>
          </button>
        </div>

        {/* Date Picker */}
        {showDatePicker && (
          <div className="border-t border-gray-100 p-4 bg-white">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setShowDatePicker(false);
              }}
              className="rounded-md border mx-auto"
            />
          </div>
        )}

        {/* Tag Picker */}
        {showTagPicker && (
          <div className="border-t border-gray-100 bg-white">
            {(['personal', 'work', 'meditation'] as const).map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSelectedTag(tag);
                  setShowTagPicker(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-4 h-4 rounded-full ${getTagColor(tag)}`}></div>
                <span className="text-black font-medium">{getTagLabel(tag)}</span>
                {selectedTag === tag && (
                  <div className="ml-auto w-2 h-2 bg-black rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TaskCreationCard; 