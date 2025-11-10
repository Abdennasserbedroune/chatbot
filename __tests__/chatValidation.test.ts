/**
 * Unit tests for chat validation
 */

import {
  validateChatRequest,
  validateLastMessageIsFromUser,
  isChatRequestPayload,
} from '@/lib/chatValidation';
import type { ChatRequestPayload } from '@/types/chat';

describe('Chat Validation', () => {
  describe('validateChatRequest', () => {
    it('should validate a valid chat request', () => {
      const payload = {
        messages: [
          { role: 'user', content: 'Hello' },
        ],
      };

      const result = validateChatRequest(payload);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid JSON type', () => {
      const result = validateChatRequest('not an object');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject missing messages array', () => {
      const result = validateChatRequest({});

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'messages')).toBe(true);
    });

    it('should reject empty messages array', () => {
      const result = validateChatRequest({ messages: [] });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('At least one message'))).toBe(true);
    });

    it('should reject invalid message format', () => {
      const payload = {
        messages: [
          { role: 'user' }, // missing content
        ],
      };

      const result = validateChatRequest(payload);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty message content', () => {
      const payload = {
        messages: [
          { role: 'user', content: '' },
        ],
      };

      const result = validateChatRequest(payload);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('cannot be empty'))).toBe(true);
    });

    it('should reject message content exceeding max length', () => {
      const payload = {
        messages: [
          { role: 'user', content: 'x'.repeat(5000) },
        ],
      };

      const result = validateChatRequest(payload);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('exceeds maximum length'))).toBe(true);
    });

    it('should reject invalid role', () => {
      const payload = {
        messages: [
          { role: 'invalid', content: 'Hello' },
        ],
      };

      const result = validateChatRequest(payload);

      expect(result.valid).toBe(false);
    });

    it('should accept optional conversationId', () => {
      const payload = {
        messages: [{ role: 'user', content: 'Hello' }],
        conversationId: 'conv-123',
      };

      const result = validateChatRequest(payload);

      expect(result.valid).toBe(true);
    });

    it('should accept optional language', () => {
      const payload = {
        messages: [{ role: 'user', content: 'Hello' }],
        language: 'fr',
      };

      const result = validateChatRequest(payload);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid language', () => {
      const payload = {
        messages: [{ role: 'user', content: 'Hello' }],
        language: 'de',
      };

      const result = validateChatRequest(payload);

      expect(result.valid).toBe(false);
    });
  });

  describe('validateLastMessageIsFromUser', () => {
    it('should accept last message from user', () => {
      const payload: ChatRequestPayload = {
        messages: [
          { role: 'assistant', content: 'Response' },
          { role: 'user', content: 'Question' },
        ],
      };

      const result = validateLastMessageIsFromUser(payload);

      expect(result.valid).toBe(true);
    });

    it('should reject last message from assistant', () => {
      const payload: ChatRequestPayload = {
        messages: [
          { role: 'user', content: 'Question' },
          { role: 'assistant', content: 'Response' },
        ],
      };

      const result = validateLastMessageIsFromUser(payload);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_CONVERSATION')).toBe(true);
    });

    it('should pass validation for single user message', () => {
      const payload: ChatRequestPayload = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const result = validateLastMessageIsFromUser(payload);

      expect(result.valid).toBe(true);
    });
  });

  describe('isChatRequestPayload', () => {
    it('should return true for valid payload', () => {
      const payload = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const result = isChatRequestPayload(payload);

      expect(result).toBe(true);
    });

    it('should return false for invalid payload', () => {
      const payload = {
        messages: [{ role: 'assistant', content: 'Response' }],
      };

      const result = isChatRequestPayload(payload);

      expect(result).toBe(false);
    });
  });
});
