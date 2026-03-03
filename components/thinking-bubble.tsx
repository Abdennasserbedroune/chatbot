'use client'

import { useState } from 'react'

interface ThinkingBubbleProps {
  content: string
  isStreaming?: boolean
}

export function ThinkingBubble({ content, isStreaming = false }: ThinkingBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="max-w-3xl w-full">
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center gap-2 text-xs text-muted-foreground dark:text-dark-muted-foreground
                   hover:text-foreground dark:hover:text-dark-foreground transition-colors duration-150
                   mb-1 group select-none cursor-pointer"
      >
        {/* Animated icon */}
        <span className="text-sm">
          {isStreaming ? (
            <span className="animate-pulse">🧠</span>
          ) : (
            <span>💭</span>
          )}
        </span>

        <span className="font-medium">
          {isStreaming ? (
            <span className="flex items-center gap-1.5">
              Nasser is thinking
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </span>
          ) : (
            'Thought for a moment'
          )}
        </span>

        {/* Chevron toggle */}
        <span
          className={`transition-transform duration-200 text-xs ml-0.5 ${
            isExpanded ? 'rotate-180' : 'rotate-0'
          }`}
        >
          ▾
        </span>
      </button>

      {isExpanded && content && (
        <div
          className="
            border-l-2 border-border dark:border-dark-border
            pl-3 py-2 ml-1
            text-xs leading-relaxed text-muted-foreground dark:text-dark-muted-foreground
            max-h-48 overflow-y-auto
            whitespace-pre-wrap break-words
            rounded-r-lg
            animate-in fade-in slide-in-from-top-1 duration-200
          "
        >
          {content}
        </div>
      )}
    </div>
  )
}
