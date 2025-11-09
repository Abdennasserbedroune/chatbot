/**
 * Chat Page
 * Main chat interface with typing animations and responsive design
 */

import type { ReactElement } from 'react';
import Head from 'next/head';
import { ChatLayout, MessageList, ChatComposer } from '@/components/chat';
import { useChatStore } from '@/lib/chatStore';

export default function Chat(): ReactElement {
  const {
    messages,
    isTyping,
    streamingText,
    isStreaming,
    addMessage,
    setTyping,
    startStreaming,
    stopStreaming,
  } = useChatStore();

  const handleSendMessage = async (content: string) => {
    // Add user message
    addMessage({
      content,
      role: 'user',
    });

    // Simulate bot typing
    setTyping(true);
    
    // Simulate a response after a delay
    setTimeout(() => {
      const responses = [
        "That's an interesting question! Let me think about that...",
        "I understand what you're asking. Here's what I think...",
        "Great point! Let me share my thoughts on this topic...",
        "Thanks for sharing that with me. I'd be happy to help...",
        "That's a thoughtful message. Let me respond to that...",
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      startStreaming(randomResponse);
      
      // Simulate streaming effect
      setTimeout(() => {
        stopStreaming();
        setTyping(false);
      }, 2000 + Math.random() * 1000);
    }, 1000 + Math.random() * 1000);
  };

  return (
    <>
      <Head>
        <title>Chat Assistant</title>
        <meta name="description" content="AI-powered chat assistant" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ChatLayout>
        <MessageList
          messages={messages}
          isTyping={isTyping}
          typingMessage={streamingText}
        />
        <ChatComposer
          onSendMessage={handleSendMessage}
          disabled={isStreaming}
          placeholder="Type your message..."
        />
      </ChatLayout>
    </>
  );
}
