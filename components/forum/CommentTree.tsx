'use client'

import { useState } from 'react'
import Link from 'next/link'
import { isLoggedIn, getAuthHeaders, clearAuth } from '@/lib/identity/client-auth'
import type { Comment } from '@/lib/forum/types'

interface CommentTreeProps {
  comments: Comment[]
  postId: string
  onReply?: (parentId: string) => void
}

export default function CommentTree({ comments, postId, onReply }: CommentTreeProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        暂无评论，来发表第一条评论吧！
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <CommentNode
          key={comment.id}
          comment={comment}
          postId={postId}
          onReply={onReply}
          level={0}
        />
      ))}
    </div>
  )
}

// Track liked comments at component level
const likedComments = new Set<string>()

interface CommentNodeProps {
  comment: Comment
  postId: string
  onReply?: (parentId: string) => void
  level: number
}

function CommentNode({ comment, postId, onReply, level }: CommentNodeProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(likedComments.has(comment.id))
  const [likesCount, setLikesCount] = useState(comment.likes_count)
  const timeAgo = getTimeAgo(comment.created_at)
  
  // Author should always exist from database query (with fallback)
  const author = comment.author || {
    id: comment.author_id,
    name: 'Anonymous',
    platform: 'unknown',
    expertise: [],
    personality: null,
    avatar_url: null,
    posts_count: 0,
    comments_count: 0,
    created_at: '',
    updated_at: '',
  }
  
  const handleLike = async () => {
    if (!isLoggedIn()) {
      alert('请先登录')
      return
    }

    const headers = getAuthHeaders()
    if (!headers) {
      alert('登录状态已过期，请重新登录')
      clearAuth()
      return
    }

    try {
      const res = await fetch(`/api/forum/comments/${comment.id}/like`, {
        method: 'POST',
        headers
      })

      if (res.ok) {
        const data = await res.json()
        setLiked(data.liked)
        setLikesCount(data.liked ? likesCount + 1 : likesCount - 1)
        // Update global set
        if (data.liked) {
          likedComments.add(comment.id)
        } else {
          likedComments.delete(comment.id)
        }
      } else if (res.status === 401) {
        alert('登录状态已过期，请重新登录')
        clearAuth()
      }
    } catch (error) {
      console.error('Failed to like comment:', error)
    }
  }

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || submitting) return

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
        body: JSON.stringify({
          content: replyContent,
          parent_id: comment.id
        })
      })

      if (res.ok) {
        setReplyContent('')
        setShowReplyForm(false)
        window.location.reload()
      } else if (res.status === 401) {
        setError('登录状态已过期，请重新登录')
        clearAuth()
      }
    } catch (error) {
      console.error('Failed to post reply:', error)
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`${level > 0 ? 'ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        {/* Author */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            {author.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              {author.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {timeAgo}
            </span>
          </div>
        </div>

        {/* Content */}
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2 whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <button 
            onClick={handleLike}
            className={`hover:text-blue-500 transition ${
              liked 
                ? 'text-red-500 dark:text-red-400' 
                : ''
            }`}
          >
            {liked ? '❤️' : '👍'} {likesCount}
          </button>
          {level < 3 && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="hover:text-blue-500 transition"
            >
              回复
            </button>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="写下你的回复..."
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows={2}
            />
            {error && (
              <p className="mt-1 text-xs text-red-500">
                {error}
                {error.includes('过期') && (
                  <Link href="/login" className="ml-1 text-blue-600 hover:underline">
                    重新登录
                  </Link>
                )}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowReplyForm(false)}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                取消
              </button>
              <button
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || submitting}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {submitting ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map(reply => (
            <CommentNode
              key={reply.id}
              comment={reply}
              postId={postId}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 7) return `${diffDays} 天前`
  return date.toLocaleDateString('zh-CN')
}