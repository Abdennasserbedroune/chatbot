'use client'

import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/types/chat'
import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  streamingText?: string
}

const suggestionPrompts = [
  "What projects have you worked on?",
  "Tell me about your background",
  "What are your hobbies?",
  "How can you help me today?",
]

export function MessageList({ messages, isLoading, streamingText = '' }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSuggestionClick = (prompt: string) => {
    // Create a custom event that the parent can listen for
    const event = new CustomEvent('suggestionClick', { detail: prompt })
    window.dispatchEvent(event)
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      role="region"
      aria-label="Messages"
      aria-live="polite"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground dark:text-dark-foreground">
              Welcome to Abdennasser AI
            </h2>
            <p className="text-lg text-muted-foreground dark:text-dark-muted-foreground max-w-md">
              I'm here to help you with questions about my background, projects, and interests. Feel free to ask me anything!
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
            {suggestionPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSuggestionClick(prompt)}
                className="p-4 text-left rounded-lg border border-border dark:border-dark-border 
                         hover:bg-accent hover:text-accent-foreground 
                         transition-all duration-200 hover:shadow-md
                         text-sm text-muted-foreground dark:text-dark-muted-foreground
                         hover:text-foreground dark:hover:text-dark-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id || index}
              message={message}
              isLatest={index === messages.length - 1}
            />
          ))}
          
          {streamingText && (
            <div className="flex justify-start">
              <div className="max-w-3xl">
                <MessageBubble
                  message={{ role: 'assistant', content: streamingText, id: 'streaming' }}
                  isLatest={true}
                />
              </div>
            </div>
          )}
          
          {isLoading && !streamingText && (
            <div className="flex justify-start">
              <div className="max-w-3xl">
                <TypingIndicator />
              </div>
            </div>
          )}
        </>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
}