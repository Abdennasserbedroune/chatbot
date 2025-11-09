import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ChatComposerProps } from '@/types/chat';

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

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
      className="border-t border-gray-200 bg-white p-4"
    >
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div
          className={`relative rounded-2xl border transition-all duration-200 ${
            isFocused
              ? 'border-blue-500 shadow-lg shadow-blue-500/10'
              : 'border-gray-300'
          } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
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
              w-full px-4 py-3 pr-12 bg-transparent border-0 rounded-2xl
              focus:outline-none focus:ring-0 resize-none
              text-gray-900 placeholder-gray-500
              disabled:text-gray-400 disabled:cursor-not-allowed
              max-h-[120px] min-h-[48px]
            `}
            aria-label="Message input"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className={`
              absolute right-2 bottom-2 w-8 h-8 rounded-full
              flex items-center justify-center transition-all duration-200
              ${
                message.trim() && !disabled
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
            aria-label="Send message"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {/* Helper text */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            Press <kbd className="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">Enter</kbd> to send,{' '}
            <kbd className="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">Shift+Enter</kbd> for new line
          </p>
        </div>
      </form>
    </motion.div>
  );
};