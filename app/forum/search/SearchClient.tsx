'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { PRESET_TAGS, getTagColorClasses } from '@/lib/forum/tags'
import { calculateHotScore, formatHotScore } from '@/lib/forum/utils'

interface SearchResult {
  id: string
  title: string
  content: string
  content_snippet?: string
  title_highlighted?: string
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
  } | null
}

interface SearchResponse {
  success: boolean
  query?: string
  data: SearchResult[]
  total: number
  page: number
  limit: number
  has_more: boolean
  error?: string
}

interface SearchClientProps {
  initialQuery?: string
  initialTag?: string
  initialSort?: 'relevance' | 'new' | 'hot'
  initialResults?: SearchResult[]
  initialTotal?: number
  initialHasMore?: boolean
}

function SearchContent({
  initialQuery = '',
  initialTag = '',
  initialSort = 'relevance' as 'relevance' | 'new' | 'hot',
  initialResults = [],
  initialTotal = 0,
  initialHasMore = false
}: SearchClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [query, setQuery] = useState(initialQuery)
  const [selectedTag, setSelectedTag] = useState(initialTag)
  const [sort, setSort] = useState<'relevance' | 'new' | 'hot'>(initialSort)
  const [results, setResults] = useState<SearchResult[]>(initialResults)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const limit = 20
  const resultsRef = useRef<SearchResult[]>(results)
  resultsRef.current = results

  // Keyboard shortcut: '/' to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only trigger if not already focused on input
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Perform search function
  const performSearch = async (pageNum: number) => {
    // 验证：至少提供 query (>=2 chars) 或 tag
    const hasQuery = query.trim().length >= 2
    const hasTag = selectedTag.trim().length > 0
    
    if (!hasQuery && !hasTag) return
    
    setLoading(true)
    // Clear results when starting a new search (first page)
    if (pageNum === 1) {
      setResults([])
      setTotal(0)
    }
    
    try {
      const params = new URLSearchParams()
      if (hasQuery) params.set('q', query.trim())
      if (hasTag) params.set('tag', selectedTag.trim())
      params.set('sort', sort)
      params.set('page', String(pageNum))
      params.set('limit', String(limit))
      
      const res = await fetch(`/api/forum/search?${params.toString()}`)
      const json: SearchResponse = await res.json()
      
      // Check for HTTP errors
      if (!res.ok) {
        setResults([])
        setTotal(0)
        setHasMore(false)
        return
      }
      
      // Validate response structure and success flag
      if (!json.success) {
        setResults([])
        setTotal(0)
        setHasMore(false)
        return
      }
      
      // Always update results, whether success or failure
      const resultsData = Array.isArray(json.data) ? json.data : []
      
      setResults(pageNum === 1 ? resultsData : [...resultsRef.current, ...resultsData])
      setTotal(typeof json.total === 'number' ? json.total : 0)
      setPage(pageNum)
      setHasMore(json.has_more || false)
    } catch (err) {
      console.error('Search failed:', err)
      // On network/parse error, show empty state
      setResults([])
      setTotal(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const performSearchRef = useRef(performSearch)
  performSearchRef.current = performSearch

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const hasQuery = query.trim().length >= 2
    const hasTag = selectedTag.trim().length > 0
    if (hasQuery || hasTag) {
      updateUrl(query, selectedTag, sort)
      performSearch(1)
    }
  }

  const handleTagClick = (tag: string) => {
    const newTag = selectedTag === tag ? '' : tag
    setSelectedTag(newTag)
    updateUrl(query, newTag, sort)
  }

  const handleSortChange = (newSort: 'relevance' | 'new' | 'hot') => {
    setSort(newSort)
    updateUrl(query, selectedTag, newSort)
  }

  const updateUrl = (q: string, tag: string, sortBy: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (tag) params.set('tag', tag)
    if (sortBy !== 'relevance') params.set('sort', sortBy)
    
    const queryString = params.toString()
    router.push(queryString ? `/forum/search?${queryString}` : '/forum/search')
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      performSearch(page + 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/forum" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              ← 返回论坛
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            {selectedTag ? (
              <>
                <span>🏷️</span> {selectedTag}
              </>
            ) : (
              <>
                <span>🔍</span> 搜索
              </>
            )}
          </h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={selectedTag ? `在「${selectedTag}」中搜索...` : "搜索帖子... (按 / 快速聚焦)"}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-block px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-600 rounded">
                /
              </kbd>
            </div>
            <button
              type="submit"
              disabled={query.trim().length < 2 && !selectedTag}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
            >
              搜索
            </button>
          </form>
        </div>
      </div>

      {/* Filters */}
      {(query.trim().length >= 2 || selectedTag.trim().length > 0) && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-4 py-3">
            {/* Tag Filter */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">标签：</span>
              {PRESET_TAGS.map(tag => {
                const colors = getTagColorClasses(tag.id)
                const isSelected = selectedTag === tag.name
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.name)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition ${
                      isSelected
                        ? 'ring-2 ring-blue-500 ring-offset-1'
                        : 'hover:opacity-80'
                    } ${colors.bg} ${colors.text}`}
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.name}</span>
                  </button>
                )
              })}
            </div>
            
            {/* Sort Options - only show when there's a query */}
            {query.trim().length >= 2 && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">排序：</span>
                <button
                  onClick={() => handleSortChange('relevance')}
                  className={`text-sm font-medium transition ${
                    sort === 'relevance'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  相关性
                </button>
                <button
                  onClick={() => handleSortChange('hot')}
                  className={`text-sm font-medium transition ${
                    sort === 'hot'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  🔥 热度
                </button>
                <button
                  onClick={() => handleSortChange('new')}
                  className={`text-sm font-medium transition ${
                    sort === 'new'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  最新
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Query too short hint - only show when there's a partial query but no tag */}
        {query.trim().length > 0 && query.trim().length < 2 && !selectedTag && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            请输入至少 2 个字符进行搜索
          </div>
        )}

        {/* Loading */}
        {loading && results.length === 0 && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* No query or tag yet */}
        {!loading && query.trim().length < 2 && !selectedTag && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-5xl mb-4">🔎</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              搜索论坛内容
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              输入关键词搜索帖子标题和内容，或点击标签浏览
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {PRESET_TAGS.slice(0, 5).map(tag => (
                <button
                  key={tag.id}
                  onClick={() => {
                    setSelectedTag(tag.name)
                    updateUrl(query, tag.name, sort)
                  }}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition hover:opacity-80 ${getTagColorClasses(tag.id).bg} ${getTagColorClasses(tag.id).text}`}
                >
                  <span>{tag.icon}</span>
                  <span>{tag.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              找到 <span className="font-medium text-gray-900 dark:text-white">{total}</span> 条结果
              {selectedTag && (
                <span> 在标签 &quot;<span className="text-gray-900 dark:text-white">{selectedTag}</span>&quot; 下</span>
              )}
              {query && <span> 匹配 &quot;<span className="text-gray-900 dark:text-white">{query}</span>&quot;</span>}
            </div>
            
            <div className="space-y-3">
              {results.map((post) => (
                <article
                  key={post.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition"
                >
                  <Link href={`/forum/post/${post.id}`}>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2">
                      {post.title}
                    </h2>
                  </Link>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {post.content_snippet || post.content}
                  </p>
                  <div className="flex items-center justify-between">
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
                      {/* Hot Score - 与 PostCard.tsx 保持一致 */}
                      {post.likes_count + post.comments_count > 0 && (
                        <span className="flex items-center gap-1 text-orange-500 dark:text-orange-400 font-medium">
                          🔥 {formatHotScore(calculateHotScore(post.likes_count, post.comments_count, post.created_at))}
                        </span>
                      )}
                    </div>
                    <time className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(post.created_at).toLocaleDateString('zh-CN')}
                    </time>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {post.tags.slice(0, 3).map((t, i) => (
                        <button
                          key={i}
                          onClick={() => handleTagClick(t)}
                          className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}
          </>
        )}

        {/* No results */}
        {!loading && (query.trim().length >= 2 || selectedTag) && results.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              没有找到结果
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {selectedTag ? (
                <>标签 &quot;<span className="text-gray-900 dark:text-white">{selectedTag}</span>&quot; 下暂无帖子</>
              ) : (
                <>没有找到 &quot;<span className="text-gray-900 dark:text-white">{query}</span>&quot; 相关的帖子</>
              )}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              {selectedTag ? '试试其他标签或' : '尝试不同的关键词或'}浏览所有帖子
            </p>
            <Link
              href="/forum"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
            >
              浏览论坛
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchClient(props: SearchClientProps) {
  return (
    <SearchContent {...props} />
  )
}