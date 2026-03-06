import { Metadata } from 'next'
import { tools, categories } from '@/lib/tools'
import ToolCard from '@/components/ToolCard'
import ClientSearch from '@/components/ClientSearch'

interface SearchParams {
  category?: string
  q?: string
  agent_friendly?: string
  open_source?: string
  pricing?: string
}

// 动态生成 metadata，支持分类页面 SEO
export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const params = await searchParams
  const category = params.category
  const query = params.q
  
  // 搜索页面
  if (query) {
    return {
      title: `Search: ${query} — AgentDex`,
      description: `Search results for "${query}" in AgentDex - the tool directory built for AI agents.`,
      robots: 'noindex', // 搜索结果页不索引
    }
  }
  
  // 分类页面
  if (category && category !== 'all') {
    const cat = categories.find(c => c.id === category)
    const toolCount = tools.filter(t => t.category === category).length
    return {
      title: `${cat?.label || category} Tools — AgentDex`,
      description: `Discover ${toolCount} ${cat?.label || category} tools for AI agents. AgentDex is the tool directory built specifically for AI agents.`,
      alternates: {
        canonical: `https://www.agentdex.top/?category=${category}`,
      },
      openGraph: {
        title: `${cat?.label || category} Tools — AgentDex`,
        description: `Discover ${toolCount} ${cat?.label || category} tools for AI agents.`,
        url: `https://www.agentdex.top/?category=${category}`,
        siteName: 'AgentDex',
        type: 'website',
      },
    }
  }
  
  // 首页
  return {
    title: 'AgentDex — The tool directory built for AI agents',
    description: 'Discover tools built specifically for AI agents: communication, memory, web scraping, code execution, integration and more.',
    alternates: {
      canonical: 'https://www.agentdex.top',
    },
  }
}

