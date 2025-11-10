import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip } from 'lucide-react';
import type { ChatComposerProps } from '@/types/chat';

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea with better limits
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 48), 160)}px`;
    }
  }, [message]);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
    >
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div
          className={`relative rounded-2xl border transition-all duration-200 ${
            isFocused
              ? 'border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/10 dark:shadow-blue-400/10'
              : 'border-gray-300 dark:border-gray-600'
          } ${disabled ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-800'}`}
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className={`
              w-full px-4 py-3 pr-24 bg-transparent border-0 rounded-2xl
              focus:outline-none focus:ring-0 resize-none
              text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
              disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed
              max-h-[160px] min-h-[48px]
            `}
            aria-label="Message input"
          />

          {/* Action buttons */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {/* Attachment button (placeholder for future functionality) */}
            <button
              type="button"
              disabled={disabled}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200
                text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-700
                disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Attach file"
              title="Attach file (coming soon)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Send button */}
            <button
              type="submit"
              disabled={!message.trim() || disabled}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200
                ${
                  message.trim() && !disabled
                    ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }
              `}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Enter</kbd> to send,{' '}
            <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Shift+Enter</kbd> for new line
          </p>
        </div>
      </form>
    </motion.div>
  );
};