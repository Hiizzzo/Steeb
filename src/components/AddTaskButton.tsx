
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AddTaskButtonProps {
  onClick: () => void;
}

const AddTaskButton: React.FC<AddTaskButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-6 right-6 z-20">
      <Button 
        onClick={onClick}
        className="w-14 h-14 rounded-full gradient-bg-button flex items-center justify-center shadow-lg"
      >
        <Plus size={24} color="white" />
      </Button>
    </div>
  );
};

export default AddTaskButton;
