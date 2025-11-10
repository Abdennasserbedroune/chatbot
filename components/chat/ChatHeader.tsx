/**
 * Chat Header Component
 * Includes title, subtitle, and dark mode toggle
 */

import type { ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ChatHeaderProps {
  title: string;
  subtitle: string;
  languageSwitcher?: ReactElement;
}

export default function ChatHeader({ title, subtitle, languageSwitcher }: ChatHeaderProps): ReactElement {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved preference or default to light mode
    const saved = localStorage.getItem('darkMode');
    if (saved) {
      setIsDark(saved === 'true');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    // Apply dark mode class to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-6 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {languageSwitcher}
            
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus-ring"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}