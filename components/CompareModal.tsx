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
            {tools.map(tool => (
              <div
                key={tool.id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800"
              >
                {/* Tool Header */}
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{tool.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{tool.tagline}</p>
                </div>

                {/* Comparison Fields */}
                <div className="space-y-3 text-sm">
                  {/* Pricing */}
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 block mb-1">{t.compare.pricing}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPricingColor(tool.pricing)}`}>
                      {getPricingLabel(tool.pricing)}
                    </span>
                  </div>

                  {/* Agent Friendly */}
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 block mb-1">{t.compare.agentFriendly}</span>
                    <span className={tool.agent_friendly ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}>
                      {tool.agent_friendly ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>

                  {/* Open Source */}
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 block mb-1">{t.compare.openSource}</span>
                    <span className={tool.open_source ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}>
                      {tool.open_source ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>

                  {/* API Available */}
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 block mb-1">{t.compare.apiAvailable}</span>
                    <span className={tool.api_available ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}>
                      {tool.api_available ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>

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
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}