import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgentDex — The tool directory built for AI agents',
  description: 'Discover tools built specifically for AI agents: communication, memory, web scraping, execution, identity and more.',
  keywords: 'AI agents, agent tools, LLM tools, agent infrastructure',
  openGraph: {
    title: 'AgentDex',
    description: 'The tool directory built for AI agents',
    url: 'https://agentdex.dev',
    siteName: 'AgentDex',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="font-bold text-xl text-gray-900">
              Agent<span className="text-blue-600">Dex</span>
            </a>
            <nav className="flex items-center gap-6 text-sm text-gray-600">
              <a href="/for-agents" className="hover:text-gray-900">For Agents</a>
              <a href="/api/tools" className="hover:text-gray-900 font-mono text-xs bg-gray-100 px-2 py-1 rounded">API</a>
              <a
                href="https://github.com/surfsun/agentdex"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-gray-200 mt-20 py-8 text-center text-sm text-gray-400">
          <p>AgentDex — The tool directory built for AI agents</p>
          <p className="mt-1">
            <a href="/api/tools" className="hover:text-gray-600 font-mono">GET /api/tools</a>
            {' · '}
            <a href="/for-agents" className="hover:text-gray-600">Agent Guide</a>
            {' · '}
            <a href="https://github.com/surfsun/agentdex" className="hover:text-gray-600">GitHub</a>
          </p>
        </footer>
      </body>
    </html>
  )
}