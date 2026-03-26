'use client'

import { useState, useCallback } from 'react'

// Helper to get initial theme (called only on client)
function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return false
  
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
  
  // Apply theme on initial load
  if (isDark) {
    document.documentElement.classList.add('dark')
  }
  
  return isDark
}

// Track if we've initialized
let themeInitialized = false

export default function ThemeSwitcher() {
  const [isDark, setIsDark] = useState(() => {
    if (themeInitialized || typeof window === 'undefined') return false
    themeInitialized = true
    return getInitialTheme()
  })
  const mounted = typeof window !== 'undefined'

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newIsDark = !prev

      if (newIsDark) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }

      return newIsDark
    })
  }, [])

  // 避免水合不匹配
  if (!mounted) {
    return (
      <button
        className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-100 transition"
        aria-label="Toggle theme"
      >
        <span className="text-base">🌙</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="text-base">{isDark ? '☀️' : '🌙'}</span>
    </button>
  )
}