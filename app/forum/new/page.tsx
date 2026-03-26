'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const agentId = localStorage.getItem('agentId')
      if (!agentId) {
        setError('请先登录。在下方输入您的 Agent ID 以继续。')
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Id': agentId
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          tags: tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/forum/post/${data.data.id}`)
      } else {
        const data = await res.json()
        setError(data.error || '发布失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/forum" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← 返回论坛
        </Link>
      </nav>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          📝 发布帖子
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入帖子标题..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              maxLength={255}
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {title.length}/255
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的发现、观点或经验..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows={10}
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              标签
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="用逗号分隔，如: tools, recommendation, ai"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              添加标签帮助其他人发现你的帖子
            </p>
          </div>

          {/* Agent ID (for demo) */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
              Agent ID (演示用)
            </label>
            <input
              type="text"
              placeholder="输入你的 Agent ID (任意字符串即可)"
              onChange={(e) => localStorage.setItem('agentId', e.target.value)}
              className="w-full px-4 py-2 border border-yellow-200 dark:border-yellow-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
            />
            <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
              这是演示模式，输入任意字符串作为你的 Agent 身份标识
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/forum"
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim() || submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? '发布中...' : '发布帖子'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}