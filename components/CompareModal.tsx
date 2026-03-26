'use client'

import { useState } from 'react'
import { Tool } from '@/lib/tools'
import { Locale, getTranslations } from '@/lib/i18n'

interface CompareModalProps {
  tools: Tool[]
  locale: Locale
  onClose: () => void
}

export default function CompareModal({ tools, locale, onClose }: CompareModalProps) {
  const [copied, setCopied] = useState(false)
  const t = getTranslations(locale)

  // Helper to get pricing label
  const getPricingLabel = (pricing: string | null) => {
    if (!pricing) return '-'
    const labels: Record<string, string> = {
      free: t.pricing.free,
      freemium: t.pricing.freemium,
      paid: t.pricing.paid,
    }
    return labels[pricing] || pricing
  }

  // Helper to get pricing color
  const getPricingColor = (pricing: string | null) => {
    if (!pricing) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    const colors: Record<string, string> = {
      free: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      freemium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      paid: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    }
    return colors[pricing] || 'bg-gray-100 text-gray-700'
  }

  // Helper to format GitHub stars
  const formatStars = (stars: number | undefined) => {
    if (!stars) return '-'
    if (stars >= 1000) return `${(stars / 1000).toFixed(1)}K`
    return stars.toString()
  }

  // Helper to get integration complexity label and color
  const getComplexityInfo = (complexity: string | undefined) => {
    if (!complexity) return { label: '-', color: 'text-gray-400' }
    const info: Record<string, { label: string; color: string }> = {
      low: { 
        label: locale === 'zh-CN' ? '简单' : 'Low', 
        color: 'text-green-600 dark:text-green-400' 
      },
      medium: { 
        label: locale === 'zh-CN' ? '中等' : 'Medium', 
        color: 'text-yellow-600 dark:text-yellow-400' 
      },
      high: { 
        label: locale === 'zh-CN' ? '复杂' : 'High', 
        color: 'text-red-600 dark:text-red-400' 
      },
    }
    return info[complexity] || { label: complexity, color: 'text-gray-400' }
  }

  // Helper to get integration level label
  const getIntegrationLevelInfo = (level: string | undefined) => {
    if (!level) return { label: '-', color: 'text-gray-400', time: '-' }
    const info: Record<string, { label: string; color: string; time: string }> = {
      quick_start: { 
        label: locale === 'zh-CN' ? '快速入门' : 'Quick Start', 
        color: 'text-green-600 dark:text-green-400',
        time: '~5 min'
      },
      standard: { 
        label: locale === 'zh-CN' ? '标准' : 'Standard', 
        color: 'text-yellow-600 dark:text-yellow-400',
        time: '~15 min'
      },
      advanced: { 
        label: locale === 'zh-CN' ? '高级' : 'Advanced', 
        color: 'text-red-600 dark:text-red-400',
        time: '~30 min'
      },
    }
    return info[level] || { label: level, color: 'text-gray-400', time: '-' }
  }

  // Find best value for GitHub stars
  const maxStars = Math.max(...tools.map(t => t.github_stars || 0))
  
  // Find best complexity (lowest is best)
  const complexityOrder = { low: 1, medium: 2, high: 3 }
  const minComplexity = Math.min(...tools.map(t => complexityOrder[t.integration_complexity || 'high']))

  // Export as Markdown
  const exportAsMarkdown = async () => {
    const headers = [
      locale === 'zh-CN' ? '对比项' : 'Comparison',
      ...tools.map(t => t.name)
    ]
    
    const rows = [
      [locale === 'zh-CN' ? '简介' : 'Tagline', ...tools.map(t => t.tagline || '-')],
      [t.compare.pricing, ...tools.map(t => t.pricing || '-')],
      [t.compare.githubStars, ...tools.map(t => t.github_stars ? `${t.github_stars}` : '-')],
      [t.compare.agentFriendly, ...tools.map(t => t.agent_friendly ? '✓' : '✗')],
      [t.compare.openSource, ...tools.map(t => t.open_source ? '✓' : '✗')],
      [t.compare.apiAvailable, ...tools.map(t => t.api_available ? '✓' : '✗')],
      [t.compare.gettingStarted, ...tools.map(t => t.integration_level || '-')],
    ]
    
    const toolIds = tools.map(t => t.id)
    const md = `# ${tools.map(t => t.name).join(' vs ')}\n\n` +
      `> ${locale === 'zh-CN' ? '导出自 AgentDex' : 'Exported from AgentDex'}: https://www.agentdex.top/compare?tools=${toolIds.join(',')}\n\n` +
      `| ${headers.join(' | ')} |\n` +
      `| ${headers.map(() => '---').join(' | ')} |\n` +
      rows.map(row => `| ${row.join(' | ')} |`).join('\n') +
      `\n\n---\n\n` +
      tools.map(t => {
        const url = `https://www.agentdex.top/tools/${t.slug}`
        return `- **${t.name}**: ${url}`
      }).join('\n')
    
    await navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Generate smart recommendations based on comparison
  const generateRecommendations = () => {
    const recommendations: { condition: string; recommended: string; reason: string }[] = []
    
    // Find best for each scenario
    const agentFriendlyTools = tools.filter(t => t.agent_friendly)
    const openSourceTools = tools.filter(t => t.open_source)
    const freeTools = tools.filter(t => t.pricing === 'free')
    const quickStartTools = tools.filter(t => t.integration_level === 'quick_start')
    
    if (agentFriendlyTools.length > 0 && agentFriendlyTools.length < tools.length) {
      recommendations.push({
        condition: locale === 'zh-CN' ? '需要 Agent 友好' : 'Need Agent-friendly',
        recommended: agentFriendlyTools[0].name,
        reason: locale === 'zh-CN' ? '专为 Agent 优化' : 'Optimized for agents'
      })
    }
    
    if (openSourceTools.length > 0 && openSourceTools.length < tools.length) {
      recommendations.push({
        condition: locale === 'zh-CN' ? '需要自托管' : 'Need self-hosted',
        recommended: openSourceTools[0].name,
        reason: locale === 'zh-CN' ? '开源可自托管' : 'Open source, self-hostable'
      })
    }
    
    if (freeTools.length > 0 && freeTools.length < tools.length) {
      recommendations.push({
        condition: locale === 'zh-CN' ? '预算有限' : 'Budget constrained',
        recommended: freeTools[0].name,
        reason: locale === 'zh-CN' ? '完全免费' : 'Completely free'
      })
    }
    
    if (quickStartTools.length > 0 && quickStartTools.length < tools.length) {
      recommendations.push({
        condition: locale === 'zh-CN' ? '快速验证想法' : 'Quick prototype',
        recommended: quickStartTools[0].name,
        reason: locale === 'zh-CN' ? '5分钟快速集成' : '5-min quick start'
      })
    }
    
    return recommendations.slice(0, 4) // Limit to 4 recommendations
  }
  
  const recommendations = generateRecommendations()

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {t.compare.title}
          </h2>
          <div className="flex items-center gap-2">
            {/* Export button */}
            <button
              onClick={exportAsMarkdown}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1"
              title={t.compare.exportHint}
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span className="hidden sm:inline">{t.compare.copied}</span>
                </>
              ) : (
                <>
                  <span>📝</span>
                  <span className="hidden sm:inline">{t.compare.exportMarkdown}</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Comparison Content - Scrollable */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {/* Mobile: Horizontal scroll table */}
          <div className="md:hidden overflow-x-auto -mx-4 px-4">
            <div className="inline-block min-w-full">
              {/* Mobile comparison cards - horizontal scroll */}
              <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
                {tools.map(tool => {
                  const complexityInfo = getComplexityInfo(tool.integration_complexity)
                  const isBestStars = tool.github_stars === maxStars && maxStars > 0
                  const isBestComplexity = complexityOrder[tool.integration_complexity || 'high'] === minComplexity
                  
                  return (
                    <div
                      key={tool.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800 w-64 flex-shrink-0"
                    >
                      {/* Tool Header */}
                      <div className="mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">{tool.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-2">{tool.tagline}</p>
                      </div>

                      {/* Comparison Fields */}
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t.compare.githubStars}</span>
                          <span className={isBestStars ? 'text-green-600 font-medium' : ''}>
                            {isBestStars && tool.github_stars ? '🏆 ' : ''}{formatStars(tool.github_stars)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t.compare.pricing}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${getPricingColor(tool.pricing)}`}>
                            {getPricingLabel(tool.pricing)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t.compare.integrationComplexity}</span>
                          <span className={isBestComplexity ? 'text-green-600 font-medium' : complexityInfo.color}>
                            {isBestComplexity && tool.integration_complexity ? '✓ ' : ''}{complexityInfo.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t.compare.agentFriendly}</span>
                          <span className={tool.agent_friendly ? 'text-green-600' : 'text-gray-400'}>
                            {tool.agent_friendly ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t.compare.openSource}</span>
                          <span className={tool.open_source ? 'text-green-600' : 'text-gray-400'}>
                            {tool.open_source ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t.compare.apiAvailable}</span>
                          <span className={tool.api_available ? 'text-green-600' : 'text-gray-400'}>
                            {tool.api_available ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t.compare.gettingStarted}</span>
                          <span className={tool.integration_level === 'quick_start' ? 'text-green-600' : ''}>
                            {getIntegrationLevelInfo(tool.integration_level).label}
                          </span>
                        </div>
                      </div>

                      {/* Link */}
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <a
                          href={`/tools/${tool.slug}`}
                          className="text-blue-500 hover:text-blue-600 text-xs font-medium"
                        >
                          {t.toolCard.viewDetails}
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden md:block">
            <div className={`grid gap-4 ${tools.length === 2 ? 'grid-cols-2' : tools.length === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
              {tools.map(tool => {
                const complexityInfo = getComplexityInfo(tool.integration_complexity)
                const isBestStars = tool.github_stars === maxStars && maxStars > 0
                const isBestComplexity = complexityOrder[tool.integration_complexity || 'high'] === minComplexity
                
                return (
                  <div
                    key={tool.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800"
                  >
                    {/* Tool Header */}
                    <div className="mb-4">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{tool.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{tool.tagline}</p>
                      {tool.featured && (
                        <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                          ⭐ {locale === 'zh-CN' ? '精选' : 'Featured'}
                        </span>
                      )}
                    </div>

                    {/* Comparison Fields */}
                    <div className="space-y-3 text-sm">
                      {/* GitHub Stars */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-500">
                          {t.compare.githubStars}
                        </span>
                        <span className={`font-medium ${isBestStars ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {isBestStars && tool.github_stars ? '🏆 ' : ''}{formatStars(tool.github_stars)}
                        </span>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-500">{t.compare.pricing}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPricingColor(tool.pricing)}`}>
                          {getPricingLabel(tool.pricing)}
                        </span>
                      </div>

                      {/* Integration Complexity */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-500">
                          {t.compare.integrationComplexity}
                        </span>
                        <span className={`font-medium ${isBestComplexity ? 'text-green-600 dark:text-green-400' : complexityInfo.color}`}>
                          {isBestComplexity && tool.integration_complexity ? '✓ ' : ''}{complexityInfo.label}
                        </span>
                      </div>

                      {/* Agent Friendly */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-500">{t.compare.agentFriendly}</span>
                        <span className={tool.agent_friendly ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}>
                          {tool.agent_friendly ? '✓ Yes' : '✗ No'}
                        </span>
                      </div>

                      {/* Open Source */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-500">{t.compare.openSource}</span>
                        <span className={tool.open_source ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}>
                          {tool.open_source ? '✓ Yes' : '✗ No'}
                        </span>
                      </div>

                      {/* API Available */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-500">{t.compare.apiAvailable}</span>
                        <span className={tool.api_available ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}>
                          {tool.api_available ? '✓ Yes' : '✗ No'}
                        </span>
                      </div>

                      {/* Integration Level */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-500">
                          {t.compare.gettingStarted}
                        </span>
                        <span className={`font-medium ${tool.integration_level === 'quick_start' ? 'text-green-600 dark:text-green-400' : tool.integration_level === 'standard' ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {getIntegrationLevelInfo(tool.integration_level).label}
                          {tool.quickstart_time && <span className="text-gray-400 ml-1">({tool.quickstart_time})</span>}
                        </span>
                      </div>

                      {/* Best For */}
                      {(tool.best_for || tool.best_for_zh) && (
                        <div>
                          <span className="text-gray-400 dark:text-gray-500 block mb-1">
                            {t.compare.bestFor}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {(locale === 'zh-CN' && tool.best_for_zh ? tool.best_for_zh : tool.best_for)?.slice(0, 3).map(use => (
                              <span key={use} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                                {use}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      <div>
                        <span className="text-gray-400 dark:text-gray-500 block mb-1">{t.compare.tags}</span>
                        <div className="flex flex-wrap gap-1">
                          {tool.tags.slice(0, 4).map(tag => (
                            <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Link */}
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <a
                        href={`/tools/${tool.slug}`}
                        className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                      >
                        {t.toolCard.viewDetails}
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Summary Section */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              📊 {t.compare.quickSummary}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {/* Most Stars */}
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">
                  {t.compare.mostStars}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {tools.filter(t => t.github_stars === maxStars && maxStars > 0).map(t => t.name).join(', ') || '-'}
                </span>
              </div>
              {/* Easiest Integration */}
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">
                  {t.compare.easiestSetup}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {tools.filter(t => complexityOrder[t.integration_complexity || 'high'] === minComplexity).map(t => t.name).join(', ') || '-'}
                </span>
              </div>
              {/* Most Agent-Friendly */}
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">
                  {t.compare.agentFriendly}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {tools.filter(t => t.agent_friendly).map(t => t.name).join(', ') || '-'}
                </span>
              </div>
              {/* Open Source */}
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">
                  {t.compare.openSource}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {tools.filter(t => t.open_source).map(t => t.name).join(', ') || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Smart Recommendations */}
          {recommendations.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span>💡</span>
                {t.compare.smartRecommendations}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{rec.condition}</span>
                    <span className="mx-1">→</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{rec.recommended}</span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs ml-auto">{rec.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}