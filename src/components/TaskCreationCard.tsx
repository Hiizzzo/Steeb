import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, Pointer } from 'lucide-react';

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
  type: 'personal' | 'work' | 'meditation';
  subgroup?:
    | 'productividad'
    | 'creatividad'
    | 'aprendizaje'
    | 'organizacion'
    | 'social'
    | 'salud'
    | 'entretenimiento'
    | 'extra';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  notes?: string;
  tags?: string[];
}

interface TaskCreationCardProps {
  onCancel: () => void;
  onCreate: (
    title: string,
    type: 'personal' | 'work' | 'meditation',
    subtasks?: SubTask[],
    scheduledDate?: string,
    scheduledTime?: string,
    notes?: string,
    isPrimary?: boolean,
    subgroup?:
      | 'productividad'
      | 'creatividad'
      | 'aprendizaje'
      | 'organizacion'
      | 'social'
      | 'salud'
      | 'entretenimiento'
      | 'extra'
  ) => void;
  editingTask?: Task | null;
}

const TaskCreationCard: React.FC<TaskCreationCardProps> = ({ onCancel, onCreate, editingTask }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<'personal' | 'work' | 'meditation'>('personal');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [showSubgroupPicker, setShowSubgroupPicker] = useState(false);
  const [selectedSubgroup, setSelectedSubgroup] = useState<
    | 'productividad'
    | 'creatividad'
    | 'aprendizaje'
    | 'organizacion'
    | 'social'
    | 'salud'
    | 'entretenimiento'
    | 'extra'
    | undefined
  >(undefined);
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
      // @ts-expect-error legacy tasks may not have subgroup
      setSelectedSubgroup(editingTask.subgroup);
    } else {
      // Resetear campos cuando se está creando una nueva tarea
      setTitle('');
      setNotes('');
      setSelectedTag('personal');
      setSelectedDate(undefined);
      setSelectedTime('');
      setIsPrimary(false);
      setSelectedSubgroup(undefined);
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
        isPrimary,
        selectedSubgroup
      });
      
      playButtonClickSound();
      
      const scheduledDate = selectedDate ? selectedDate.toISOString().split('T')[0] : undefined;
      
      console.log('📝 TaskCreationCard: Llamando a onCreate...');
      onCreate(
        title.trim(), 
        selectedTag, 
        undefined, // subtasks - not implemented in this simple version
        scheduledDate,
        selectedTime || undefined,
        notes.trim() || undefined,
        isPrimary,
        selectedSubgroup
      );
      
      // Cerrar el modal después de crear la tarea
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

  const getTagLabel = (tag: 'personal' | 'work' | 'meditation') => {
    switch (tag) {
      case 'personal': return 'Personal';
      case 'work': return 'Trabajo';
      case 'meditation': return 'Meditación';
    }
  };

  const getTagIcon = (tag: 'personal' | 'work' | 'meditation') => {
    switch (tag) {
      case 'personal': return <PersonalIcon />;
      case 'work': return <WorkIcon />;
      case 'meditation': return <MeditationIcon />;
    }
  };

  const subgroupOptions: Array<{
    key:
      | 'productividad'
      | 'creatividad'
      | 'aprendizaje'
      | 'organizacion'
      | 'social'
      | 'salud'
      | 'entretenimiento'
      | 'extra';
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: 'productividad', label: 'Productividad', icon: <div className="w-4 h-4 border border-black" /> },
    { key: 'creatividad', label: 'Creatividad', icon: <div className="w-4 h-4 border-2 border-black rotate-45" /> },
    { key: 'aprendizaje', label: 'Aprendizaje', icon: <div className="w-4 h-4 border border-black rounded" /> },
    { key: 'organizacion', label: 'Organización', icon: <div className="w-4 h-4 border-black border-l-4" /> },
    { key: 'social', label: 'Social', icon: <div className="w-4 h-4 border border-black rounded-full" /> },
    { key: 'salud', label: 'Salud', icon: <div className="w-4 h-4 border-black border-b-4" /> },
    { key: 'entretenimiento', label: 'Entretenimiento', icon: <div className="w-4 h-4 border border-black border-dashed" /> },
    { key: 'extra', label: 'Extra', icon: <div className="w-4 h-4 bg-black" /> },
  ];

  const getSelectedSubgroupLabel = () => {
    const found = subgroupOptions.find(o => o.key === selectedSubgroup);
    return found ? found.label : 'Subgrupo';
  };

  const getSelectedSubgroupIcon = () => {
    const found = subgroupOptions.find(o => o.key === selectedSubgroup);
    return found ? found.icon : <div className="w-4 h-4 border border-black" />;
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

          {/* Mission Type */}
          <div className="mb-4 flex items-center gap-2">
            <input
              id="isPrimary"
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 accent-black"
            />
            <label htmlFor="isPrimary" className="text-sm text-black">
              Marcar como misión principal
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex border-t border-gray-100">
          {/* Date Section */}
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex-1 flex items-center justify-center gap-2 py-4 text-black hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Calendar size={20} className="text-black" />
            <span className="font-medium">
              {selectedDate ? selectedDate.toLocaleDateString() : "Fecha ..."}
            </span>
          </button>
          
          {/* Time Section */}
          <button 
            onClick={() => setShowTimePicker(!showTimePicker)}
            className="flex-1 flex items-center justify-center gap-2 py-4 text-black hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Clock size={20} className="text-black" />
            <span className="font-medium">
              {selectedTime || "Hora ..."}
            </span>
          </button>
          
          {/* Divider */}
          <div className="w-px bg-gray-100"></div>
          
          {/* Tag Section */}
          <button 
            onClick={() => setShowTagPicker(!showTagPicker)}
            className="flex-1 flex items-center justify-center gap-2 py-4 text-black hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {getTagIcon(selectedTag)}
            <span className="font-medium">{getTagLabel(selectedTag)}</span>
          </button>
        </div>

        {/* Subgroup Selector Bar */}
        <div className="flex border-t border-gray-100">
          <button
            onClick={() => setShowSubgroupPicker(!showSubgroupPicker)}
            className="flex-1 flex items-center justify-center gap-2 py-4 text-black hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {getSelectedSubgroupIcon()}
            <span className="font-medium">{getSelectedSubgroupLabel()}</span>
          </button>
        </div>

        {/* Date Picker */}
        {showDatePicker && (
          <div className="border-t border-gray-100 p-4 bg-white">
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
          <div className="border-t border-gray-100 p-4 bg-white">
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
                {getTagIcon(tag)}
                <span className="text-black font-medium">{getTagLabel(tag)}</span>
                {selectedTag === tag && (
                  <div className="ml-auto w-2 h-2 bg-black rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Subgroup Picker */}
        {showSubgroupPicker && (
          <div className="border-t border-gray-100 bg-white">
            {subgroupOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setSelectedSubgroup(opt.key);
                  setShowSubgroupPicker(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                {opt.icon}
                <span className="text-black font-medium">{opt.label}</span>
                {selectedSubgroup === opt.key && (
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