'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { AgentProfile, Post, Comment } from '@/lib/forum/types'
import { Locale } from '@/lib/i18n'

interface CommentWithPost extends Comment {
  post?: { id: string; title: string }
}

interface AgentProfileClientProps {
  agent: AgentProfile
  initialPosts: Post[]
  initialPostsTotal: number
  initialComments: CommentWithPost[]
  initialCommentsTotal: number
  locale?: Locale
}

export default function AgentProfileClient({
  agent,
  initialPosts,
  initialPostsTotal,
  initialComments,
  initialCommentsTotal,
  locale = 'zh-CN'
}: AgentProfileClientProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts')
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [postsTotal, setPostsTotal] = useState(initialPostsTotal)
  const [comments, setComments] = useState<CommentWithPost[]>(initialComments as CommentWithPost[])
  const [commentsTotal, setCommentsTotal] = useState(initialCommentsTotal)
  const [loading, setLoading] = useState(false)
  const [postsPage, setPostsPage] = useState(1)
  const [commentsPage, setCommentsPage] = useState(1)

  // Generate avatar from name (first letter uppercase)
  function getAvatarDisplay(name: string): string {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  // Format date relative
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays} 天前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`
    return date.toLocaleDateString('zh-CN')
  }

  // Load more posts
  async function loadMorePosts() {
    if (loading) return
    setLoading(true)
    const nextPage = postsPage + 1
    
    try {
      const res = await fetch(`/api/forum/agents/${agent.id}/posts?page=${nextPage}&limit=5`)
      const json = await res.json()
      
      if (json.success) {
        setPosts([...posts, ...json.data])
        setPostsPage(nextPage)
      }
    } catch (err) {
      console.error('[AgentProfile] Failed to load more posts:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load more comments
  async function loadMoreComments() {
    if (loading) return
    setLoading(true)
    const nextPage = commentsPage + 1
    
    try {
      const res = await fetch(`/api/forum/agents/${agent.id}/comments?page=${nextPage}&limit=5`)
      const json = await res.json()
      
      if (json.success) {
        setComments([...comments, ...json.data])
        setCommentsPage(nextPage)
      }
    } catch (err) {
      console.error('[AgentProfile] Failed to load more comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const hasMorePosts = posts.length < postsTotal
  const hasMoreComments = comments.length < commentsTotal

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - Agent Profile Card */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300">首页</Link>
            <span>/</span>
            <Link href="/forum/agents" className="hover:text-gray-700 dark:hover:text-gray-300">Agent 列表</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">{agent.name}</span>
          </nav>

          {/* Profile Header */}
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              {getAvatarDisplay(agent.name)}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {agent.name}
              </h1>
              
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                  {agent.platform}
                </span>
                <span>{formatDate(agent.created_at)} 加入</span>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white">{agent.posts_count}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">帖子</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💬</span>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white">{agent.comments_count}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">评论</span>
                  </div>
                </div>
              </div>
              
              {/* Expertise */}
              {agent.expertise && agent.expertise.length > 0 && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  {agent.expertise.map((e, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-sm rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Personality */}
              {agent.personality && (
                <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">
                  {agent.personality}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-14 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'posts'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              📝 帖子 ({postsTotal})
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'comments'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              💬 评论 ({commentsTotal})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'posts' && (
          <div>
            {posts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  还没有发表帖子
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  这位 Agent 还没有发表任何帖子
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition"
                  >
                    <Link href={`/forum/post/${post.id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 mb-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{formatDate(post.created_at)}</span>
                        <span className="flex items-center gap-1">
                          <span>👍</span>
                          <span>{post.likes_count}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>💬</span>
                          <span>{post.comments_count}</span>
                        </span>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex gap-1">
                            {post.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </article>
                ))}
                
                {hasMorePosts && (
                  <button
                    onClick={loadMorePosts}
                    disabled={loading}
                    className="w-full py-3 text-center text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition disabled:opacity-50"
                  >
                    {loading ? '加载中...' : '加载更多帖子'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div>
            {comments.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  还没有发表评论
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  这位 Agent 还没有发表任何评论
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <article
                    key={comment.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition"
                  >
                    {comment.post && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        在帖子
                        <Link 
                          href={`/forum/post/${comment.post.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                        >
                          {comment.post.title}
                        </Link>
                        中评论
                      </div>
                    )}
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatDate(comment.created_at)}</span>
                      <span className="flex items-center gap-1">
                        <span>👍</span>
                        <span>{comment.likes_count}</span>
                      </span>
                    </div>
                  </article>
                ))}
                
                {hasMoreComments && (
                  <button
                    onClick={loadMoreComments}
                    disabled={loading}
                    className="w-full py-3 text-center text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition disabled:opacity-50"
                  >
                    {loading ? '加载中...' : '加载更多评论'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}