
import React, { useState } from 'react';
import { Lock, ChevronRight } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface ModalAddTaskProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (title: string, type: 'personal' | 'work' | 'meditation', subtasks?: SubTask[], scheduledDate?: string, scheduledTime?: string) => void;
}

const ModalAddTask: React.FC<ModalAddTaskProps> = ({ isOpen, onClose, onAddTask }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedList, setSelectedList] = useState('ToDo');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [hasDate, setHasDate] = useState(false);
  const [hasTime, setHasTime] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>(['']);

  const handleSubmit = () => {
    if (title.trim()) {
      const validSubtasks = subtasks
        .filter(s => s.trim())
        .map((s, index) => ({
          id: `${Date.now()}-${index}`,
          title: s.trim(),
          completed: false
        }));
      
      const scheduledDate = hasDate && selectedDate ? selectedDate.toISOString().split('T')[0] : undefined;
      
      // Map list to type for backward compatibility
      const taskType = selectedList === 'Work' ? 'work' : selectedList === 'Personal' ? 'personal' : 'work';
      
      onAddTask(
        title.trim(), 
        taskType, 
        validSubtasks.length > 0 ? validSubtasks : undefined, 
        scheduledDate,
        hasTime ? selectedTime : undefined
      );
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setSelectedList('ToDo');
    setSelectedDate(undefined);
    setSelectedTime('');
    setHasDate(false);
    setHasTime(false);
    setSubtasks(['']);
  };

  const addSubtask = () => {
    setSubtasks([...subtasks, '']);
  };

  const updateSubtask = (index: number, value: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = value;
    setSubtasks(newSubtasks);
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-gray-100 w-full sm:max-w-md h-[85vh] sm:h-auto sm:rounded-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 bg-gray-200/80 backdrop-blur-sm sm:rounded-t-2xl">
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-[#007AFF] text-lg"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Cancelar
          </button>
          <h2 className="text-lg font-semibold text-black" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
            Nuevo
          </h2>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className={cn(
              "text-lg font-medium",
              title.trim() ? "text-[#007AFF]" : "text-gray-400"
            )}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Listo
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Title Input */}
          <div className="px-4 py-3 border-b border-gray-200">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título"
              className="w-full text-lg placeholder-gray-400 focus:outline-none bg-transparent"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
              autoFocus
            />
          </div>

          {/* Notes with Lock Icon */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-start space-x-2">
              <Lock size={16} className="text-[#FFD700] mt-1" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas"
                className="flex-1 text-base placeholder-gray-400 focus:outline-none bg-transparent"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
              />
            </div>
            <div className="ml-6 mt-1">
              <span className="text-xs text-[#FFD700] font-medium">Premium</span>
            </div>
          </div>

          {/* Subtasks */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base text-gray-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                Subtareas
              </span>
              <button
                type="button"
                onClick={addSubtask}
                className="text-[#007AFF] text-sm"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
              >
                + Agregar
              </button>
            </div>
            <div className="space-y-2">
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-gray-400">•</span>
                  <input
                    type="text"
                    value={subtask}
                    onChange={(e) => updateSubtask(index, e.target.value)}
                    placeholder="Nueva subtarea..."
                    className="flex-1 text-base placeholder-gray-400 focus:outline-none bg-transparent py-1"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
                  />
                  {subtasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubtask(index)}
                      className="text-red-500 text-sm px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* List Selector */}
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 uppercase tracking-wide" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                Lista
              </span>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-[#007AFF] rounded-full"></div>
                  <span className="text-base text-black" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                    {selectedList}
                  </span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Due Date Section */}
          <div className="bg-gray-50 px-4 py-4">
            <div className="mb-4">
              <span className="text-sm text-gray-600 uppercase tracking-wide" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                Due Date
              </span>
            </div>

            {/* Date Toggle */}
            <div className="flex items-center justify-between py-3">
              <span className="text-base text-black" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                Fecha
              </span>
              <button
                onClick={() => {
                  setHasDate(!hasDate);
                  if (!hasDate && !selectedDate) {
                    setSelectedDate(new Date());
                  }
                }}
                className={cn(
                  "w-[51px] h-[31px] rounded-full transition-all relative",
                  hasDate ? "bg-[#34C759]" : "bg-gray-300"
                )}
              >
                <div
                  className={cn(
                    "absolute w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform top-[2px]",
                    hasDate ? "translate-x-[22px]" : "translate-x-[2px]"
                  )}
                />
              </button>
            </div>

            {/* Show date picker when date is enabled */}
            {hasDate && (
              <div className="py-2 border-t border-gray-200">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full text-left text-[#007AFF] text-base"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
                >
                  {selectedDate ? format(selectedDate, "EEEE, d MMMM yyyy") : "Seleccionar fecha"}
                </button>
                
                {showDatePicker && (
                  <div className="mt-2">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setShowDatePicker(false);
                      }}
                      className="rounded-md border"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Time Toggle */}
            <div className="flex items-center justify-between py-3 border-t border-gray-200">
              <span className="text-base text-black" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                Hora
              </span>
              <button
                onClick={() => {
                  setHasTime(!hasTime);
                  if (!hasTime && !selectedTime) {
                    const now = new Date();
                    setSelectedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
                  }
                }}
                className={cn(
                  "w-[51px] h-[31px] rounded-full transition-all relative",
                  hasTime ? "bg-[#34C759]" : "bg-gray-300"
                )}
              >
                <div
                  className={cn(
                    "absolute w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform top-[2px]",
                    hasTime ? "translate-x-[22px]" : "translate-x-[2px]"
                  )}
                />
              </button>
            </div>

            {/* Show time picker when time is enabled */}
            {hasTime && (
              <div className="py-2 border-t border-gray-200">
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full text-[#007AFF] text-base bg-transparent focus:outline-none"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalAddTask;
