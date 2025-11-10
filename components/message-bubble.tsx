'use client'

import { useEffect, useState } from 'react'
import type { ChatMessage } from '@/types/chat'
import { TypingIndicator } from './typing-indicator'

interface MessageBubbleProps {
  message: ChatMessage & { id?: string }
  isLatest: boolean
}

export function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Variable speed character reveal based on content length
  const getTypingSpeed = (content: string) => {
    if (content.length < 50) return 15 // Fast for short responses
    if (content.length > 200) return 50 // Slow for long responses
    return 30 // Medium for regular responses
  }

  useEffect(() => {
    // For streaming messages, show content immediately
    if (message.id === 'streaming') {
      setDisplayedText(message.content)
      setIsTyping(true)
      return
    }

    if (message.role === 'assistant' && isLatest && message.id !== 'streaming') {
      setIsTyping(true)
      setDisplayedText('')
      
      let currentIndex = 0
      const speed = getTypingSpeed(message.content)
      
      const typeNextChar = () => {
        if (currentIndex < message.content.length) {
          setDisplayedText(message.content.slice(0, currentIndex + 1))
          currentIndex++
          setTimeout(typeNextChar, speed)
        } else {
          setIsTyping(false)
        }
      }
      
      typeNextChar()
    } else {
      setDisplayedText(message.content)
      setIsTyping(false)
    }
  }, [message.content, message.role, isLatest, message.id])

  const isUser = message.role === 'user'
  const showTypingIndicator = isUser ? false : (isLatest && isTyping)

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
        <div className="text-sm leading-relaxed">
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div>
              {displayedText}
              {showTypingIndicator && <TypingIndicator inline />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}