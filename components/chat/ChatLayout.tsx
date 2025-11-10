import React from 'react';
import { motion } from 'framer-motion';
import ChatHeader from './ChatHeader';
import type { ChatLayoutProps } from '@/types/chat';

export interface ExtendedChatLayoutProps extends ChatLayoutProps {
  title?: string;
  subtitle?: string;
  languageSwitcher?: React.ReactElement;
}

export const ChatLayout: React.FC<ExtendedChatLayoutProps> = ({
  children,
  className = '',
  title = 'Chat Assistant',
  subtitle = 'Always here to help',
  languageSwitcher,
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className="flex flex-col h-screen max-w-6xl mx-auto">
        {/* Header */}
        <ChatHeader 
          title={title}
          subtitle={subtitle}
          languageSwitcher={languageSwitcher}
        />

        {/* Main content */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800"
        >
          {children}
        </motion.main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Powered by Next.js & React
            </p>
            <div className="flex items-center gap-4">
              <button
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="Clear chat history"
              >
                Clear History
              </button>
              <button
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="Chat settings"
              >
                Settings
              </button>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};