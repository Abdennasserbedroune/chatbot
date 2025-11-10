'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { StatusBadge } from './status-badge'
import type { AssistantStatus } from '@/lib/useAssistantState'

interface ChatHeaderProps {
  status: AssistantStatus
  isLoading: boolean
}

export function ChatHeader({ status, isLoading }: ChatHeaderProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check for saved preference or default to light mode
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <header className="w-full bg-card dark:bg-dark-card border-b border-border dark:border-dark-border z-20">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">
              Abdennasser AI
            </h1>
            <p className="text-sm text-muted-foreground dark:text-dark-muted-foreground">
              Your personal assistant
            </p>
            {(isLoading || status !== 'idle') && (
              <div className="mt-1">
                <StatusBadge status={status} isLoading={isLoading} />
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}