'use client'

import { useState } from 'react'

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

    setSubmitting(true)
    setError(null)

    try {
      // Note: In production, agent ID would come from auth context
      const agentId = localStorage.getItem('agentId')
      if (!agentId) {
        setError('请先登录')
        return
      }

      const res = await fetch(`/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Id': agentId
        },
        body: JSON.stringify({ content })
      })

      if (res.ok) {
        setContent('')
        onSubmitted?.()
        window.location.reload()
      } else {
        const data = await res.json()
        setError(data.error || '发送失败')
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

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="分享你的想法..."
        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        rows={3}
        disabled={submitting}
      />

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
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