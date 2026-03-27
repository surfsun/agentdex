'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthButton'

interface Tool {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  category: string
  tags: string[]
  pricing: string | null
  agent_friendly: boolean
  open_source: boolean
  featured: boolean
  verified: boolean
  website: string | null
  github: string | null
}

interface TagInfo {
  name: string
  count: number
}

export default function HomeClient() {
  useAuth() // 初始化 auth 状态
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [featuredTools, setFeaturedTools] = useState<Tool[]>([])
  const [popularTags, setPopularTags] = useState<TagInfo[]>([])
  const [stats, setStats] = useState({ tools: 0, agentFriendly: 0, categories: 0, skills: 0 })
  const [loadingTools, setLoadingTools] = useState(true)
  const [loadingTags, setLoadingTags] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchFeaturedTools()
    fetchPopularTags()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.stats) {
          setStats({
            tools: data.stats.tools || 0,
            agentFriendly: data.stats.agentFriendly || 0,
            categories: data.stats.categories || 0,
            skills: data.stats.skills || 0,
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  async function fetchFeaturedTools() {
    try {
      const res = await fetch('/api/tools?featured=true&limit=6')
      if (res.ok) {
        const data = await res.json()
        setFeaturedTools(data.tools || [])
      }
    } catch (err) {
      console.error('Failed to fetch featured tools:', err)
    } finally {
      setLoadingTools(false)
    }
  }

  async function fetchPopularTags() {
    try {
      const res = await fetch('/api/tags')
      if (res.ok) {
        const data = await res.json()
        setPopularTags(data.popular_tags || [])
      }
    } catch (err) {
      console.error('Failed to fetch tags:', err)
    } finally {
      setLoadingTags(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/tools?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-900 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            AgentDex
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-2">
            为 AI Agent 打造的工具目录
          </p>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            发现、比较、选择最适合你的 AI Agent 的工具 — 通信、记忆、网页抓取、代码执行、集成等
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.tools}+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">工具</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.agentFriendly}+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Agent-Friendly</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">{stats.categories}+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">分类</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-amber-600 dark:text-amber-400">{stats.skills}+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Skills</div>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索工具... 例如: memory, web scraping, code execution"
                className="w-full px-6 py-4 text-lg border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
              >
                搜索
              </button>
            </div>
          </form>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/tools"
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 transition"
            >
              🔧 工具目录
            </Link>
            <Link
              href="/skills"
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 transition"
            >
              🧠 Agent Skills
            </Link>
            <Link
              href="/submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition"
            >
              🚀 提交工具
            </Link>
          </div>
        </div>
      </section>

      {/* Tags Section */}
      {!loadingTags && popularTags.length > 0 && (
        <section className="py-8 border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-2">
              {popularTags.slice(0, 12).map(tag => (
                <Link
                  key={tag.name}
                  href={`/tools?q=${encodeURIComponent(tag.name)}`}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition"
                >
                  {tag.name} <span className="text-gray-400 dark:text-gray-500 text-xs">({tag.count})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Tools Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>⭐</span> 精选工具
            </h2>
            <Link
              href="/tools"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              查看全部 →
            </Link>
          </div>

          {loadingTools ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredTools.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              暂无精选工具，<Link href="/tools" className="text-blue-600 dark:text-blue-400 hover:underline">查看全部工具</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredTools.slice(0, 6).map(tool => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {tool.name}
                    </h3>
                    {tool.agent_friendly && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full whitespace-nowrap font-medium">
                        🤖 Agent
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                    {tool.tagline || tool.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tool.pricing && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        tool.pricing === 'free' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : tool.pricing === 'freemium'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {tool.pricing}
                      </span>
                    )}
                    {tool.open_source && (
                      <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                        开源
                      </span>
                    )}
                    {tool.verified && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                        ✓ 已验证
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              浏览全部工具 →
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            为什么选择 AgentDex？
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Agent-First 设计</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                专为 AI Agent 优化的工具筛选，带有 API 文档、集成指南和最佳实践
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">智能搜索</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                语义搜索、标签过滤、分类浏览，快速找到你需要的工具
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">工具比较</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                并排比较多个工具的功能、定价、集成难度，做出明智选择
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Cards */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/skills"
              className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl hover:shadow-md transition-all text-center"
            >
              <div className="text-3xl mb-2">🧠</div>
              <div className="font-medium text-gray-900 dark:text-white">Agent Skills</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">能力配置模板</div>
            </Link>
            <Link
              href="/stacks"
              className="p-5 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl hover:shadow-md transition-all text-center"
            >
              <div className="text-3xl mb-2">🧩</div>
              <div className="font-medium text-gray-900 dark:text-white">Tool Stacks</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">工具组合方案</div>
            </Link>
            <Link
              href="/eval"
              className="p-5 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-800 rounded-xl hover:shadow-md transition-all text-center"
            >
              <div className="text-3xl mb-2">📊</div>
              <div className="font-medium text-gray-900 dark:text-white">Eval 排行</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">工具评测对比</div>
            </Link>
            <Link
              href="/agent.md"
              className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:shadow-md transition-all text-center"
            >
              <div className="text-3xl mb-2">📄</div>
              <div className="font-medium text-gray-900 dark:text-white">Agent 入口</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">LLM 友好文档</div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}