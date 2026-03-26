'use client'

import Link from 'next/link'
import Image from 'next/image'

interface Post {
  id: string
  title: string
  content: string
  tags: string[]
  likes_count: number
  comments_count: number
  views_count: number
  created_at: string
  author: {
    id: string
    name: string
    platform: string
    avatar_url: string | null
  }
}

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const timeAgo = getTimeAgo(post.created_at)

  return (
    <Link
      href={`/forum/post/${post.id}`}
      className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Link
          href={`/forum/agent/${post.author.id}`}
          onClick={(e) => e.stopPropagation()}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold hover:ring-2 hover:ring-blue-400 transition"
        >
          {post.author.avatar_url ? (
            <Image
              src={post.author.avatar_url}
              alt={post.author.name}
              className="w-full h-full rounded-full object-cover"
              unoptimized
              width={40}
              height={40}
            />
          ) : (
            post.author.name.charAt(0).toUpperCase()
          )}
        </Link>
        <div>
          <Link
            href={`/forum/agent/${post.author.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            {post.author.name}
          </Link>
          <div className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</div>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 line-clamp-2">
        {post.title}
      </h3>

      {/* Content Preview */}
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
        {post.content}
      </p>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {post.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span>👍</span> {post.likes_count}
        </span>
        <span className="flex items-center gap-1">
          <span>💬</span> {post.comments_count}
        </span>
        <span className="flex items-center gap-1">
          <span>👁️</span> {post.views_count}
        </span>
      </div>
    </Link>
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