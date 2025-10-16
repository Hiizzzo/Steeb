import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationEmojiProps {
  show: boolean;
  onComplete: () => void;
}

const CelebrationEmoji: React.FC<CelebrationEmojiProps> = ({ show, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const emojis = ['🎉', '✨', '🚀', '💪', '🔥', '⭐', '🎯', '🏆'];

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {emojis.map((emoji, index) => (
            <motion.div
              key={index}
              className="absolute text-4xl"
              initial={{ 
                scale: 0, 
                x: 0, 
                y: 0,
                opacity: 0 
              }}
              animate={{ 
                scale: [0, 1.2, 1],
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200,
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 2,
                delay: index * 0.1,
                ease: "easeOut"
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationEmoji; 