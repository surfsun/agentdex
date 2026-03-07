'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Locale, getTranslations } from '@/lib/i18n'

interface ClientSearchProps {
  currentQuery: string
  locale: Locale
}

export default function ClientSearch({ currentQuery, locale }: ClientSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState(currentQuery)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const t = getTranslations(locale)

  useEffect(() => {
    // 从 URL 同步 query 状态
    setQuery(currentQuery)
  }, [currentQuery])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // 清除之前的定时器
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // 设置新的 debounce 定时器 (300ms)
    debounceTimer.current = setTimeout(() => {
      if (value.trim()) {
        router.push(`/?q=${encodeURIComponent(value.trim())}`)
      } else {
        router.push('/')
      }
    }, 300)
  }

  const handleClear = () => {
    setQuery('')
    router.push('/')
  }

  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={t.search.placeholder}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
            aria-label={t.search.clear}
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {t.search.hint}
      </p>
    </div>
  )
}