'use client'

import { useEffect, useState } from 'react'
import type { ChatMessage } from '@/types/chat'
import { components } from '@/lib/designTokens'

interface MessageBubbleProps {
  message: ChatMessage & { id?: string }
  isLatest: boolean
}

export function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const [displayedText, setDisplayedText] = useState('')
  const messageSpec = components.message
  const isUser = message.role === 'user'
  const spec = isUser ? messageSpec.user : messageSpec.bot

  // Variable speed character reveal based on content length
  const getTypingSpeed = (content: string) => {
    if (content.length < 50) return 20 // Fast for short responses
    if (content.length > 200) return 40 // Slow for long responses
    return 30 // Medium for regular responses
  }

  useEffect(() => {
    // For streaming messages, show content immediately (character-by-character is handled by streaming)
    if (message.id === 'streaming') {
      setDisplayedText(message.content)
      return
    }

    // For completed assistant messages that are latest, show typing animation
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
      // For user messages and non-latest assistant messages, show content immediately
      setDisplayedText(message.content)
    }
  }, [message.content, message.role, isLatest, message.id])

  return (
    <div 
      className={`flex ${spec.alignment} animate-in slide-in-from-bottom fade-in duration-200`}
    >
      <div 
        className={`
          ${isUser 
            ? 'bg-minimal-user-msg dark:bg-minimal-dark-user-msg text-minimal-primary dark:text-minimal-dark-primary' 
            : 'bg-minimal-bot-msg dark:bg-minimal-dark-bot-msg text-minimal-primary dark:text-minimal-dark-primary'
          }
        `}
        style={{
          padding: `${spec.padding}px`,
          borderRadius: `${spec.radius}px`,
          maxWidth: `${spec.maxWidthPercent}%`,
        }}
        role={isUser ? 'user-message' : 'assistant-message'}
        aria-label={`${isUser ? 'User' : 'Assistant'} message`}
      >
        <div 
          className="break-words"
          style={{
            fontSize: '16px',
            lineHeight: '1.6',
          }}
        >
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