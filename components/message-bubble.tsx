'use client'

import { useEffect, useState } from 'react'
import type { ChatMessage } from '@/types/chat'

interface MessageBubbleProps {
  message: ChatMessage & { id?: string }
  isLatest: boolean
}

export function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const [displayedText, setDisplayedText] = useState('')

  // Variable speed character reveal based on content length
  const getTypingSpeed = (content: string) => {
    if (content.length < 50) return 20 // Fast for short responses
    if (content.length > 200) return 40 // Slow for long responses
    return 30 // Medium for regular responses
  }

  useEffect(() => {
    // For streaming messages, show character-by-character reveal as content arrives
    if (message.id === 'streaming') {
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
      return
    }

    // For completed assistant messages (latest), show typing animation
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
      // For user messages and older assistant messages, show full content immediately
      setDisplayedText(message.content)
    }
  }, [message.content, message.role, isLatest, message.id])

  const isUser = message.role === 'user'

  return (
    <div 
      className={`
        flex ${isUser ? 'justify-end' : 'justify-start'}
        animate-in slide-in-from-bottom fade-in duration-200
      `}
    >
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