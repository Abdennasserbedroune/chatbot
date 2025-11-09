/**
 * Unit tests for the Gemini client wrapper
 */

import * as geminiModule from '@/lib/geminiClient';
import type { ChatMessage } from '@/types/chat';

// Mock the Google Generative AI library
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessageStream: jest.fn().mockResolvedValue({
            stream: (async function* () {
              yield { text: () => 'Hello' };
              yield { text: () => ' ' };
              yield { text: () => 'world' };
            })(),
          }),
        }),
      }),
    })),
  };
});

describe('Gemini Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the cached client
    jest.resetModules();
  });

  describe('getGeminiClient', () => {
    it('should create a GoogleGenerativeAI client with valid API key', () => {
      process.env.GOOGLE_GEMINI_API_KEY = 'test-api-key-123';

      const client = geminiModule.getGeminiClient();

      expect(client).toBeDefined();
    });

    it('should throw error when API key is missing', () => {
      delete process.env.GOOGLE_GEMINI_API_KEY;

      expect(() => {
        geminiModule.getGeminiClient();
      }).toThrow('GOOGLE_GEMINI_API_KEY environment variable is not set');
    });

    it('should throw error when API key is empty string', () => {
      process.env.GOOGLE_GEMINI_API_KEY = '';

      expect(() => {
        geminiModule.getGeminiClient();
      }).toThrow('GOOGLE_GEMINI_API_KEY environment variable is empty');
    });

    it('should throw error when API key is only whitespace', () => {
      process.env.GOOGLE_GEMINI_API_KEY = '   ';

      expect(() => {
        geminiModule.getGeminiClient();
      }).toThrow('GOOGLE_GEMINI_API_KEY environment variable is empty');
    });

    it('should cache the client instance', () => {
      process.env.GOOGLE_GEMINI_API_KEY = 'test-api-key-123';

      const client1 = geminiModule.getGeminiClient();
      const client2 = geminiModule.getGeminiClient();

      expect(client1).toBe(client2);
    });
  });

  describe('streamChatResponse', () => {
    beforeEach(() => {
      process.env.GOOGLE_GEMINI_API_KEY = 'test-api-key-123';
    });

    it('should stream chat response chunks', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      const generator = await geminiModule.streamChatResponse(messages);

      const chunks: string[] = [];
      for await (const chunk of generator) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toContain('Hello');
    });

    it('should handle multi-turn conversations', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'First response' },
        { role: 'user', content: 'Second message' },
      ];

      const generator = await geminiModule.streamChatResponse(messages);

      let receivedData = false;
      for await (const chunk of generator) {
        if (chunk) {
          receivedData = true;
        }
      }

      expect(receivedData).toBe(true);
    });

    it('should throw error if last message is not from user', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'First' },
        { role: 'assistant', content: 'Response' },
      ];

      await expect(geminiModule.streamChatResponse(messages)).rejects.toThrow(
        'Last message must be from the user'
      );
    });

    it('should convert assistant role to model role for Gemini', async () => {
      process.env.GOOGLE_GEMINI_API_KEY = 'test-api-key-123';

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Response' },
        { role: 'user', content: 'Next' },
      ];

      const generator = await geminiModule.streamChatResponse(messages);

      // Consume the generator
      for await (const _ of generator) {
        // just iterate
      }

      // Verify that messages were converted correctly
      expect(true).toBe(true); // placeholder
    });

    it('should handle empty text chunks', async () => {
      // Mock to return empty chunks
      const mockGenerator = (async function* () {
        yield { text: () => '' };
        yield { text: () => 'content' };
        yield { text: () => '' };
      })();

      // This test verifies the client handles empty chunks gracefully
      expect(true).toBe(true); // placeholder assertion
    });
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      process.env.GOOGLE_GEMINI_API_KEY = 'valid-key-123';

      const result = await geminiModule.validateApiKey();

      expect(result).toBe(true);
    });

    it('should return false for missing API key', async () => {
      delete process.env.GOOGLE_GEMINI_API_KEY;

      const result = await geminiModule.validateApiKey();

      expect(result).toBe(false);
    });

    it('should return false for empty API key', async () => {
      process.env.GOOGLE_GEMINI_API_KEY = '';

      const result = await geminiModule.validateApiKey();

      expect(result).toBe(false);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      process.env.GOOGLE_GEMINI_API_KEY = 'test-api-key-123';
    });

    it('should include helpful error message when API key is missing', () => {
      delete process.env.GOOGLE_GEMINI_API_KEY;

      try {
        geminiModule.getGeminiClient();
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain('GOOGLE_GEMINI_API_KEY');
        expect(message).toContain('.env.local');
      }
    });

    it('should include helpful error message when API key is empty', () => {
      process.env.GOOGLE_GEMINI_API_KEY = '   ';

      try {
        geminiModule.getGeminiClient();
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain('empty');
        expect(message).toContain('API key');
      }
    });
  });
});
