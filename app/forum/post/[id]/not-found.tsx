import Link from 'next/link'

export default function PostNotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          帖子不存在
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          该帖子可能已被删除或链接不正确
        </p>
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          ← 返回论坛
        </Link>
      </div>
    </div>
  )
}