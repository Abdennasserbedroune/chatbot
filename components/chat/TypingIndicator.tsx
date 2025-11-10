import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TypingDots } from './TypingDots';
import type { TypingIndicatorProps } from '@/types/chat';

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible,
  message = '',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isVisible || !message) {
      setDisplayedText('');
      setCurrentIndex(0);
      return;
    }

    const interval = setInterval(() => {
      if (currentIndex < message.length) {
        setDisplayedText((prev) => prev + message[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      } else {
        clearInterval(interval);
      }
    }, 25 + Math.random() * 35); // Variable delay between 25-60ms for more natural feel

    return () => clearInterval(interval);
  }, [isVisible, message, currentIndex]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-2 px-4 py-2"
    >
      {/* Bot avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
        AB
      </div>
      
      {/* Typing bubble */}
      <div className="message-bubble bot-bubble relative">
        {displayedText && (
          <span className="text-gray-800 dark:text-gray-200">{displayedText}</span>
        )}
        
        {/* Typing dots animation using new component */}
        {!displayedText && (
          <TypingDots size="md" color="rgb(156 163 175)" />
        )}
        
        {/* Cursor for typing animation */}
        {displayedText && displayedText.length < message.length && (
          <motion.span
            className="inline-block w-0.5 h-4 bg-gray-400 dark:bg-gray-500 ml-1"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
};