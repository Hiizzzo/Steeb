
import React from 'react';
import { Card } from '@/components/ui/card';
import SteveAvatar from '@/components/SteveAvatar';
import { cn } from '@/lib/utils';

interface SteveMessageProps {
  message: string;
  mood?: 'happy' | 'angry' | 'neutral';
  className?: string;
}

const SteveMessage: React.FC<SteveMessageProps> = ({ 
  message, 
  mood = 'happy',
  className
}) => {
  return (
    <div className={cn('flex items-start gap-3 my-4', className)}>
      <SteveAvatar mood={mood} size="sm" />
      
      <Card className="steve-border bg-steve-white p-3 flex-1 relative">
        <div className="absolute left-[-8px] top-4 w-3 h-3 bg-steve-white border-l-2 border-b-2 border-steve-black transform rotate-45"></div>
        <p className="text-sm">{message}</p>
      </Card>
    </div>
  );
};

export default SteveMessage;
