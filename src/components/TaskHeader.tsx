
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TaskHeader: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <header className="pt-6 pb-4 px-6 relative z-10">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          className="p-0 mr-3"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-4xl font-bold">Mis Tareas</h1>
      </div>
    </header>
  );
};

export default TaskHeader;