// 构建筛选 URL，支持多条件组合
function buildFilterUrl(params: {
  category?: string
  agent_friendly?: boolean
  open_source?: boolean
  pricing?: string
  q?: string
}): string {
  const searchParams = new URLSearchParams()
  
  if (params.category && params.category !== 'all') {
    searchParams.set('category', params.category)
  }
  if (params.agent_friendly) {
    searchParams.set('agent_friendly', 'true')
  }
  if (params.open_source) {
    searchParams.set('open_source', 'true')
  }
  if (params.pricing) {
    searchParams.set('pricing', params.pricing)
  }
  if (params.q) {
    searchParams.set('q', params.q)
  }
  
  const queryString = searchParams.toString()
  return queryString ? `/?${queryString}` : '/'
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const activeCategory = params.category || 'all'
  const query = params.q || ''
  const agentFriendlyFilter = params.agent_friendly === 'true'
  const openSourceFilter = params.open_source === 'true'
  const pricingFilter = params.pricing || ''

  let displayTools = tools
  
  // 先应用筛选（可组合）
  if (agentFriendlyFilter) {
    displayTools = displayTools.filter(t => t.agent_friendly)
  }
  if (openSourceFilter) {
    displayTools = displayTools.filter(t => t.open_source)
  }
  if (pricingFilter) {
    displayTools = displayTools.filter(t => t.pricing === pricingFilter)
  }
  
  // 再应用搜索/分类
  if (query) {
    // 搜索时忽略分类筛选
    displayTools = displayTools.filter(t =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.tagline.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    )
  } else if (activeCategory !== 'all') {
    displayTools = displayTools.filter(t => t.category === activeCategory)
  }

  // 计算各筛选条件下的工具数量（用于智能提示）
  const agentFriendlyCount = tools.filter(t => t.agent_friendly).length
  const openSourceCount = tools.filter(t => t.open_source).length
  const freeCount = tools.filter(t => t.pricing === 'free').length
  const freemiumCount = tools.filter(t => t.pricing === 'freemium').length

  // 生成 JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: query ? `Search results for "${query}"` : activeCategory === 'all' ? 'AgentDex Tools' : `${categories.find(c => c.id === activeCategory)?.label || activeCategory} Tools`,
    description: 'The tool directory built for AI agents',
    numberOfItems: displayTools.length,
    itemListElement: displayTools.slice(0, 10).map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: tool.name,
        description: tool.description,
        url: `https://www.agentdex.top/tools/${tool.slug}`,
      },
    })),
  }

  // 计算当前活跃的筛选器数量
  const activeFilterCount = [
    agentFriendlyFilter,
    openSourceFilter,
    !!pricingFilter,
    activeCategory !== 'all'
  ].filter(Boolean).length

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          The tool directory built for AI agents
        </h1>
        <p className="text-lg text-gray-500 mb-2">
          Discover infrastructure tools designed specifically for AI agents —
          not adapted from human tools.
        </p>
        <p className="text-sm text-blue-600 font-mono mb-3">
          GET https://www.agentdex.top/api/tools — machine-readable, agent-friendly
        </p>
        {/* Agent 入口 */}
        <div className="flex justify-center gap-3">
          <a
            href="/agent.md"
            className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-200 transition"
          >
            🤖 Agent? Read /agent.md
          </a>
          <a
            href="/for-agents"
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition"
          >
            📖 API Reference
          </a>
        </div>
      </div>

      {/* Search with Real-time Filter */}
      <ClientSearch currentQuery={query} />

      {/* Stats - 实时更新 */}
      <div className="flex gap-6 text-sm text-gray-400 mb-6">
        <span className="font-medium text-gray-600">{displayTools.length} tools</span>
        <span>{displayTools.filter(t => t.agent_friendly).length} agent-friendly</span>
        <span>{displayTools.filter(t => t.open_source).length} open source</span>
      </div>

      {/* Agent 快捷筛选 - 支持组合 */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-500 font-medium">Filters:</span>
        <a
          href={buildFilterUrl({
            category: activeCategory,
            agent_friendly: !agentFriendlyFilter,
            open_source: openSourceFilter,
            pricing: pricingFilter || undefined,
            q: query || undefined
          })}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            agentFriendlyFilter
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
          }`}
        >
          🤖 Agent-friendly <span className="text-xs opacity-60">({agentFriendlyCount})</span>
        </a>
        <a
          href={buildFilterUrl({
            category: activeCategory,
            agent_friendly: agentFriendlyFilter,
            open_source: !openSourceFilter,
            pricing: pricingFilter || undefined,
            q: query || undefined
          })}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            openSourceFilter
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
          }`}
        >
          📦 Open Source <span className="text-xs opacity-60">({openSourceCount})</span>
        </a>
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-500">Pricing:</span>
        <a
          href={buildFilterUrl({
            category: activeCategory,
            agent_friendly: agentFriendlyFilter,
            open_source: openSourceFilter,
            pricing: pricingFilter === 'free' ? undefined : 'free',
            q: query || undefined
          })}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            pricingFilter === 'free'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
          }`}
        >
          💚 Free <span className="text-xs opacity-60">({freeCount})</span>
        </a>
        <a
          href={buildFilterUrl({
            category: activeCategory,
            agent_friendly: agentFriendlyFilter,
            open_source: openSourceFilter,
            pricing: pricingFilter === 'freemium' ? undefined : 'freemium',
            q: query || undefined
          })}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            pricingFilter === 'freemium'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          }`}
        >
          💙 Freemium <span className="text-xs opacity-60">({freemiumCount})</span>
        </a>
        {activeFilterCount > 0 && (
          <a
            href="/"
            className="px-3 py-1 rounded-full text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300"
          >
            ✕ Clear ({activeFilterCount})
          </a>
        )}
      </div>

      {/* Category Filter - 始终显示，搜索时显示工具的分类标签 */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => {
          // 搜索时显示匹配该分类的工具数量
          const count = query
            ? displayTools.filter(t => t.category === cat.id).length
            : undefined
          
          // 搜索时不高亮分类，但显示各分类的结果数
          const isActive = !query && activeCategory === cat.id
          
          return (
            <a
              key={cat.id}
              href={buildFilterUrl({
                category: cat.id,
                agent_friendly: agentFriendlyFilter,
                open_source: openSourceFilter,
                pricing: pricingFilter || undefined,
                q: query || undefined
              })}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {cat.label}
              {query && count !== undefined && count > 0 && (
                <span className="ml-1 text-xs text-blue-500">({count})</span>
              )}
            </a>
          )
        })}
      </div>

      {/* Search Results Header */}
      {query && (
        <div className="mb-4 text-sm text-gray-600">
          Found {displayTools.length} result{displayTools.length !== 1 ? 's' : ''} for &quot;{query}&quot;
          {' — '}
          <a href="/" className="text-blue-500 hover:underline">Clear search</a>
        </div>
      )}

      {/* Active Filters Summary - Agent 友好显示 */}
      {activeFilterCount > 0 && !query && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <span className="font-medium">Active filters:</span>{' '}
          {agentFriendlyFilter && <span className="mr-2">🤖 Agent-friendly</span>}
          {openSourceFilter && <span className="mr-2">📦 Open Source</span>}
          {pricingFilter && <span className="mr-2">💰 {pricingFilter}</span>}
          {activeCategory !== 'all' && <span className="mr-2">📁 {categories.find(c => c.id === activeCategory)?.label}</span>}
          <span className="text-blue-500">→ {displayTools.length} tools found</span>
        </div>
      )}

      {/* Tool Grid */}
      {displayTools.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>No tools found. <a href="/" className="text-blue-500 hover:underline">Clear filters</a></p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTools.map(tool => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}

      {/* Submit CTA */}
      <div className="mt-16 bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Know a tool that should be here?
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Submit via API or open a GitHub issue.
        </p>
        <div className="flex justify-center gap-3">
          <a
            href="/for-agents"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            Submit via API (for agents)
          </a>
          <a
            href="https://github.com/surfsun/agentdex/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Open GitHub Issue (for humans)
          </a>
        </div>
      </div>
      </div>
    </>
  )
}