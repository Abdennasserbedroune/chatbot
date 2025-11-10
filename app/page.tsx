'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { detectLanguage } from '@/lib/languageDetection'
import { ChatHeader } from '@/components/chat-header'
import { MessageList } from '@/components/message-list'
import { ChatComposer } from '@/components/chat-composer'
import { TypingIndicator } from '@/components/typing-indicator'
import { useAssistantState } from '@/lib/useAssistantState'
import type { ChatMessage } from '@/types/chat'

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [language, setLanguage] = useState<'en' | 'fr'>('en')
  const [userName, setUserName] = useState<string>('')
  const [lastMessageRef, setLastMessageRef] = useState<string>('')
  
  const assistantState = useAssistantState()
  const status = assistantState.current
  const getStatusFromContent = assistantState.getStatusFromContent
  const setStatus = assistantState.set

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }, [])

  const handleSendMessage = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return

      // Detect language from user message
      const detectedLang = detectLanguage(input)
      if (detectedLang !== language) {
        setLanguage(detectedLang)
      }

      // Update assistant status based on input
      const newStatus = getStatusFromContent(input)
      setStatus(newStatus)

      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: input,
      }
      setMessages(prev => [...prev, userMessage])
      setLastMessageRef(input)
      setInput('')
      setIsLoading(true)
      setStreamingText('')

      try {
        // Build conversation history
        const conversationHistory: ChatMessage[] = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        // Send to API
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
        }
      } catch (err) {
        console.error('Chat error:', err)
        // You could add error state handling here
      } finally {
        setIsLoading(false)
        setStreamingText('')
      }
    },
    [messages, language, userName, input, isLoading, getStatusFromContent, setStatus]
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

      <footer className="border-t border-border dark:border-dark-border bg-card dark:bg-dark-card">
        <form onSubmit={handleSendMessage} className="relative">
          <ChatComposer
            input={input}
            handleInputChange={handleInputChange}
            isLoading={isLoading}
          />
          
          {isLoading && (
            <TypingIndicator />
          )}
        </form>
      </footer>
    </div>
  )
}