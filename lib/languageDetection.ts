/**
 * Language Detection Utilities
 * Detects language using franc-min and provides fallbacks
 */

import { franc } from 'franc-min';

export type SupportedLanguage = 'en' | 'fr';

/**
 * Language codes mapping
 */
const LANGUAGE_CODES: Record<string, SupportedLanguage> = {
  eng: 'en',
  fra: 'fr',
};

/**
 * Detects language from text using franc-min
 * Returns 'en' or 'fr', with fallback to 'en' for uncertain cases
 */
export function detectLanguage(text: string): SupportedLanguage {
  // Handle empty or very short text
  if (!text || text.trim().length < 10) {
    return 'en'; // Default to English
  }

  // Use franc to detect language
  const detected = franc(text);

  // Map to supported language or default to English
  return LANGUAGE_CODES[detected] || 'en';
}

/**
 * Detects language with confidence score
 */
export function detectLanguageWithConfidence(
  text: string
): { language: SupportedLanguage; confident: boolean } {
  if (!text || text.trim().length < 10) {
    return { language: 'en', confident: false };
  }

  const detected = franc(text);
  const language = LANGUAGE_CODES[detected] || 'en';
  const confident = detected !== 'und' && detected in LANGUAGE_CODES;

  return { language, confident };
}

/**
 * Detects language from conversation history
 * Uses multiple messages to improve accuracy
 */
export function detectLanguageFromHistory(messages: string[]): SupportedLanguage {
  if (messages.length === 0) {
    return 'en';
  }

  // Combine recent messages for better detection
  const combinedText = messages.slice(-3).join(' ');
  return detectLanguage(combinedText);
}
