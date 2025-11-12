'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { detectLanguage } from '@/lib/languageDetection'
import { ChatHeader } from '@/components/chat-header'
import { MessageList } from '@/components/message-list'
import { ChatComposer } from '@/components/chat-composer'
import { useAssistantState } from '@/lib/useAssistantState'
import type { ChatMessage } from '@/types/chat'

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [language, setLanguage] = useState<'en' | 'fr'>('en')
  const [userName, setUserName] = useState<string>('')
  const [messageQueue, setMessageQueue] = useState<string[]>([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  
  const assistantState = useAssistantState()
  const status = assistantState.current
  const getStatusFromContent = assistantState.getStatusFromContent
  const setStatus = assistantState.set

  // Process message queue - handles one message at a time
  const processQueue = useCallback(async () => {
    if (messageQueue.length === 0 || isProcessingQueue) {
      return
    }

    setIsProcessingQueue(true)
    const currentMessage = messageQueue[0]
    
    try {
      await sendMessageToAPI(currentMessage)
    } catch (error) {
      console.error('Error processing queued message:', error)
    } finally {
      // Remove the processed message from queue (whether success or failure)
      setMessageQueue(prev => prev.slice(1))
      setIsProcessingQueue(false)
    }
  }, [messageQueue, isProcessingQueue])

  // Send message to API
  const sendMessageToAPI = useCallback(async (messageContent: string) => {
    try {
      // Detect language from user message
      const detectedLang = detectLanguage(messageContent)
      if (detectedLang !== language) {
        setLanguage(detectedLang)
      }

      // Update assistant status based on input
      const newStatus = getStatusFromContent(messageContent)
      setStatus(newStatus)

      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: messageContent,
      }
      setMessages(prev => [...prev, userMessage])
      setIsLoading(true)
      setStreamingText('')

      // Build conversation history (excluding system messages)
      const conversationHistory: ChatMessage[] = messages
        .filter(msg => msg.role !== 'system')
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

      // Send to API with new messages array that includes the user message
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...conversationHistory, userMessage],
          language: detectedLang,
          userName: userName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'API request failed')
      }

      if (!response.body) {
        throw new Error('No response stream available')
      }

      // Handle SSE streaming
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      let streaming = true
      while (streaming) {
        const { done, value } = await reader.read()

        if (done) {
          streaming = false
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6)
            try {
              const data = JSON.parse(jsonStr)

              if (data.type === 'content') {
                // For streaming, the data comes character by character, so just append it
                accumulatedText += data.data
                setStreamingText(accumulatedText)
              } else if (data.type === 'done') {
                streaming = false
                break
              } else if (data.type === 'error') {
                throw new Error(data.error)
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError)
            }
          }
        }
      }

      // Add assistant message
      if (accumulatedText) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: accumulatedText,
        }
        setMessages(prev => [...prev, assistantMessage])
        // Clear streaming text to prevent duplicate display
        setStreamingText('')
      }
      
      // Ensure loading state is cleared
      setIsLoading(false)
    } catch (error) {
      // Clean up state on error
      setStreamingText('')
      setIsLoading(false)
      console.error('Error sending message:', error)
      // Re-throw to be handled by the queue processor
      throw error
    }
  }, [messages, language, userName, getStatusFromContent, setStatus])

  // Reset loading state when streaming completes
  useEffect(() => {
    if (!streamingText && isLoading) {
      setIsLoading(false)
    }
  }, [streamingText, isLoading])

  // Trigger queue processing when messages are added
  useEffect(() => {
    if (messageQueue.length > 0 && !isProcessingQueue && !isLoading) {
      processQueue()
    }
  }, [messageQueue, isProcessingQueue, isLoading, processQueue])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }, [])

  const handleSendMessage = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!input.trim() || isLoading) {
        return
      }

      // Add message to queue instead of sending immediately
      setMessageQueue(prev => [...prev, input.trim()])
      setInput('')
    },
    [input, isLoading]
  )

  // Extract user name from conversation if needed
  useEffect(() => {
    const extractUserName = () => {
      const userMessages = messages.filter(msg => msg.role === 'user')
      const firstMessage = userMessages[0]?.content || ''
      
      // Simple name extraction - look for patterns like "I am [Name]" or "My name is [Name]"
      const namePatterns = [
        /(?:i am|i'm|my name is)\s+([a-zA-Z]+)/i,
        /^(?:hi|hello|hey),?\s*i'm\s+([a-zA-Z]+)/i,
        /^(?:hi|hello|hey),?\s*my name is\s+([a-zA-Z]+)/i,
      ]
      
      for (const pattern of namePatterns) {
        const match = firstMessage.match(pattern)
        if (match && match[1]) {
          setUserName(match[1])
          break
        }
      }
    }

    if (messages.length > 0 && !userName) {
      extractUserName()
    }
  }, [messages, userName])

  // Reset status when loading completes
  useEffect(() => {
    if (!isLoading && status !== 'idle') {
      setTimeout(() => {
        setStatus('idle')
      }, 1000)
    }
  }, [isLoading, status, setStatus])

  // Handle suggestion clicks from the empty state
  useEffect(() => {
    const handleSuggestionClick = (event: CustomEvent) => {
      setInput(event.detail)
    }

    window.addEventListener('suggestionClick', handleSuggestionClick as EventListener)
    return () => {
      window.removeEventListener('suggestionClick', handleSuggestionClick as EventListener)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background dark:bg-dark-background">
      <ChatHeader
        status={status}
        isLoading={isLoading}
      />
      
      <main className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          streamingText={streamingText}
        />
      </main>

      <footer className="border-t border-border dark:border-dark-border bg-card dark:bg-dark-card z-10">
        <form onSubmit={handleSendMessage} className="w-full">
          <ChatComposer
            input={input}
            handleInputChange={handleInputChange}
            isLoading={isLoading}
            queueLength={messageQueue.length}
          />
        </form>
      </footer>
    </div>
  )
}