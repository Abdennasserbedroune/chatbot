/**
 * Unit tests for the Ollama client wrapper
 */

import * as ollamaModule from '@/lib/ollamaClient';
import type { ChatMessage } from '@/types/chat';

describe('Ollama Client', () => {
  describe('streamChatResponse', () => {
    it('should throw error if messages array is empty', async () => {
      const messages: ChatMessage[] = [];

      await expect(ollamaModule.streamChatResponse(messages)).rejects.toThrow(
        'Messages array cannot be empty'
      );
    });

    it('should throw error if last message is not from user', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'First' },
        { role: 'assistant', content: 'Response' },
      ];

      await expect(ollamaModule.streamChatResponse(messages)).rejects.toThrow(
        'Last message must be from the user'
      );
    });

    it('should throw error when Ollama connection fails', async () => {
      const originalFetch = global.fetch;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      global.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

      try {
        const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
        await expect(ollamaModule.streamChatResponse(messages)).rejects.toThrow(
          'Failed to connect to Ollama'
        );
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should throw error when Ollama returns non-ok status', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal server error'),
      });

      try {
        const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
        await expect(ollamaModule.streamChatResponse(messages)).rejects.toThrow(
          'Ollama API returned status 500'
        );
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should throw error when response body is empty', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: null,
      });

      try {
        const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
        await expect(ollamaModule.streamChatResponse(messages)).rejects.toThrow(
          'response body is empty'
        );
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('validateConnection', () => {
    it('should return true when Ollama is reachable', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      try {
        const result = await ollamaModule.validateConnection();
        expect(result).toBe(true);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should return false when Ollama is not reachable', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

      try {
        const result = await ollamaModule.validateConnection();
        expect(result).toBe(false);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should return false when Ollama returns error status', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      });

      try {
        const result = await ollamaModule.validateConnection();
        expect(result).toBe(false);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
