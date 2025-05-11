
import React from 'react';
import { cn } from '@/lib/utils';

interface SteveAvatarProps {
  mood?: 'happy' | 'angry' | 'neutral';
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
  
  // Diferentes expresiones para Steve basado en su estado de ánimo
  const renderFace = () => {
    switch(mood) {
      case 'happy':
        return (
          <>
            <div className="eyes flex justify-center space-x-5 pt-4">
              <div className="eye w-3 h-3 bg-steve-black rounded-full"></div>
              <div className="eye w-3 h-3 bg-steve-black rounded-full"></div>
            </div>
            <div className="mouth mt-2 w-10 h-4 mx-auto border-b-2 border-steve-black rounded-b-full"></div>
          </>
        );
      case 'angry':
        return (
          <>
            <div className="eyes flex justify-center space-x-5 pt-4">
              <div className="eye-left flex flex-col items-center">
                <div className="eyebrow w-4 h-1 bg-steve-black -rotate-45 mb-1"></div>
                <div className="eye w-3 h-3 bg-steve-black rounded-full"></div>
              </div>
              <div className="eye-right flex flex-col items-center">
                <div className="eyebrow w-4 h-1 bg-steve-black rotate-45 mb-1"></div>
                <div className="eye w-3 h-3 bg-steve-black rounded-full"></div>
              </div>
            </div>
            <div className="mouth mt-3 w-8 h-3 mx-auto border-t-2 border-steve-black rounded-t-full"></div>
          </>
        );
      default: // neutral
        return (
          <>
            <div className="eyes flex justify-center space-x-5 pt-4">
              <div className="eye w-3 h-3 bg-steve-black rounded-full"></div>
              <div className="eye w-3 h-3 bg-steve-black rounded-full"></div>
            </div>
            <div className="mouth mt-3 w-8 h-1 mx-auto bg-steve-black"></div>
          </>
        );
    }
  };
  
  return (
    <div 
      className={cn(
        'flex flex-col justify-center', 
        sizeClasses[size],
        animations,
        className
      )}
    >
      <div className="steve-head bg-steve-white steve-border p-2 rounded-full">
        {renderFace()}
      </div>
    </div>
  );
};

export default SteveAvatar;
