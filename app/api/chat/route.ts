/**
 * API Route: POST /api/chat
 * Streams Groq responses with rate limiting, validation, and custom streaming
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamChatResponse, GroqClientError } from '@/lib/groqClient';
import { createRateLimiter } from '@/lib/rateLimiter';
import { buildChatMessages, isJailbreakAttempt, isProjectInquiry, isOutOfScope, getProjectInquiryResponse, getOutOfScopeResponse } from '@/lib/prompt';
import { validateChatRequest, validateLastMessageIsFromUser } from '@/lib/chatValidation';
import type { ChatRequestPayload, ChatMessage, ChatErrorResponse } from '@/types/chat';

// Create a singleton rate limiter (30 requests per minute per IP - Groq free tier)
const rateLimiter = createRateLimiter({
  maxTokens: 30,
  refillRate: 30 / 60, // 30 tokens per minute
});

/**
 * Sanitize messages to prevent Groq API 4096 character limit errors
 * - Keeps only last N messages to prevent infinite history growth
 * - Truncates individual messages that exceed safe length
 */
function sanitizeMessages(messages: ChatMessage[]): ChatMessage[] {
  const MAX_MESSAGE_LENGTH = 4000; // Safe buffer before 4096 limit
  const MAX_MESSAGES = 10; // Keep only last 10 messages for context

  // Step 1: Keep only the last N messages (prevent infinite history growth)
  let trimmed = messages.slice(-MAX_MESSAGES);

  // Step 2: Truncate any individual message that's too long
  trimmed = trimmed.map(msg => {
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      console.warn(`[Chat] Trimmed message (${msg.role}) from ${msg.content.length} to ${MAX_MESSAGE_LENGTH} chars`);
      return {
        ...msg,
        content: msg.content.slice(0, MAX_MESSAGE_LENGTH) + '... [truncated]'
      };
    }
    return msg;
  });

  return trimmed;
}

