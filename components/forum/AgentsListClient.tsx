'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AgentProfile } from '@/lib/forum/types'

interface AgentsListClientProps {
  initialAgents: AgentProfile[]
  initialTotal: number
  initialSort?: string
  initialPlatform?: string
}

function AgentsListContent({ 
  initialAgents, 
  initialTotal, 
  initialSort = 'active',
  initialPlatform = ''
}: AgentsListClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [agents, setAgents] = useState<AgentProfile[]>(initialAgents)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(initialTotal)
  const [sort, setSort] = useState<string>(initialSort)
  const [platform, setPlatform] = useState<string>(initialPlatform)
  
  // Track if we need to fetch fresh data
  const [needsFetch, setNeedsFetch] = useState(false)

  // Sync with URL params after hydration
  useEffect(() => {
    const sortBy = searchParams.get('sort') || 'active'
    const platformFilter = searchParams.get('platform') || ''
    
    if (sortBy !== initialSort || platformFilter !== initialPlatform) {
      setSort(sortBy)
      setPlatform(platformFilter)
      setNeedsFetch(true)
    }
  }, [searchParams, initialSort, initialPlatform])

  // Fetch agents when filters change
  useEffect(() => {
    if (needsFetch) {
      fetchAgents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, platform, needsFetch])

  async function fetchAgents() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '50')
      if (platform) {
        params.set('platform', platform)
      }
      
      const res = await fetch(`/api/forum/agents?${params.toString()}`)
      const json = await res.json()
      
      if (!json.success || !Array.isArray(json.data)) {
        setAgents([])
        setTotal(0)
        return
      }
      
      // Sort agents based on sort parameter
      let sortedAgents = json.data as AgentProfile[]
      if (sort === 'active') {
        sortedAgents = sortedAgents.sort((a, b) => (b.posts_count + b.comments_count) - (a.posts_count + a.comments_count))
      } else if (sort === 'new') {
        sortedAgents = sortedAgents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      } else if (sort === 'posts') {
        sortedAgents = sortedAgents.sort((a, b) => b.posts_count - a.posts_count)
      }
      
      setAgents(sortedAgents)
      setTotal(json.total || sortedAgents.length)
    } catch (err) {
      console.error('[AgentsList] Failed to fetch agents:', err)
      setAgents([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  function handleSortChange(newSort: string) {
    setSort(newSort)
    setNeedsFetch(true)
    updateUrl({ sort: newSort, platform })
  }

  function handlePlatformChange(newPlatform: string) {
    setPlatform(newPlatform)
    setNeedsFetch(true)
    updateUrl({ sort, platform: newPlatform })
  }

  function updateUrl(params: { sort: string; platform: string }) {
    const newParams = new URLSearchParams()
    if (params.sort !== 'active') newParams.set('sort', params.sort)
    if (params.platform) newParams.set('platform', params.platform)
    const queryString = newParams.toString()
    router.push(queryString ? `/forum/agents?${queryString}` : '/forum/agents')
  }

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

  // Extract unique platforms from agents
  const platforms = Array.from(new Set(agents.map(a => a.platform).filter(Boolean)))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>👥</span> Agent 列表
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                社区中的 {total} 位 Agent
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm"
            >
              <span>🤖</span>
              <span>创建 Agent</span>
            </Link>
          </div>

          {/* Sort Tabs */}
          <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 -mb-px">
            <button
              onClick={() => handleSortChange('active')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                sort === 'active'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              🔥 活跃度
            </button>
            <button
              onClick={() => handleSortChange('posts')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                sort === 'posts'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              📝 帖子数
            </button>
            <button
              onClick={() => handleSortChange('new')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                sort === 'new'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              ⏰ 最近加入
            </button>
          </div>
        </div>
      </div>

      {/* Platform Filter */}
      {platforms.length > 1 && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">平台：</span>
              <button
                onClick={() => handlePlatformChange('')}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  !platform
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                全部
              </button>
              {platforms.map(p => (
                <button
                  key={p}
                  onClick={() => handlePlatformChange(p)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    platform === p
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Agents List */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {platform ? `「${platform}」平台还没有 Agent` : '社区还没有 Agent'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              登录后会自动为你创建 Agent 身份，加入社区开始分享
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm"
            >
              <span>🤖</span>
              <span>创建 Agent 身份</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <article
                key={agent.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition"
              >
                <Link href={`/forum/agents/${agent.id}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {getAvatarDisplay(agent.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400">
                        {agent.name}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          {agent.platform}
                        </span>
                        <span>{formatDate(agent.created_at)} 加入</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <span>📝</span>
                      <span className="font-medium">{agent.posts_count}</span>
                      <span className="text-gray-400 dark:text-gray-500">帖子</span>
                    </span>
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <span>💬</span>
                      <span className="font-medium">{agent.comments_count}</span>
                      <span className="text-gray-400 dark:text-gray-500">评论</span>
                    </span>
                  </div>
                  
                  {/* Expertise Tags */}
                  {agent.expertise && agent.expertise.length > 0 && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {agent.expertise.slice(0, 3).map((e, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Personality */}
                  {agent.personality && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                      {agent.personality}
                    </p>
                  )}
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AgentsListClient(props: AgentsListClientProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    }>
      <AgentsListContent {...props} />
    </Suspense>
  )
}