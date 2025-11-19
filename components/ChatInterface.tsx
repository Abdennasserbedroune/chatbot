'use client'

import React, { useState, useCallback } from 'react'
import { Message } from '@/lib/types'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

export default function ChatInterface(): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [cooldownActive, setCooldownActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = useCallback(async (content: string) => {
    if (cooldownActive || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setIsTyping(true)
    setError(null)

    try {
      // Keep only last 2 messages for context
      const contextMessages = messages.slice(-2)
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...contextMessages, { role: 'user', content }],
        }),
      })

      // First check if response is OK
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      // Parse JSON response
      const data = await response.json()

      // Validate response structure
      if (!data.message) {
        throw new Error('Invalid response: missing message field')
      }

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
      console.error('Chat Error:', err)
      setIsTyping(false)
      
      const errorMessage = err instanceof Error ? err.message : 'Sorry, something went wrong. Please try again.'
      setError(errorMessage)
      
      // Show user-friendly error
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
      // 2 second cooldown minimum
      setTimeout(() => {
        setIsLoading(false)
        setCooldownActive(false)
      }, 2000)
    }
  }, [messages, isLoading, cooldownActive])

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border-b border-red-200 dark:border-red-800 px-4 py-2 text-red-800 dark:text-red-200 text-sm text-center">
          {error}
        </div>
      )}
      <MessageList messages={messages} streamingText={streamingText} isTyping={isTyping} />
      <ChatInput 
        onSend={handleSend} 
        disabled={cooldownActive || isLoading} 
        isLoading={isLoading}
      />
    </div>
  )
}