function createErrorResponse(
  status: number,
  error: string,
  code?: string,
  details?: Record<string, unknown>
): NextResponse<ChatErrorResponse> {
  const errorResponse: ChatErrorResponse = {
    error,
    code,
    details,
  };

  return new NextResponse(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function getClientIp(request: NextRequest): string {
  // Try to get IP from headers (works with most proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const ip = request.headers.get('x-real-ip');
  if (ip) {
    return ip;
  }

  // Fallback to socket address if available
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const clientIp = getClientIp(request);
    if (!rateLimiter.isAllowed(clientIp, 1)) {
      const retryAfter = rateLimiter.getRetryAfterSeconds(clientIp);
      return Response.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            retryAfter,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    // Parse request body
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return Response.json(
        { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // Validate payload with Zod schema
    const validationResult = validateChatRequest(payload);
    if (!validationResult.valid) {
      return Response.json(
        {
          error: 'Invalid request payload',
          code: 'INVALID_PAYLOAD',
          details: { errors: validationResult.errors },
        },
        { status: 400 }
      );
    }

    // Additional validation: last message must be from user
    const messageValidation = validateLastMessageIsFromUser(payload as ChatRequestPayload);
    if (!messageValidation.valid) {
      return Response.json(
        {
          error: 'Last message must be from user',
          code: 'INVALID_CONVERSATION'
        },
        { status: 400 }
      );
    }

    const typedPayload = payload as ChatRequestPayload;

    // Sanitize messages to prevent 4096 character limit errors
    const sanitizedMessages = sanitizeMessages(typedPayload.messages);

    // Extract language and userName from conversation (optional, defaults to 'en')
    const language = typedPayload.language || 'en';
    const userName = typedPayload.userName;

    // Build enhanced messages with profile context
    const lastUserMessage = sanitizedMessages[sanitizedMessages.length - 1].content;
    const conversationHistory = sanitizedMessages.slice(0, -1);

    // Check for jailbreak attempts - log for security monitoring
    const isJailbreak = isJailbreakAttempt(lastUserMessage);
    if (isJailbreak) {
      console.warn('[Security] Potential jailbreak attempt detected:', {
        clientIp,
        queryLength: lastUserMessage.length,
      });
    }

    // Check for out-of-scope requests and project inquiries
    if (isOutOfScope(lastUserMessage)) {
      const outOfScopeResponse = getOutOfScopeResponse(language);
      
      // Create a simple text response for out-of-scope requests
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        start(controller) {
          const data = `data: ${JSON.stringify({ type: 'content', data: outOfScopeResponse })}\n\n`;
          controller.enqueue(encoder.encode(data));
          
          const done = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
          controller.enqueue(encoder.encode(done));
          controller.close();
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    if (isProjectInquiry(lastUserMessage)) {
      const projectInquiryResponse = getProjectInquiryResponse(language);
      
      // Create a simple text response for project inquiries
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        start(controller) {
          const data = `data: ${JSON.stringify({ type: 'content', data: projectInquiryResponse })}\n\n`;
          controller.enqueue(encoder.encode(data));
          
          const done = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
          controller.enqueue(encoder.encode(done));
          controller.close();
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    let enhancedMessages: ChatMessage[];
    try {
      enhancedMessages = await buildChatMessages(lastUserMessage, conversationHistory, {
        language,
      }, userName);
    } catch (error) {
      console.error('[Chat API] Context building error:', error);
      return Response.json(
        {
          error: 'Failed to build chat context',
          code: 'CONTEXT_ERROR'
        },
        { status: 500 }
      );
    }

    // Create readable stream for streaming response
    const encoder = new TextEncoder();
    let isStreamActive = true;

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const generator = await streamChatResponse(enhancedMessages);

          // Stream each chunk from the generator
          for await (const chunk of generator) {
            if (!isStreamActive) break;

            // Send chunk as SSE
            const data = `data: ${JSON.stringify({ type: 'content', data: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          // Send completion signal
          if (isStreamActive) {
            const done = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
            controller.enqueue(encoder.encode(done));
          }

          controller.close();
        } catch (error) {
          isStreamActive = false;

          // Log error for debugging (sanitized, no API keys)
          console.error('[Chat API Error]', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : 'Unknown error',
            code: error instanceof GroqClientError ? error.code : 'UNKNOWN',
          });

          // Determine error response
          let errorMessage = 'An unexpected error occurred while processing your request.';
          let errorCode = 'INTERNAL_ERROR';

          if (error instanceof GroqClientError) {
            errorCode = error.code;

            if (error.code === 'MISSING_API_KEY') {
              errorMessage =
                'Groq API is not properly configured. Please verify GROQ_API_KEY is set.';
            } else if (error.code === 'INVALID_API_KEY') {
              errorMessage = 'Groq API authentication failed. Please verify your API key.';
            } else if (error.code === 'RATE_LIMITED') {
              errorMessage = 'Groq API rate limit exceeded. Please try again in a moment.';
            } else if (error.code === 'TIMEOUT') {
              errorMessage = 'Request to Groq API timed out. Please try again.';
            } else if (error.code === 'SERVICE_ERROR') {
              errorMessage = 'Groq service is temporarily unavailable. Please try again later.';
            } else if (error.code === 'CONNECTION_ERROR') {
              errorMessage = 'Failed to connect to Groq API. Please check your connection.';
            } else if (error.code === 'INVALID_INPUT') {
              errorMessage = error.message;
            } else {
              errorMessage = error.message;
            }
          } else if (error instanceof Error) {
            if (error.message.includes('timeout')) {
              errorCode = 'TIMEOUT';
              errorMessage = 'Request timed out. Please try again.';
            }
          }

          // Send error as SSE
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            error: errorMessage,
            code: errorCode,
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },

      cancel() {
        isStreamActive = false;
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Chat API Unhandled Error]', error);

    return Response.json(
      {
        error: 'An unexpected error occurred. Please try again later.',
        code: 'UNHANDLED_ERROR'
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
