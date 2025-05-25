
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
  
  // Ahora siempre usamos la imagen de Steve
  return (
    <div className={cn('flex flex-col justify-center', sizeClasses[size], animations, className)}>
      <img 
        src="/lovable-uploads/1b99faf8-ba83-48b1-bd88-78b3a1b8b3e6.png" 
        alt="Steve Avatar" 
        className="w-full h-full rounded-full object-cover"
      />
    </div>
  );
};

export default SteveAvatar;
