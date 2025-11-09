/**
 * ErrorBanner Component
 * Displays error messages with retry and dismiss actions
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
  retryLabel?: string;
  dismissLabel?: string;
}

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  retryLabel = 'Retry',
  dismissLabel = 'Dismiss',
}: ErrorBannerProps): React.ReactElement {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">{message}</p>
            </div>
            <div className="flex-shrink-0 flex gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-xs font-medium text-red-700 hover:text-red-900 transition-colors"
                  aria-label={retryLabel}
                >
                  {retryLabel}
                </button>
              )}
              <button
                onClick={onDismiss}
                className="text-xs font-medium text-red-700 hover:text-red-900 transition-colors"
                aria-label={dismissLabel}
              >
                {dismissLabel}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
