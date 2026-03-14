'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '@/types/chat'
import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'
import { ThinkingBubble } from './thinking-bubble'

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  streamingText?: string
  streamingThinking?: string
}

const suggestionPrompts = [
  "Quels projets avez-vous réalisés ?",
  "Parlez-moi de votre parcours",
  "Quelles sont vos compétences techniques ?",
  "Pourquoi vous reconvertir vers la tech ?",
]

export function MessageList({ messages, isLoading, streamingText = '', streamingThinking = '' }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const previousMessageCountRef = useRef(messages.length)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleScroll = () => {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
      setShouldAutoScroll(isNearBottom)
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const messageCountIncreased = messages.length > previousMessageCountRef.current
    previousMessageCountRef.current = messages.length
    if (messageCountIncreased && shouldAutoScroll) scrollToBottom()
  }, [messages, shouldAutoScroll])

  useEffect(() => {
    if ((streamingThinking || streamingText) && shouldAutoScroll) scrollToBottom()
  }, [streamingThinking, streamingText, shouldAutoScroll])

  const handleSuggestionClick = (prompt: string) => {
    window.dispatchEvent(new CustomEvent('suggestionClick', { detail: prompt }))
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
      {messages.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground dark:text-dark-foreground">
              Bienvenue sur Abdennasser AI
            </h2>
            <p className="text-lg text-muted-foreground dark:text-dark-muted-foreground max-w-md">
              Je suis ici pour répondre à vos questions sur mon parcours, mes projets et mes compétences. N&apos;hésitez pas à me poser n&apos;importe quelle question !
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

          {isLoading && streamingThinking && !streamingText && (
            <div className="flex justify-start">
              <ThinkingBubble content={streamingThinking} isStreaming={true} />
            </div>
          )}

          {isLoading && !streamingThinking && !streamingText && (
            <div className="flex justify-start">
              <div className="max-w-3xl">
                <TypingIndicator />
              </div>
            </div>
          )}

          {streamingText && (
            <div className="flex justify-start">
              <div className="max-w-3xl px-4 py-3 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-bl-sm">
                <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {streamingText}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
