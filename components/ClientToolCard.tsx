'use client'

import { Tool, isNewTool, IntegrationLevel, Identity, getRecommendedReason } from '@/lib/tools'
import { Locale, getTranslations } from '@/lib/i18n'
import BookmarkButton from './BookmarkButton'
import { useVotes } from '@/lib/VotesContext'

interface ClientToolCardProps {
  tool: Tool
  locale: Locale
  identity?: Identity | null
  compareSelected?: boolean
  canAddToCompare?: boolean
  onToggleCompare?: (toolId: string) => void
  alternatives?: Tool[]  // 同类工具
}

// Helper function to get integration level display info
function getIntegrationLevelInfo(level: IntegrationLevel | undefined, t: any) {
  if (!level) return null
  
  const config = {
    quick_start: {
      label: t.toolCard.quickStart,
      color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      hint: t.integration.quickStartHint
    },
    standard: {
      label: t.toolCard.standard,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      hint: t.integration.standardHint
    },
    advanced: {
      label: t.toolCard.advanced,
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      hint: t.integration.advancedHint
    }
  }
  
  return config[level]
}

export default function ClientToolCard({ tool, locale, identity, compareSelected, canAddToCompare = true, onToggleCompare, alternatives = [] }: ClientToolCardProps) {
  const t = getTranslations(locale)
  const { isVoted, toggleVote, getVoteCount } = useVotes()
  const hasVoted = isVoted(tool.id)
  const voteCount = getVoteCount(tool.id, tool.votes || 0)
  
  const pricingColor = {
    free: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    freemium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    paid: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  }[tool.pricing as 'free' | 'freemium' | 'paid'] || 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'

  const pricingLabel = {
    free: t.pricing.free,
    freemium: t.pricing.freemium,
    paid: t.pricing.paid,
  }[tool.pricing as 'free' | 'freemium' | 'paid'] || tool.pricing

  const isNew = isNewTool(tool)
  const integrationInfo = getIntegrationLevelInfo(tool.integration_level, t)
  const recommendationReason = identity ? getRecommendedReason(tool, identity, locale) : null
  
  // Get dynamic pick label based on identity
  const getPickLabel = () => {
    if (!identity) return null
    const identityLabels: Record<Identity, string> = {
      developer: t.identity.pickFor.developer,
      founder: t.identity.pickFor.founder,
      researcher: t.identity.pickFor.researcher,
      pm: t.identity.pickFor.pm
    }
    return identityLabels[identity]
  }
  const pickLabel = getPickLabel()

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm transition-all bg-white dark:bg-gray-800 relative group">
      {/* Compare Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleCompare?.(tool.id)
          }}
          disabled={!compareSelected && !canAddToCompare}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            compareSelected
              ? 'bg-blue-600 border-blue-600 text-white'
              : canAddToCompare
                ? 'border-gray-300 dark:border-gray-600 hover:border-blue-400 bg-white dark:bg-gray-800'
                : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
          }`}
          title={compareSelected ? t.compare.remove : canAddToCompare ? t.compare.add : t.compare.maxReached}
          aria-label={compareSelected ? t.compare.remove : t.compare.add}
        >
          {compareSelected && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Bookmark Button */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Vote Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleVote(tool.id)
          }}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
            hasVoted
              ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900'
          }`}
          title={hasVoted ? t.votes.remove : t.votes.add}
          aria-label={hasVoted ? t.votes.remove : t.votes.add}
        >
          <span>{hasVoted ? '🔥' : '👍'}</span>
          <span>{voteCount}</span>
        </button>
        <BookmarkButton toolId={tool.id} toolName={tool.name} />
      </div>

      <a href={`/tools/${tool.slug}`} className="block">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="pr-8">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">{tool.name}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{tool.tagline}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {isNew && (
              <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full whitespace-nowrap font-medium">
                {t.toolCard.new}
              </span>
            )}
            {tool.agent_friendly && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                {t.toolCard.agentFriendly}
              </span>
            )}
            {tool.featured && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                {t.toolCard.featured}
              </span>
            )}
          </div>
        </div>

        {/* Recommendation Reason */}
        {recommendationReason && pickLabel && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">💡 {pickLabel}</span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{recommendationReason}</p>
          </div>
        )}

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{tool.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {tool.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pricingColor}`}>
              {pricingLabel}
            </span>
            {/* Integration Level Badge */}
            {integrationInfo && (
              <span 
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${integrationInfo.color}`} 
                title={integrationInfo.hint}
              >
                {integrationInfo.label}
                {tool.quickstart_time && <span className="opacity-60 ml-1">~{tool.quickstart_time}</span>}
              </span>
            )}
            {tool.api_available && (
              <span className="text-xs bg-cyan-50 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 px-2 py-0.5 rounded-full" title="API Available">
                {t.toolCard.api}
              </span>
            )}
            {tool.open_source && (
              <span className="text-xs bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded-full" title="Open Source">
                {t.toolCard.oss}
              </span>
            )}
          </div>
          <span className="text-xs text-blue-500 font-medium">
            {t.toolCard.viewDetails}
          </span>
        </div>
      </a>

      {/* Alternatives - 同类工具标签 */}
      {alternatives.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {locale === 'zh-CN' ? '替代方案:' : 'Alternatives:'}
            </span>
            {alternatives.map(alt => (
              <a
                key={alt.id}
                href={`/tools/${alt.slug}`}
                className="text-xs bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {alt.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}