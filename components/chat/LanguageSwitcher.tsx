/**
 * LanguageSwitcher Component
 * Allows users to switch between English and French
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface LanguageSwitcherProps {
  currentLanguage: 'en' | 'fr';
  onLanguageChange: (language: 'en' | 'fr') => void;
}

export function LanguageSwitcher({
  currentLanguage,
  onLanguageChange,
}: LanguageSwitcherProps): React.ReactElement {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onLanguageChange('en')}
        className={`relative px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
          currentLanguage === 'en'
            ? 'text-gray-900'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-label="Switch to English"
        aria-pressed={currentLanguage === 'en'}
      >
        {currentLanguage === 'en' && (
          <motion.div
            layoutId="language-indicator"
            className="absolute inset-0 bg-white rounded-md shadow-sm"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10">EN</span>
      </button>
      <button
        onClick={() => onLanguageChange('fr')}
        className={`relative px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
          currentLanguage === 'fr'
            ? 'text-gray-900'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-label="Switch to French"
        aria-pressed={currentLanguage === 'fr'}
      >
        {currentLanguage === 'fr' && (
          <motion.div
            layoutId="language-indicator"
            className="absolute inset-0 bg-white rounded-md shadow-sm"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10">FR</span>
      </button>
    </div>
  );
}
