
import React, { useEffect, useState } from 'react';
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

  const fallbackImage = '/lovable-uploads/steve-thumbs-up-icon.png';
  const [avatarSrc, setAvatarSrc] = useState<string>(() => {
    if (typeof window === 'undefined') return fallbackImage;
    return localStorage.getItem('stebe-top-left-image') || fallbackImage;
  });

  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem('stebe-top-left-image');
      setAvatarSrc(stored || fallbackImage);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  
  return (
    <div className={cn('flex items-center justify-start', sizeClasses[size], animations, className)}>
      <img 
        src={avatarSrc}
        alt="Steve Avatar" 
        className="w-full h-full rounded-full object-cover flex-shrink-0"
      />
    </div>
  );
};

export default SteveAvatar;
