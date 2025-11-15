'use client'

import React, { useState, useRef, useEffect } from 'react'
import { detectLanguage } from '@/lib/languageDetection'
import { useAssistantState } from '@/lib/useAssistantState'
import type { ChatMessage } from '@/types/chat'

export default function TerminalChat(): React.ReactElement {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [language, setLanguage] = useState<'en' | 'fr'>('en')
  const [userName, setUserName] = useState<string>('')
  const [messageQueue, setMessageQueue] = useState<string[]>([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const assistantState = useAssistantState()
  const status = assistantState.current
  const getStatusFromContent = assistantState.getStatusFromContent
  const setStatus = assistantState.set

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingText])

  // Process message queue - handles one message at a time
  const processQueue = async () => {
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
  }

  // Send message to API
  const sendMessageToAPI = async (messageContent: string) => {
    try {
      // Set message lock to prevent duplicate submissions
      setIsWaitingForResponse(true)
      
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
      
      // Ensure loading state is cleared and unlock message input
      setIsLoading(false)
      setIsWaitingForResponse(false)
    } catch (error) {
      // Clean up state on error and unlock message input
      setStreamingText('')
      setIsLoading(false)
      setIsWaitingForResponse(false)
      console.error('Error sending message:', error)
      // Re-throw to be handled by the queue processor
      throw error
    }
  }

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
  }, [messageQueue, isProcessingQueue, isLoading])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || isWaitingForResponse) return

    // Add message to queue instead of sending immediately
    setMessageQueue(prev => [...prev, input.trim()])
    setInput('')
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] text-[#00ff41] font-mono flex flex-col">
      {/* Terminal Header */}
      <div className="bg-black/50 border-b border-[#00ff41]/20 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="ml-4 text-[#00ff41]/60">
            user@abdennasser ~ chat
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Welcome Message */}
          {messages.length === 0 && !streamingText && (
            <div className="space-y-2">
              <p className="text-[#00ff41]">
                <span className="text-[#00d9ff]">$</span> Initializing AI chatbot...
              </p>
              <p className="text-[#00ff41]/60">
                System ready. Type your message below.
              </p>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((message, idx) => (
            <div key={idx} className="space-y-1">
              {message.role === 'user' ? (
                <div className="flex items-start gap-2">
                  <span className="text-[#00d9ff]">$</span>
                  <span className="text-white">{message.content}</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#00ff41]">{'>'}</span>
                  <span className="text-[#00ff41]/90">{message.content}</span>
                </div>
              )}
            </div>
          ))}

          {/* Streaming text */}
          {streamingText && (
            <div className="flex items-start gap-2 ml-4">
              <span className="text-[#00ff41]">{'>'}</span>
              <span className="text-[#00ff41]/90">{streamingText}</span>
              <span className="terminal-cursor">█</span>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && !streamingText && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-[#00ff41]">{'>'}</span>
              <span className="text-[#00ff41]/60 animate-pulse">
                Processing...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-black/50 border-t border-[#00ff41]/20 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <span className="text-[#00d9ff]">$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-[#00ff41]/30"
              disabled={isLoading || isWaitingForResponse}
            />
            <button
              type="submit"
              disabled={isLoading || isWaitingForResponse || !input.trim()}
              className="px-4 py-2 bg-[#00ff41]/10 hover:bg-[#00ff41]/20 border border-[#00ff41]/30 rounded text-[#00ff41] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Send
            </button>
          </form>
          <p className="text-[#00ff41]/40 text-xs mt-2">
            Press Enter to send • Powered by Groq
          </p>
        </div>
      </div>
    </div>
  )
}