export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequestPayload {
  messages: ChatMessage[];
  conversationId?: string;
  language?: 'en' | 'fr';
}

export interface ChatErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  currentTypingMessage: string;
  pendingMessage: string;
  streamingText: string;
  isStreaming: boolean;
  language: 'en' | 'fr';
  error: string | null;
}

export interface ChatActions {
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setTyping: (isTyping: boolean) => void;
  setPendingMessage: (message: string) => void;
  startStreaming: (text: string) => void;
  stopStreaming: () => void;
  clearMessages: () => void;
  setLanguage: (language: 'en' | 'fr') => void;
  setError: (error: string | null) => void;
}

export type ChatStore = ChatState & ChatActions;

export interface TypingIndicatorProps {
  isVisible: boolean;
  message?: string;
}

export interface MessageBubbleProps {
  message: Message;
  isTyping?: boolean;
}

export interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  typingMessage?: string;
}

export interface ChatComposerProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

import type { ReactNode } from 'react';

export interface ChatLayoutProps {
  children: ReactNode;
  className?: string;
}