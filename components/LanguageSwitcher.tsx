'use client'

import { Locale, localeNames, locales } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface LanguageSwitcherProps {
  currentLocale: Locale
}

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleLocaleChange = async (locale: Locale) => {
    // Set cookie
    document.cookie = `locale=${locale};path=/;max-age=31536000`
    setIsOpen(false)
    // Refresh the page to apply the new locale
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition"
        aria-label="Select language"
      >
        <span className="text-base">🌐</span>
        <span className="hidden sm:inline">{localeNames[currentLocale]}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition flex items-center justify-between ${
                  currentLocale === locale ? 'text-blue-600 font-medium' : 'text-gray-700'
                }`}
              >
                <span>{localeNames[locale]}</span>
                {currentLocale === locale && (
                  <span className="text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}