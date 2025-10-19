import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, Pointer, Repeat, X } from 'lucide-react';
import ShapeIcon from "./ShapeIcon";
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
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
  const { currentTheme } = useTheme();
  
  // Debug: Log theme when component mounts
  useEffect(() => {
    console.log('🎨 TaskCreationCard: currentTheme =', currentTheme);
    console.log('🎨 TaskCreationCard: document classes =', document.documentElement.className);
    console.log('🎨 TaskCreationCard: localStorage theme =', localStorage.getItem('stebe-theme'));
  }, [currentTheme]);
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
  const { isAuthenticated, user } = useAuth();

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
    // Verificar autenticación antes de crear tareas
    if (!isAuthenticated || !user) {
      toast({
        title: "Se requiere autenticación",
        description: "Debes iniciar sesión para crear tareas",
        variant: "destructive"
      });
      return;
    }

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
              ...(recurrenceFrequency === 'weekly' && recurrenceDaysOfWeek.length > 0 && { daysOfWeek: recurrenceDaysOfWeek }),
              ...(recurrenceEndDate && { endDate: recurrenceEndDate }),
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
    
    // Color del ícono según tema/selección
    // - En tema claro: íconos negros (fondo blanco del div)
    // - En tema oscuro: íconos blancos (para mejor visibilidad)
    // Forzamos el color para evitar problemas de inicialización
    const themeIconColor = currentTheme === 'light' ? '#000000' : '#FFFFFF';
    const iconColor = themeIconColor; // Simplificamos para evitar problemas de estado
    
    switch (tag) {
      case 'productividad':   return wrap(
        <span
          title="Trabajo"
          aria-label="Trabajo"
          className="block rounded-[3px] outline outline-2"
          style={{ 
            width: 20, 
            height: 20, 
            backgroundColor: `${iconColor} !important`,
            outlineColor: `${iconColor} !important`
          }}
        />
      );
      case 'salud':           return wrap(
        <svg
          viewBox="0 0 24 24"
          aria-label="Salud"
          role="img"
          style={{ width: 28, height: 28, color: iconColor }}
          className="task-category-icon"
        >
          <path fill={iconColor} style={{ fill: `${iconColor} !important`, color: `${iconColor} !important` }} d="M12 21s-6.716-4.35-9.193-7.36C.953 10.545 2.097 6.5 5.293 5.364 7.162 4.688 9.21 5.29 10.5 6.7 11.79 5.29 13.838 4.688 15.707 5.364c3.196 1.136 4.34 5.181 2.486 8.276C18.716 16.65 12 21 12 21z"/>
        </svg>
      );
      case 'social':          return wrap(
        <svg
          viewBox="0 0 24 24"
          aria-label="Social"
          role="img"
          style={{ width: 28, height: 28, color: iconColor }}
          className="task-category-icon"
        >
          <path fill={iconColor} style={{ fill: `${iconColor} !important`, color: `${iconColor} !important` }} d="M12 3l9 18H3l9-18z"/>
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
      className="task-creation-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
    >
      <div className={`task-creation-modal w-full max-w-md rounded-[18px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden bg-white border-2 border-black shiny-task-card`}>
        {/* Header */}
        <div className={`flex items-start justify-between px-4 py-4 border-b-2 border-black task-card-header`}>
          <button
            onClick={onCancel}
            className="transition-colors flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-white hover:bg-gray-100"
          >
            <X size={24} strokeWidth={2} className="text-black" />
          </button>

          <button
            onClick={handleCreate}
            className={`transition-colors font-bold text-lg ${
              currentTheme === 'light' ? 'text-black hover:text-black' : 'text-white hover:text-white'
            }`}
            style={{
              background: 'none !important',
              border: 'none !important',
              boxShadow: 'none !important'
            }}
          >
            Crear
          </button>
        </div>

        {/* Shiny: horizontal rainbow divider under header */}
        <div className="shiny-divider-h hidden mx-6" aria-hidden></div>

        {/* Main Content */}
        <div className="p-4">
          {/* Task Name Input */}
          <div className="mb-4">
            <h2 className={`text-2xl font-bold mb-3 ${
              currentTheme === 'light' ? 'text-black' : 'text-white'
            }`}>
              Nombre de la tarea
            </h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre de la tarea"
              className={`w-full text-xl border-none outline-none bg-transparent pr-6 ${
                currentTheme === 'light'
                  ? 'text-black placeholder-gray-400'
                  : 'text-white placeholder-gray-500'
              }`}
              style={{
                border: 'none !important',
                outline: 'none !important',
                boxShadow: 'none !important',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
              autoFocus
            />
          </div>

          {/* Notes Input */}
          <div className="mb-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas"
              className={`w-full text-base border-none outline-none bg-transparent resize-none min-h-[44px] ${
                currentTheme === 'light'
                  ? 'text-gray-600 placeholder-gray-400'
                  : 'text-gray-300 placeholder-gray-500'
              }`}
              style={{
                border: 'none !important',
                outline: 'none !important',
                boxShadow: 'none !important',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            />
          </div>

          {/* Mission Type removed by request */}
        </div>

        {/* Footer */}
        <div className="flex relative">
          {/* Date Section */}
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            aria-label="Fecha"
            title={selectedDate ? selectedDate.toLocaleDateString() : 'Seleccionar fecha'}
            className={`shiny-footer-btn is-multi flex-1 flex items-center justify-center h-16 transition-colors border-r-2 border-black ${
              currentTheme === 'light'
                ? 'bg-white text-black hover:bg-gray-100'
                : 'text-white hover:text-white hover:bg-gray-700'
            }`}
          >
            <Calendar size={28} />
          </button>

          {/* Repeat Section */}
          <button
            onClick={() => setShowRepeatPicker(!showRepeatPicker)}
            aria-label="Repetir"
            title={recurrenceDaysOfWeek.length === 0 ? 'Configurar repetición' : ['D','L','M','M','J','V','S'].filter((_, idx) => recurrenceDaysOfWeek.includes(idx)).join(' ')}
            className={`shiny-footer-btn is-multi flex-1 flex items-center justify-center h-16 transition-colors border-r-2 border-black ${
              currentTheme === 'light'
                ? 'bg-white text-black hover:bg-gray-100'
                : 'text-white hover:text-white hover:bg-gray-700'
            }`}
          >
            <Repeat size={28} />
          </button>

          {/* Time Section */}
          <button
            onClick={() => setShowTimePicker(!showTimePicker)}
            aria-label="Hora"
            title={selectedTime || 'Seleccionar hora'}
            className={`shiny-footer-btn is-multi flex-1 flex items-center justify-center h-16 transition-colors border-r-2 border-black ${
              currentTheme === 'light'
                ? 'bg-white text-black hover:bg-gray-100'
                : 'text-white hover:text-white hover:bg-gray-700'
            }`}
          >
            <Clock size={28} />
          </button>

          {/* Divider removed to make buttons seamless */}

          {/* Tag Section */}
          <button
            onClick={() => setShowTagPicker(!showTagPicker)}
            aria-label="Categoría"
            title={getTagLabel(selectedTag)}
            className={`shiny-footer-btn is-multi flex-1 flex items-center justify-center h-16 transition-colors ${
              currentTheme === 'light'
                ? 'bg-white text-black hover:bg-gray-100'
                : 'text-white hover:text-white hover:bg-gray-700'
            }`}
          >
            {getTagIcon(selectedTag, true)}
          </button>

          {/* Shiny: vertical rainbow dividers overlay between categories */}
          <div className="pointer-events-none absolute inset-0 z-10 hidden shiny-v-lines" aria-hidden>
            <div className="shiny-divider-v absolute top-0 bottom-0" style={{ left: '25%' }}></div>
            <div className="shiny-divider-v absolute top-0 bottom-0" style={{ left: '50%' }}></div>
            <div className="shiny-divider-v absolute top-0 bottom-0" style={{ left: '75%' }}></div>
          </div>
        </div>

        {/* Date Picker */}
        {showDatePicker && (
          <div className={`picker-panel p-3 ${
            currentTheme === 'light' ? 'bg-white' : 'bg-gray-800'
          }`}>
            <input
              type="date"
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                setSelectedDate(e.target.value ? new Date(e.target.value) : undefined);
                setShowDatePicker(false);
              }}
              className={`w-full h-11 px-4 rounded-2xl border focus:outline-none focus:ring-2 ${
                currentTheme === 'light' 
                  ? 'border-black/15 bg-white text-black focus:ring-black/10' 
                  : 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500'
              }`}
            />
          </div>
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <div className={`picker-panel p-3 ${
            currentTheme === 'light' ? 'bg-white' : 'bg-gray-800'
          }`}>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => {
                setSelectedTime(e.target.value);
                setShowTimePicker(false);
              }}
              className={`w-full h-11 px-4 rounded-2xl border focus:outline-none focus:ring-2 ${
                currentTheme === 'light' 
                  ? 'border-black/15 bg-white text-black focus:ring-black/10' 
                  : 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500'
              }`}
            />
          </div>
        )}

        {/* Repeat Picker */}
        {showRepeatPicker && (
          <div className={`picker-panel p-2 ${
            currentTheme === 'light' ? 'bg-white' : 'bg-gray-800'
          }`}>
            <div>
              <p className={`text-base mb-2 text-center ${
                currentTheme === 'light' ? 'text-black' : 'text-white'
              }`}>Seleccioná los días que se repite</p>
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
                      className={`repeat-day-btn ${toggled ? 'is-on' : ''} py-1 text-xs rounded border transition-colors ${
                        toggled 
                          ? (currentTheme === 'light' 
                              ? 'bg-black text-white border-black' 
                              : 'bg-white text-black border-white')
                          : (currentTheme === 'light' 
                              ? 'bg-white text-black border-gray-300' 
                              : 'bg-transparent text-white border-gray-500')
                      }`}
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
          <div className={`picker-panel border-t z-50 ${
            currentTheme === 'light' 
              ? 'border-gray-100 bg-black' 
              : 'border-gray-700 bg-gray-800'
          }`}>
            <div className="grid grid-cols-3 gap-2 p-3">
              {(['social', 'productividad', 'salud'] as const).map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(tag);
                    setShowTagPicker(false);
                  }}
                  className={`tag-btn ${selectedTag === tag ? 'is-on' : ''} flex items-center gap-1 px-1.5 py-3 min-h-[60px] transition-colors rounded-lg border whitespace-nowrap overflow-visible ${
                    selectedTag === tag
                      ? (currentTheme === 'light' 
                          ? 'bg-white text-black border-white' 
                          : 'bg-white text-black border-white')
                      : (currentTheme === 'light' 
                          ? 'bg-transparent text-white border-white/30 hover:bg-white/10'
                          : 'bg-transparent text-white border-white/30 hover:bg-white/10')
                  }`}
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