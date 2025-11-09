/**
 * Gemini AI client wrapper
 * Handles initialization, streaming, and error cases
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatMessage } from '@/types/chat';

let cachedClient: GoogleGenerativeAI | null = null;

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GOOGLE_GEMINI_API_KEY environment variable is not set. ' +
        'Please configure it in your .env.local file.'
    );
  }

  if (apiKey.trim().length === 0) {
    throw new Error(
      'GOOGLE_GEMINI_API_KEY environment variable is empty. ' +
        'Please provide a valid API key.'
    );
  }

  return apiKey;
}

export function getGeminiClient(): GoogleGenerativeAI {
  if (!cachedClient) {
    const apiKey = getApiKey();
    cachedClient = new GoogleGenerativeAI(apiKey);
  }
  return cachedClient;
}

export async function streamChatResponse(
  messages: ChatMessage[]
): Promise<AsyncGenerator<string, void, unknown>> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-pro' });

  // Convert messages to Gemini format
  const conversationHistory = messages.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: conversationHistory.slice(0, -1), // All but the last message
  });

  // Stream the response
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'user') {
    throw new Error('Last message must be from the user');
  }

  const result = await chat.sendMessageStream(lastMessage.content);

  // Create async generator that yields chunks
  return (async function* () {
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  })();
}

export async function validateApiKey(): Promise<boolean> {
  try {
    const apiKey = getApiKey();
    // Basic validation: key should be a non-empty string
    return apiKey.length > 0;
  } catch {
    return false;
  }
}
