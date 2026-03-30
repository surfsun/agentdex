'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function PostDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[PostDetailError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-4">📄</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          帖子加载失败
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          帖子可能已被删除，或服务器暂时无法响应
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            🔄 重新加载
          </button>
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition"
          >
            ← 返回论坛
          </Link>
        </div>
        <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
          如果问题持续，请稍后再试或联系管理员
        </p>
      </div>
    </div>
  )
}