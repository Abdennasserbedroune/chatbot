'use client'

import { useState, useCallback } from 'react'

export type AssistantStatus = 
  | 'idle'
  | 'typing'
  | 'thinking'
  | 'inspired'
  | 'thoughtful'
  | 'amused'
  | 'engaged'

interface AssistantState {
  current: AssistantStatus
  set: (status: AssistantStatus) => void
  getStatusFromContent: (content: string) => AssistantStatus
}

export function useAssistantState(): AssistantState {
  const [current, setCurrent] = useState<AssistantStatus>('idle')

  const set = useCallback((status: AssistantStatus) => {
    setCurrent(status)
  }, [])

  const getStatusFromContent = useCallback((content: string): AssistantStatus => {
    const lowerContent = content.toLowerCase()
    
    // Check for specific patterns to determine appropriate status
    if (lowerContent.length < 50) {
      return 'typing'
    }
    
    if (
      lowerContent.includes('wow') ||
      lowerContent.includes('amazing') ||
      lowerContent.includes('fantastic') ||
      lowerContent.includes('brilliant') ||
      lowerContent.includes('incredible')
    ) {
      return 'inspired'
    }
    
    if (
      lowerContent.includes('hmm') ||
      lowerContent.includes('interesting') ||
      lowerContent.includes('let me think') ||
      lowerContent.includes('ponder') ||
      lowerContent.includes('consider')
    ) {
      return 'thoughtful'
    }
    
    if (
      lowerContent.includes('haha') ||
      lowerContent.includes('funny') ||
      lowerContent.includes('lol') ||
      lowerContent.includes('😄') ||
      lowerContent.includes('😂')
    ) {
      return 'amused'
    }
    
    if (
      lowerContent.includes('project') ||
      lowerContent.includes('build') ||
      lowerContent.includes('create') ||
      lowerContent.includes('develop') ||
      lowerContent.includes('implement')
    ) {
      return 'engaged'
    }
    
    // Default based on content length
    if (lowerContent.length > 200) {
      return 'thinking'
    }
    
    return 'typing'
  }, [])

  return {
    current,
    set,
    getStatusFromContent,
  }
}