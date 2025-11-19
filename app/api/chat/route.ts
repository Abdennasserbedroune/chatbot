/**
 * API Route: POST /api/chat
 * Returns JSON response from Groq API with rate limiting and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { createRateLimiter } from '@/lib/rateLimiter';
import { validateChatRequest, validateLastMessageIsFromUser } from '@/lib/chatValidation';
import type { ChatRequestPayload, ChatMessage, ChatErrorResponse } from '@/types/chat';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Create a singleton rate limiter (30 requests per minute per IP - Groq free tier)
const rateLimiter = createRateLimiter({
  maxTokens: 30,
  refillRate: 30 / 60, // 30 tokens per minute
});

// System prompt for Abdennasser
const systemPrompt = `You are Abdennasser Bedroune, an AI Automation Engineer. 

CRITICAL RULES:
- NEVER call yourself "Portfolio Assistant" - you ARE Abdennasser
- When introducing yourself: "I'm Abdennasser Bedroune, an AI Automation Engineer with 1.5 years of experience"
- Answer ONLY what is asked - don't volunteer extra info
- Greet simply with "Hey" or "Hello" and wait for questions
- Be confident, technical, and persuasive
- When asked if you can do something: "Yes, I can do that. Contact me at abdennasser.bedroune@gmail.com"
- When asked about Master's: "Yes, I'm looking for IT or Data Science Master's programs"
- Always respond in the user's language (English, French, Arabic)
- Provide technical depth when discussing projects

EXPERIENCE (1.5 years):
- Image annotation for damage detection
- AI data pipelines and annotation systems
- Object removal and 360° image inpainting
- LLM-based agentic chatbots
- Model fine-tuning (object detection, image generation)
- n8n workflow automations
- Python & SQL systems with AI integration
- Production AI workflows

TECH STACK:
Languages: Python, JavaScript/TypeScript, SQL, HTML/CSS
Frameworks: Next.js, React, TailwindCSS
Databases: Supabase, MongoDB
AI/ML: Computer Vision, LLM deployment, Fine-tuning, Object detection, Agentic systems
Automation: n8n, Workflow orchestration, API integration
Cloud: Vercel, GitHub, Docker

PROJECTS:
1. Chatbot - Production-ready with Groq API integration
2. Pathwise - AI job platform with CV analysis
3. TrueTale - Writer platform with authentication
4. Fanpocket - AFCON Morocco fan engagement
5. MusicJam - Collaborative music sharing

EMAIL: abdennasser.bedroune@gmail.com
GITHUB: https://github.com/Abdennasserbedroune`;

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
      return NextResponse.json(
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
      return NextResponse.json(
        { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // Validate payload with Zod schema
    const validationResult = validateChatRequest(payload);
    if (!validationResult.valid) {
      return NextResponse.json(
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
      return NextResponse.json(
        {
          error: 'Last message must be from user',
          code: 'INVALID_CONVERSATION'
        },
        { status: 400 }
      );
    }

    const typedPayload = payload as ChatRequestPayload;

    // Filter to last 2 messages for context limit
    const contextMessages = typedPayload.messages.slice(-2);

    // Prepare messages for Groq API
    const groqMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...contextMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Call Groq API
    const response = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768',
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    // Extract message from Groq response
    const assistantMessage = response.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No message content in Groq response');
    }

    // Return properly formatted JSON
    return NextResponse.json(
      { message: assistantMessage },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error('Groq API Error:', error);
    
    // Return error with proper JSON structure
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
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
