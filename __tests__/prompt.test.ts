/**
 * Tests for prompt builder utilities
 */

import {
  findRelevantEntries,
  buildSystemPrompt,
  buildChatMessages,
  needsClarification,
  generateClarificationPrompt,
  DEFAULT_PROMPT_CONFIG,
} from '@/lib/prompt';

// Mock the profile module
jest.mock('@/lib/profile', () => ({
  getProfileEntries: jest.fn().mockResolvedValue([
    {
      id: 'test-1',
      topic: 'Technology',
      question: { en: 'What is React?', fr: 'Qu\'est-ce que React?' },
      answer: {
        en: 'React is a JavaScript library for building user interfaces',
        fr: 'React est une bibliothèque JavaScript pour créer des interfaces utilisateur',
      },
      tags: ['react', 'javascript', 'frontend'],
    },
    {
      id: 'test-2',
      topic: 'Technology',
      question: { en: 'What is TypeScript?', fr: 'Qu\'est-ce que TypeScript?' },
      answer: {
        en: 'TypeScript is a typed superset of JavaScript',
        fr: 'TypeScript est un sur-ensemble typé de JavaScript',
      },
      tags: ['typescript', 'javascript'],
    },
    {
      id: 'test-3',
      topic: 'General',
      question: { en: 'What is your favorite color?', fr: 'Quelle est votre couleur préférée?' },
      answer: {
        en: 'I enjoy working with various colors in UI design',
        fr: 'J\'aime travailler avec diverses couleurs dans la conception d\'interface utilisateur',
      },
      tags: ['personal', 'design'],
    },
  ]),
  searchEntries: jest.fn().mockImplementation((query: string, lang: 'en' | 'fr') => {
    return Promise.resolve([]);
  }),
}));

describe('Prompt Builder', () => {
  describe('findRelevantEntries', () => {
    it('should find entries relevant to React', async () => {
      const entries = await findRelevantEntries('Tell me about React');
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0].id).toBe('test-1');
    });

    it('should find entries relevant to TypeScript', async () => {
      const entries = await findRelevantEntries('What is TypeScript?');
      expect(entries.length).toBeGreaterThan(0);
      expect(entries.some((e) => e.id === 'test-2')).toBe(true);
    });

    it('should respect language configuration', async () => {
      const entries = await findRelevantEntries('React', { language: 'fr' });
      expect(entries).toBeDefined();
    });

    it('should limit results to maxContextEntries', async () => {
      const entries = await findRelevantEntries('javascript', { maxContextEntries: 1 });
      expect(entries.length).toBeLessThanOrEqual(1);
    });

    it('should return empty array for irrelevant queries', async () => {
      const entries = await findRelevantEntries('xyz quantum entanglement', {
        contextRelevanceThreshold: 10,
      });
      expect(entries.length).toBe(0);
    });
  });

  describe('buildSystemPrompt', () => {
    it('should build system prompt in English', () => {
      const entries = [
        {
          id: 'test-1',
          topic: 'Technology',
          question: { en: 'What is React?', fr: 'Qu\'est-ce que React?' },
          answer: {
            en: 'React is a JavaScript library',
            fr: 'React est une bibliothèque JavaScript',
          },
          tags: ['react'],
        },
      ];

      const prompt = buildSystemPrompt(entries, { language: 'en' });
      expect(prompt).toContain('Abdennasser');
      expect(prompt).toContain('What is React?');
      expect(prompt).toContain('React is a JavaScript library');
      expect(prompt).toContain('ADDITIONAL CONTEXT');
    });

    it('should build system prompt in French', () => {
      const entries = [
        {
          id: 'test-1',
          topic: 'Technology',
          question: { en: 'What is React?', fr: 'Qu\'est-ce que React?' },
          answer: {
            en: 'React is a JavaScript library',
            fr: 'React est une bibliothèque JavaScript',
          },
          tags: ['react'],
        },
      ];

      const prompt = buildSystemPrompt(entries, { language: 'fr' });
      expect(prompt).toContain('Abdennasser');
      expect(prompt).toContain('Qu\'est-ce que React?');
      expect(prompt).toContain('React est une bibliothèque JavaScript');
      expect(prompt).toContain('CONTEXTE ADDITIONNEL');
    });

    it('should include guardrails when configured', () => {
      const prompt = buildSystemPrompt([], { includeGuardrails: true, language: 'en' });
      expect(prompt).toContain('Additional Guardrails');
      expect(prompt).toContain('DO NOT fabricate');
    });

    it('should exclude guardrails when configured', () => {
      const prompt = buildSystemPrompt([], { includeGuardrails: false, language: 'en' });
      expect(prompt).not.toContain('Additional Guardrails');
    });

    it('should handle empty entries gracefully', () => {
      const prompt = buildSystemPrompt([], { language: 'en' });
      expect(prompt).toContain('No specific profile information available');
    });
  });

  describe('buildChatMessages', () => {
    it('should build complete message array', async () => {
      const messages = await buildChatMessages('Tell me about React', []);
      expect(messages.length).toBeGreaterThan(1);
      expect(messages[0].role).toBe('system'); // System prompt
      expect(messages[messages.length - 1].role).toBe('user');
      expect(messages[messages.length - 1].content).toBe('Tell me about React');
    });

    it('should include conversation history', async () => {
      const history = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' },
      ];

      const messages = await buildChatMessages('Tell me about React', history);
      expect(messages.length).toBeGreaterThan(3); // system + history + new message
      expect(messages.some((m) => m.content === 'Hello')).toBe(true);
    });

    it('should respect maxHistoryTurns', async () => {
      const history = Array.from({ length: 50 }, (_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Message ${i}`,
      }));

      const messages = await buildChatMessages('New message', history, {
        maxHistoryTurns: 5,
      });

      // Should have: system + (5 turns * 2 messages) + new user message = 12 messages
      expect(messages.length).toBeLessThanOrEqual(12);
    });
  });

  describe('needsClarification', () => {
    it('should return true for vague queries with no context', () => {
      const result = needsClarification('hi', []);
      expect(result).toBe(true);
    });

    it('should return false when relevant entries exist', () => {
      const entries = [
        {
          id: 'test-1',
          topic: 'Technology',
          question: { en: 'What is React?', fr: 'Qu\'est-ce que React?' },
          answer: { en: 'React is...', fr: 'React est...' },
          tags: ['react'],
        },
      ];

      const result = needsClarification('hi', entries);
      expect(result).toBe(false);
    });

    it('should return false for detailed queries even without entries', () => {
      const result = needsClarification('Can you tell me about React and its ecosystem?', []);
      expect(result).toBe(false);
    });
  });

  describe('generateClarificationPrompt', () => {
    it('should generate English clarification prompt', () => {
      const prompt = generateClarificationPrompt('hi', 'en');
      expect(prompt).toContain('more details');
      expect(prompt).toContain('What specific aspect');
    });

    it('should generate French clarification prompt', () => {
      const prompt = generateClarificationPrompt('salut', 'fr');
      expect(prompt).toContain('plus de détails');
      expect(prompt).toContain('Quel aspect spécifique');
    });
  });

  describe('DEFAULT_PROMPT_CONFIG', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_PROMPT_CONFIG.maxContextEntries).toBe(5);
      expect(DEFAULT_PROMPT_CONFIG.language).toBe('en');
      expect(DEFAULT_PROMPT_CONFIG.includeGuardrails).toBe(true);
      expect(DEFAULT_PROMPT_CONFIG.maxHistoryTurns).toBe(10);
    });
  });
});
