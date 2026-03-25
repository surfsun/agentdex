'use client'

import { useBookmarks } from '@/lib/useBookmarks'
import { Locale, getTranslations } from '@/lib/i18n'

interface BookmarksFilterProps {
  locale: Locale
  activeFilters: {
    category: string
    agent_friendly: boolean
    open_source: boolean
    pricing: string
    q: string
    sort: string
  }
}

export default function BookmarksFilter({ locale, activeFilters }: BookmarksFilterProps) {
  const { bookmarks, isLoaded } = useBookmarks()
  const t = getTranslations(locale)

  if (!isLoaded || bookmarks.length === 0) return null

  // Build URL with bookmarked filter
  const buildBookmarkedUrl = (isBookmarked: boolean) => {
    const params = new URLSearchParams()
    
    if (activeFilters.category && activeFilters.category !== 'all') {
      params.set('category', activeFilters.category)
    }
    if (activeFilters.agent_friendly) {
      params.set('agent_friendly', 'true')
    }
    if (activeFilters.open_source) {
      params.set('open_source', 'true')
    }
    if (activeFilters.pricing) {
      params.set('pricing', activeFilters.pricing)
    }
    if (activeFilters.q) {
      params.set('q', activeFilters.q)
    }
    if (activeFilters.sort) {
      params.set('sort', activeFilters.sort)
    }
    if (isBookmarked) {
      params.set('bookmarked', 'true')
    }
    
    const queryString = params.toString()
    return queryString ? `/?${queryString}` : '/'
  }

  const isBookmarkedFilter = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('bookmarked') === 'true'

  return (
    <a
      href={buildBookmarkedUrl(!isBookmarkedFilter)}
      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
        isBookmarkedFilter
          ? 'bg-yellow-500 text-white border-yellow-500'
          : 'bg-white text-gray-600 border-gray-300 hover:border-yellow-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:border-yellow-500'
      }`}
    >
      {t.bookmarks.filter} <span className="text-xs opacity-60">({bookmarks.length})</span>
    </a>
  )
}