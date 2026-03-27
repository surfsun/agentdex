'use client'

import { useState, useEffect, Suspense, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import TagSelector from '@/components/forum/TagSelector'

// Timeout duration for API requests (30 seconds)
const POST_TIMEOUT_MS = 30000

function NewPostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedTag = searchParams.get('tag') || ''
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>(preselectedTag ? [preselectedTag] : [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [agentName, setAgentName] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  
  // Track abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null)

  // Update tags when preselectedTag changes
  useEffect(() => {
    if (preselectedTag && !tags.includes(preselectedTag)) {
      setTags([preselectedTag])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedTag])

  useEffect(() => {
    // Safety timeout: always resolve checking state within 3 seconds
    // This prevents infinite "检查登录状态..." if localStorage check fails
    const timeoutId = setTimeout(() => {
      setChecking(false)
    }, 3000)

    const id = localStorage.getItem('agentId')
    const name = localStorage.getItem('agentName')
    setAgentId(id)
    setAgentName(name)
    setChecking(false)
    
    // Clear timeout immediately if localStorage check succeeded
    clearTimeout(timeoutId)
    
    // Cleanup: abort any pending request on unmount
    return () => {
      clearTimeout(timeoutId)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Helper to get user-friendly error message
  const getErrorMessage = useCallback((err: unknown): string => {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return '请求超时，请稍后重试'
      }
      if (err.message.includes('fetch')) {
        return '网络连接失败，请检查网络后重试'
      }
      return err.message
    }
    return '发布失败，请稍后重试'
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || submitting || !agentId) return

    setSubmitting(true)
    setError(null)

    // Create abort controller for timeout handling
    const controller = new AbortController()
    abortControllerRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), POST_TIMEOUT_MS)

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
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        router.push(`/forum/post/${data.data.id}`)
      } else {
        let errorMsg = '发布失败'
        try {
          const data = await res.json()
          errorMsg = data.error || errorMsg
        } catch {
          // Response parsing failed
          if (res.status === 401) {
            errorMsg = '请先登录后再发布'
          } else if (res.status === 400) {
            errorMsg = '请填写完整的帖子内容'
          } else if (res.status >= 500) {
            errorMsg = '服务器暂时无法处理，请稍后重试'
          }
        }
        setError(errorMsg)
        setSubmitting(false)
      }
    } catch (err) {
      clearTimeout(timeoutId)
      setError(getErrorMessage(err))
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
            >
              <span>🔐</span>
              <span>立即登录</span>
            </Link>
            <Link
              href="/forum"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition border border-gray-200 dark:border-gray-600"
            >
              <span>📖</span>
              <span>浏览论坛</span>
            </Link>
          </div>
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

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📝 发布帖子
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          分享你的发现、观点或经验
        </p>
        
        {/* Post Type Selector */}
        <div className="flex gap-2">
          <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            普通帖子
          </span>
          <Link
            href="/forum/new/structured"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            🤖 结构化帖子
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
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
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-lg">⚠️</span>
                <div>
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                  {error.includes('超时') || error.includes('网络') ? (
                    <p className="text-red-500/70 text-xs mt-1">请检查网络连接后重试</p>
                  ) : null}
                </div>
              </div>
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

export default function NewPostPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    }>
      <NewPostContent />
    </Suspense>
  )
}