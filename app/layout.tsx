import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Locale, getLocaleFromCookie, getTranslations } from '@/lib/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import Providers from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentDex — The tool directory built for AI agents',
  description: 'Discover tools built specifically for AI agents: communication, memory, web scraping, code execution, integration and more.',
  keywords: 'AI agents, agent tools, LLM tools, agent infrastructure',
  alternates: {
    canonical: 'https://www.agentdex.top',
    types: {
      'application/rss+xml': 'https://www.agentdex.top/rss',
    },
  },
  openGraph: {
    title: 'AgentDex — The tool directory built for AI agents',
    description: 'Discover tools built specifically for AI agents: communication, memory, web scraping, code execution, integration and more.',
    url: 'https://www.agentdex.top',
    siteName: 'AgentDex',
    type: 'website',
    images: [
      {
        url: 'https://www.agentdex.top/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'AgentDex - The tool directory built for AI agents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentDex — The tool directory built for AI agents',
    description: 'Discover tools built specifically for AI agents',
    images: ['https://www.agentdex.top/og-image.svg'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AgentDex',
  description: 'The tool directory built for AI agents',
  url: 'https://www.agentdex.top',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.agentdex.top/api/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
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
  const t = getTranslations(locale)

  return (
    <html lang={locale === 'zh-CN' ? 'zh-CN' : 'en'}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-xl text-gray-900 dark:text-white">
              Agent<span className="text-blue-600">Dex</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/bookmarks" className="hover:text-gray-900 dark:hover:text-white flex items-center gap-1" title={locale === 'zh-CN' ? '我的收藏' : 'My Bookmarks'}>
                🔖
              </Link>
              <Link href="/for-agents" className="hover:text-gray-900 dark:hover:text-white hidden sm:inline">{t.nav.forAgents}</Link>
              <Link href="/eval" className="hover:text-gray-900 dark:hover:text-white hidden sm:inline">{t.nav.eval}</Link>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/tools" className="hover:text-gray-900 dark:hover:text-white font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded hidden sm:inline">{t.nav.api}</a>
              <Link
                href="/submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                <span>🚀</span>
                <span className="hidden sm:inline">{t.nav.submit}</span>
              </Link>
              <a
                href="https://github.com/surfsun/agentdex"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-white hidden md:inline"
              >
                {t.nav.github}
              </a>
              <ThemeSwitcher />
              <LanguageSwitcher currentLocale={locale} />
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-gray-200 dark:border-gray-800 mt-20 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          <p>{t.footer.tagline}</p>
          <p className="mt-1">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/tools" className="hover:text-gray-600 dark:hover:text-gray-300 font-mono">{t.footer.apiLink}</a>
            {' · '}
            <Link href="/for-agents" className="hover:text-gray-600 dark:hover:text-gray-300">{t.footer.agentGuide}</Link>
            {' · '}
            <a href="https://github.com/surfsun/agentdex" className="hover:text-gray-600 dark:hover:text-gray-300">{t.nav.github}</a>
          </p>
        </footer>
        <Analytics />
        </Providers>
      </body>
    </html>
  )
}
