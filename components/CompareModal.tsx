'use client'

import { Tool } from '@/lib/tools'
import { Locale, getTranslations } from '@/lib/i18n'

interface CompareModalProps {
  tools: Tool[]
  locale: Locale
  onClose: () => void
}

export default function CompareModal({ tools, locale, onClose }: CompareModalProps) {
  const t = getTranslations(locale)

  // Helper to get pricing label
  const getPricingLabel = (pricing: string) => {
    const labels: Record<string, string> = {
      free: t.pricing.free,
      freemium: t.pricing.freemium,
      paid: t.pricing.paid,
    }
    return labels[pricing] || pricing
  }

  // Helper to get pricing color
  const getPricingColor = (pricing: string) => {
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

  // Find best value for GitHub stars
  const maxStars = Math.max(...tools.map(t => t.github_stars || 0))
  
  // Find best complexity (lowest is best)
  const complexityOrder = { low: 1, medium: 2, high: 3 }
  const minComplexity = Math.min(...tools.map(t => complexityOrder[t.integration_complexity || 'high']))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t.compare.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="p-6">
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
                    {/* GitHub Stars - New */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 dark:text-gray-500">
                        {locale === 'zh-CN' ? 'GitHub Stars' : 'GitHub Stars'}
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

                    {/* Integration Complexity - New */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 dark:text-gray-500">
                        {locale === 'zh-CN' ? '集成难度' : 'Integration'}
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

                    {/* Best For - New */}
                    {(tool.best_for || tool.best_for_zh) && (
                      <div>
                        <span className="text-gray-400 dark:text-gray-500 block mb-1">
                          {locale === 'zh-CN' ? '最适合' : 'Best For'}
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

          {/* Summary Section */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              {locale === 'zh-CN' ? '📊 快速对比' : '📊 Quick Summary'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {/* Most Stars */}
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">
                  {locale === 'zh-CN' ? '最多 Stars' : 'Most Stars'}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {tools.filter(t => t.github_stars === maxStars && maxStars > 0).map(t => t.name).join(', ') || '-'}
                </span>
              </div>
              {/* Easiest Integration */}
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">
                  {locale === 'zh-CN' ? '最易集成' : 'Easiest Setup'}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {tools.filter(t => complexityOrder[t.integration_complexity || 'high'] === minComplexity).map(t => t.name).join(', ') || '-'}
                </span>
              </div>
              {/* Most Agent-Friendly */}
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">
                  {locale === 'zh-CN' ? 'Agent 友好' : 'Agent-Friendly'}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {tools.filter(t => t.agent_friendly).map(t => t.name).join(', ') || '-'}
                </span>
              </div>
              {/* Open Source */}
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">
                  {locale === 'zh-CN' ? '开源' : 'Open Source'}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {tools.filter(t => t.open_source).map(t => t.name).join(', ') || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}