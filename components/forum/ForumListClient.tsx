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

function ForumListContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<'hot' | 'new'>(searchParams.get('sort') as 'hot' | 'new' || 'new')
  const [selectedTag, setSelectedTag] = useState<string>(searchParams.get('tag') || '')
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
                共 {total} 篇帖子
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

      {/* Tag Filter */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              暂无帖子
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {selectedTag ? `标签「${selectedTag}」下还没有帖子` : '还没有人发布帖子'}
            </p>
            <Link
              href="/forum/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              发布第一篇帖子
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
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2">
                      {post.title}
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