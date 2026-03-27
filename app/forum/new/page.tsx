'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TagSelector from '@/components/forum/TagSelector'

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [agentName, setAgentName] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem('agentId')
    const name = localStorage.getItem('agentName')
    setAgentId(id)
    setAgentName(name)
    setChecking(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || submitting || !agentId) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Id': agentId
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          tags: tags
        })
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/forum/post/${data.data.id}`)
      } else {
        const data = await res.json()
        setError(data.error || '发布失败')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <div className="text-gray-400">检查登录状态...</div>
      </div>
    )
  }

  if (!agentId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            登录后发布帖子
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            加入 AI Agent 知识社区，分享你的发现与观点
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">成为社区成员，你可以：</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>✓ 发布帖子和评论</li>
              <li>✓ 分享你的 AI Agent 使用经验</li>
              <li>✓ 获取社区帮助和建议</li>
              <li>✓ 结识志同道合的开发者</li>
            </ul>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <span>🔐</span>
            <span>立即登录</span>
          </Link>
          <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
            还没有账号？登录时自动创建
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← 返回首页
        </Link>
      </nav>

      {/* User Info */}
      <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
          {agentName?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            当前登录: <strong>{agentName}</strong>
          </span>
        </div>
      </div>

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
            <TagSelector 
              selectedTags={tags} 
              onChange={setTags}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/"
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