import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, Pointer, Repeat } from 'lucide-react';
import ShapeIcon from "./ShapeIcon";
import type { RecurrenceRule, RecurrenceFrequency } from '@/types';

// Íconos simples para los tipos de tarea
const PersonalIcon = () => <div className="w-4 h-4 bg-black rounded-full"></div>;
const WorkIcon = () => <div className="w-4 h-4 bg-black rounded-sm"></div>;
const MeditationIcon = () => <div className="w-4 h-4 bg-black rounded-full border-2 border-white"></div>;

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  notes?: string;
  tags?: string[];
  recurrence?: RecurrenceRule;
}

interface TaskCreationCardProps {
  onCancel: () => void;
  onCreate: (
    title: string,
    type: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra',
    subtasks?: SubTask[],
    scheduledDate?: string,
    scheduledTime?: string,
    notes?: string,
    isPrimary?: boolean,
    recurrence?: RecurrenceRule
  ) => void;
  editingTask?: Task | null;
}

const TaskCreationCard: React.FC<TaskCreationCardProps> = ({ onCancel, onCreate, editingTask }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra'>('productividad');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  // Recurrence state
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(1);
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');
  const { playButtonClickSound } = useSoundEffects();
  const { toast } = useToast();

  // Pre-llenar campos cuando se está editando una tarea
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setNotes(editingTask.notes || '');
      setSelectedTag(editingTask.type);
      if (editingTask.scheduledDate) {
        setSelectedDate(new Date(editingTask.scheduledDate));
      }
      if (editingTask.scheduledTime) {
        setSelectedTime(editingTask.scheduledTime);
      }
      setIsPrimary(!!editingTask.tags?.includes('principal'));
      // Prefill recurrence
      if (editingTask.recurrence) {
        setRecurrenceFrequency(editingTask.recurrence.frequency);
        setRecurrenceInterval(editingTask.recurrence.interval || 1);
        setRecurrenceDaysOfWeek(editingTask.recurrence.daysOfWeek || []);
        setRecurrenceEndDate(editingTask.recurrence.endDate || '');
      } else {
        setRecurrenceFrequency('none');
        setRecurrenceInterval(1);
        setRecurrenceDaysOfWeek([]);
        setRecurrenceEndDate('');
      }
    } else {
      // Resetear campos cuando se está creando una nueva tarea
      setTitle('');
      setNotes('');
      setSelectedTag('productividad');
      setSelectedDate(undefined);
      setSelectedTime('');
      setIsPrimary(false);
      setRecurrenceFrequency('none');
      setRecurrenceInterval(1);
      setRecurrenceDaysOfWeek([]);
      setRecurrenceEndDate('');
    }
  }, [editingTask]);

  const handleCreate = () => {
    if (title.trim()) {
      console.log('📝 TaskCreationCard: Iniciando creación de tarea...');
      console.log('📝 Datos de la tarea:', { 
        title: title.trim(), 
        selectedTag, 
        scheduledDate: selectedDate ? selectedDate.toISOString().split('T')[0] : undefined,
        scheduledTime: selectedTime || undefined,
        notes: notes.trim() || undefined,
        isPrimary
      });
      
      playButtonClickSound();
      
      const scheduledDate = selectedDate ? selectedDate.toISOString().split('T')[0] : undefined;
      
      console.log('📝 TaskCreationCard: Llamando a onCreate...');
      const recurrence: RecurrenceRule | undefined =
        recurrenceFrequency === 'none'
          ? undefined
          : {
              frequency: recurrenceFrequency,
              interval: recurrenceInterval || 1,
              daysOfWeek: recurrenceFrequency === 'weekly' ? recurrenceDaysOfWeek : undefined,
              endDate: recurrenceEndDate || undefined,
            };

      onCreate(
        title.trim(), 
        selectedTag, 
        undefined,
        scheduledDate,
        selectedTime || undefined,
        notes.trim() || undefined,
        isPrimary,
        recurrence
      );
      
      onCancel();
      
      toast({
        title: editingTask ? "¡Tarea actualizada!" : "¡Tarea creada!",
        description: editingTask ? "Tu tarea ha sido actualizada exitosamente." : "Tu nueva tarea ha sido añadida exitosamente.",
      });
    } else {
      toast({
        title: "Error",
        description: "Por favor, escribe un nombre para la tarea.",
        variant: "destructive",
      });
    }
  };

  const getTagLabel = (tag: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra') => {
    switch (tag) {
      case 'productividad': return 'Trabajo';
      case 'creatividad': return 'Creatividad';
      case 'aprendizaje': return 'Aprendizaje';
      case 'organizacion': return 'Organización';
      case 'salud': return 'Salud';
      case 'social': return 'Social';
      case 'entretenimiento': return 'Entretenimiento';
      case 'extra': return 'Extra';
    }
  };

  // Formas geométricas por tag (círculos reemplazados por triángulos)
  const getTagIcon = (tag: 'productividad' | 'creatividad' | 'aprendizaje' | 'organizacion' | 'salud' | 'social' | 'entretenimiento' | 'extra') => {
    switch (tag) {
      case 'productividad':   return <ShapeIcon variant="square" className="w-6 h-6 mr-2 text-black" title="Trabajo" />;
      case 'creatividad':     return <ShapeIcon variant="triangle" className="w-6 h-6 mr-2 text-black" title="Creatividad" />;
      case 'aprendizaje':     return <ShapeIcon variant="triangle" className="w-6 h-6 mr-2 text-black" title="Aprendizaje" />;
      case 'organizacion':    return <ShapeIcon variant="diamond" className="w-6 h-6 mr-2 text-black" title="Organización" />;
      case 'salud':           return <ShapeIcon variant="heart" className="w-6 h-6 mr-2 text-black" title="Salud" />;
      case 'social':          return <ShapeIcon variant="triangle" className="w-6 h-6 mr-2 text-black" title="Social" />;
      case 'entretenimiento': return <ShapeIcon variant="triangle" className="w-6 h-6 mr-2 text-black" title="Entretenimiento" />;
      case 'extra':           return <ShapeIcon variant="square" className="w-6 h-6 mr-2 text-black" title="Extra" />;
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
            <Pointer size={20} className="text-white" strokeWidth={2} />
          </button>
          
          <button
            onClick={handleCreate}
            className="text-black hover:text-gray-600 transition-colors font-bold text-lg"
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
              className="w-full text-xl text-black placeholder-gray-400 border-none outline-none bg-transparent pr-6"
              autoFocus
            />
          </div>

          {/* Notes Input */}
          <div className="mb-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas"
              className="w-full text-base text-gray-600 placeholder-gray-400 border-none outline-none bg-transparent resize-none min-h-[44px]"
            />
          </div>

          {/* Mission Type removed by request */}
        </div>

        {/* Footer */}
        <div className="flex">
          {/* Date Section */}
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            aria-label="Fecha"
            title={selectedDate ? selectedDate.toLocaleDateString() : 'Seleccionar fecha'}
            className="flex-1 flex items-center justify-center py-4 text-black hover:text-black hover:bg-white transition-colors"
          >
            <Calendar size={24} className="text-black dark:text-white" />
          </button>
          
          {/* Repeat Section */}
          <button 
            onClick={() => setShowRepeatPicker(!showRepeatPicker)}
            aria-label="Repetir"
            title={recurrenceDaysOfWeek.length === 0 ? 'Configurar repetición' : ['D','L','M','M','J','V','S'].filter((_, idx) => recurrenceDaysOfWeek.includes(idx)).join(' ')}
            className="flex-1 flex items-center justify-center py-4 text-black hover:text-black hover:bg-white transition-colors"
          >
            <Repeat size={24} className="text-black dark:text-white" />
          </button>

          {/* Time Section */}
          <button 
            onClick={() => setShowTimePicker(!showTimePicker)}
            aria-label="Hora"
            title={selectedTime || 'Seleccionar hora'}
            className="flex-1 flex items-center justify-center py-4 text-black hover:text-black hover:bg-white transition-colors"
          >
            <Clock size={24} className="text-black dark:text-white" />
          </button>
          
          {/* Divider removed to make buttons seamless */}
          
          {/* Tag Section */}
          <button 
            onClick={() => setShowTagPicker(!showTagPicker)}
            aria-label="Categoría"
            title={getTagLabel(selectedTag)}
            className="flex-1 flex items-center justify-center py-4 text-black hover:text-black hover:bg-white transition-colors"
          >
            {getTagIcon(selectedTag)}
          </button>
        </div>

        {/* Date Picker */}
        {showDatePicker && (
          <div className="p-2 bg:white">
            <input
              type="date"
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                setSelectedDate(e.target.value ? new Date(e.target.value) : undefined);
                setShowDatePicker(false);
              }}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <div className="p-2 bg:white">
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => {
                setSelectedTime(e.target.value);
                setShowTimePicker(false);
              }}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        )}

        {/* Repeat Picker */}
        {showRepeatPicker && (
          <div className="p-2 bg:white">
            <div>
              <p className="text-base text-black mb-2 text-center">Seleccioná los días que se repite</p>
              <div className="grid grid-cols-7 gap-1">
                {['D','L','M','M','J','V','S'].map((label, idx) => {
                  const toggled = recurrenceDaysOfWeek.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setRecurrenceDaysOfWeek(prev => {
                          const next = prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx];
                          // auto-set frequency based on selection
                          setRecurrenceFrequency(next.length > 0 ? 'weekly' : 'none');
                          return next;
                        });
                      }}
                      className={`py-1 text-xs rounded border transition-colors
                        ${toggled 
                          ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                          : 'bg-white text-black border-gray-300 dark:bg-transparent dark:text-white dark:border-gray-500'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tag Picker */}
        {showTagPicker && (
          <div className="border-t border-gray-100 bg-white z-50">
            <div className="grid grid-cols-3 gap-2 p-3">
              {(['social', 'productividad', 'salud'] as const).map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(tag);
                    setShowTagPicker(false);
                  }}
                  className="flex items-center gap-2 px-2 py-2 min-h-[56px] hover:bg-gray-50 transition-colors rounded-lg border border-gray-300 hover:border-gray-400"
                >
                  {getTagIcon(tag)}
                  <span className="text-black text-base mr-2">{getTagLabel(tag)}</span>
                  {selectedTag === tag && (
                    <div className="ml-auto w-2 h-2 bg-black rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TaskCreationCard; 