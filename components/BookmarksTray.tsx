'use client'

import { useState } from 'react'
import { useBookmarks } from '@/lib/useBookmarks'
import { Tool } from '@/lib/tools'
import { Locale, getTranslations } from '@/lib/i18n'

interface BookmarksTrayProps {
  tools: Tool[]
  locale: Locale
}

export default function BookmarksTray({ tools, locale }: BookmarksTrayProps) {
  const { bookmarks, isLoaded, removeBookmark, clearBookmarks } = useBookmarks()
  const [isExpanded, setIsExpanded] = useState(false)
  const t = getTranslations(locale)

  if (!isLoaded || bookmarks.length === 0) return null

  const bookmarkedTools = tools.filter(tool => bookmarks.includes(tool.id))

  return (
    <>
      {/* Floating bookmarks button - bottom right */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2.5 rounded-full shadow-lg transition-all"
          aria-label={t.bookmarks.myBookmarks}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="font-medium">{t.bookmarks.myBookmarks}</span>
          <span className="bg-white text-yellow-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {bookmarks.length}
          </span>
        </button>
      </div>

      {/* Expanded bookmarks panel */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Panel */}
          <div className="fixed bottom-20 right-4 w-80 max-h-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/30">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t.bookmarks.myBookmarks}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({bookmarks.length})
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tools list */}
            <div className="overflow-y-auto max-h-64 p-2">
              {bookmarkedTools.length === 0 ? (
                <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                  <p className="text-sm">{t.bookmarks.empty}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {bookmarkedTools.map(tool => (
                    <div
                      key={tool.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group"
                    >
                      <a
                        href={`/tools/${tool.slug}`}
                        className="flex-1 min-w-0"
                        onClick={() => setIsExpanded(false)}
                      >
                        <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {tool.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {tool.tagline}
                        </div>
                      </a>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          removeBookmark(tool.id)
                        }}
                        className="ml-2 p-1 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t.bookmarks.remove}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <a
                href="/bookmarks"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => setIsExpanded(false)}
              >
                {t.bookmarks.viewAll}
              </a>
              <button
                onClick={() => {
                  if (confirm(t.bookmarks.clearConfirm)) {
                    clearBookmarks()
                  }
                }}
                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                {t.bookmarks.clearAll}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}