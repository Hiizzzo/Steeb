
import React from 'react';
import { cn } from '@/lib/utils';

interface SteveAvatarProps {
  mood?: 'happy' | 'angry' | 'neutral' | 'logo';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

const SteveAvatar: React.FC<SteveAvatarProps> = ({ 
  mood = 'happy', 
  size = 'md', 
  className,
  animate = false
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };
  
  const animations = animate ? 'animate-bounce-light' : '';
  
  // Ahora usamos la nueva imagen de Steve
  return (
    <div className={cn('flex items-center justify-start', sizeClasses[size], animations, className)}>
      <img 
        src="/lovable-uploads/1773de0b-514d-4336-b9b8-d7ffe17a6934.png" 
        alt="Steve Avatar" 
        className="w-full h-full rounded-full object-cover flex-shrink-0"
      />
    </div>
  );
};

export default SteveAvatar;
