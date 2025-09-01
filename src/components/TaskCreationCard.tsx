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
  type: 'productividad' | 'social' | 'salud';
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
    type: 'productividad' | 'social' | 'salud',
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
  const [selectedTag, setSelectedTag] = useState<'productividad' | 'social' | 'salud'>('productividad');
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

  const getTagLabel = (tag: 'productividad' | 'social' | 'salud') => {
    switch (tag) {
      case 'productividad': return 'Trabajo';
      case 'salud': return 'Salud';
      case 'social': return 'Social';
    }
  };

  // Formas geométricas por tag con tamaños fijos (evita variaciones por fuentes)
  const getTagIcon = (tag: 'productividad' | 'social' | 'salud', isSelected = false) => {
    const wrap = (node: React.ReactNode) => (
      <span className="inline-grid place-items-center w-7 h-7 mr-1 shrink-0" style={{ width: 28, height: 28 }}>
        {node}
      </span>
    );
    
    // Set all icons to white
    const iconColor = 'white';
    const bgColor = 'white';
    const outlineColor = 'white';
    
    switch (tag) {
      case 'productividad':   return wrap(
        <span
          title="Trabajo"
          aria-label="Trabajo"
          className="block rounded-[3px] outline outline-2"
          style={{ 
            width: 20, 
            height: 20, 
            backgroundColor: bgColor,
            outlineColor: outlineColor
          }}
        />
      );
      case 'salud':           return wrap(
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-label="Salud"
          role="img"
          style={{ width: 28, height: 28, color: iconColor }}
        >
          <path fill="white" d="M12 21s-6.716-4.35-9.193-7.36C.953 10.545 2.097 6.5 5.293 5.364 7.162 4.688 9.21 5.29 10.5 6.7 11.79 5.29 13.838 4.688 15.707 5.364c3.196 1.136 4.34 5.181 2.486 8.276C18.716 16.65 12 21 12 21z"/>
        </svg>
      );
      case 'social':          return wrap(
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-label="Social"
          role="img"
          style={{ width: 28, height: 28, color: iconColor }}
        >
          <path fill="white" d="M12 3l9 18H3l9-18z"/>
        </svg>
      );
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
            className="flex items-center justify-center w-10 h-10 bg-white text-black border border-black rounded-full hover:bg-gray-100 transition-colors"
          >
            <Pointer size={20} className="text-black" strokeWidth={2} />
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
            className="flex-1 flex items-center justify-center h-16 text-black dark:text-white hover:text-black hover:bg-white transition-colors"
          >
            <Calendar size={28} className="text-black dark:text-white" />
          </button>
          
          {/* Repeat Section */}
          <button 
            onClick={() => setShowRepeatPicker(!showRepeatPicker)}
            aria-label="Repetir"
            title={recurrenceDaysOfWeek.length === 0 ? 'Configurar repetición' : ['D','L','M','M','J','V','S'].filter((_, idx) => recurrenceDaysOfWeek.includes(idx)).join(' ')}
            className="flex-1 flex items-center justify-center h-16 text-black dark:text-white hover:text-black hover:bg-white transition-colors"
          >
            <Repeat size={28} className="text-black dark:text-white" />
          </button>

          {/* Time Section */}
          <button 
            onClick={() => setShowTimePicker(!showTimePicker)}
            aria-label="Hora"
            title={selectedTime || 'Seleccionar hora'}
            className="flex-1 flex items-center justify-center h-16 text-black dark:text-white hover:text-black hover:bg-white transition-colors"
          >
            <Clock size={28} className="text-black dark:text-white" />
          </button>
          
          {/* Divider removed to make buttons seamless */}
          
          {/* Tag Section */}
          <button 
            onClick={() => setShowTagPicker(!showTagPicker)}
            aria-label="Categoría"
            title={getTagLabel(selectedTag)}
            className="flex-1 flex items-center justify-center h-16 bg-white text-black rounded-none transition-colors"
          >
            {getTagIcon(selectedTag)}
          </button>
        </div>

        {/* Date Picker */}
        {showDatePicker && (
          <div className="p-3 bg-white">
            <input
              type="date"
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                setSelectedDate(e.target.value ? new Date(e.target.value) : undefined);
                setShowDatePicker(false);
              }}
              className="w-full h-11 px-4 rounded-2xl border border-black/15 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <div className="p-3 bg-white">
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => {
                setSelectedTime(e.target.value);
                setShowTimePicker(false);
              }}
              className="w-full h-11 px-4 rounded-2xl border border-black/15 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/10"
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
                  className={`flex items-center gap-1 px-1.5 py-3 min-h-[60px] transition-colors rounded-lg border whitespace-nowrap overflow-visible
                    ${selectedTag === tag
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                      : 'bg-white text-black border-black hover:bg-gray-100 dark:bg-transparent dark:text-white dark:border-white/30 hover:dark:bg-white/10'}`}
                >
                  {getTagIcon(tag, selectedTag === tag)}
                  <span className="text-base font-medium">{getTagLabel(tag)}</span>
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