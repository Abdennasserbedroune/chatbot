import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import type { MessageListProps } from '@/types/chat';

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping = false,
  typingMessage = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScrollRef.current && scrollRef.current) {
      const scrollContainer = scrollRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, isTyping, typingMessage]);

  // Handle manual scroll to disable auto-scroll temporarily
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
      autoScrollRef.current = isAtBottom;
    }
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto custom-scrollbar px-2 py-4 space-y-1"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
      aria-atomic="false"
    >
      {/* Welcome message if no messages */}
      {messages.length === 0 && !isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-full text-center px-4 py-8"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-medium shadow-lg mb-6 dark:from-blue-600 dark:to-purple-700">
            AB
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Welcome! I'm Abdennasser
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6 text-balance">
            I bridge law, technology, and data. Feel free to ask me about my background, projects, or anything else you're curious about!
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Tell me about yourself",
              "What projects have you built?",
              "Your background in law",
              "How do you bridge tech and law?"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  // This will be handled by the parent component
                  const event = new CustomEvent('suggestionClick', { detail: suggestion });
                  window.dispatchEvent(event);
                }}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus-ring"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Message list */}
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.2,
              delay: index * 0.05,
            }}
          >
            <MessageBubble
              message={message}
              isTyping={isTyping && index === messages.length - 1}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      <AnimatePresence>
        {isTyping && typingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <TypingIndicator isVisible={isTyping} message={typingMessage} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for scroll padding */}
      <div className="h-4" />
    </div>
  );
};