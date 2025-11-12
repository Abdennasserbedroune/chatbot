'use client'

import React from 'react'
import { useTheme } from '@/lib/contexts/ThemeContext'
import ThemeSwitcher from '@/components/theme-switcher'
import MinimalChat from '@/components/chat/minimal-chat'
import TerminalChat from '@/components/chat/terminal-chat'

function ChatContent(): React.ReactElement {
  const { theme } = useTheme()

  return (
    <>
      <ThemeSwitcher />
      {theme === 'minimal' ? <MinimalChat /> : <TerminalChat />}
    </>
  )
}

export default function ChatPage(): React.ReactElement {
  return <ChatContent />
}