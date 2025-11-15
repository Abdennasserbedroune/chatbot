'use client'

import React, { useRef, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { components } from '@/lib/designTokens'

interface ChatComposerProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  isLoading: boolean
  isWaitingForResponse?: boolean
  queueLength?: number
}

export function ChatComposer({ input, handleInputChange, isLoading, isWaitingForResponse = false, queueLength = 0 }: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputBarSpec = components.inputBar
  const sendButtonSpec = components.sendButton
  
  // Check if message sending is locked
  const isLocked = isLoading || isWaitingForResponse

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = Math.min(textarea.scrollHeight, 5 * 24) // 5 lines max
      textarea.style.height = `${scrollHeight}px`
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      // Prevent submission if locked
      if (isLocked || !input.trim()) {
        return
      }
      const form = e.currentTarget.form
      if (form) {
        form.requestSubmit()
      }
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
      <div 
        className="mx-auto"
        style={{ maxWidth: `${900}px` }}
      >
        <div 
          className="relative flex items-end bg-minimal-input-bg dark:bg-minimal-dark-input-bg rounded-xl border border-minimal-border dark:border-minimal-dark-border transition-all duration-200"
          style={{ 
            minHeight: `${inputBarSpec.height}px`,
            padding: `${inputBarSpec.padding}px`,
            borderRadius: `${inputBarSpec.radius}px`,
            gap: `${inputBarSpec.gap}px`,
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isLocked ? "Processing..." : "Ask me anything..."}
            disabled={isLocked}
            rows={1}
            className="flex-1 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-minimal-primary dark:text-minimal-dark-primary placeholder-minimal-secondary dark:placeholder-minimal-dark-secondary disabled:opacity-50"
            style={{
              fontSize: `${16}px`,
              lineHeight: '1.4',
            }}
            aria-label="Message input"
          />
          
          <button
            type="submit"
            disabled={isLocked || !input.trim()}
            className="flex items-center justify-center bg-minimal-primary dark:bg-minimal-dark-primary text-minimal-bg dark:text-minimal-dark-bg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 rounded-full flex-shrink-0"
            style={{
              width: `${sendButtonSpec.size}px`,
              height: `${sendButtonSpec.size}px`,
            }}
            aria-label="Send message"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-minimal-secondary dark:text-minimal-dark-secondary text-center">
          {isLocked ? (
            queueLength > 1 ? `Processing ${queueLength} messages...` : 'Processing your message...'
          ) : (
            'Press Enter to send, Shift+Enter for new line'
          )}
        </div>
      </div>
    </div>
  )
}