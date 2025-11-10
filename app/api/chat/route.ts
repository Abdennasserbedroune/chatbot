/**
 * API Route: POST /api/chat
 * Streams Groq responses with rate limiting, validation, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamChatResponse, GroqClientError } from '@/lib/groqClient';
import { createRateLimiter } from '@/lib/rateLimiter';
import { buildChatMessages } from '@/lib/prompt';
import { validateChatRequest, validateLastMessageIsFromUser } from '@/lib/chatValidation';
import type { ChatRequestPayload, ChatErrorResponse, ChatMessage } from '@/types/chat';

// Create a singleton rate limiter (30 requests per minute per IP - Groq free tier)
const rateLimiter = createRateLimiter({
  maxTokens: 30,
  refillRate: 30 / 60, // 30 tokens per minute
});

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

export async function POST(request: NextRequest): Promise<NextResponse | Response> {
  try {
    // Check rate limit
    const clientIp = getClientIp(request);
    if (!rateLimiter.isAllowed(clientIp, 1)) {
      const retryAfter = rateLimiter.getRetryAfterSeconds(clientIp);
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            retryAfter,
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
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
      return createErrorResponse(400, 'Invalid JSON in request body', 'INVALID_JSON');
    }

    // Validate payload with Zod schema
    const validationResult = validateChatRequest(payload);
    if (!validationResult.valid) {
      const errorDetails = {
        errors: validationResult.errors,
      };
      return createErrorResponse(
        400,
        'Invalid request payload',
        'INVALID_PAYLOAD',
        errorDetails
      );
    }

    // Additional validation: last message must be from user
    const messageValidation = validateLastMessageIsFromUser(payload as ChatRequestPayload);
    if (!messageValidation.valid) {
      return createErrorResponse(
        400,
        'Last message must be from user',
        'INVALID_CONVERSATION'
      );
    }

    const typedPayload = payload as ChatRequestPayload;

    // Extract language and userName from conversation (optional, defaults to 'en')
    const language = typedPayload.language || 'en';
    const userName = typedPayload.userName;

    // Build enhanced messages with profile context
    const lastUserMessage = typedPayload.messages[typedPayload.messages.length - 1].content;
    const conversationHistory = typedPayload.messages.slice(0, -1);

    let enhancedMessages: ChatMessage[];
    try {
      enhancedMessages = await buildChatMessages(lastUserMessage, conversationHistory, {
        language,
      }, userName);
    } catch (error) {
      console.error('[Chat API] Context building error:', error);
      return createErrorResponse(
        500,
        'Failed to build chat context',
        'CONTEXT_ERROR'
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

    return createErrorResponse(
      500,
      'An unexpected error occurred. Please try again later.',
      'UNHANDLED_ERROR'
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
