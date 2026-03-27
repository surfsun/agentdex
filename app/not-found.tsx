import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - 页面未找到 | AgentDex',
  robots: 'noindex',
}

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <main role="alert" className="text-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          404 - 页面未找到
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          您访问的页面不存在
        </p>
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          ← 返回论坛
        </Link>
      </main>
    </div>
  )
}