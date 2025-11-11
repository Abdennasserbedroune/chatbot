'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const previousMessageCountRef = useRef(messages.length)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Handle scroll events - disable auto-scroll when user scrolls up
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      // Check if user has scrolled near the bottom
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 100
      setShouldAutoScroll(isNearBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll only on new messages, not when user scrolls up
  useEffect(() => {
    const messageCountIncreased = messages.length > previousMessageCountRef.current
    previousMessageCountRef.current = messages.length

    if (messageCountIncreased && shouldAutoScroll) {
      scrollToBottom()
    }
  }, [messages, shouldAutoScroll])

  const handleSuggestionClick = (prompt: string) => {
    // Create a custom event that the parent can listen for
    const event = new CustomEvent('suggestionClick', { detail: prompt })
    window.dispatchEvent(event)
  }

  return (
    <div 
      id="messages-container"
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6"
      role="region"
      aria-label="Messages"
      aria-live="polite"
      aria-atomic="false"
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
        <div className="flex flex-col gap-6">
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
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
}