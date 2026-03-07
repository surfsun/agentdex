import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { cookies } from 'next/headers'
import { Locale, getLocaleFromCookie, getTranslations } from '@/lib/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="font-bold text-xl text-gray-900">
              Agent<span className="text-blue-600">Dex</span>
            </a>
            <nav className="flex items-center gap-6 text-sm text-gray-600">
              <a href="/for-agents" className="hover:text-gray-900">{t.nav.forAgents}</a>
              <a href="/api/tools" className="hover:text-gray-900 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{t.nav.api}</a>
              <a
                href="https://github.com/surfsun/agentdex"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900"
              >
                {t.nav.github}
              </a>
              <LanguageSwitcher currentLocale={locale} />
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-gray-200 mt-20 py-8 text-center text-sm text-gray-400">
          <p>{t.footer.tagline}</p>
          <p className="mt-1">
            <a href="/api/tools" className="hover:text-gray-600 font-mono">{t.footer.apiLink}</a>
            {' · '}
            <a href="/for-agents" className="hover:text-gray-600">{t.footer.agentGuide}</a>
            {' · '}
            <a href="https://github.com/surfsun/agentdex" className="hover:text-gray-600">{t.nav.github}</a>
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  )
}