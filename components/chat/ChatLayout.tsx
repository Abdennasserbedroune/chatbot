import React from 'react';
import { motion } from 'framer-motion';
import type { ChatLayoutProps } from '@/types/chat';

export const ChatLayout: React.FC<ChatLayoutProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}>
      <div className="flex flex-col h-screen max-w-6xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo/Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-md">
                AI
              </div>
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Chat Assistant
                </h1>
                <p className="text-sm text-gray-500">
                  Always here to help
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">Online</span>
            </div>
          </div>
        </motion.header>

        {/* Main content */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {children}
        </motion.main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border-t border-gray-200 px-4 py-2"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Powered by Next.js & React
            </p>
            <div className="flex items-center gap-4">
              <button
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Clear chat history"
              >
                Clear History
              </button>
              <button
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
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