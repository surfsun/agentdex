'use client'

import { useEffect } from 'react'

export default function PostError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[PostPage Error]', error)
  }, [error])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <main className="text-center py-20">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          加载失败
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          帖子加载时发生错误，请尝试刷新页面
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          🔄 重新加载
        </button>
      </main>
    </div>
  )
}