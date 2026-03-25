'use client'

import { useBookmarks } from '@/lib/useBookmarks'
import { Tool } from '@/lib/tools'
import { Locale, getTranslations } from '@/lib/i18n'
import ClientToolCard from '@/components/ClientToolCard'

interface BookmarksContentProps {
  locale: Locale
  tools: Tool[]
}

export default function BookmarksContent({ locale, tools }: BookmarksContentProps) {
  const { bookmarks, isLoaded, clearBookmarks } = useBookmarks()
  const t = getTranslations(locale)

  if (!isLoaded) {
    return (
      <div className="text-center py-20 text-gray-400">
        {locale === 'zh-CN' ? '加载中...' : 'Loading...'}
      </div>
    )
  }

  const bookmarkedTools = tools.filter(tool => bookmarks.includes(tool.id))

  if (bookmarkedTools.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          {locale === 'zh-CN' 
            ? '还没有收藏任何工具' 
            : 'No bookmarked tools yet'}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {locale === 'zh-CN'
            ? '浏览工具列表，点击收藏按钮保存你感兴趣的工具'
            : 'Browse tools and click the bookmark button to save your favorites'}
        </p>
        <a
          href="/"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {locale === 'zh-CN' ? '浏览工具' : 'Browse Tools'}
        </a>
      </div>
    )
  }

  return (
    <>
      {/* Stats Bar */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium text-gray-900 dark:text-white">{bookmarkedTools.length}</span>
          {' '}
          {locale === 'zh-CN' 
            ? `个工具已收藏` 
            : `tool${bookmarkedTools.length !== 1 ? 's' : ''} bookmarked`}
        </div>
        <button
          onClick={() => {
            if (confirm(locale === 'zh-CN' ? '确定要清空所有收藏吗？' : 'Clear all bookmarks?')) {
              clearBookmarks()
            }
          }}
          className="text-sm text-red-500 hover:text-red-700 transition"
        >
          {locale === 'zh-CN' ? '清空收藏' : 'Clear All'}
        </button>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookmarkedTools.map(tool => (
          <ClientToolCard key={tool.id} tool={tool} locale={locale} />
        ))}
      </div>
    </>
  )
}