import React from 'react';
import { motion } from 'framer-motion';
import { StatusBadge, detectMessageStatus } from './StatusBadge';
import type { MessageBubbleProps } from '@/types/chat';

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isTyping = false,
}) => {
  const isUser = message.role === 'user';
  const statusType = isUser ? 'conversational' : detectMessageStatus(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
      }}
      className={`flex items-start gap-2 px-4 py-2 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-green-500 to-teal-600 text-white'
            : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
        }`}
      >
        {isUser ? 'U' : 'AB'}
      </div>

      {/* Message bubble */}
      <div
        className={`message-bubble ${
          isUser ? 'user-bubble' : 'bot-bubble'
        } relative group max-w-[85%]`}
      >
        {/* Status badge for bot messages */}
        {!isUser && !isTyping && (
          <div className="absolute -top-2 -left-2 z-10">
            <StatusBadge type={statusType} size="sm" />
          </div>
        )}

        {/* Message content */}
        <p
          className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser ? 'text-white' : 'text-gray-800 dark:text-gray-200'
          }`}
        >
          {message.content}
        </p>

        {/* Typing indicator overlay */}
        {isTyping && (
          <motion.div
            className="absolute inset-0 flex items-center justify-end pr-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    isUser ? 'bg-white/70' : 'bg-gray-400'
                  }`}
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
          </motion.div>
        )}

        {/* Timestamp */}
        <div
          className={`absolute -bottom-5 text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity ${
            isUser ? 'right-12' : 'left-12'
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {/* Spacer for timestamp */}
      <div className="w-12 h-5" />
    </motion.div>
  );
};