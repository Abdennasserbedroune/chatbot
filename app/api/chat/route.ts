/**
 * API Route: POST /api/chat
 * Streams Gemini responses with rate limiting and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamChatResponse } from '@/lib/geminiClient';
import { createRateLimiter } from '@/lib/rateLimiter';
import { buildChatMessages } from '@/lib/prompt';
import type { ChatRequestPayload, ChatErrorResponse, ChatMessage } from '@/types/chat';

// Create a singleton rate limiter (10 requests per minute per IP)
const rateLimiter = createRateLimiter({
  maxTokens: 10,
  refillRate: 10 / 60, // 10 tokens per minute
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

function validateRequestPayload(payload: unknown): payload is ChatRequestPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const p = payload as Record<string, unknown>;

  if (!Array.isArray(p.messages)) {
    return false;
  }

  if (p.messages.length === 0) {
    return false;
  }

  return p.messages.every(
    (msg): msg is ChatMessage =>
      msg &&
      typeof msg === 'object' &&
      'role' in msg &&
      'content' in msg &&
      typeof (msg as Record<string, unknown>).role === 'string' &&
      typeof (msg as Record<string, unknown>).content === 'string' &&
      ((msg as Record<string, unknown>).role === 'user' ||
        (msg as Record<string, unknown>).role === 'assistant')
  );
}

export async function POST(request: NextRequest): Promise<NextResponse | Response> {
  try {
    // Check rate limit
    const clientIp = getClientIp(request);
    if (!rateLimiter.isAllowed(clientIp, 1)) {
      return createErrorResponse(
        429,
        'Rate limit exceeded. Please try again later.',
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Parse request body
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return createErrorResponse(400, 'Invalid JSON in request body', 'INVALID_JSON');
    }

    // Validate payload
    if (!validateRequestPayload(payload)) {
      return createErrorResponse(
        400,
        'Invalid request payload. Expected: { messages: Array<{role, content}> }',
        'INVALID_PAYLOAD'
      );
    }

    // Ensure last message is from user
    if (payload.messages[payload.messages.length - 1].role !== 'user') {
      return createErrorResponse(
        400,
        'Last message must be from user',
        'INVALID_CONVERSATION'
      );
    }

    // Extract language from conversation (optional, defaults to 'en')
    const language = payload.language;

    // Build enhanced messages with profile context
    const lastUserMessage = payload.messages[payload.messages.length - 1].content;
    const conversationHistory = payload.messages.slice(0, -1);

    let enhancedMessages: ChatMessage[];
    try {
      enhancedMessages = await buildChatMessages(lastUserMessage, conversationHistory, {
        language: language || 'en',
      });
    } catch (error) {
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

          // Log error for debugging
          console.error('[Chat API Error]', error);

          // Determine error response
          let errorMessage = 'An unexpected error occurred while processing your request.';
          let errorCode = 'INTERNAL_ERROR';

          if (error instanceof Error) {
            if (error.message.includes('GOOGLE_GEMINI_API_KEY')) {
              errorMessage =
                'AI service is not available. Please contact support if the problem persists.';
              errorCode = 'API_KEY_ERROR';
            } else if (error.message.includes('API error')) {
              errorMessage = 'The AI service returned an error. Please try again later.';
              errorCode = 'API_ERROR';
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
