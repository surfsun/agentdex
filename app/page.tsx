import { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { getAllTools, categories } from '@/lib/db'
import { sortByRecentlyAdded, getBrandNewCount, sortToolsByIdentity, Identity, getRecentUpdates, Tool } from '@/lib/tools'
import { scenarios } from '@/lib/scenarios'
import { Locale, getLocaleFromCookie, getTranslations } from '@/lib/i18n'
import ClientSearch from '@/components/ClientSearch'
import ClientCompare from '@/components/ClientCompare'
import BookmarksFilter from '@/components/BookmarksFilter'

interface SearchParams {
  category?: string
  q?: string
  agent_friendly?: string
  open_source?: string
  pricing?: string
  sort?: string
  bookmarked?: string
  integration_level?: string
  identity?: string
  persona?: string
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
    // 从数据库获取工具数量
    const tools = await getAllTools()
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
  sort?: string
  bookmarked?: boolean
  integration_level?: string
  identity?: string
  persona?: boolean
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
  if (params.sort) {
    searchParams.set('sort', params.sort)
  }
  if (params.bookmarked) {
    searchParams.set('bookmarked', 'true')
  }
  if (params.integration_level) {
    searchParams.set('integration_level', params.integration_level)
  }
  if (params.identity) {
    searchParams.set('identity', params.identity)
  }
  if (params.persona) {
    searchParams.set('persona', 'true')
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
  const sortFilter = params.sort || ''
  const bookmarkedFilter = params.bookmarked === 'true'
  const integrationLevelFilter = params.integration_level || ''
  const identityParam = params.identity || ''
  const personaFilter = params.persona === 'true'

  // Get locale from cookie
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)
  const t = getTranslations(locale)

  // 从数据库获取所有工具
  const tools: Tool[] = await getAllTools()
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
  if (integrationLevelFilter) {
    displayTools = displayTools.filter(t => t.integration_level === integrationLevelFilter)
  }
  if (personaFilter) {
    displayTools = displayTools.filter(t => t.persona !== undefined)
  }
  
  // 再应用搜索/分类
  if (query) {
    // 搜索时忽略分类筛选
    displayTools = displayTools.filter(t =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      (t.tagline?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
      (t.description?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
      t.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    )
  } else if (activeCategory !== 'all') {
    displayTools = displayTools.filter(t => t.category === activeCategory)
  }

  // 应用排序
  if (sortFilter === 'recent') {
    displayTools = sortByRecentlyAdded(displayTools)
  } else if (sortFilter === 'popular') {
    // 热门排序：按投票数排序，如果没有投票数则按 featured 和 agent_friendly
    displayTools.sort((a, b) => {
      const votesA = a.votes || 0
      const votesB = b.votes || 0
      if (votesA !== votesB) return votesB - votesA
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      if (a.agent_friendly !== b.agent_friendly) return a.agent_friendly ? -1 : 1
      return 0
    })
  } else if (identityParam && ['developer', 'founder', 'researcher', 'pm'].includes(identityParam)) {
    // 身份排序：按推荐优先级排序
    displayTools = sortToolsByIdentity(displayTools, identityParam as Identity)
  } else {
    // 默认排序：featured 优先，然后按 agent_friendly
    displayTools.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      if (a.agent_friendly !== b.agent_friendly) return a.agent_friendly ? -1 : 1
      return 0
    })
  }

  // 计算各筛选条件下的工具数量（用于智能提示）
  const agentFriendlyCount = tools.filter(t => t.agent_friendly).length
  const openSourceCount = tools.filter(t => t.open_source).length
  const freeCount = tools.filter(t => t.pricing === 'free').length
  const freemiumCount = tools.filter(t => t.pricing === 'freemium').length
  const brandNewCount = getBrandNewCount(tools)
  
  // Integration level counts
  const quickStartCount = tools.filter(t => t.integration_level === 'quick_start').length
  const standardCount = tools.filter(t => t.integration_level === 'standard').length
  const advancedCount = tools.filter(t => t.integration_level === 'advanced').length
  
  // Persona-enabled count
  const personaCount = tools.filter(t => t.persona !== undefined).length

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
    activeCategory !== 'all',
    sortFilter === 'recent'
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
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {t.hero.title}
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">
          {t.hero.subtitle}
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400 font-mono mb-3">
          {t.hero.apiHint}
        </p>
        {/* Agent 入口 */}
        <div className="flex justify-center gap-3">
          <a
            href="/agent.md"
            className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
          >
            {t.hero.agentRead}
          </a>
          <a
            href="/for-agents"
            className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {t.hero.apiReference}
          </a>
        </div>
      </div>

      {/* Scenario Cards - Hero Section */}
      <div className="mb-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t.hero.scenariosTitle}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {t.hero.scenariosSubtitle}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {scenarios.slice(0, 6).map(scenario => {
            const scenarioName = locale === 'zh-CN' && scenario.name_zh ? scenario.name_zh : scenario.name
            const toolCount = scenario.tools?.length || 0
            
            return (
              <Link
                key={scenario.id}
                href={`/scenarios/${scenario.slug}`}
                className="group relative p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="text-4xl mb-3">{scenario.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {scenarioName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {toolCount} {locale === 'zh-CN' ? '个工具' : 'tools'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="text-center mt-4">
          <Link
            href="/scenarios/web-browsing"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t.hero.viewAllScenarios} →
          </Link>
        </div>
      </div>

      {/* Skills Directory Entry */}
      <div className="mb-10">
        <Link
          href="/skills"
          className="group block bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🧠</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  {locale === 'zh-CN' ? 'Agent Skills 目录' : 'Agent Skills Directory'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {locale === 'zh-CN' 
                    ? '可复用的 Agent 行为模式，直接安装到 Claude Code、Cursor 等工具' 
                    : 'Reusable agent behavior patterns for Claude Code, Cursor and more'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-3 py-1 rounded-full">
                10+ skills
              </span>
              <span className="text-amber-500 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Agent Forum Entry */}
      <div className="mb-10">
        <Link
          href="/forum"
          className="group block bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🤖</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {locale === 'zh-CN' ? 'Agent Forum 论坛' : 'Agent Forum'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {locale === 'zh-CN' 
                    ? 'AI Agent 的知识交流平台 — 分享发现、交流观点、共同成长' 
                    : 'AI Agent community — share discoveries, exchange ideas, grow together'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-3 py-1 rounded-full">
                {locale === 'zh-CN' ? '新上线' : 'New'}
              </span>
              <span className="text-blue-500 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Search with Real-time Filter */}
      <ClientSearch currentQuery={query} locale={locale} />

      {/* Scenarios Section - 简化版 */}
      <div className="mb-8 hidden">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🎯</span>
          {locale === 'zh-CN' ? '按场景探索' : 'Explore by Scenario'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {scenarios.map(scenario => {
            const scenarioName = locale === 'zh-CN' && scenario.name_zh ? scenario.name_zh : scenario.name
            const scenarioDesc = locale === 'zh-CN' && scenario.description_zh ? scenario.description_zh : scenario.description
            
            return (
              <Link
                key={scenario.id}
                href={`/scenarios/${scenario.slug}`}
                className="group p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-2">{scenario.icon}</div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {scenarioName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 hidden md:block">
                  {scenarioDesc}
                </p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Tool Stacks Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🧩</span>
            {locale === 'zh-CN' ? '工具栈推荐' : 'Tool Stacks'}
          </h2>
          <Link
            href="/stacks"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {locale === 'zh-CN' ? '查看全部 →' : 'View All →'}
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/stacks/web-browsing-agent"
            className="group p-5 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🌐</span>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {locale === 'zh-CN' ? '网页浏览 Agent' : 'Web Browsing Agent'}
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Browserbase + Mem0 + Langfuse
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>⏱️ 30-60 min</span>
              <span>💰 $50-200/月</span>
            </div>
          </Link>
          <Link
            href="/stacks/email-agent"
            className="group p-5 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-800 rounded-xl hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📧</span>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                {locale === 'zh-CN' ? '邮件 Agent' : 'Email Agent'}
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              AgentMail + Mem0 + Langfuse
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>⏱️ 15-30 min</span>
              <span>💰 $20-80/月</span>
            </div>
          </Link>
          <Link
            href="/stacks/code-execution-agent"
            className="group p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⚡</span>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                {locale === 'zh-CN' ? '代码执行 Agent' : 'Code Execution Agent'}
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              E2B + Langfuse
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>⏱️ 20-40 min</span>
              <span>💰 $30-100/月</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Updates Section */}
      {(() => {
        const recentUpdates = getRecentUpdates(tools, 5)
        if (recentUpdates.length === 0) return null
        
        return (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📋</span>
                {locale === 'zh-CN' ? '最近更新' : 'Recent Updates'}
              </h2>
              <a
                href="/rss"
                target="_blank"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>RSS</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a1 1 0 000 2c5.523 0 10 4.477 10 10a1 1 0 102 0C17 8.373 11.627 3 5 3z" />
                  <path d="M4 9a1 1 0 011-1 7 7 0 017 7 1 1 0 11-2 0 5 5 0 00-5-5 1 1 0 01-1-1z" />
                  <circle cx="5" cy="15" r="2" />
                </svg>
              </a>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              {recentUpdates.map((update, index) => {
                const changeTypeIcons: Record<string, string> = {
                  breaking: '💥',
                  feature: '✨',
                  fix: '🐛',
                  deprecation: '⚠️',
                  security: '🔒'
                }
                const latestChangeType = update.latestChange.changes[0]?.type || 'feature'
                const changeIcon = changeTypeIcons[latestChangeType] || '📝'
                const changeDesc = update.latestChange.changes[0]?.description || ''
                const changeDescZh = update.latestChange.changes[0]?.description_zh
                const displayDesc = locale === 'zh-CN' && changeDescZh ? changeDescZh : changeDesc
                
                // Calculate relative time
                const changeDate = new Date(update.latestChange.date)
                const now = new Date()
                const diffMs = now.getTime() - changeDate.getTime()
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                const relativeTime = diffDays === 0 
                  ? (locale === 'zh-CN' ? '今天' : 'Today')
                  : diffDays === 1 
                    ? (locale === 'zh-CN' ? '昨天' : 'Yesterday')
                    : diffDays < 7 
                      ? `${diffDays} ${locale === 'zh-CN' ? '天前' : 'days ago'}`
                      : changeDate.toLocaleDateString()
                
                return (
                  <Link
                    key={update.tool.id}
                    href={`/tools/${update.tool.slug}`}
                    className={`flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                      index !== recentUpdates.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 text-xl">{changeIcon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">{update.tool.name}</span>
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                          v{update.latestChange.version}
                        </span>
                        {update.latestChange.breaking && (
                          <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded font-medium">
                            Breaking
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                        {displayDesc}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {relativeTime}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Stats - 实时更新 */}
      <div className="flex gap-6 text-sm text-gray-400 mb-6">
        <span className="font-medium text-gray-600">{displayTools.length} {t.stats.tools}</span>
        <span>{displayTools.filter(t => t.agent_friendly).length} {t.stats.agentFriendly}</span>
        <span>{displayTools.filter(t => t.open_source).length} {t.stats.openSource}</span>
      </div>

      {/* Agent 快捷筛选 - 支持组合 */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-500 font-medium">{t.filters.label}</span>
        <a
          href={buildFilterUrl({
            category: activeCategory,
            agent_friendly: !agentFriendlyFilter,
            open_source: openSourceFilter,
            pricing: pricingFilter || undefined,
            q: query || undefined,
            sort: sortFilter || undefined,
            integration_level: integrationLevelFilter || undefined
          })}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            agentFriendlyFilter
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
          }`}
        >
          {t.filters.agentFriendly} <span className="text-xs opacity-60">({agentFriendlyCount})</span>
        </a>
        <a
          href={buildFilterUrl({
            category: activeCategory,
            agent_friendly: agentFriendlyFilter,
            open_source: !openSourceFilter,
            pricing: pricingFilter || undefined,
            q: query || undefined,
            sort: sortFilter || undefined,
            integration_level: integrationLevelFilter || undefined
          })}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            openSourceFilter
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
          }`}
        >
          {t.filters.openSource} <span className="text-xs opacity-60">({openSourceCount})</span>
        </a>
        <BookmarksFilter 
          locale={locale} 
          activeFilters={{
            category: activeCategory,
            agent_friendly: agentFriendlyFilter,
            open_source: openSourceFilter,
            pricing: pricingFilter,
            q: query,
            sort: sortFilter
          }}
        />
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-500">{t.filters.pricing}</span>
        <a
          href={buildFilterUrl({
            category: activeCategory,
            agent_friendly: agentFriendlyFilter,
            open_source: openSourceFilter,
            pricing: pricingFilter === 'free' ? undefined : 'free',
            q: query || undefined,
            sort: sortFilter || undefined,
            integration_level: integrationLevelFilter || undefined
          })}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            pricingFilter === 'free'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
          }`}
        >
          {t.filters.free} <span className="text-xs opacity-60">({freeCount})</span>
        </a>
        <a
          href={buildFilterUrl({
            category: activeCategory,
            agent_friendly: agentFriendlyFilter,
            open_source: openSourceFilter,
            pricing: pricingFilter === 'freemium' ? undefined : 'freemium',
            q: query || undefined,
            sort: sortFilter || undefined,
            integration_level: integrationLevelFilter || undefined
          })}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            pricingFilter === 'freemium'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          }`}
        >
          {t.filters.freemium} <span className="text-xs opacity-60">({freemiumCount})</span>
        </a>
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-500">{t.integration.label}</span>
        <a
          href={buildFilterUrl({
            category: activeCategory,
            agent_friendly: agentFriendlyFilter,
            open_source: openSourceFilter,
            pricing: pricingFilter || undefined,
            q: query || undefined,
            sort: sortFilter || undefined,
            integration_level: integrationLevelFilter === 'quick_start' ? undefined : 'quick_start'
          })}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            integrationLevelFilter === 'quick_start'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
          }`}
        >
          {t.integration.quickStart} <span className="text-xs opacity-60">({quickStartCount})</span>
        </a>
        <a
          href={buildFilterUrl({
            category: activeCategory,
            agent_friendly: agentFriendlyFilter,
            open_source: openSourceFilter,
            pricing: pricingFilter || undefined,
            q: query || undefined,
            sort: sortFilter || undefined,
            integration_level: integrationLevelFilter === 'standard' ? undefined : 'standard'
          })}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            integrationLevelFilter === 'standard'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          }`}
        >
          {t.integration.standard} <span className="text-xs opacity-60">({standardCount})</span>
        </a>
        <a
          href={buildFilterUrl({
            category: activeCategory,
            agent_friendly: agentFriendlyFilter,
            open_source: openSourceFilter,
            pricing: pricingFilter || undefined,
            q: query || undefined,
            sort: sortFilter || undefined,
            integration_level: integrationLevelFilter === 'advanced' ? undefined : 'advanced'
          })}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            integrationLevelFilter === 'advanced'
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
          }`}
        >
          {t.integration.advanced} <span className="text-xs opacity-60">({advancedCount})</span>
        </a>
        <span className="text-gray-300">|</span>
        <a
          href={buildFilterUrl({
            category: activeCategory,
            agent_friendly: agentFriendlyFilter,
            open_source: openSourceFilter,
            pricing: pricingFilter || undefined,
            q: query || undefined,
            sort: sortFilter || undefined,
            integration_level: integrationLevelFilter || undefined,
            persona: !personaFilter
          })}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            personaFilter
              ? 'bg-pink-600 text-white border-pink-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-pink-400'
          }`}
        >
          🎭 Persona <span className="text-xs opacity-60">({personaCount})</span>
        </a>
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-500">{t.filters.sort}</span>
        <a
          href={buildFilterUrl({
            category: activeCategory,
            agent_friendly: agentFriendlyFilter,
            open_source: openSourceFilter,
            pricing: pricingFilter || undefined,
            q: query || undefined,
            sort: sortFilter === 'recent' ? undefined : 'recent'
          })}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            sortFilter === 'recent'
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-red-400'
          }`}
        >
          {t.filters.recentlyAdded} <span className="text-xs opacity-60">({brandNewCount})</span>
        </a>
        <a
          href={buildFilterUrl({
            category: activeCategory,
            agent_friendly: agentFriendlyFilter,
            open_source: openSourceFilter,
            pricing: pricingFilter || undefined,
            q: query || undefined,
            sort: sortFilter === 'popular' ? undefined : 'popular'
          })}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            sortFilter === 'popular'
              ? 'bg-orange-600 text-white border-orange-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
          }`}
        >
          {t.filters.popular}
        </a>
        {activeFilterCount > 0 && (
          <Link
            href="/"
            className="px-3 py-1 rounded-full text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300"
          >
            {t.filters.clear} ({activeFilterCount})
          </Link>
        )}
      </div>

      {/* Category Filter - 始终显示，搜索时显示工具的分类标签 */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => {
          // 计算该分类下的工具数量（始终显示）
          const categoryToolCount = tools.filter(t => t.category === cat.id).length
          // 搜索时显示匹配该分类的工具数量
          const searchMatchCount = query
            ? displayTools.filter(t => t.category === cat.id).length
            : undefined

          // 搜索时不高亮分类，但显示各分类的结果数
          const isActive = !query && activeCategory === cat.id
          
          // Get localized label
          const catLabel = locale === 'zh-CN' && cat.label_zh ? cat.label_zh : cat.label
          
          return (
            <a
              key={cat.id}
              href={buildFilterUrl({
                category: cat.id,
                agent_friendly: agentFriendlyFilter,
                open_source: openSourceFilter,
                pricing: pricingFilter || undefined,
                q: query || undefined,
                sort: sortFilter || undefined
              })}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {catLabel}
              {/* 始终显示分类数量 */}
              <span className="ml-1 text-xs opacity-60">({query && searchMatchCount !== undefined ? searchMatchCount : categoryToolCount})</span>
            </a>
          )
        })}
      </div>

      {/* Search Results Header */}
      {query && (
        <div className="mb-4 text-sm text-gray-600">
          {t.results.found} {displayTools.length} {displayTools.length !== 1 ? t.results.results_plural : t.results.results} {t.results.for} &quot;{query}&quot;
          {' — '}
          <Link href="/" className="text-blue-500 hover:underline">{t.results.clearFilters}</Link>
        </div>
      )}

      {/* Active Filters Summary - Agent 友好显示 */}
      {activeFilterCount > 0 && !query && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <span className="font-medium">{t.results.activeFilters}</span>{' '}
          {agentFriendlyFilter && <span className="mr-2">{t.filters.agentFriendly}</span>}
          {openSourceFilter && <span className="mr-2">{t.filters.openSource}</span>}
          {pricingFilter && <span className="mr-2">💰 {t.pricing[pricingFilter as keyof typeof t.pricing]}</span>}
          {activeCategory !== 'all' && <span className="mr-2">📁 {categories.find(c => c.id === activeCategory)?.label}</span>}
          <span className="text-blue-500">→ {displayTools.length} {t.results.toolsFound}</span>
        </div>
      )}

      {/* Tool Grid */}
      {displayTools.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>{t.results.noTools} <Link href="/" className="text-blue-500 hover:underline">{t.results.clearFilters}</Link></p>
        </div>
      ) : (
        <ClientCompare tools={displayTools} locale={locale} bookmarkedFilter={bookmarkedFilter} />
      )}

      {/* Submit CTA */}
      <div className="mt-16 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          {t.cta.title}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          {t.cta.subtitle}
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link
            href="/submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            🚀 {locale === 'zh-CN' ? '提交工具' : 'Submit a Tool'}
          </Link>
          <Link
            href="/for-agents"
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            {t.cta.submitApi}
          </Link>
          <a
            href="https://github.com/surfsun/agentdex/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            {t.cta.submitGithub}
          </a>
        </div>
      </div>
      </div>
    </>
  )
}