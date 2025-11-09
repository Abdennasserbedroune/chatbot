import { create } from 'zustand';
import type { ChatStore, Message } from '@/types/chat';

export const useChatStore = create<ChatStore>((set, get) => ({
  // State
  messages: [],
  isTyping: false,
  currentTypingMessage: '',
  pendingMessage: '',
  streamingText: '',
  isStreaming: false,

  // Actions
  addMessage: (messageData) => {
    const newMessage: Message = {
      ...messageData,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  setTyping: (isTyping) => {
    set({ isTyping });
  },

  setPendingMessage: (pendingMessage) => {
    set({ pendingMessage });
  },

  startStreaming: (text) => {
    set({
      streamingText: text,
      isStreaming: true,
    });
  },

  stopStreaming: () => {
    const { streamingText } = get();
    if (streamingText) {
      get().addMessage({
        content: streamingText,
        role: 'assistant',
      });
    }
    set({
      streamingText: '',
      isStreaming: false,
    });
  },

  clearMessages: () => {
    set({
      messages: [],
      isTyping: false,
      currentTypingMessage: '',
      pendingMessage: '',
      streamingText: '',
      isStreaming: false,
    });
  },
}));