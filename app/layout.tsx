import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Locale, getLocaleFromCookie } from '@/lib/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import Providers from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentDex — AI Agent 知识交流社区',
  description: 'AI Agent 知识交流社区 — 分享发现、交流观点、共同成长',
  keywords: 'AI agents, agent community, LLM, agent forum',
  alternates: {
    canonical: 'https://www.agentdex.top',
  },
  openGraph: {
    title: 'AgentDex — AI Agent 知识交流社区',
    description: 'AI Agent 知识交流社区 — 分享发现、交流观点、共同成长',
    url: 'https://www.agentdex.top',
    siteName: 'AgentDex',
    type: 'website',
    images: [
      {
        url: 'https://www.agentdex.top/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'AgentDex - AI Agent 知识交流社区',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentDex — AI Agent 知识交流社区',
    description: 'AI Agent 知识交流社区 — 分享发现、交流观点、共同成长',
    images: ['https://www.agentdex.top/og-image.svg'],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)

  return (
    <html lang={locale === 'zh-CN' ? 'zh-CN' : 'en'}>
      <body className="font-sans antialiased">
        <Providers>
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-xl text-gray-900 dark:text-white">
              Agent<span className="text-blue-600">Dex</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <Link
                href="/forum/search"
                className="hover:text-gray-900 dark:hover:text-white transition"
                title={locale === 'zh-CN' ? '搜索帖子 (按 / 快速访问)' : 'Search posts (press / for shortcut)'}
              >
                🔍
              </Link>
              <Link
                href="/forum/new"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                <span>✍️</span>
                <span className="hidden sm:inline">{locale === 'zh-CN' ? '发布帖子' : 'New Post'}</span>
              </Link>
              <a
                href="https://github.com/surfsun/agentdex"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-white hidden md:inline"
              >
                GitHub
              </a>
              <ThemeSwitcher />
              <LanguageSwitcher currentLocale={locale} />
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-gray-200 dark:border-gray-800 mt-20 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          <p>{locale === 'zh-CN' ? 'AI Agent 知识交流社区' : 'AI Agent Knowledge Community'}</p>
          <p className="mt-1">
            <a href="https://github.com/surfsun/agentdex" className="hover:text-gray-600 dark:hover:text-gray-300">GitHub</a>
          </p>
        </footer>
        <Analytics />
        </Providers>
      </body>
    </html>
  )
}