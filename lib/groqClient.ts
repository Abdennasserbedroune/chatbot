/**
 * Groq AI client wrapper
 * Handles Groq API communication with streaming support
 * Model: qwen/qwen3-32b
 *
 * NOTE: reasoning_effort is NOT supported by qwen/qwen3-32b on Groq's API.
 * Passing it (even as 'none') causes a 400 invalid_request_error.
 * It has been removed entirely. The model responds normally without it.
 */

import Groq from 'groq-sdk';
import type { ChatMessage } from '@/types/chat';

// Configuration constants
const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3-32b';
const GROQ_TIMEOUT = parseInt(process.env.GROQ_TIMEOUT || '30000', 10);
const GROQ_MAX_RETRIES = parseInt(process.env.GROQ_MAX_RETRIES || '3', 10);
const GROQ_INITIAL_RETRY_DELAY = parseInt(process.env.GROQ_INITIAL_RETRY_DELAY || '1000', 10);

// Validation constants
const MAX_MESSAGE_LENGTH = 4096;
const MIN_MESSAGE_LENGTH = 1;

export type StreamChunk = { type: 'thinking' | 'content'; data: string };

interface GroqClientOptions {
  apiKey?: string;
  timeout?: number;
  maxRetries?: number;
}

class GroqClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'GroqClientError';
  }
}

async function createGroqClient(options?: GroqClientOptions): Promise<Groq> {
  const apiKey = options?.apiKey || process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new GroqClientError(
      'GROQ_API_KEY environment variable is not set. Please configure it to use Groq API.',
      'MISSING_API_KEY',
      undefined,
      false
    );
  }

  return new Groq({
    apiKey,
    timeout: options?.timeout || GROQ_TIMEOUT,
  });
}

function validateMessages(messages: ChatMessage[]): void {
  if (messages.length === 0) {
    throw new GroqClientError('Messages array cannot be empty', 'INVALID_INPUT', 400, false);
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'user') {
    throw new GroqClientError('Last message must be from the user', 'INVALID_INPUT', 400, false);
  }

  for (const message of messages) {
    if (message.content.length < MIN_MESSAGE_LENGTH) {
      throw new GroqClientError(
        `Message content must be at least ${MIN_MESSAGE_LENGTH} character`,
        'INVALID_INPUT',
        400,
        false
      );
    }
    if (message.content.length > MAX_MESSAGE_LENGTH) {
      throw new GroqClientError(
        `Message content must not exceed ${MAX_MESSAGE_LENGTH} characters`,
        'INVALID_INPUT',
        400,
        false
      );
    }
  }
}

function sanitizeMessageContent(content: string): string {
  const charCodes = Array.from(content).filter((char) => {
    const code = char.charCodeAt(0);
    return code >= 0x20 && code !== 0x7f;
  });
  return charCodes.join('').trim();
}

async function streamWithRetry(
  client: Groq,
  messages: ChatMessage[],
  retryCount: number = 0
): Promise<AsyncGenerator<StreamChunk, void, unknown>> {
  try {
    const groqMessages = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    const stream = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: groqMessages as Parameters<typeof client.chat.completions.create>[0]['messages'],
      stream: true,
      temperature: 0.6,
      max_tokens: 2048,
      top_p: 0.95,
    });

    return (async function* (): AsyncGenerator<StreamChunk, void, unknown>) {
      for await (const chunk of stream) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const delta = chunk.choices[0]?.delta as any;
        if (delta?.reasoning_content) {
          yield { type: 'thinking', data: delta.reasoning_content };
        }
        if (delta?.content) {
          yield { type: 'content', data: delta.content };
        }
      }
    })();
  } catch (error) {
    const isRetryable =
      error instanceof Error &&
      ((error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('429') ||
        error.message.includes('500') ||
        error.message.includes('503')) as boolean);

    if (isRetryable && retryCount < GROQ_MAX_RETRIES) {
      const delayMs = GROQ_INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return streamWithRetry(client, messages, retryCount + 1);
    }

    let errorCode = 'UNKNOWN_ERROR';
    let statusCode: number | undefined;
    let message = 'An error occurred while processing your request';

    if (error instanceof Groq.APIError) {
      statusCode = error.status;
      if (error.status === 401) {
        errorCode = 'INVALID_API_KEY';
        message = 'Invalid Groq API key. Please verify your configuration.';
      } else if (error.status === 429) {
        errorCode = 'RATE_LIMITED';
        message = 'Rate limit exceeded. Please try again in a moment.';
      } else if (error.status === 400) {
        errorCode = 'INVALID_REQUEST';
        message = 'Invalid request to Groq API: ' + error.message;
      } else if (error.status && error.status >= 500) {
        errorCode = 'SERVICE_ERROR';
        message = 'Groq service is temporarily unavailable. Please try again later.';
      } else {
        errorCode = 'API_ERROR';
        message = 'Groq API error: ' + error.message;
      }
      } else if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorCode = 'TIMEOUT';
        message = 'Request to Groq API timed out. Please try again.';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorCode = 'CONNECTION_ERROR';
        message = 'Failed to connect to Groq API.';
      } else {
        message = error.message;
      }
    }

    throw new GroqClientError(message, errorCode, statusCode, isRetryable);
  }
}

export async function streamChatResponse(
  messages: ChatMessage[],
  options?: GroqClientOptions
): Promise<AsyncGenerator<StreamChunk, void, unknown>> {
  validateMessages(messages);

  const sanitizedMessages = messages.map((msg) => ({
    ...msg,
    content: sanitizeMessageContent(msg.content),
  }));

  const client = await createGroqClient(options);
  return streamWithRetry(client, sanitizedMessages);
}

export async function validateConnection(apiKey?: string): Promise<boolean> {
  try {
    const client = await createGroqClient({ apiKey });
    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user' as const, content: 'test' }],
      max_tokens: 10,
      stream: false,
    });
    return !!response;
  } catch {
    return false;
  }
}

export { GroqClientError };
