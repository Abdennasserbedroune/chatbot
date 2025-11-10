'use client'

import React, { useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

interface ChatComposerProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  isLoading: boolean
}

export function ChatComposer({ input, handleInputChange, isLoading }: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      const form = e.currentTarget.form
      if (form && input.trim()) {
        form.requestSubmit()
      }
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-3 bg-background dark:bg-dark-background rounded-lg border border-border dark:border-dark-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={isLoading}
            rows={1}
            className="flex-1 px-4 py-3 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-foreground dark:text-dark-foreground placeholder-muted-foreground dark:placeholder-dark-muted-foreground disabled:opacity-50"
            style={{
              minHeight: '56px',
              maxHeight: '120px', // 5 lines at 24px each
            }}
            aria-label="Message input"
          />
          
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="m-2 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground dark:text-dark-muted-foreground text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}