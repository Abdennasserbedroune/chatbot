'use client'

import { useEffect, useState } from 'react'
import type { ChatMessage } from '@/types/chat'
import { ThinkingBubble } from './thinking-bubble'

interface MessageBubbleProps {
  message: ChatMessage & { id?: string }
  isLatest: boolean
}

export function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const [displayedText, setDisplayedText] = useState('')

  const getTypingSpeed = (content: string) => {
    if (content.length < 50) return 20
    if (content.length > 200) return 40
    return 30
  }

  useEffect(() => {
    if (message.id === 'streaming') {
      setDisplayedText(message.content)
      return
    }

    if (message.role === 'assistant' && isLatest && message.id !== 'streaming') {
      setDisplayedText('')

      let currentIndex = 0
      const speed = getTypingSpeed(message.content)

      const typeNextChar = () => {
        if (currentIndex < message.content.length) {
          setDisplayedText(message.content.slice(0, currentIndex + 1))
          currentIndex++
          setTimeout(typeNextChar, speed)
        }
      }

      typeNextChar()
    } else {
      setDisplayedText(message.content)
    }
  }, [message.content, message.role, isLatest, message.id])

  const isUser = message.role === 'user'

  return (
    <div
      className={`
        flex flex-col ${isUser ? 'items-end' : 'items-start'}
        animate-in slide-in-from-bottom fade-in duration-200
      `}
    >
      {/* Thinking block — shown above assistant bubble if thinking content exists */}
      {!isUser && message.thinking && (
        <div className="mb-2 w-full max-w-3xl">
          <ThinkingBubble content={message.thinking} isStreaming={false} />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`
          max-w-3xl px-4 py-3 rounded-2xl
          ${isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-bl-sm'
          }
        `}
        role={isUser ? 'user-message' : 'assistant-message'}
        aria-label={`${isUser ? 'User' : 'Assistant'} message`}
      >
        <div className="text-sm leading-relaxed break-words">
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {displayedText}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
