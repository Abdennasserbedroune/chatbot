'use client'

interface TypingIndicatorProps {
  inline?: boolean
}

export function TypingIndicator({ inline = false }: TypingIndicatorProps) {
  const containerClass = inline 
    ? 'inline-flex items-center gap-1 ml-1' 
    : 'flex items-center gap-1 px-4 py-3'

  return (
    <div className={containerClass} aria-label="Typing indicator">
      <div className="flex gap-1">
        <div 
          className="w-2 h-2 bg-muted-foreground dark:bg-dark-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
        />
        <div 
          className="w-2 h-2 bg-muted-foreground dark:bg-dark-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: '150ms', animationDuration: '1.4s' }}
        />
        <div 
          className="w-2 h-2 bg-muted-foreground dark:bg-dark-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: '300ms', animationDuration: '1.4s' }}
        />
      </div>
    </div>
  )
}