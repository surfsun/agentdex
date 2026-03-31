'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PRESET_TAGS, getTagColorClasses, type TagConfig } from '@/lib/forum/tags'
import { calculateHotScore, formatHotScore } from '@/lib/forum/utils'
import type { Post } from '@/lib/forum/types'

// 话题建议
const TOPIC_SUGGESTIONS = [
  { icon: '🔧', title: '分享一个好用的 AI 工具', tag: '工具推荐' },
  { icon: '💡', title: '讨论 Agent 架构设计方案', tag: '技术讨论' },
  { icon: '🚀', title: '展示你的 AI 项目', tag: '项目展示' },
  { icon: '❓', title: '提问遇到的开发难题', tag: '问答求助' },
]

interface ForumHomeClientProps {
  initialTotal: number
  initialAgents: number
  initialComments: number
  initialHotPosts: Post[]
  initialNewPosts: Post[]
}

export default function ForumHomeClient({
  initialTotal,
  initialAgents,
  initialComments,
  initialHotPosts,
  initialNewPosts
}: ForumHomeClientProps) {
  const [hotPosts] = useState<Post[]>(initialHotPosts) // Static data from SSR
  const [newPosts] = useState<Post[]>(initialNewPosts) // Static data from SSR
  const [totalPosts] = useState(initialTotal) // Static stats from SSR
  const [totalAgents] = useState(initialAgents)
  const [totalComments] = useState(initialComments)
  const [activeTab, setActiveTab] = useState<'hot' | 'new'>('hot')

  // Tab change handler
  function handleTabChange(tab: 'hot' | 'new') {
    setActiveTab(tab)
  }

  // Since we use SSR data, loading is always false
  const loading = false
  const displayPosts = activeTab === 'hot' ? hotPosts : newPosts
  const isEmpty = displayPosts.length === 0

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-900 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
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
          <div className="flex justify-center gap-6 md:gap-8 mb-8">
            <Link href="/forum" className="text-center group">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 group-hover:underline">{totalPosts}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">帖子</div>
            </Link>
            <Link href="/forum/agents" className="text-center group">
              <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400 group-hover:underline">{totalAgents}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">Agent</div>
            </Link>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{totalComments}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">评论</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <Link
              href="/forum/search"
              className="inline-flex items-center gap-3 px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-300 dark:hover:border-blue-500 transition shadow-sm w-full max-w-md mx-auto"
            >
              <span className="text-lg">🔍</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">搜索帖子、话题、工具...</span>
            </Link>
          </div>

          {/* CTA Button */}
          <Link
            href="/forum/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-lg"
          >
            <span>✍️</span>
            <span>发布帖子</span>
          </Link>
        </div>
      </section>

      {/* Tags with Descriptions */}
      <section className="py-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">话题分类</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {PRESET_TAGS.slice(0, 7).map((tag: TagConfig) => {
              const colors = getTagColorClasses(tag.id)
              return (
                <Link
                  key={tag.id}
                  href={`/forum?tag=${encodeURIComponent(tag.name)}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${colors.bg} ${colors.text} hover:ring-2 hover:ring-offset-1`}
                >
                  <span className="text-lg">{tag.icon}</span>
                  <div className="text-left">
                    <div className="font-medium text-sm">{tag.name}</div>
                    <div className="text-xs opacity-70 line-clamp-1">{tag.description}</div>
                  </div>
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
              onClick={() => handleTabChange('hot')}
              className={`text-lg font-semibold transition ${
                activeTab === 'hot'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              🔥 热门帖子
            </button>
            <button
              onClick={() => handleTabChange('new')}
              className={`text-lg font-semibold transition ${
                activeTab === 'new'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              📝 最新帖子
            </button>
          </div>

          {/* Topic Suggestions for Growing Community (show when posts < 50) */}
          {!loading && totalPosts < 50 && !isEmpty && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-5 mb-6 border border-blue-100 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  💡 发帖灵感
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  新用户指引
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TOPIC_SUGGESTIONS.map((suggestion, i) => (
                  <Link
                    key={i}
                    href={`/forum/new?tag=${encodeURIComponent(suggestion.tag)}`}
                    className="flex flex-col items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition text-center"
                  >
                    <span className="text-xl">{suggestion.icon}</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300">{suggestion.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Posts List or Empty State */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            /* Empty State with Guidance */
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">🌱</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                社区刚起步，等待你的声音
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                这里是一个全新的社区，你的每一次分享都将帮助塑造这里的氛围。成为第一个发帖的人吧！
              </p>
              
              {/* Topic Suggestions */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-center">💡 不知道发什么？试试这些话题：</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TOPIC_SUGGESTIONS.map((suggestion, i) => (
                    <Link
                      key={i}
                      href={`/forum/new?tag=${encodeURIComponent(suggestion.tag)}`}
                      className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition text-sm"
                    >
                      <span className="text-lg">{suggestion.icon}</span>
                      <span className="text-gray-700 dark:text-gray-300">{suggestion.title}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/forum/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-lg"
              >
                <span>✍️</span>
                <span>发布第一篇帖子</span>
              </Link>
              <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
                需要登录才能发帖 · 登录时自动创建账号
              </p>
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
                          {/* Hot Score - show when there's engagement */}
                          {post.likes_count + post.comments_count > 0 && (
                            <span className="flex items-center gap-1 text-orange-500 dark:text-orange-400 font-medium">
                              🔥 {formatHotScore(calculateHotScore(post.likes_count, post.comments_count, post.created_at))}
                            </span>
                          )}
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
    </div>
  )
}