'use client'

import React from 'react'

export default function TypingIndicator(): React.ReactElement {
  return (
    <div className="flex gap-1 items-center py-1">
      <div 
        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: '0ms', animationDuration: '1s' }}
      />
      <div 
        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: '150ms', animationDuration: '1s' }}
      />
      <div 
        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: '300ms', animationDuration: '1s' }}
      />
    </div>
  )
}
