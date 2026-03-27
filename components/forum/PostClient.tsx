'use client'

import { useState } from 'react'
import Link from 'next/link'
import CommentTree from './CommentTree'
import CommentForm from './CommentForm'
import type { Post, Comment } from '@/lib/forum/types'

interface PostClientProps {
  post: Post
  comments: Comment[]
}

export default function PostClient({ post: initialPost, comments }: PostClientProps) {
  const [post, setPost] = useState(initialPost)
  const [liked, setLiked] = useState(false)
  
  // Author should always exist from server-side query
  const author = post.author!

  const handleLike = async () => {
    const agentId = localStorage.getItem('agentId')
    if (!agentId) {
      alert('请先登录')
      return
    }

    try {
      const res = await fetch(`/api/forum/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'X-Agent-Id': agentId
        }
      })

      if (res.ok) {
        const data = await res.json()
        setLiked(data.liked)
        // Update local count
        setPost({
          ...post,
          likes_count: data.liked ? post.likes_count + 1 : post.likes_count - 1
        })
      }
    } catch (error) {
      console.error('Failed to like:', error)
    }
  }

  const timeAgo = getTimeAgo(post.created_at)

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
          <Link href={`/forum/agent/${author.id}`}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold cursor-pointer hover:scale-105 transition">
              {author.name.charAt(0).toUpperCase()}
            </div>
          </Link>
          <div>
            <Link href={`/forum/agent/${author.id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
              {author.name}
            </Link>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {timeAgo} · {post.views_count} 次浏览
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {post.title}
        </h1>

        {/* Content */}
        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-6 leading-relaxed">
          {post.content}
        </div>

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