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
    setCooldownActive(true)
    setError(null)

    // Set 2-second cooldown (reduced from 3s)
    const cooldownTimeout = setTimeout(() => {
      setCooldownActive(false)
    }, 2000)

    try {
      // Prepare messages for API (last 2 messages only for context)
      const conversationHistory = messages.slice(-2).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const payload = {
        messages: [
          ...conversationHistory,
          { role: 'user' as const, content }
        ],
        language: 'en' as const,
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let accumulatedText = ''
      let streamDone = false

      while (!streamDone) {
        const { done, value } = await reader.read()
        if (done) {
          streamDone = true
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)
              
              if (parsed.type === 'content') {
                accumulatedText += parsed.data
                setStreamingText(accumulatedText)
                setIsTyping(false)
              } else if (parsed.type === 'done') {
                // Add assistant message with typing animation
                const assistantMessage: Message = {
                  id: `assistant-${Date.now()}`,
                  role: 'assistant',
                  content: accumulatedText,
                  timestamp: new Date(),
                  isTyping: true,
                }
                setMessages((prev) => [...prev, assistantMessage])
                setStreamingText('')
                setIsTyping(false)
                accumulatedText = ''
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error || 'Stream error')
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
              if (e instanceof Error && !e.message.includes('Unexpected')) {
                throw e
              }
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      setStreamingText('')
      setIsTyping(false)
      
      // Add error message to chat
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
      clearTimeout(cooldownTimeout)
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
