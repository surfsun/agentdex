'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PRESET_TAGS, getTagColorClasses } from '@/lib/forum/tags'

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

interface PostsResponse {
  data: Post[]
  total: number
  page: number
  pageSize: number
}

// Quick action buttons for empty state - link to /forum/new with pre-selected tag
const QUICK_ACTIONS = [
  { icon: '🔧', text: '分享工具', tag: '工具推荐', description: '推荐AI工具，分享使用心得' },
  { icon: '❓', text: '提问求助', tag: '问答求助', description: '向社区提问' },
  { icon: '💡', text: '发布教程', tag: '学习笔记', description: '分享学习心得' },
]

function ForumListContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<'hot' | 'new'>(searchParams.get('sort') as 'hot' | 'new' || 'new')
  const [selectedTag, setSelectedTag] = useState<string>(searchParams.get('tag') || '')
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)
  const pageSize = 20

  useEffect(() => {
    const tag = searchParams.get('tag') || ''
    const sortBy = searchParams.get('sort') as 'hot' | 'new' || 'new'
    setSelectedTag(tag)
    setSort(sortBy)
  }, [searchParams])

  useEffect(() => {
    fetchPosts()
  }, [sort, selectedTag, page])

  async function fetchPosts() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('sort', sort)
      params.set('limit', String(pageSize))
      params.set('offset', String((page - 1) * pageSize))
      if (selectedTag) {
        params.set('tag', selectedTag)
      }

      const res = await fetch(`/api/forum/posts?${params.toString()}`)
      if (res.ok) {
        const data: PostsResponse = await res.json()
        setPosts(data.data || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSortChange(newSort: 'hot' | 'new') {
    setSort(newSort)
    setPage(1)
    updateUrl({ sort: newSort, tag: selectedTag })
  }

  function handleTagClick(tag: string) {
    const newTag = selectedTag === tag ? '' : tag
    setSelectedTag(newTag)
    setPage(1)
    updateUrl({ sort, tag: newTag })
  }

  function updateUrl(params: { sort: string; tag: string }) {
    const newParams = new URLSearchParams()
    if (params.sort !== 'new') newParams.set('sort', params.sort)
    if (params.tag) newParams.set('tag', params.tag)
    const queryString = newParams.toString()
    router.push(queryString ? `/forum?${queryString}` : '/forum')
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>💬</span> 论坛
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                AI Agent 知识交流社区 · 共 {total} 篇帖子
              </p>
            </div>
            <Link
              href="/forum/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm"
            >
              <span>✍️</span>
              <span>发布帖子</span>
            </Link>
          </div>

          {/* Sort Tabs */}
          <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 -mb-px">
            <button
              onClick={() => handleSortChange('new')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                sort === 'new'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              📝 最新
            </button>
            <button
              onClick={() => handleSortChange('hot')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                sort === 'hot'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              🔥 热门
            </button>
          </div>
        </div>
      </div>

      {/* Tag Filter with Tooltips */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">标签：</span>
            {PRESET_TAGS.map(tag => {
              const colors = getTagColorClasses(tag.id)
              const isSelected = selectedTag === tag.name
              const isHovered = hoveredTag === tag.id
              return (
                <div key={tag.id} className="relative">
                  <button
                    onClick={() => handleTagClick(tag.name)}
                    onMouseEnter={() => setHoveredTag(tag.id)}
                    onMouseLeave={() => setHoveredTag(null)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition ${
                      isSelected
                        ? 'ring-2 ring-blue-500 ring-offset-1'
                        : 'hover:opacity-80'
                    } ${colors.bg} ${colors.text}`}
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.name}</span>
                  </button>
                  {/* Tag Description Tooltip */}
                  {isHovered && (
                    <div className="absolute z-10 top-full left-0 mt-1 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                      <div className="font-medium mb-1">{tag.name}</div>
                      <div className="text-gray-300">{tag.description}</div>
                      <div className="text-gray-400 mt-1 text-[10px]">点击筛选</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          // Improved Empty State UI with Quick Action Buttons
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-5xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {selectedTag ? `「${selectedTag}」还没有帖子` : '还没有帖子，成为第一个发帖的人！'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {selectedTag 
                ? `来分享一篇关于「${selectedTag}」的内容吧`
                : '这是一个全新的论坛，你的分享将帮助更多人了解 AI Agent'}
            </p>
            
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {QUICK_ACTIONS.map((action, i) => (
                <Link
                  key={i}
                  href={`/forum/new?tag=${encodeURIComponent(action.tag)}`}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 font-medium transition"
                >
                  <span className="text-lg">{action.icon}</span>
                  <span>{action.text}</span>
                </Link>
              ))}
            </div>
            
            <Link
              href="/forum/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm"
            >
              <span>✍️</span>
              <span>发布第一篇帖子</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition"
                >
                  <Link href={`/forum/post/${post.id}`}>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 flex items-start gap-2">
                      {/* Pinned Badge */}
                      {post.pinned && (
                        <span className="inline-flex items-center shrink-0 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-medium rounded">
                          置顶
                        </span>
                      )}
                      <span className={post.pinned ? 'flex-1' : ''}>{post.title}</span>
                    </h2>
                  </Link>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {post.content}
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
                    </div>
                    <time className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(post.created_at).toLocaleDateString('zh-CN')}
                    </time>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  上一页
                </button>
                <span className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  第 {page} / {totalPages} 页
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function ForumListClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    }>
      <ForumListContent />
    </Suspense>
  )
}