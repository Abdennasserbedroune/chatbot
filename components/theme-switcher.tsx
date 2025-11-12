'use client'

import React from 'react'
import { useTheme } from '@/lib/contexts/ThemeContext'

export default function ThemeSwitcher(): React.ReactElement {
  const { theme, setTheme } = useTheme()

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20">
      <button
        onClick={() => setTheme('minimal')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          theme === 'minimal'
            ? 'bg-white text-gray-900'
            : 'text-white hover:bg-white/10'
        }`}
      >
        Minimal
      </button>
      <button
        onClick={() => setTheme('terminal')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          theme === 'terminal'
            ? 'bg-[#00ff41] text-black'
            : 'text-white hover:bg-white/10'
        }`}
      >
        Terminal
      </button>
    </div>
  )
}