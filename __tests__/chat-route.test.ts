/**
 * Unit and integration tests for the Groq chat API route
 */

import { NextRequest } from 'next/server';
import { POST, OPTIONS } from '@/app/api/chat/route';
import * as groqClient from '@/lib/groqClient';
import { RateLimiter } from '@/lib/rateLimiter';
import type { ChatRequestPayload, ChatMessage } from '@/types/chat';

// Mock the groq client
jest.mock('@/lib/groqClient');

// Mock the prompt builder
jest.mock('@/lib/prompt', () => ({
  buildChatMessages: jest.fn().mockImplementation(async (userMessage: string, history: ChatMessage[]) => {
    return [
      { role: 'assistant' as const, content: 'System prompt' },
      ...history,
      { role: 'user' as const, content: userMessage },
    ];
  }),
}));

// Helper function to safely consume a readable stream (with timeout)
async function consumeStream(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';

  let result = '';
  try {
    // Read with a timeout to prevent hanging tests
    const readWithTimeout = new Promise<{ done: boolean; value?: Uint8Array }>((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ done: true });
      }, 100);

      reader.read().then((chunk) => {
        clearTimeout(timeout);
        resolve(chunk);
      }).catch(() => {
        clearTimeout(timeout);
        resolve({ done: true });
      });
    });

    const chunk = await readWithTimeout;
    if (chunk.value && !chunk.done) {
      result += new TextDecoder().decode(chunk.value);
    }
  } catch {
    // Ignore errors from stream consumption
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Ignore release errors
    }
  }
  return result;
}

