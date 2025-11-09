import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    }, 30 + Math.random() * 40); // Random delay between 30-70ms

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
        AI
      </div>
      
      {/* Typing bubble */}
      <div className="message-bubble bot-bubble relative">
        {displayedText && (
          <span className="text-gray-800">{displayedText}</span>
        )}
        
        {/* Typing dots animation */}
        {!displayedText && (
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}
        
        {/* Cursor for typing animation */}
        {displayedText && displayedText.length < message.length && (
          <motion.span
            className="inline-block w-0.5 h-4 bg-gray-400 ml-1"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
};