'use client'

import Link from 'next/link'
import { Tool } from '@/lib/tools'
import { Locale, getTranslations } from '@/lib/i18n'
import { useCompare } from '@/lib/useCompare'
import { useBookmarks } from '@/lib/useBookmarks'
import { useIdentity } from '@/components/IdentityProvider'
import ClientToolCard from './ClientToolCard'
import CompareTray from './CompareTray'
import BookmarksTray from './BookmarksTray'
import { useMemo } from 'react'

interface ClientCompareProps {
  tools: Tool[]
  locale: Locale
  bookmarkedFilter?: boolean
}

// Helper to get alternative tools (same category, excluding self)
function getAlternativeTools(tool: Tool, allTools: Tool[], maxCount: number = 2): Tool[] {
  return allTools
    .filter(t => t.category === tool.category && t.id !== tool.id)
    .slice(0, maxCount)
}

export default function ClientCompare({ tools, locale, bookmarkedFilter }: ClientCompareProps) {
  const { selectedTools, toggleCompare, isSelected, canAddMore, removeFromCompare, clearCompare, getShareUrl } = useCompare()
  const { bookmarks, isLoaded: bookmarksLoaded } = useBookmarks()
  const { identity } = useIdentity()
  const t = getTranslations(locale)

  // Filter by bookmarks if needed
  const displayTools = bookmarkedFilter && bookmarksLoaded
    ? tools.filter(tool => bookmarks.includes(tool.id))
    : tools

  // Get selected tool objects
  const selectedToolObjects = tools.filter(t => selectedTools.includes(t.id))

  // Pre-compute alternatives for each tool
  const toolsWithAlternatives = useMemo(() => {
    return displayTools.map(tool => ({
      tool,
      alternatives: getAlternativeTools(tool, tools)
    }))
  }, [displayTools, tools])

  return (
    <>
      {/* Show message when bookmarked filter is active but no bookmarks */}
      {bookmarkedFilter && bookmarksLoaded && displayTools.length === 0 && (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <p>{t.bookmarks.empty}</p>
          <Link href="/" className="text-blue-500 hover:underline mt-2 inline-block">
            {locale === 'zh-CN' ? '浏览所有工具' : 'Browse all tools'}
          </Link>
        </div>
      )}
      
      {/* Tool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {toolsWithAlternatives.map(({ tool, alternatives }) => (
          <ClientToolCard
            key={tool.id}
            tool={tool}
            locale={locale}
            identity={identity}
            compareSelected={isSelected(tool.id)}
            canAddToCompare={canAddMore || isSelected(tool.id)}
            onToggleCompare={toggleCompare}
            alternatives={alternatives}
          />
        ))}
      </div>

      {/* Compare Tray */}
      <CompareTray
        selectedTools={selectedToolObjects}
        onRemove={removeFromCompare}
        onClear={clearCompare}
        locale={locale}
        getShareUrl={getShareUrl}
      />

      {/* Bookmarks Tray */}
      <BookmarksTray tools={tools} locale={locale} />

      {/* Bottom padding when tray is visible */}
      {selectedTools.length > 0 && <div className="h-20" />}
    </>
  )
}