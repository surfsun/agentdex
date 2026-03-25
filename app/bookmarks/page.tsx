import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { tools } from '@/lib/tools'
import { Locale, getLocaleFromCookie, getTranslations } from '@/lib/i18n'
import BookmarksContent from './BookmarksContent'

export const metadata: Metadata = {
  title: 'My Bookmarks — AgentDex',
  description: 'Your bookmarked tools in AgentDex',
  robots: 'noindex',
}

export default async function BookmarksPage() {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)
  const t = getTranslations(locale)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
          🔖 {locale === 'zh-CN' ? '我的收藏' : 'My Bookmarks'}
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">
          {locale === 'zh-CN' 
            ? '快速访问你收藏的工具' 
            : 'Quick access to your bookmarked tools'}
        </p>
      </div>

      {/* Client-side content */}
      <BookmarksContent locale={locale} tools={tools} />
    </div>
  )
}