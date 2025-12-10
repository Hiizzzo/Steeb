import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getSteebEmotionImagePath, getStoredSteebEmotionImage, type SteebEmotion } from '@/utils/steebEmotions';

interface SteveAvatarProps {
  mood?: SteebEmotion | 'neutral' | 'logo';
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
  const normalizedMood: SteebEmotion = mood === 'neutral' || mood === 'logo' ? 'happy' : mood;
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const animations = animate ? 'animate-bounce-light' : '';

  const [avatarSrc, setAvatarSrc] = useState<string>(() => getStoredSteebEmotionImage(normalizedMood));

  useEffect(() => {
    const handler = () => {
      setAvatarSrc(getStoredSteebEmotionImage(normalizedMood));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handler);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handler);
      }
    };
  }, [normalizedMood]);

  useEffect(() => {
    setAvatarSrc(getStoredSteebEmotionImage(normalizedMood));
  }, [normalizedMood]);

  return (
    <div className={cn('flex items-center justify-center', sizeClasses[size], animations, className)}>
      <div className="relative w-full h-full">
        <img
          src={avatarSrc || getSteebEmotionImagePath(normalizedMood)}
          alt="Steeb"
          className="w-full h-full object-cover flex-shrink-0"
        />
      </div>
    </div>
  );
};

export default SteveAvatar;
