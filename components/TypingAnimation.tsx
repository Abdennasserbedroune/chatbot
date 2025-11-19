'use client'

import React, { useState, useEffect } from 'react'

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

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)
      return () => clearTimeout(timer)
    } else if (currentIndex === text.length && onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('')
    setCurrentIndex(0)
  }, [text])

  return (
    <span className="whitespace-pre-wrap break-words">
      {displayedText}
      {currentIndex < text.length && (
        <span className="inline-block w-0.5 h-4 ml-0.5 bg-gray-900 dark:bg-gray-100 animate-pulse" />
      )}
    </span>
  )
}