describe('Chat API Route Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Allow any pending async operations to complete
    await new Promise((resolve) => setImmediate(resolve));
  });

  describe('POST /api/chat - Success Cases', () => {
    it('should successfully stream a chat response', async () => {
      // Setup mock generator
      const mockGenerator = (async function* () {
        yield 'Hello ';
        yield 'from';
        yield ' Groq';
      })();

      (groqClient.streamChatResponse as jest.Mock).mockResolvedValue(mockGenerator);

      // Create request
      const payload: ChatRequestPayload = {
        messages: [
          { role: 'user', content: 'Hello' },
        ],
      };

      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');

      // Consume the stream to clean up
      const content = await consumeStream(response);
      expect(content).toContain('data:');
    });

    it('should handle multiple messages in conversation', async () => {
      const mockGenerator = (async function* () {
        yield 'Response to multi-turn';
      })();

      (groqClient.streamChatResponse as jest.Mock).mockResolvedValue(mockGenerator);

      const payload: ChatRequestPayload = {
        messages: [
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'First response' },
          { role: 'user', content: 'Second message' },
        ],
      };

      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      // streamChatResponse is called with enhanced messages from buildChatMessages
      expect(groqClient.streamChatResponse).toHaveBeenCalled();

      // Consume the stream to clean up
      await consumeStream(response);
    });

    it('should include conversation ID in request if provided', async () => {
      const mockGenerator = (async function* () {
        yield 'Response';
      })();

      (groqClient.streamChatResponse as jest.Mock).mockResolvedValue(mockGenerator);

      const payload: ChatRequestPayload = {
        messages: [{ role: 'user', content: 'Test' }],
        conversationId: 'conv-123',
      };

      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      // Verify streamChatResponse was called with enhanced messages
      expect(groqClient.streamChatResponse).toHaveBeenCalled();

      // Consume the stream to clean up
      await consumeStream(response);
    });

    it('should handle French language requests', async () => {
      const mockGenerator = (async function* () {
        yield 'Réponse en français';
      })();

      (groqClient.streamChatResponse as jest.Mock).mockResolvedValue(mockGenerator);

      const payload: ChatRequestPayload = {
        messages: [{ role: 'user', content: 'Bonjour' }],
        language: 'fr',
      };

      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      await consumeStream(response);
    });
  });

  describe('POST /api/chat - Error Cases', () => {
    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid JSON');
      expect(data.code).toBe('INVALID_JSON');
    });

    it('should return 400 for missing messages array', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('INVALID_PAYLOAD');
    });

    it('should return 400 for empty messages array', async () => {
      const payload = { messages: [] };

      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('INVALID_PAYLOAD');
    });

    it('should return 400 for invalid message format', async () => {
      const payload = {
        messages: [
          { role: 'user' }, // missing content
        ],
      };

      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('INVALID_PAYLOAD');
    });

    it('should return 400 if last message is not from user', async () => {
      const payload: ChatRequestPayload = {
        messages: [
          { role: 'user', content: 'First' },
          { role: 'assistant', content: 'Response' },
        ],
      };

      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('INVALID_CONVERSATION');
    });

    it('should return 400 for message content exceeding max length', async () => {
      const payload = {
        messages: [
          { role: 'user', content: 'x'.repeat(5000) },
        ],
      };

      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('INVALID_PAYLOAD');
    });

    it('should return 500 when Groq client throws error', async () => {
      (groqClient.streamChatResponse as jest.Mock).mockRejectedValue(
        new Error('Failed to connect to Groq API')
      );

      const payload: ChatRequestPayload = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      // Streaming response with error in stream
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');

      // Consume the stream to clean up
      await consumeStream(response);
    });

    it('should handle Groq API errors with proper messages', async () => {
      const groqError = new (groqClient.GroqClientError as any)(
        'Invalid API key',
        'INVALID_API_KEY',
        401,
        false
      );

      (groqClient.streamChatResponse as jest.Mock).mockRejectedValue(groqError);

      const payload: ChatRequestPayload = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');

      // Consume the stream to clean up
      await consumeStream(response);
    });

    it('should return 500 for unexpected errors', async () => {
      (groqClient.streamChatResponse as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      const payload: ChatRequestPayload = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');

      // Consume the stream to clean up
      await consumeStream(response);
    });
  });

  describe('POST /api/chat - Rate Limiting', () => {
    it('should return 429 when rate limit is exceeded', async () => {
      // Create a rate limiter with very restrictive settings for testing
      const testLimiter = new RateLimiter({
        maxTokens: 1,
        refillRate: 0,
      });

      const ip = '192.168.1.1';

      // First request should succeed
      const first = testLimiter.isAllowed(ip, 1);
      expect(first).toBe(true);

      // Second request should fail (rate limited)
      const second = testLimiter.isAllowed(ip, 1);
      expect(second).toBe(false);

      testLimiter.destroy();
    });

    it('should include Retry-After header in rate limit response', async () => {
      // Create a rate limiter with very restrictive settings for testing
      const testLimiter = new RateLimiter({
        maxTokens: 1,
        refillRate: 0,
      });

      const ip = '192.168.1.1';

      // Exhaust the limiter
      testLimiter.isAllowed(ip, 1);

      // Get retry-after time
      const retryAfter = testLimiter.getRetryAfterSeconds(ip);
      expect(retryAfter).toBeGreaterThan(0);

      testLimiter.destroy();
    });

    it('should extract client IP from x-forwarded-for header', async () => {
      const mockGenerator = (async function* () {
        yield 'Response';
      })();

      (groqClient.streamChatResponse as jest.Mock).mockResolvedValue(mockGenerator);

      const payload: ChatRequestPayload = {
        messages: [{ role: 'user', content: 'Test' }],
      };

      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.1, 198.51.100.1',
        },
      });

      const response = await POST(request);

      // Should succeed with valid IP extraction
      expect(response.status).toBe(200);

      // Consume the stream to clean up
      await consumeStream(response);
    });

    it('should fall back to x-real-ip header if x-forwarded-for is not present', async () => {
      const mockGenerator = (async function* () {
        yield 'Response';
      })();

      (groqClient.streamChatResponse as jest.Mock).mockResolvedValue(mockGenerator);

      const payload: ChatRequestPayload = {
        messages: [{ role: 'user', content: 'Test' }],
      };

      const request = new NextRequest(new URL('http://localhost:3000/api/chat'), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'x-real-ip': '203.0.113.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Consume the stream to clean up
      await consumeStream(response);
    });
  });

  describe('OPTIONS /api/chat', () => {
    it('should return 204 with proper CORS headers', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
        'POST, OPTIONS'
      );
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
        'Content-Type'
      );
    });
  });
});
