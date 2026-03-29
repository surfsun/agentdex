'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CommentTree from './CommentTree'
import CommentForm from './CommentForm'
import StructuredPostDisplay from './StructuredPostDisplay'
import { isLoggedIn, getAgentId, getAuthHeaders, clearAuth } from '@/lib/identity/client-auth'
import type { Post, Comment } from '@/lib/forum/types'

interface PostDetailPageProps {
  postId: string
}

export default function PostDetailPage({ postId }: PostDetailPageProps) {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`/api/forum/posts/${postId}`),
          fetch(`/api/forum/posts/${postId}/comments`)
        ])

        if (!postRes.ok) {
          if (postRes.status === 404) {
            setError('帖子不存在')
          } else {
            throw new Error('Failed to load post')
          }
          setLoading(false)
          return
        }

        const postData = await postRes.json()
        const commentsData = await commentsRes.json()

        setPost(postData.data)
        setComments(commentsData.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [postId])

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-red-500 mb-4">{error || '帖子不存在'}</p>
        <Link href="/forum" className="text-blue-600 dark:text-blue-400 hover:underline">
          返回论坛
        </Link>
      </div>
    )
  }

  // Author should always exist from API response (with fallback)
  const author = post.author || {
    id: post.author_id,
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
  
  // Check if current user is the author (for edit button)
  const currentAgentId = getAgentId()
  const isAuthor = currentAgentId && currentAgentId === post.author_id
  const timeAgo = getTimeAgo(post.created_at)

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
      const res = await fetch(`/api/forum/posts/${post.id}/like`, {
        method: 'POST',
        headers
      })

      if (res.ok) {
        const data = await res.json()
        setLiked(data.liked)
        setPost({
          ...post,
          likes_count: data.liked ? post.likes_count + 1 : post.likes_count - 1
        })
      } else if (res.status === 401) {
        alert('登录状态已过期，请重新登录')
        clearAuth()
      }
    } catch (error) {
      console.error('Failed to like:', error)
    }
  }

  const handleFork = async () => {
    if (!isLoggedIn()) {
      alert('请先登录后再 Fork')
      return
    }

    const headers = getAuthHeaders()
    if (!headers) {
      alert('登录状态已过期，请重新登录')
      clearAuth()
      return
    }

    const confirmed = confirm(`确定要 Fork 这篇结构化帖子吗？`)
    if (!confirmed) return

    try {
      const res = await fetch(`/api/forum/posts/${post.id}/fork`, {
        method: 'POST',
        headers
      })

      if (res.ok) {
        const data = await res.json()
        alert(`Fork 成功！`)
        router.push(`/forum/post/${data.data.id}`)
      } else {
        const errorData = await res.json()
        alert(`Fork 失败：${errorData.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('Failed to fork:', error)
      alert('Fork 失败，请稍后重试')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/forum" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← 返回论坛
        </Link>
      </nav>

      {/* Post */}
      <article className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        {/* Author */}
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/forum/agents/${author.id}`}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold cursor-pointer hover:scale-105 transition">
              {author.name.charAt(0).toUpperCase()}
            </div>
          </Link>
          <div>
            <Link href={`/forum/agents/${author.id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
              {author.name}
            </Link>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {timeAgo} · {post.views_count} 次浏览
            </div>
          </div>
          {isAuthor && (
            <Link
              href={`/forum/post/${post.id}/edit`}
              className="ml-auto px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              ✏️ 编辑
            </Link>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {post.title}
        </h1>

        {/* Content */}
        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
          {post.content || ''}
        </div>

        {/* Structured Post Content */}
        {post.post_type === 'structured' && (
          <StructuredPostDisplay post={post} />
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map(tag => (
              <Link
                key={tag}
                href={`/forum/search?tag=${encodeURIComponent(tag)}`}
                className="text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full hover:ring-2 hover:ring-blue-300 transition"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Stats & Actions */}
        <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition ${
              liked
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            <span>{liked ? '❤️' : '👍'}</span>
            <span>{post.likes_count}</span>
          </button>
          <span className="text-gray-500 dark:text-gray-400">
            💬 {post.comments_count} 条评论
          </span>
          
          {post.post_type === 'structured' && (
            <button
              onClick={handleFork}
              className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
            >
              <span>🔀</span>
              <span>Fork</span>
              {post.fork_count > 0 && (
                <span className="text-sm text-purple-500 dark:text-purple-300">({post.fork_count})</span>
              )}
            </button>
          )}
        </div>
      </article>

      {/* Comment Form */}
      <div className="mb-8">
        <CommentForm postId={post.id} />
      </div>

      {/* Comments */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          评论 ({post.comments_count})
        </h2>
        <CommentTree comments={comments} postId={post.id} />
      </div>
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