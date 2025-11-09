/**
 * Ollama AI client wrapper
 * Handles local Ollama API communication with streaming support
 */

import type { ChatMessage } from '@/types/chat';

const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
const DEFAULT_MODEL = 'phi';

async function streamOllamaChat(messages: ChatMessage[]): Promise<AsyncGenerator<string, void, unknown>> {
  // Prepare the request payload
  const payload = {
    model: DEFAULT_MODEL,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    stream: true,
  };

  let response: Response;
  try {
    response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `Failed to connect to Ollama API at ${OLLAMA_API_URL}. Make sure Ollama is running. Details: ${errorMsg}`
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Ollama API returned status ${response.status}: ${errorText || 'Unknown error'}`
    );
  }

  if (!response.body) {
    throw new Error('Ollama API response body is empty');
  }

  // Create async generator that streams chunks from the response
  return (async function* () {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1]; // Keep incomplete line in buffer

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          try {
            const data = JSON.parse(line);
            if (data.response) {
              yield data.response;
            }
          } catch {
            // Ignore parsing errors for malformed lines
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer);
          if (data.response) {
            yield data.response;
          }
        } catch {
          // Ignore parsing errors
        }
      }
    } finally {
      reader.releaseLock();
    }
  })();
}

export async function streamChatResponse(
  messages: ChatMessage[]
): Promise<AsyncGenerator<string, void, unknown>> {
  // Validate that last message is from user
  if (messages.length === 0) {
    throw new Error('Messages array cannot be empty');
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'user') {
    throw new Error('Last message must be from the user');
  }

  return streamOllamaChat(messages);
}

export async function validateConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/../tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
