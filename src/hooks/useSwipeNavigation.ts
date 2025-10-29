import { useState } from 'react';

interface SwipeNavigationConfig {
  threshold?: number;
  duration?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  onSwipe?: () => void;
  enableMouse?: boolean;
}

export const useSwipeNavigation = (config: SwipeNavigationConfig = {}) => {
  const [isSwiping] = useState(false);
  const [swipeProgress] = useState(0);

  const SwipeHandler = ({ children }: { children: any }) => children;

  return {
    SwipeHandler,
    isSwiping,
    swipeProgress,
  };
};
