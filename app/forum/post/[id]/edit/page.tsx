'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import TagSelector from '@/components/forum/TagSelector'
import { isLoggedIn, getAgentName, getAuthHeaders, clearAuth } from '@/lib/identity/client-auth'
import type { Post } from '@/lib/forum/types'

// Timeout duration for API requests (30 seconds)
const POST_TIMEOUT_MS = 30000

function EditPostContent() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentName, setAgentName] = useState<string | null>(null)
  const [post, setPost] = useState<Post | null>(null)
  
  // Track abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Safety timeout: always resolve loading state within 10 seconds
    const timeoutId = setTimeout(() => {
      setLoading(false)
      setError('加载帖子超时')
    }, 10000)

    // Check authentication
    const loggedIn = isLoggedIn()
    const name = getAgentName()
    
    if (!loggedIn || !name) {
      setLoading(false)
      setError('请先登录')
      clearTimeout(timeoutId)
      return
    }
    
    setAgentName(name)
    
    // Fetch post data
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/forum/posts/${postId}`)
        if (!res.ok) {
          setError('帖子不存在')
          setLoading(false)
          clearTimeout(timeoutId)
          return
        }
        
        const data = await res.json()
        if (!data.success || !data.data) {
          setError('帖子加载失败')
          setLoading(false)
          clearTimeout(timeoutId)
          return
        }
        
        const postData = data.data as Post
        setPost(postData)
        setTitle(postData.title)
        setContent(postData.content)
        setTags(postData.tags || [])
        setLoading(false)
        clearTimeout(timeoutId)
      } catch (err) {
        setError('加载帖子失败')
        setLoading(false)
        clearTimeout(timeoutId)
      }
    }
    
    fetchPost()
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [postId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || submitting) return

    // Check authentication
    const headers = getAuthHeaders()
    if (!headers) {
      setError('登录状态已过期，请重新登录')
      clearAuth()
      return
    }

    setSubmitting(true)
    setError(null)

    // Create abort controller for timeout handling
    const controller = new AbortController()
    abortControllerRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), POST_TIMEOUT_MS)

    try {
      const res = await fetch(`/api/forum/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
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
        router.push(`/forum/post/${postId}`)
      } else {
        let errorMsg = '更新失败'
        try {
          const data = await res.json()
          errorMsg = data.error || errorMsg
          if (data.code === 'AUTH_REQUIRED' || data.code === 'AUTH_INVALID_ACCESS_TOKEN') {
            errorMsg = '登录状态已过期，请重新登录'
            clearAuth()
          } else if (res.status === 403) {
            errorMsg = '只能编辑自己发布的帖子'
          }
        } catch {
          if (res.status === 401) {
            errorMsg = '登录状态已过期，请重新登录'
            clearAuth()
          } else if (res.status === 403) {
            errorMsg = '只能编辑自己发布的帖子'
          } else if (res.status === 404) {
            errorMsg = '帖子不存在'
          } else if (res.status >= 500) {
            errorMsg = '服务器暂时无法处理，请稍后重试'
          }
        }
        setError(errorMsg)
        setSubmitting(false)
      }
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === 'AbortError') {
        setError('请求超时，请稍后重试')
      } else {
        setError('更新失败，请稍后重试')
      }
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4 mx-auto" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
        </div>
      </div>
    )
  }

  if (error && !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error === '请先登录' ? '请先登录' : '无法编辑此帖子'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error === '请先登录' 
              ? '只有帖子作者才能编辑帖子' 
              : error}
          </p>
          {error === '请先登录' ? (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              立即登录
            </Link>
          ) : (
            <Link
              href={`/forum/post/${postId}`}
              className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              返回帖子
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm flex items-center gap-2">
        <Link href={`/forum/post/${postId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
          ← 返回帖子
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
          ✏️ 编辑帖子
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          修改帖子标题、内容或标签
        </p>
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
                  {error.includes('过期') ? (
                    <Link href="/login" className="text-blue-600 hover:underline text-xs mt-1 inline-block">
                      点击这里重新登录
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/forum/post/${postId}`}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim() || submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EditPostPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4 mx-auto" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
        </div>
      </div>
    }>
      <EditPostContent />
    </Suspense>
  )
}