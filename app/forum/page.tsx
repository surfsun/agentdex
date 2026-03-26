'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import PostCard from '@/components/forum/PostCard'
import { PRESET_TAGS, getTagColorClasses } from '@/lib/forum/tags'

interface Post {
  id: string
  title: string
  title_highlighted?: string
  content: string
  content_snippet?: string
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
  
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState(false)
  const [searchSort, setSearchSort] = useState<'relevance' | 'new'>('relevance')

  // 搜索帖子
  const searchPosts = useCallback(async (query: string, sortType: 'relevance' | 'new', pageNum: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: query,
        sort: sortType,
        page: pageNum.toString(),
        limit: '10'
      })

      const res = await fetch(`/api/forum/search?${params}`)
      const data = await res.json()

      if (data.success) {
        if (pageNum === 1) {
          setPosts(data.data)
        } else {
          setPosts(prev => [...prev, ...data.data])
        }
        setHasMore(data.has_more)
        setTotal(data.total)
      } else {
        if (pageNum === 1) {
          setPosts([])
          setTotal(0)
        }
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to search posts:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取帖子列表
  const fetchPosts = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        sort
      })
      if (tag) params.set('tag', tag)

      const res = await fetch(`/api/forum/posts?${params}`)
      const data = await res.json()

      if (data.success) {
        if (pageNum === 1) {
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
  }, [sort, tag])

  // 根据模式获取数据
  useEffect(() => {
    if (searchMode && searchQuery.trim().length >= 2) {
      searchPosts(searchQuery, searchSort, 1)
    } else if (!searchMode) {
      fetchPosts(1)
    }
  }, [searchMode, searchQuery, searchSort, sort, tag, fetchPosts, searchPosts])

  // 重置页面
  useEffect(() => {
    setPage(1)
  }, [sort, tag, searchQuery, searchSort, searchMode])

  // 处理搜索提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (query.length >= 2) {
      setSearchMode(true)
      setPage(1)
    }
  }

  // 清除搜索
  const clearSearch = () => {
    setSearchQuery('')
    setSearchMode(false)
    setPage(1)
  }

  // 加载更多
  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    if (searchMode) {
      searchPosts(searchQuery, searchSort, nextPage)
    } else {
      fetchPosts(nextPage)
    }
  }

  // 高亮渲染
  const renderHighlightedText = (text: string) => {
    if (!text) return text
    const parts = text.split(/==HIGHLIGHT==|==\/HIGHLIGHT==/)
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded px-0.5">
            {part}
          </mark>
        )
      }
      return part
    })
  }

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

      {/* Search Box */}
      <div className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索帖子标题或内容..."
              className="w-full px-4 py-2.5 pl-10 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={searchQuery.trim().length < 2}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
          >
            搜索
          </button>
        </form>
        {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            请输入至少 2 个字符进行搜索
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Sort & Tags Row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Sort */}
          {!searchMode ? (
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
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">排序：</span>
              <button
                onClick={() => setSearchSort('relevance')}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  searchSort === 'relevance'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                相关度
              </button>
              <button
                onClick={() => setSearchSort('new')}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  searchSort === 'new'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                最新
              </button>
            </div>
          )}
        </div>

        {/* Tag Cloud - Preset Tags (非搜索模式显示) */}
        {!searchMode && (
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
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        {searchMode ? (
          <span>
            搜索 "<strong className="text-gray-700 dark:text-gray-300">{searchQuery}</strong>" 
            找到 {total} 篇帖子
            <button
              onClick={clearSearch}
              className="ml-3 text-blue-600 dark:text-blue-400 hover:underline"
            >
              清除搜索
            </button>
          </span>
        ) : (
          <span>共 {total} 篇帖子</span>
        )}
      </div>

      {/* Posts List */}
      {loading && posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-400">加载中...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          {searchMode ? (
            <>
              <div className="text-gray-400 mb-2">未找到匹配 "{searchQuery}" 的帖子</div>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                建议：检查关键词拼写是否正确，或尝试使用更通用的关键词
              </p>
              <button
                onClick={clearSearch}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                清除搜索，查看全部帖子
              </button>
            </>
          ) : (
            <>
              <div className="text-gray-400 mb-4">暂无帖子</div>
              <Link
                href="/forum/new"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                发布第一篇帖子
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <article
              key={post.id}
              className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition"
            >
              <Link href={`/forum/post/${post.id}`}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400">
                  {post.title_highlighted ? renderHighlightedText(post.title_highlighted) : post.title}
                </h2>
              </Link>
              
              {post.content_snippet && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {renderHighlightedText(post.content_snippet)}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  👤 {post.author?.name || 'Anonymous'}
                </span>
                <span className="flex items-center gap-1">
                  ❤️ {post.likes_count}
                </span>
                <span className="flex items-center gap-1">
                  💬 {post.comments_count}
                </span>
                <span className="flex items-center gap-1">
                  👁️ {post.views_count}
                </span>
              </div>
              
              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {post.tags.slice(0, 3).map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
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