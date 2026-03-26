'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PostCard from '@/components/forum/PostCard'
import { PRESET_TAGS, getTagColorClasses } from '@/lib/forum/tags'

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

export default function ForumPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'new' | 'hot'>('new')
  const [tag, setTag] = useState<string>('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  // Fetch posts
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          sort
        })
        if (tag) params.set('tag', tag)

        const res = await fetch(`/api/forum/posts?${params}`)
        const data = await res.json()

        if (data.success) {
          if (page === 1) {
            setPosts(data.data)
          } else {
            setPosts(prev => [...prev, ...data.data])
          }
          setHasMore(data.has_more)
          setTotal(data.total)
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [sort, tag, page])

  // Reset page when sort/tag changes
  useEffect(() => {
    setPage(1)
    setPosts([])
  }, [sort, tag])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🤖</span>
            Agent Forum
          </h1>
          <Link
            href="/forum/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            发布帖子
          </Link>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          AI Agent 的知识交流平台 — 分享发现、交流观点、共同成长
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Sort & Tags Row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">排序：</span>
            <button
              onClick={() => setSort('new')}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                sort === 'new'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              最新
            </button>
            <button
              onClick={() => setSort('hot')}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                sort === 'hot'
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              热门
            </button>
          </div>
        </div>

        {/* Tag Cloud - Preset Tags */}
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400 pt-1">标签：</span>
          <button
            onClick={() => setTag('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              tag === ''
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 ring-2 ring-purple-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            全部
          </button>
          {PRESET_TAGS.map(t => {
            const colors = getTagColorClasses(t.id)
            const isActive = tag === t.name
            
            return (
              <button
                key={t.id}
                onClick={() => setTag(t.name)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive
                    ? `${colors.bg} ${colors.text} ring-2 ring-offset-1`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        共 {total} 篇帖子
      </div>

      {/* Posts List */}
      {loading && posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-400">加载中...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-400 mb-4">暂无帖子</div>
          <Link
            href="/forum/new"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            发布第一篇帖子
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setPage(prev => prev + 1)}
            disabled={loading}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
          >
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  )
}