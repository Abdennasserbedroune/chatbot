'use client'

import { components } from '@/lib/designTokens'

interface TypingIndicatorProps {
  inline?: boolean
}

export function TypingIndicator({ inline = false }: TypingIndicatorProps) {
  const indicatorSpec = components.typingIndicator
  const dotSize = indicatorSpec.dotSize
  
  const containerClass = inline 
    ? 'inline-flex items-center gap-1 ml-1' 
    : 'flex items-center gap-1 px-4 py-3'

  return (
    <div className={containerClass} aria-label="Typing indicator">
      <div className="flex gap-1">
        {Array.from({ length: indicatorSpec.dots }).map((_, i) => (
          <div 
            key={i}
            className="bg-minimal-secondary dark:bg-minimal-dark-secondary rounded-full animate-pulse"
            style={{ 
              width: `${dotSize}px`, 
              height: `${dotSize}px`,
              animationDelay: `${i * 150}ms`, 
              animationDuration: '1.4s' 
            }}
          />
        ))}
      </div>
    </div>
  )
}