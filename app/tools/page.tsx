import { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { getAllTools, categories } from '@/lib/db'
import { sortByRecentlyAdded, getBrandNewCount, sortToolsByIdentity, Identity, Tool } from '@/lib/tools'
import { Locale, getLocaleFromCookie, getTranslations } from '@/lib/i18n'
import ClientSearch from '@/components/ClientSearch'
import ClientCompare from '@/components/ClientCompare'
import BookmarksFilter from '@/components/BookmarksFilter'

export const metadata: Metadata = {
  title: 'Tools — AgentDex',
  description: 'Discover tools built specifically for AI agents: communication, memory, web scraping, code execution, integration and more.',
}

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
  return queryString ? `/tools?${queryString}` : '/tools'
}

export default async function ToolsPage({
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

  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)
  const t = getTranslations(locale)

  const tools: Tool[] = await getAllTools()
  let displayTools = tools
  
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
  
  if (query) {
    displayTools = displayTools.filter(t =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      (t.tagline?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
      (t.description?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
      t.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    )
  } else if (activeCategory !== 'all') {
    displayTools = displayTools.filter(t => t.category === activeCategory)
  }

  if (sortFilter === 'recent') {
    displayTools = sortByRecentlyAdded(displayTools)
  } else if (sortFilter === 'popular') {
    displayTools.sort((a, b) => {
      const votesA = a.votes || 0
      const votesB = b.votes || 0
      if (votesA !== votesB) return votesB - votesA
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      if (a.agent_friendly !== b.agent_friendly) return a.agent_friendly ? -1 : 1
      return 0
    })
  } else if (identityParam && ['developer', 'founder', 'researcher', 'pm'].includes(identityParam)) {
    displayTools = sortToolsByIdentity(displayTools, identityParam as Identity)
  } else {
    displayTools.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      if (a.agent_friendly !== b.agent_friendly) return a.agent_friendly ? -1 : 1
      return 0
    })
  }

  const agentFriendlyCount = tools.filter(t => t.agent_friendly).length
  const openSourceCount = tools.filter(t => t.open_source).length
  const freeCount = tools.filter(t => t.pricing === 'free').length
  const freemiumCount = tools.filter(t => t.pricing === 'freemium').length
  const brandNewCount = getBrandNewCount(tools)
  const quickStartCount = tools.filter(t => t.integration_level === 'quick_start').length
  const standardCount = tools.filter(t => t.integration_level === 'standard').length
  const advancedCount = tools.filter(t => t.integration_level === 'advanced').length
  const personaCount = tools.filter(t => t.persona !== undefined).length

  const activeFilterCount = [
    agentFriendlyFilter,
    openSourceFilter,
    !!pricingFilter,
    activeCategory !== 'all',
    sortFilter === 'recent'
  ].filter(Boolean).length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-blue-600">首页</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">工具目录</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🛠️ 工具目录
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          专为 AI Agent 设计的工具，支持快速集成
        </p>
      </div>

      {/* Search */}
      <ClientSearch currentQuery={query} locale={locale} />

      {/* Stats */}
      <div className="flex gap-6 text-sm text-gray-400 mb-6">
        <span className="font-medium text-gray-600">{displayTools.length} {t.stats.tools}</span>
        <span>{displayTools.filter(t => t.agent_friendly).length} {t.stats.agentFriendly}</span>
        <span>{displayTools.filter(t => t.open_source).length} {t.stats.openSource}</span>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
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
            href="/tools"
            className="px-3 py-1 rounded-full text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300"
          >
            {t.filters.clear} ({activeFilterCount})
          </Link>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => {
          const categoryToolCount = tools.filter(t => t.category === cat.id).length
          const searchMatchCount = query
            ? displayTools.filter(t => t.category === cat.id).length
            : undefined
          const isActive = !query && activeCategory === cat.id
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
          <Link href="/tools" className="text-blue-500 hover:underline">{t.results.clearFilters}</Link>
        </div>
      )}

      {/* Tool Grid */}
      {displayTools.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>{t.results.noTools} <Link href="/tools" className="text-blue-500 hover:underline">{t.results.clearFilters}</Link></p>
        </div>
      ) : (
        <ClientCompare tools={displayTools} locale={locale} bookmarkedFilter={bookmarkedFilter} />
      )}
    </div>
  )
}