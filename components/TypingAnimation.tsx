'use client'

import React, { useState, useEffect, useRef } from 'react'

interface TypingAnimationProps {
  text: string
  speed?: number
  onComplete?: () => void
}

export default function TypingAnimation({ 
  text, 
  speed = 20,
  onComplete 
}: TypingAnimationProps): React.ReactElement {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCompleteRef = useRef(onComplete)

  // Keep onComplete ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Typing effect
  useEffect(() => {
    if (currentIndex < text.length) {
      timerRef.current = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)
      
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }
    } else if (currentIndex === text.length && onCompleteRef.current) {
      onCompleteRef.current()
    }
  }, [currentIndex, text, speed])

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('')
    setCurrentIndex(0)
    
    // Clear any pending timer
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [text])

  return (
    <span className="whitespace-pre-wrap break-words">
      {displayedText}
      {currentIndex < text.length && (
        <span className="inline-block w-0.5 h-4 ml-0.5 bg-gray-900 dark:bg-gray-100 animate-pulse" aria-hidden="true" />
      )}
    </span>
  )
}
