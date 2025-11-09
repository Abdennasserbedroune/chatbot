/**
 * Internationalization (i18n) utilities
 * Provides translations for UI elements
 */

import type { SupportedLanguage } from './languageDetection';

export interface TranslationKeys {
  chatTitle: string;
  chatPlaceholder: string;
  typingIndicator: string;
  sendButton: string;
  clearButton: string;
  errorTitle: string;
  errorRetry: string;
  errorDismiss: string;
  rateLimitError: string;
  apiError: string;
  networkError: string;
  languageSwitcher: string;
  switchToEnglish: string;
  switchToFrench: string;
}

const translations: Record<SupportedLanguage, TranslationKeys> = {
  en: {
    chatTitle: 'Chat Assistant',
    chatPlaceholder: 'Type your message...',
    typingIndicator: 'Assistant is typing...',
    sendButton: 'Send',
    clearButton: 'Clear chat',
    errorTitle: 'Error',
    errorRetry: 'Retry',
    errorDismiss: 'Dismiss',
    rateLimitError: 'Too many requests. Please wait a moment and try again.',
    apiError: 'Unable to connect to the AI service. Please try again later.',
    networkError: 'Network error. Please check your connection and try again.',
    languageSwitcher: 'Language',
    switchToEnglish: 'English',
    switchToFrench: 'Français',
  },
  fr: {
    chatTitle: 'Assistant de chat',
    chatPlaceholder: 'Tapez votre message...',
    typingIndicator: "L'assistant tape...",
    sendButton: 'Envoyer',
    clearButton: 'Effacer le chat',
    errorTitle: 'Erreur',
    errorRetry: 'Réessayer',
    errorDismiss: 'Fermer',
    rateLimitError: 'Trop de requêtes. Veuillez patienter un moment et réessayer.',
    apiError: "Impossible de se connecter au service d'IA. Veuillez réessayer plus tard.",
    networkError: 'Erreur réseau. Veuillez vérifier votre connexion et réessayer.',
    languageSwitcher: 'Langue',
    switchToEnglish: 'English',
    switchToFrench: 'Français',
  },
};

/**
 * Gets translation for a specific key
 */
export function t(key: keyof TranslationKeys, language: SupportedLanguage): string {
  return translations[language][key];
}

/**
 * Gets all translations for a language
 */
export function getTranslations(language: SupportedLanguage): TranslationKeys {
  return translations[language];
}

/**
 * Hook-like function to get translations (for use in components)
 */
export function useTranslations(language: SupportedLanguage) {
  return {
    t: (key: keyof TranslationKeys) => t(key, language),
    translations: getTranslations(language),
  };
}
