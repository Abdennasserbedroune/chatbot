/**
 * Tests for language detection utilities
 */

// Mock franc-min
jest.mock('franc-min', () => ({
  franc: jest.fn((text: string) => {
    // Simple mock based on common words and patterns
    const lowerText = text.toLowerCase();
    
    // French patterns
    const frenchIndicators = [
      'bonjour', 'français', 'merci', 'quel', 'est', 'faire', 'aujourd',
      'ceci', 'définitivement', 'une', 'phrase', 'avec', 'plusieurs',
      'comment', 'allez', 'vous', 'voulez', 'savoir'
    ];
    
    // English patterns
    const englishIndicators = [
      'hello', 'english', 'thank', 'this', 'definitely', 'sentence',
      'many', 'words', 'what', 'weather', 'like', 'today', 'would'
    ];
    
    const frenchScore = frenchIndicators.filter(word => lowerText.includes(word)).length;
    const englishScore = englishIndicators.filter(word => lowerText.includes(word)).length;
    
    if (frenchScore > englishScore) {
      return 'fra';
    } else if (englishScore > 0) {
      return 'eng';
    }
    
    return 'und'; // undefined
  }),
}));

import {
  detectLanguage,
  detectLanguageWithConfidence,
  detectLanguageFromHistory,
} from '@/lib/languageDetection';

describe('Language Detection', () => {
  describe('detectLanguage', () => {
    it('should detect English text', () => {
      const lang = detectLanguage('Hello, this is a test message in English language');
      expect(lang).toBe('en');
    });

    it('should detect French text', () => {
      const lang = detectLanguage('Bonjour, ceci est un message de test en langue française');
      expect(lang).toBe('fr');
    });

    it('should default to English for empty text', () => {
      const lang = detectLanguage('');
      expect(lang).toBe('en');
    });

    it('should default to English for very short text', () => {
      const lang = detectLanguage('Hi');
      expect(lang).toBe('en');
    });

    it('should handle mixed content', () => {
      const lang = detectLanguage('Hello world bonjour monde');
      expect(['en', 'fr']).toContain(lang);
    });

    it('should detect English questions', () => {
      const lang = detectLanguage('What is the weather like today?');
      expect(lang).toBe('en');
    });

    it('should detect French questions', () => {
      const lang = detectLanguage('Quel temps fait-il aujourd\'hui?');
      expect(lang).toBe('fr');
    });
  });

  describe('detectLanguageWithConfidence', () => {
    it('should return confident detection for clear English', () => {
      const result = detectLanguageWithConfidence(
        'This is definitely an English sentence with many words'
      );
      expect(result.language).toBe('en');
    });

    it('should return confident detection for clear French', () => {
      const result = detectLanguageWithConfidence(
        'Ceci est définitivement une phrase française avec plusieurs mots'
      );
      expect(result.language).toBe('fr');
    });

    it('should return low confidence for short text', () => {
      const result = detectLanguageWithConfidence('Hi');
      expect(result.confident).toBe(false);
      expect(result.language).toBe('en');
    });

    it('should return low confidence for empty text', () => {
      const result = detectLanguageWithConfidence('');
      expect(result.confident).toBe(false);
      expect(result.language).toBe('en');
    });
  });

  describe('detectLanguageFromHistory', () => {
    it('should detect language from multiple messages', () => {
      const messages = [
        'Hello, how are you?',
        'I am doing well, thank you',
        'What would you like to know?',
      ];
      const lang = detectLanguageFromHistory(messages);
      expect(lang).toBe('en');
    });

    it('should detect French from conversation', () => {
      const messages = [
        'Bonjour, comment allez-vous?',
        'Je vais bien, merci',
        'Que voulez-vous savoir?',
      ];
      const lang = detectLanguageFromHistory(messages);
      expect(lang).toBe('fr');
    });

    it('should default to English for empty history', () => {
      const lang = detectLanguageFromHistory([]);
      expect(lang).toBe('en');
    });

    it('should use recent messages for detection', () => {
      const messages = [
        'Bonjour',
        'Salut',
        'Hello there, this is a longer English message',
        'This is another English message to ensure detection',
      ];
      const lang = detectLanguageFromHistory(messages);
      expect(lang).toBe('en');
    });

    it('should handle single message', () => {
      const lang = detectLanguageFromHistory(['This is a test message in English']);
      expect(lang).toBe('en');
    });
  });
});
