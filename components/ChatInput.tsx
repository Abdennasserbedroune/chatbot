'use client'

import React, { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled: boolean
  isLoading: boolean
}

const MAX_INPUT_LENGTH = 4096

export default function ChatInput({ onSend, disabled, isLoading }: ChatInputProps): React.ReactElement {
  const [input, setInput] = useState('')
  const [charCount, setCharCount] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSend = useCallback(() => {
    const trimmedInput = input.trim()
    if (trimmedInput && !disabled && trimmedInput.length <= MAX_INPUT_LENGTH) {
      onSend(trimmedInput)
      setInput('')
      setCharCount(0)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.focus()
      }
    }
  }, [input, disabled, onSend])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= MAX_INPUT_LENGTH) {
      setInput(newValue)
      setCharCount(newValue.length)
    }
  }, [])

  const isOverLimit = charCount > MAX_INPUT_LENGTH
  const canSend = input.trim() && !disabled && !isOverLimit

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={disabled}
              rows={1}
              maxLength={MAX_INPUT_LENGTH}
              aria-label="Message input"
              aria-describedby="char-count"
              className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ maxHeight: '200px', minHeight: '48px' }}
            />
            {charCount > 0 && (
              <div 
                id="char-count"
                className={`absolute bottom-1 right-2 text-xs ${
                  isOverLimit 
                    ? 'text-red-600 dark:text-red-400' 
                    : charCount > MAX_INPUT_LENGTH * 0.9
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
                aria-live="polite"
              >
                {charCount}/{MAX_INPUT_LENGTH}
              </div>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Send message"
            type="button"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            )}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Shift + Enter</kbd> for new line
        </div>
      </div>
    </div>
  )
}
