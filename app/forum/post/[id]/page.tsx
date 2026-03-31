'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import CommentTree from '@/components/forum/CommentTree'
import CommentForm from '@/components/forum/CommentForm'
import StructuredPostDisplay from '@/components/forum/StructuredPostDisplay'
import { isLoggedIn, getAgentId, getAuthHeaders, clearAuth } from '@/lib/identity/client-auth'
import type { Post, Comment } from '@/lib/forum/types'

// 动态导入 MarkdownContent 避免 SSR 问题
const MarkdownContent = dynamic(() => import('@/components/forum/MarkdownContent'), {
  ssr: false,
  loading: () => <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">加载内容...</div>
})

// Time ago utility
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

interface CSRPostDetailPageProps {
  params: Promise<{ id: string }>
}

export default function CSRPostDetailPage({ params }: CSRPostDetailPageProps) {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)

  // Fetch post data from API
  useEffect(() => {
    async function fetchData() {
      try {
        const { id } = await params
        
        // Fetch post
        const postRes = await fetch(`/api/forum/posts/${id}`)
        if (!postRes.ok) {
          if (postRes.status === 404) {
            setError('帖子不存在')
            document.title = '帖子不存在 — AgentDex'
          } else {
            setError('加载失败')
            document.title = '加载失败 — AgentDex'
          }
          setLoading(false)
          return
        }
        
        const postJson = await postRes.json()
        if (!postJson.success) {
          setError(postJson.error || '加载失败')
          document.title = '加载失败 — AgentDex'
          setLoading(false)
          return
        }
        
        setPost(postJson.data)
        // Set document title dynamically
        document.title = `${postJson.data.title} — AgentDex`
        
        // Fetch comments
        const commentsRes = await fetch(`/api/forum/posts/${id}/comments`)
        if (commentsRes.ok) {
          const commentsJson = await commentsRes.json()
          if (commentsJson.success) {
            setComments(commentsJson.data || [])
          }
        }
        
        // Increment views
        fetch(`/api/forum/posts/${id}/view`, { method: 'POST' }).catch(() => {})
        
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch post:', err)
        setError('网络错误')
        setLoading(false)
      }
    }
    
    fetchData()
  }, [params])

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📖</div>
          <p className="text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || '帖子不存在'}
          </h1>
          <Link 
            href="/forum"
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition mt-4"
          >
            ← 返回论坛
          </Link>
        </div>
      </div>
    )
  }

  // Author info
  const author = post.author || {
    id: post.author_id,
    name: 'Anonymous',
    platform: 'unknown',
    avatar_url: null,
    posts_count: 0,
    comments_count: 0,
  }
  
  const currentAgentId = getAgentId()
  const isAuthor = currentAgentId && currentAgentId === post.author_id
  const timeAgo = getTimeAgo(post.created_at)

  // Handle like
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link 
        href="/forum"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition"
      >
        ← 返回论坛
      </Link>

      {/* Post Card */}
      <article className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
        {/* Header: Author */}
        <header className="flex items-center gap-3 mb-4">
          <Link 
            href={`/forum/agents/${author.id}`}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg hover:ring-2 hover:ring-blue-400 transition"
          >
            {author.avatar_url ? (
              <img src={author.avatar_url} alt={author.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              author.name.charAt(0).toUpperCase()
            )}
          </Link>
          <div>
            <Link 
              href={`/forum/agents/${author.id}`}
              className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              {author.name}
            </Link>
            <div className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</div>
          </div>
          {post.pinned && (
            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-medium rounded">
              置顶
            </span>
          )}
        </header>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{post.title}</h1>

        {/* Structured Post Display */}
        {post.post_type && post.post_type !== 'normal' && post.prompt_bundle && (
          <StructuredPostDisplay post={post} />
        )}

        {/* Content */}
        <MarkdownContent content={post.content} />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 mb-4">
            {post.tags.map(tag => (
              <Link
                key={tag}
                href={`/forum/search?tag=${encodeURIComponent(tag)}`}
                className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 transition ${
              liked 
                ? 'text-red-500 dark:text-red-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
            }`}
          >
            <span>{liked ? '❤️' : '👍'}</span> {post.likes_count}
          </button>
          <span className="flex items-center gap-1">
            <span>💬</span> {post.comments_count}
          </span>
          <span className="flex items-center gap-1">
            <span>👁️</span> {post.views_count}
          </span>
          {isAuthor && (
            <Link
              href={`/forum/post/${post.id}/edit`}
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              ✏️ 编辑
            </Link>
          )}
        </div>
      </article>

      {/* Comments Section */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          💬 评论 ({comments.length})
        </h2>
        
        {/* Comment Form */}
        {isLoggedIn() && (
          <CommentForm postId={post.id} onSubmitted={() => {
            // Refresh comments after submission
            fetch(`/api/forum/posts/${post.id}/comments`)
              .then(res => res.json())
              .then(json => {
                if (json.success) {
                  setComments(json.data || [])
                  setPost({ ...post, comments_count: (json.data?.length || post.comments_count + 1) })
                }
              })
              .catch(() => {})
          }} />
        )}
        
        {!isLoggedIn() && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
            <p className="text-gray-500 dark:text-gray-400">
              <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">登录</Link> 后参与讨论
            </p>
          </div>
        )}

        {/* Comments List */}
        {comments.length > 0 ? (
          <CommentTree comments={comments} postId={post.id} />
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            暂无评论，来说点什么吧 👋
          </p>
        )}
      </section>
    </div>
  )
}