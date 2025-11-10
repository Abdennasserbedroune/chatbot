/**
 * Typing Dots Component
 * Animated typing indicator with variable delays for natural feel
 */

import type { ReactElement } from 'react';
import { motion } from 'framer-motion';

interface TypingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function TypingDots({ 
  size = 'md', 
  color = 'currentColor',
  className = ''
}: TypingDotsProps): ReactElement {
  const sizeConfig = {
    sm: { dot: 'w-1 h-1', gap: 'gap-0.5' },
    md: { dot: 'w-1.5 h-1.5', gap: 'gap-1' },
    lg: { dot: 'w-2 h-2', gap: 'gap-1.5' },
  };

  const config = sizeConfig[size];

  // Variable delays for more natural animation
  const delays = [0, 0.15, 0.3];
  const durations = [1.2, 1.4, 1.1]; // Variable durations

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${config.dot} rounded-full`}
          style={{ backgroundColor: color }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: durations[index],
            repeat: Infinity,
            delay: delays[index],
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Enhanced Typing Indicator with streaming animation
 */
interface TypingIndicatorProps {
  isVisible: boolean;
  message?: string;
  showDots?: boolean;
}

export function EnhancedTypingIndicator({ 
  isVisible, 
  message = '',
  showDots = true 
}: TypingIndicatorProps): ReactElement | null {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
        AB
      </div>

      {/* Typing bubble */}
      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-sm">
        {message ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
            {showDots && <TypingDots size="sm" color="rgb(156 163 175)" />}
          </div>
        ) : (
          <TypingDots size="md" color="rgb(107 114 128)" />
        )}
      </div>
    </motion.div>
  );
}