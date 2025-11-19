'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Message } from '@/lib/types'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

export default function ChatInterface(): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [cooldownActive, setCooldownActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Ref to track current request and cleanup
  const abortControllerRef = useRef<AbortController | null>(null)
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      // Clear cooldown timer
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current)
      }
    }
  }, [])

  const handleSend = useCallback(async (content: string) => {
    // Prevent multiple simultaneous requests
    if (cooldownActive || isLoading) return

    // Validate input
    if (!content.trim() || content.length > 4096) {
      setError(content.length > 4096 ? 'Message is too long (max 4096 characters)' : 'Message cannot be empty')
      return
    }

    // Clear any previous error
    setError(null)

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }
    
    // Update state in correct order to prevent race conditions
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setIsTyping(true)
    setCooldownActive(true)

    // Create new abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      // Get context from current messages state (use functional update to get latest)
      const contextMessages = await new Promise<Message[]>((resolve) => {
        setMessages((prev) => {
          resolve(prev.slice(-2))
          return prev
        })
      })
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...contextMessages.filter(m => m.role !== 'assistant' || !m.content.startsWith('Error:')), { role: 'user', content: content.trim() }],
        }),
        signal: abortController.signal,
      })

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return
      }

      // First check if response is OK
      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          throw new Error(`Server error: ${response.status}`)
        }
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      // Parse JSON response
      const data = await response.json()

      // Validate response structure
      if (!data.message || typeof data.message !== 'string') {
        throw new Error('Invalid response: missing or invalid message field')
      }

      // Stop typing indicator
      setIsTyping(false)

      // Create assistant message with typing animation
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        isTyping: true,
      }

      setMessages((prev) => [...prev, assistantMessage])

    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      console.error('Chat Error:', err)
      setIsTyping(false)
      
      const errorMessage = err instanceof Error ? err.message : 'Sorry, something went wrong. Please try again.'
      setError(errorMessage)
      
      // Show user-friendly error message
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: err instanceof Error 
          ? `Error: ${err.message}` 
          : 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])

    } finally {
      setIsLoading(false)
      
      // Clear abort controller
      abortControllerRef.current = null
      
      // 2 second cooldown minimum - clear previous timer
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current)
      }
      
      cooldownTimerRef.current = setTimeout(() => {
        setCooldownActive(false)
        cooldownTimerRef.current = null
      }, 2000)
    }
  }, [isLoading, cooldownActive])

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border-b border-red-200 dark:border-red-800 px-4 py-2 text-red-800 dark:text-red-200 text-sm text-center" role="alert">
          {error}
        </div>
      )}
      <MessageList messages={messages} isTyping={isTyping} />
      <ChatInput 
        onSend={handleSend} 
        disabled={cooldownActive || isLoading} 
        isLoading={isLoading}
      />
    </div>
  )
}
