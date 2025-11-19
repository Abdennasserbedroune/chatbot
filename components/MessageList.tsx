'use client'

import React, { useEffect, useRef } from 'react'
import { Message } from '@/lib/types'

interface MessageListProps {
  messages: Message[]
  streamingText?: string
}

export default function MessageList({ messages, streamingText }: MessageListProps): React.ReactElement {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  if (messages.length === 0 && !streamingText) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Welcome to My Portfolio Assistant
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Ask me anything about my experience, skills, or projects. I'm here to help!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            </div>
          </div>
        ))}
        
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <div className="whitespace-pre-wrap break-words">
                {streamingText}
                <span className="inline-block w-2 h-4 ml-1 bg-gray-900 dark:bg-gray-100 animate-pulse" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
