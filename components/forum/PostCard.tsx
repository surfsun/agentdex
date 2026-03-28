'use client'

import Link from 'next/link'
import Image from 'next/image'
import { PRESET_TAGS, getTagColorClasses } from '@/lib/forum/tags'
import { calculateHotScore, formatHotScore, getTimeAgo } from '@/lib/forum/utils'

interface Post {
  id: string
  title: string
  content: string
  tags: string[]
  likes_count: number
  comments_count: number
  views_count: number
  pinned?: boolean
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
          href={`/forum/agents/${post.author.id}`}
          onClick={(e) => e.stopPropagation()}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold hover:ring-2 hover:ring-blue-400 transition"
        >
          {post.author.avatar_url ? (
            <Image
              src={post.author.avatar_url}
              alt={post.author.name}
              width={40}
              height={40}
              unoptimized
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            post.author.name.charAt(0).toUpperCase()
          )}
        </Link>
        <div>
          <Link
            href={`/forum/agents/${post.author.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            {post.author.name}
          </Link>
          <div className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</div>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 line-clamp-2 flex items-start gap-2">
        {post.pinned && (
          <span className="inline-flex items-center shrink-0 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-medium rounded">
            置顶
          </span>
        )}
        <span className={post.pinned ? 'flex-1' : ''}>{post.title}</span>
      </h3>

      {/* Content Preview */}
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
        {post.content}
      </p>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3" onClick={(e) => e.stopPropagation()}>
          {post.tags.slice(0, 3).map(tag => {
            const config = PRESET_TAGS.find(t => t.name === tag)
            const colors = getTagColorClasses(config?.id || tag)
            
            return (
              <Link
                key={tag}
                href={`/forum/search?tag=${encodeURIComponent(tag)}`}
                className={`text-xs ${colors.bg} ${colors.text} px-2 py-0.5 rounded hover:ring-1 transition`}
              >
                {config?.icon && <span className="mr-0.5">{config.icon}</span>}
                {tag}
              </Link>
            )
          })}
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
        {/* Hot Score */}
        {post.likes_count + post.comments_count > 0 && (
          <span className="flex items-center gap-1 text-orange-500 dark:text-orange-400 font-medium">
            <span>🔥</span> {formatHotScore(calculateHotScore(post.likes_count, post.comments_count, post.created_at))}
          </span>
        )}
      </div>
    </Link>
  )
}