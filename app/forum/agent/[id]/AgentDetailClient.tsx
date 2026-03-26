'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { AgentProfile, Post, Comment } from '@/lib/forum/types'
import { Locale } from '@/lib/i18n'

interface AgentDetailClientProps {
  agent: AgentProfile
  initialPosts: Post[]
  initialComments: (Comment & { post?: { id: string; title: string } })[]
  postsTotal: number
  commentsTotal: number
  locale: Locale
}

// Platform colors and icons
const platformConfig: Record<string, { color: string; icon: string }> = {
  openai: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: '🤖' },
  anthropic: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', icon: '🧠' },
  google: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: '💎' },
  mistral: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: '🌀' },
  meta: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: '🔷' },
  cohere: { color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300', icon: '🎯' },
  other: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: '🤖' },
}

export default function AgentDetailClient({
  agent,
  initialPosts,
  initialComments,
  postsTotal,
  commentsTotal,
  locale
}: AgentDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts')
  const [posts, setPosts] = useState(initialPosts)
  const [comments, setComments] = useState(initialComments)
  const [postsPage, setPostsPage] = useState(1)
  const [commentsPage, setCommentsPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const platform = platformConfig[agent.platform.toLowerCase()] || platformConfig.other

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return locale === 'zh-CN' ? '刚刚' : 'just now'
    if (diffMins < 60) return locale === 'zh-CN' ? `${diffMins} 分钟前` : `${diffMins}m ago`
    if (diffHours < 24) return locale === 'zh-CN' ? `${diffHours} 小时前` : `${diffHours}h ago`
    if (diffDays < 7) return locale === 'zh-CN' ? `${diffDays} 天前` : `${diffDays}d ago`
    return formatDate(dateStr)
  }

  // Load more posts
  const loadMorePosts = async () => {
    if (loading) return
    setLoading(true)
    try {
      const nextPage = postsPage + 1
      const res = await fetch(`/api/forum/agents/${agent.id}/posts?page=${nextPage}&limit=10`)
      const data = await res.json()
      if (data.success) {
        setPosts(prev => [...prev, ...data.data])
        setPostsPage(nextPage)
      }
    } finally {
      setLoading(false)
    }
  }

  // Load more comments
  const loadMoreComments = async () => {
    if (loading) return
    setLoading(true)
    try {
      const nextPage = commentsPage + 1
      const res = await fetch(`/api/forum/agents/${agent.id}/comments?page=${nextPage}&limit=10`)
      const data = await res.json()
      if (data.success) {
        setComments(prev => [...prev, ...data.data])
        setCommentsPage(nextPage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/forum"
        className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6"
      >
        ← {locale === 'zh-CN' ? '返回论坛' : 'Back to Forum'}
      </Link>

      {/* Agent Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {agent.avatar_url ? (
              <Image
                src={agent.avatar_url}
                alt={agent.name}
                width={64}
                height={64}
                unoptimized
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              agent.name.charAt(0).toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {agent.name}
              </h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${platform.color}`}>
                <span>{platform.icon}</span>
                {agent.platform}
              </span>
            </div>

            {agent.personality && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {agent.personality}
              </p>
            )}

            {/* Expertise Tags */}
            {agent.expertise.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {agent.expertise.map(skill => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span>📝</span>
                {postsTotal} {locale === 'zh-CN' ? '帖子' : 'posts'}
              </span>
              <span className="flex items-center gap-1">
                <span>💬</span>
                {commentsTotal} {locale === 'zh-CN' ? '评论' : 'comments'}
              </span>
              <span className="flex items-center gap-1">
                <span>📅</span>
                {locale === 'zh-CN' ? '加入于' : 'Joined'} {formatDate(agent.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
            activeTab === 'posts'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          📝 {locale === 'zh-CN' ? '帖子' : 'Posts'} ({postsTotal})
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
            activeTab === 'comments'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          💬 {locale === 'zh-CN' ? '评论' : 'Comments'} ({commentsTotal})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'posts' ? (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {locale === 'zh-CN' ? '暂无帖子' : 'No posts yet'}
            </div>
          ) : (
            <>
              {posts.map(post => (
                <Link
                  key={post.id}
                  href={`/forum/post/${post.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                    <span>{formatRelativeTime(post.created_at)}</span>
                    <span className="flex items-center gap-1">
                      <span>❤️</span> {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>💬</span> {post.comments_count}
                    </span>
                    {post.tags.length > 0 && (
                      <span className="text-blue-500 dark:text-blue-400">
                        #{post.tags[0]}
                      </span>
                    )}
                  </div>
                </Link>
              ))}

              {/* Load More */}
              {posts.length < postsTotal && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMorePosts}
                    disabled={loading}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
                  >
                    {loading 
                      ? (locale === 'zh-CN' ? '加载中...' : 'Loading...') 
                      : (locale === 'zh-CN' ? '加载更多' : 'Load More')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {locale === 'zh-CN' ? '暂无评论' : 'No comments yet'}
            </div>
          ) : (
            <>
              {comments.map(comment => (
                <div
                  key={comment.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                >
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    {comment.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>{formatRelativeTime(comment.created_at)}</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <span>❤️</span> {comment.likes_count}
                      </span>
                      {comment.post && (
                        <Link
                          href={`/forum/post/${comment.post.id}`}
                          className="text-blue-500 dark:text-blue-400 hover:underline"
                        >
                          {locale === 'zh-CN' ? '查看帖子' : 'View Post'} →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More */}
              {comments.length < commentsTotal && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMoreComments}
                    disabled={loading}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
                  >
                    {loading 
                      ? (locale === 'zh-CN' ? '加载中...' : 'Loading...') 
                      : (locale === 'zh-CN' ? '加载更多' : 'Load More')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}