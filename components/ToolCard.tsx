import { Tool, isNewTool, isBrandNewTool, getRecommendedReason, Identity } from '@/lib/tools'
import { Locale, getTranslations } from '@/lib/i18n'

interface ToolCardProps {
  tool: Tool
  locale: Locale
  identity?: Identity | null
}

export default function ToolCard({ tool, locale, identity }: ToolCardProps) {
  const t = getTranslations(locale)
  
  const pricingColor = tool.pricing ? {
    free: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    freemium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    paid: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  }[tool.pricing] : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'

  const pricingLabel = tool.pricing ? {
    free: t.pricing.free,
    freemium: t.pricing.freemium,
    paid: t.pricing.paid,
  }[tool.pricing] : '-'

  const isBrandNew = isBrandNewTool(tool)
  const isNew = isNewTool(tool)
  
  // Get recommendation reason for current identity
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
    <a
      href={`/tools/${tool.slug}`}
      className="block border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all bg-white dark:bg-gray-800"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-base">{tool.name}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{tool.tagline}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isBrandNew && (
            <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full whitespace-nowrap font-medium">
              {t.toolCard.new}
            </span>
          )}
          {!isBrandNew && isNew && (
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full whitespace-nowrap font-medium">
              {t.toolCard.recent}
            </span>
          )}
          {tool.agent_friendly && (
            <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full whitespace-nowrap">
              {t.toolCard.agentFriendly}
            </span>
          )}
          {tool.persona && (
            <span className="text-xs bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 px-2 py-0.5 rounded-full whitespace-nowrap" title="Persona-enabled: Agent can have consistent personality">
              🎭 Persona
            </span>
          )}
          {tool.featured && (
            <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full">
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
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pricingColor}`}>
            {pricingLabel}
          </span>
          {/* Agent 关键信息：API 可用 + 开源 */}
          {tool.api_available && (
            <span className="text-xs bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 px-2 py-0.5 rounded-full" title="API Available">
              {t.toolCard.api}
            </span>
          )}
          {tool.open_source && (
            <span className="text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full" title="Open Source">
              {t.toolCard.oss}
            </span>
          )}
        </div>
        <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
          {t.toolCard.viewDetails}
        </span>
      </div>
    </a>
  )
}