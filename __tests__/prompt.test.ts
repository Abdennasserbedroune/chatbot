/**
 * Tests for prompt builder utilities
 */

import {
  findRelevantEntries,
  buildSystemPrompt,
  buildChatMessages,
  needsClarification,
  generateClarificationPrompt,
  extractUserName,
  isSimpleFactQuestion,
  isProjectQuery,
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
  searchEntries: jest.fn().mockImplementation((_query: string, _lang: 'en' | 'fr') => {
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

  describe('extractUserName', () => {
    it('should extract name from English patterns', () => {
      const messages = [
        { role: 'user' as const, content: 'My name is John' },
        { role: 'assistant' as const, content: 'Hello!' },
      ];
      expect(extractUserName(messages)).toBe('John');
    });

    it('should extract name from "I am" patterns', () => {
      const messages = [
        { role: 'user' as const, content: 'I am Sarah and I need help' },
      ];
      expect(extractUserName(messages)).toBe('Sarah');
    });

    it('should extract name from French patterns', () => {
      const messages = [
        { role: 'user' as const, content: 'Je m\'appelle Marie' },
      ];
      expect(extractUserName(messages)).toBe('Marie');
    });

    it('should return undefined for no name found', () => {
      const messages = [
        { role: 'user' as const, content: 'Hello, how are you?' },
      ];
      expect(extractUserName(messages)).toBeUndefined();
    });

    it('should filter out common words', () => {
      const messages = [
        { role: 'user' as const, content: 'I am the best' },
      ];
      expect(extractUserName(messages)).toBeUndefined();
    });

    it('should check messages in reverse order', () => {
      const messages = [
        { role: 'user' as const, content: 'My name is Alice' },
        { role: 'assistant' as const, content: 'Hello!' },
        { role: 'user' as const, content: 'Actually, call me Bob' },
      ];
      expect(extractUserName(messages)).toBe('Bob');
    });
  });

  describe('isSimpleFactQuestion', () => {
    it('should detect English age questions', () => {
      expect(isSimpleFactQuestion('How old are you?')).toBe(true);
      expect(isSimpleFactQuestion('What age are you?')).toBe(true);
      expect(isSimpleFactQuestion('Age?')).toBe(true);
    });

    it('should detect English origin questions', () => {
      expect(isSimpleFactQuestion('Where are you from?')).toBe(true);
      expect(isSimpleFactQuestion('Where were you born?')).toBe(true);
      expect(isSimpleFactQuestion('Where do you live?')).toBe(true);
    });

    it('should detect English identity questions', () => {
      expect(isSimpleFactQuestion('What is your name?')).toBe(true);
      expect(isSimpleFactQuestion('Who are you?')).toBe(true);
      expect(isSimpleFactQuestion('What do you do?')).toBe(true);
    });

    it('should detect French age questions', () => {
      expect(isSimpleFactQuestion('Quel âge as-tu?')).toBe(true);
      expect(isSimpleFactQuestion('Âge?')).toBe(true);
    });

    it('should detect French origin questions', () => {
      expect(isSimpleFactQuestion('D\'où viens-tu?')).toBe(true);
      expect(isSimpleFactQuestion('Où es-tu né?')).toBe(true);
      expect(isSimpleFactQuestion('Où habites-tu?')).toBe(true);
    });

    it('should return false for complex questions', () => {
      expect(isSimpleFactQuestion('Tell me about your experience with React')).toBe(false);
      expect(isSimpleFactQuestion('Can you explain your approach to problem solving?')).toBe(false);
    });
  });

  describe('isProjectQuery', () => {
    it('should detect project keywords in English', () => {
      expect(isProjectQuery('Tell me about Fanpocket', [])).toBe(true);
      expect(isProjectQuery('What projects have you built?', [])).toBe(true);
      expect(isProjectQuery('Tell me about your app', [])).toBe(true);
    });

    it('should detect project keywords in French', () => {
      expect(isProjectQuery('Parle-moi de Fanpocket', [])).toBe(true);
      expect(isProjectQuery('Quels projets as-tu développés?', [])).toBe(true);
    });

    it('should detect project-related entries', () => {
      const relevantEntries = [
        {
          id: 'test-1',
          topic: 'Technology',
          question: { en: 'What is React?', fr: 'Qu\'est-ce que React?' },
          answer: { en: 'React is...', fr: 'React est...' },
          tags: ['project', 'development'],
        },
      ];
      expect(isProjectQuery('Tell me about your work', relevantEntries)).toBe(true);
    });

    it('should return false for non-project queries', () => {
      expect(isProjectQuery('What is your favorite color?', [])).toBe(false);
      expect(isProjectQuery('How do you learn?', [])).toBe(false);
    });
  });

  describe('buildChatMessages with name extraction', () => {
    it('should extract name from conversation history', async () => {
      const history = [
        { role: 'user' as const, content: 'My name is David' },
        { role: 'assistant' as const, content: 'Hello!' },
      ];

      const messages = await buildChatMessages('Tell me about React', history);
      const systemMessage = messages.find(m => m.role === 'system');
      expect(systemMessage?.content).toContain('David');
    });

    it('should use provided userName over extraction', async () => {
      const history = [
        { role: 'user' as const, content: 'My name is David' },
      ];

      const messages = await buildChatMessages('Tell me about React', history, {}, 'Sarah');
      const systemMessage = messages.find(m => m.role === 'system');
      expect(systemMessage?.content).toContain('Sarah');
      expect(systemMessage?.content).not.toContain('David');
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
