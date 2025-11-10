'use client'

import type { AssistantStatus } from '@/lib/useAssistantState'

interface StatusBadgeProps {
  status: AssistantStatus
  isLoading: boolean
}

const statusConfig = {
  typing: {
    text: 'Typing...',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    emoji: null,
  },
  thinking: {
    text: 'Thinking...',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    emoji: null,
  },
  inspired: {
    text: 'Inspired',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    emoji: '✨',
  },
  thoughtful: {
    text: 'Thoughtful',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    emoji: '🤔',
  },
  amused: {
    text: 'Amused',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    emoji: '😄',
  },
  engaged: {
    text: 'Engaged',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    emoji: '💡',
  },
  idle: {
    text: '',
    color: '',
    bgColor: '',
    emoji: null,
  },
}

export function StatusBadge({ status, isLoading }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  if (!isLoading && status === 'idle') {
    return null
  }

  return (
    <div 
      className={`
        inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
        transition-all duration-200 ease-in-out
        ${config.bgColor} ${config.color}
      `}
    >
      {config.emoji && <span className="text-base">{config.emoji}</span>}
      <span>{config.text}</span>
    </div>
  )
}