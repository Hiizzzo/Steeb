
import React, { useState } from 'react';
import { X, Pencil, Calendar, ShoppingCart, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  onAddTask: (title: string, type: 'personal' | 'work' | 'meditation', subtasks?: SubTask[], scheduledDate?: string) => void;
}

const ModalAddTask: React.FC<ModalAddTaskProps> = ({ isOpen, onClose, onAddTask }) => {
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<'personal' | 'work' | 'meditation'>('work');
  const [subtasks, setSubtasks] = useState<string[]>(['']);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const validSubtasks = subtasks
        .filter(s => s.trim())
        .map((s, index) => ({
          id: `${Date.now()}-${index}`,
          title: s.trim(),
          completed: false
        }));
      
      const scheduledDate = selectedDate.toISOString().split('T')[0];
      onAddTask(title.trim(), selectedType, validSubtasks.length > 0 ? validSubtasks : undefined, scheduledDate);
      setTitle('');
      setSubtasks(['']);
      setSelectedDate(new Date());
      onClose();
    }
  };

  const addSubtask = () => {
    setSubtasks([...subtasks, '']);
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const updateSubtask = (index: number, value: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = value;
    setSubtasks(newSubtasks);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-300 rounded-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Add New Task
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <X size={16} className="text-black" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input de texto */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task description..."
              className="w-full p-3 border border-gray-300 rounded-xl text-lg font-medium focus:outline-none focus:border-black"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              autoFocus
            />
          </div>

          {/* Selector de fecha */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Scheduled date:
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-gray-300 hover:bg-gray-50",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Selector de tipo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Task type:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'work', label: 'Work', icon: Pencil },
                { value: 'meditation', label: 'Meeting', icon: Calendar },
                { value: 'personal', label: 'Personal', icon: ShoppingCart }
              ].map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedType(option.value as any)}
                    className={`p-3 border border-gray-300 rounded-xl text-center transition-all flex flex-col items-center space-y-1 ${
                      selectedType === option.value 
                        ? 'bg-black text-white border-black' 
                        : 'bg-white text-black hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent size={20} />
                    <div className="text-xs font-medium" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      {option.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtareas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Subtasks (optional):
              </label>
              <button
                type="button"
                onClick={addSubtask}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border border-gray-300"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                + Add
              </button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">▸</span>
                  <input
                    type="text"
                    value={subtask}
                    onChange={(e) => updateSubtask(index, e.target.value)}
                    placeholder="Enter subtask..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  />
                  {subtasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubtask(index)}
                      className="text-gray-400 hover:text-red-500 text-sm px-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3 border border-gray-300 rounded-xl font-medium text-black bg-white hover:bg-gray-50 transition-colors"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 p-3 rounded-xl font-medium text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalAddTask;
