/**
 * Unit tests for Groq client
 */

import { streamChatResponse, validateConnection, GroqClientError } from '@/lib/groqClient';
import type { ChatMessage } from '@/types/chat';

// Mock the groq-sdk
const mockCreate = jest.fn();
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe('Groq Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set test API key
    process.env.GROQ_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  describe('streamChatResponse', () => {
    it('should stream chat responses successfully', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello, Groq!' },
      ];

      // Mock the stream
      const mockStream = (async function* () {
        yield { choices: [{ delta: { content: 'Hello' } }] };
        yield { choices: [{ delta: { content: ' from' } }] };
        yield { choices: [{ delta: { content: ' Groq' } }] };
      })();

      mockCreate.mockResolvedValue(mockStream);

      const generator = await streamChatResponse(messages);
      const chunks: string[] = [];

      for await (const chunk of generator) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle empty messages array', async () => {
      const messages: ChatMessage[] = [];

      await expect(streamChatResponse(messages)).rejects.toThrow(GroqClientError);
    });

    it('should reject if last message is not from user', async () => {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: 'Response' },
      ];

      await expect(streamChatResponse(messages)).rejects.toThrow(GroqClientError);
    });

    it('should validate message content length', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '' },
      ];

      await expect(streamChatResponse(messages)).rejects.toThrow(GroqClientError);
    });

    it('should reject message exceeding max length', async () => {
      const longContent = 'x'.repeat(5000); // Exceeds 4096 limit
      const messages: ChatMessage[] = [
        { role: 'user', content: longContent },
      ];

      await expect(streamChatResponse(messages)).rejects.toThrow(GroqClientError);
    });

    it('should sanitize message content', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello\x00World' }, // Contains null byte
      ];

      mockCreate.mockResolvedValue((async function* () {})());

      await streamChatResponse(messages);

      // Verify the message was sanitized
      const callArgs = mockCreate.mock.calls[0][0];
      // The null byte should be removed
      expect(callArgs.messages[0].content).toBe('HelloWorld');
    });

    it('should throw error if GROQ_API_KEY is not set', async () => {
      delete process.env.GROQ_API_KEY;

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      await expect(streamChatResponse(messages)).rejects.toThrow(GroqClientError);
      await expect(streamChatResponse(messages)).rejects.toMatchObject({
        code: 'MISSING_API_KEY',
      });
    });
  });

  describe('validateConnection', () => {
    it('should return true on successful connection', async () => {
      mockCreate.mockResolvedValue({ id: 'test' });

      const result = await validateConnection('test-key');

      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      mockCreate.mockRejectedValue(new Error('Connection failed'));

      const result = await validateConnection('invalid-key');

      expect(result).toBe(false);
    });
  });

  describe('GroqClientError', () => {
    it('should create error with correct properties', () => {
      const error = new GroqClientError('Test error', 'TEST_CODE', 400, true);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('GroqClientError');
    });
  });
});
