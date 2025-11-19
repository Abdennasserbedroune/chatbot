'use client'

import React from 'react'
import ChatInterface from '@/components/ChatInterface'
import ThemeToggle from '@/components/ThemeToggle'

export default function ChatPage(): React.ReactElement {
  return (
    <>
      <ThemeToggle />
      <ChatInterface />
    </>
  )
}