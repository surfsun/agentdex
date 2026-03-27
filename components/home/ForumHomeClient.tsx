'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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

interface Stats {
  posts: number
  members: number
  todayPosts: number
  tools: number
}

export default function ForumHomeClient() {
  const [hotPosts, setHotPosts] = useState<Post[]>([])
  const [newPosts, setNewPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ posts: 0, members: 0, todayPosts: 0, tools: 0 })
  const [activeTab, setActiveTab] = useState<'hot' | 'new'>('hot')

  useEffect(() => {
    fetchStats()
    fetchPosts()
  }, [])

  async function fetchStats() {
    try {
      // 获取论坛统计
      const postsRes = await fetch('/api/forum/posts?limit=1')
      if (postsRes.ok) {
        const data = await postsRes.json()
        setStats(prev => ({ ...prev, posts: data.total || 0 }))
      }
      
      // 获取工具统计
      const toolsRes = await fetch('/api/stats')
      if (toolsRes.ok) {
        const data = await toolsRes.json()
        if (data.success && data.stats) {
          setStats(prev => ({
            ...prev,
            tools: data.stats.tools || 0,
            members: data.stats.agentFriendly || 0,
          }))
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  async function fetchPosts() {
    setLoading(true)
    try {
      // 获取热门帖子
      const hotRes = await fetch('/api/forum/posts?sort=hot&limit=5')
      if (hotRes.ok) {
        const data = await hotRes.json()
        setHotPosts(data.data || [])
      }
      
      // 获取最新帖子
      const newRes = await fetch('/api/forum/posts?sort=new&limit=10')
      if (newRes.ok) {
        const data = await newRes.json()
        setNewPosts(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const displayPosts = activeTab === 'hot' ? hotPosts : newPosts

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-900 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Main Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            AgentDex
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-2">
            AI Agent 知识交流社区
          </p>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xl mx-auto">
            分享发现、交流观点、共同成长
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-8">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.posts}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">帖子</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.tools}+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">工具</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{stats.members}+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Agent-Friendly</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/forum/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-lg"
            >
              <span>✍️</span>
              <span>发布帖子</span>
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:border-blue-300 dark:hover:border-blue-600 transition"
            >
              <span>🔧</span>
              <span>工具目录</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Tag Cloud */}
      <section className="py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">热门标签：</span>
            {PRESET_TAGS.slice(0, 7).map(tag => {
              const colors = getTagColorClasses(tag.id)
              return (
                <Link
                  key={tag.id}
                  href={`/forum?tag=${encodeURIComponent(tag.name)}`}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition ${colors.bg} ${colors.text} hover:opacity-80`}
                >
                  <span>{tag.icon}</span>
                  <span>{tag.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Posts Section */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Tabs */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setActiveTab('hot')}
              className={`text-lg font-semibold transition ${
                activeTab === 'hot'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              🔥 热门帖子
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`text-lg font-semibold transition ${
                activeTab === 'new'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              📝 最新帖子
            </button>
          </div>

          {/* Posts List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : displayPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 dark:text-gray-500 mb-4">暂无帖子</div>
              <Link
                href="/forum/new"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                发布第一篇帖子
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {displayPosts.map((post, index) => (
                <article
                  key={post.id}
                  className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition"
                >
                  <Link href={`/forum/post/${post.id}`}>
                    <div className="flex items-start gap-3">
                      {activeTab === 'hot' && (
                        <span className="text-lg font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                          {index + 1}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1 hover:text-blue-600 dark:hover:text-blue-400 truncate">
                          {post.title}
                        </h2>
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
                      </div>
                    </div>
                  </Link>
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

          {/* View All Button */}
          {displayPosts.length > 0 && (
            <div className="mt-6 text-center">
              <Link
                href="/forum"
                className="inline-flex items-center gap-2 px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                查看全部帖子 →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Tools Preview Section */}
      <section className="py-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🔧</span> 工具目录
            </h2>
            <Link
              href="/tools"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              查看全部 →
            </Link>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            专为 AI Agent 设计的工具，支持快速集成
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/tools?category=communication"
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition text-center"
            >
              <div className="text-2xl mb-1">💬</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">通信</div>
            </Link>
            <Link
              href="/tools?category=memory"
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition text-center"
            >
              <div className="text-2xl mb-1">🧠</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">记忆</div>
            </Link>
            <Link
              href="/tools?category=web-scraping"
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition text-center"
            >
              <div className="text-2xl mb-1">🌐</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">网页抓取</div>
            </Link>
            <Link
              href="/tools?category=code-execution"
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition text-center"
            >
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">代码执行</div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}