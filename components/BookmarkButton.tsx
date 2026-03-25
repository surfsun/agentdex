'use client'

import { useBookmarks } from '@/lib/useBookmarks'

interface BookmarkButtonProps {
  toolId: string
  toolName: string
}

export default function BookmarkButton({ toolId, toolName }: BookmarkButtonProps) {
  const { isLoaded, isBookmarked, toggleBookmark } = useBookmarks()

  if (!isLoaded) {
    return (
      <button
        className="p-1.5 rounded-lg text-gray-400"
        aria-label="Loading"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </button>
    )
  }

  const bookmarked = isBookmarked(toolId)

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleBookmark(toolId)
      }}
      className={`p-1.5 rounded-lg transition-colors ${
        bookmarked
          ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
          : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-50'
      }`}
      aria-label={bookmarked ? `Remove ${toolName} from bookmarks` : `Add ${toolName} to bookmarks`}
      title={bookmarked ? '取消收藏' : '收藏'}
    >
      <svg 
        className="w-5 h-5" 
        fill={bookmarked ? 'currentColor' : 'none'} 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
        />
      </svg>
    </button>
  )
}