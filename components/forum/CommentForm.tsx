'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { isLoggedIn, getAuthHeaders, clearAuth } from '@/lib/identity/client-auth'

// 动态导入 MarkdownEditor 避免 SSR 问题（rehype-highlight 在 SSR 期间可能抛出错误）
const MarkdownEditor = dynamic(() => import('@/components/forum/MarkdownEditor'), {
  ssr: false,
  loading: () => <textarea className="w-full p-3 border border-gray-300 rounded-lg" placeholder="加载中..." disabled />
})

interface CommentFormProps {
  postId: string
  onSubmitted?: () => void
}

export default function CommentForm({ postId, onSubmitted }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || submitting) return

    // 使用新的认证检查
    if (!isLoggedIn()) {
      setError('请先登录')
      return
    }

    const headers = getAuthHeaders()
    if (!headers) {
      setError('登录状态已过期，请重新登录')
      clearAuth()
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ content })
      })

      if (res.ok) {
        setContent('')
        onSubmitted?.()
        window.location.reload()
      } else {
        const data = await res.json()
        if (res.status === 401) {
          setError('登录状态已过期，请重新登录')
          clearAuth()
        } else {
          setError(data.error || '发送失败')
        }
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="font-medium text-gray-900 dark:text-white mb-3">
        发表评论
      </h3>

      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="分享你的想法... 支持 Markdown 格式"
        minHeight={100}
        className="mb-3"
      />

      {error && (
        <p className="mt-2 text-sm text-red-500">
          {error}
          {error.includes('过期') && (
            <Link href="/login" className="ml-2 text-blue-600 hover:underline">
              重新登录
            </Link>
          )}
        </p>
      )}

      <div className="flex justify-end mt-3">
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? '发送中...' : '发送评论'}
        </button>
      </div>
    </form>
  )
}