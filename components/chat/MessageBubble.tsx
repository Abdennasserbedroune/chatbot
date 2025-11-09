import React from 'react';
import { motion } from 'framer-motion';
import type { MessageBubbleProps } from '@/types/chat';

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isTyping = false,
}) => {
  const isUser = message.role === 'user';

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
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Message bubble */}
      <div
        className={`message-bubble ${
          isUser ? 'user-bubble' : 'bot-bubble'
        } relative group`}
      >
        {/* Message content */}
        <p
          className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser ? 'text-white' : 'text-gray-800'
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
          className={`absolute -bottom-5 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ${
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