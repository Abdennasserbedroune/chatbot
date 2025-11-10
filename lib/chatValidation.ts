/**
 * Chat request validation using Zod
 * Provides runtime validation for chat messages and payloads
 */

import { z } from 'zod';
import type { ChatRequestPayload } from '@/types/chat';

// Define validation schemas
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z
    .string()
    .min(1, 'Message content cannot be empty')
    .max(4096, 'Message content exceeds maximum length of 4096 characters'),
});

export const ChatRequestPayloadSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1, 'At least one message is required'),
  conversationId: z.string().optional(),
  language: z.enum(['en', 'fr']).optional(),
});

// Custom validation error type
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a chat request payload
 */
export function validateChatRequest(payload: unknown): ValidationResult {
  try {
    ChatRequestPayloadSchema.parse(payload);
    return {
      valid: true,
      errors: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      return {
        valid: false,
        errors,
      };
    }

    return {
      valid: false,
      errors: [
        {
          field: 'unknown',
          message: 'Validation error occurred',
          code: 'UNKNOWN_ERROR',
        },
      ],
    };
  }
}

/**
 * Validates that the last message is from the user
 */
export function validateLastMessageIsFromUser(payload: ChatRequestPayload): ValidationResult {
  if (
    payload.messages.length > 0 &&
    payload.messages[payload.messages.length - 1].role !== 'user'
  ) {
    return {
      valid: false,
      errors: [
        {
          field: 'messages',
          message: 'Last message must be from the user',
          code: 'INVALID_CONVERSATION',
        },
      ],
    };
  }

  return {
    valid: true,
    errors: [],
  };
}

/**
 * Type guard for ChatRequestPayload
 */
export function isChatRequestPayload(payload: unknown): payload is ChatRequestPayload {
  const result = validateChatRequest(payload);
  if (!result.valid) return false;

  const validation = validateLastMessageIsFromUser(payload as ChatRequestPayload);
  return validation.valid;
}
