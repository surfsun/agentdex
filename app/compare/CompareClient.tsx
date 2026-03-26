'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Tool } from '@/lib/tools'
import { Locale, getTranslations } from '@/lib/i18n'
import CompareModal from '@/components/CompareModal'
import { comparePresets, ComparePreset } from '@/lib/comparePresets'

interface CompareClientProps {
  tools: Tool[]
  initialToolIds: string[]
  locale: Locale
}

export default function CompareClient({ tools, initialToolIds, locale }: CompareClientProps) {
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(initialToolIds)
  const [showModal, setShowModal] = useState(initialToolIds.length >= 2)
  const [copied, setCopied] = useState(false)
  const t = getTranslations(locale)

  const selectedTools = selectedToolIds
    .map(id => tools.find(t => t.id === id))
    .filter(Boolean) as Tool[]

  const toggleTool = (toolId: string) => {
    setSelectedToolIds(prev => {
      if (prev.includes(toolId)) {
        return prev.filter(id => id !== toolId)
      }
      if (prev.length < 4) {
        return [...prev, toolId]
      }
      return prev
    })
  }

  const clearSelection = () => {
    setSelectedToolIds([])
    setShowModal(false)
  }

  const getShareUrl = () => {
    if (selectedToolIds.length === 0) return ''
    const url = new URL(window.location.origin)
    url.pathname = '/compare'
    url.searchParams.set('tools', selectedToolIds.join(','))
    return url.toString()
  }

  const copyShareUrl = async () => {
    const url = getShareUrl()
    if (url) {
      await navigator.clipboard.writeText(url)
      alert(locale === 'zh-CN' ? '链接已复制！' : 'Link copied!')
    }
  }

  // Apply preset
  const applyPreset = (preset: ComparePreset) => {
    // Find tools by slug or id
    const matchedTools = preset.toolIds
      .map(id => tools.find(t => t.slug === id || t.id === id))
      .filter(Boolean) as Tool[]
    
    if (matchedTools.length > 0) {
      setSelectedToolIds(matchedTools.map(t => t.id))
    }
  }

  // Export comparison as Markdown
  const exportAsMarkdown = async () => {
    if (selectedTools.length < 2) return
    
    const headers = [
      locale === 'zh-CN' ? '对比项' : 'Comparison',
      ...selectedTools.map(t => t.name)
    ]
    
    const rows = [
      // Tagline
      [locale === 'zh-CN' ? '简介' : 'Tagline', ...selectedTools.map(t => t.tagline || '-')],
      // Pricing
      [t.compare.pricing, ...selectedTools.map(t => t.pricing || '-')],
      // GitHub Stars
      [t.compare.githubStars, ...selectedTools.map(t => t.github_stars ? `${t.github_stars}` : '-')],
      // Agent Friendly
      [t.compare.agentFriendly, ...selectedTools.map(t => t.agent_friendly ? '✓' : '✗')],
      // Open Source
      [t.compare.openSource, ...selectedTools.map(t => t.open_source ? '✓' : '✗')],
      // API Available
      [t.compare.apiAvailable, ...selectedTools.map(t => t.api_available ? '✓' : '✗')],
      // Integration Level
      [t.compare.gettingStarted, ...selectedTools.map(t => t.integration_level || '-')],
      // Best For
      [t.compare.bestFor, ...selectedTools.map(t => {
        const bestFor = locale === 'zh-CN' && t.best_for_zh ? t.best_for_zh : t.best_for
        return bestFor?.slice(0, 2).join(', ') || '-'
      })],
    ]
    
    // Build markdown table
    const md = `# ${selectedTools.map(t => t.name).join(' vs ')}\n\n` +
      `> ${locale === 'zh-CN' ? '导出自 AgentDex' : 'Exported from AgentDex'}: https://www.agentdex.top/compare?tools=${selectedToolIds.join(',')}\n\n` +
      `| ${headers.join(' | ')} |\n` +
      `| ${headers.map(() => '---').join(' | ')} |\n` +
      rows.map(row => `| ${row.join(' | ')} |`).join('\n') +
      `\n\n---\n\n` +
      selectedTools.map(t => {
        const url = `https://www.agentdex.top/tools/${t.slug}`
        return `- **${t.name}**: ${url}`
      }).join('\n')
    
    await navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Group tools by category
  const toolsByCategory = useMemo(() => {
    return tools.reduce((acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = []
      acc[tool.category].push(tool)
      return acc
    }, {} as Record<string, Tool[]>)
  }, [tools])

  const categoryLabels: Record<string, string> = {
    framework: locale === 'zh-CN' ? '框架' : 'Framework',
    memory: locale === 'zh-CN' ? '记忆' : 'Memory',
    execution: locale === 'zh-CN' ? '执行' : 'Execution',
    web: locale === 'zh-CN' ? '网页' : 'Web',
    observability: locale === 'zh-CN' ? '可观测性' : 'Observability',
    integration: locale === 'zh-CN' ? '集成' : 'Integration',
    evaluation: locale === 'zh-CN' ? '评估' : 'Evaluation',
    security: locale === 'zh-CN' ? '安全' : 'Security',
    orchestration: locale === 'zh-CN' ? '编排' : 'Orchestration',
    communication: locale === 'zh-CN' ? '通信' : 'Communication',
  }

  // Check if preset can be applied (has valid tools)
  const validPresets = useMemo(() => {
    return comparePresets.filter(preset => {
      const matchedTools = preset.toolIds
        .map(id => tools.find(t => t.slug === id || t.id === id))
        .filter(Boolean)
      return matchedTools.length >= 2
    })
  }, [tools])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {locale === 'zh-CN' ? '⚖️ 工具对比' : '⚖️ Compare Tools'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {locale === 'zh-CN' 
            ? '选择 2-4 个工具进行并排对比' 
            : 'Select 2-4 tools to compare side by side'}
        </p>
      </div>

      {/* Quick Compare Presets */}
      {validPresets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>⚡</span>
            {t.compare.presets}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {t.compare.presetsHint}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {validPresets.map(preset => {
              const name = locale === 'zh-CN' ? preset.name_zh : preset.name
              const desc = locale === 'zh-CN' ? preset.description_zh : preset.description
              const isActive = preset.toolIds.some(id => 
                selectedToolIds.some(sid => {
                  const tool = tools.find(t => t.id === sid)
                  return tool?.slug === id || tool?.id === id
                })
              )
              
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="text-2xl mb-2">{preset.icon}</div>
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 hidden md:block">
                    {desc}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {preset.toolIds.length} {locale === 'zh-CN' ? '个工具' : 'tools'}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected Tools Bar */}
      {selectedToolIds.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 dark:text-white">
                {locale === 'zh-CN' ? '已选择' : 'Selected'} ({selectedToolIds.length}/4):
              </span>
              {selectedTools.map(tool => (
                <span
                  key={tool.id}
                  className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-sm border border-gray-200 dark:border-gray-700"
                >
                  {tool.name}
                  <button
                    onClick={() => toggleTool(tool.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {locale === 'zh-CN' ? '清空' : 'Clear'}
              </button>
              {selectedToolIds.length >= 2 && (
                <button
                  onClick={copyShareUrl}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  📋 {locale === 'zh-CN' ? '分享链接' : 'Share Link'}
                </button>
              )}
              {/* Export as Markdown */}
              {selectedToolIds.length >= 2 && (
                <button
                  onClick={exportAsMarkdown}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1"
                  title={t.compare.exportHint}
                >
                  {copied ? (
                    <>
                      <span>✓</span>
                      <span>{t.compare.copied}</span>
                    </>
                  ) : (
                    <>
                      <span>📝</span>
                      <span className="hidden sm:inline">{t.compare.exportMarkdown}</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => setShowModal(true)}
                disabled={selectedToolIds.length < 2}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {locale === 'zh-CN' ? '开始对比' : 'Compare'} ({selectedToolIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tool Selection Grid */}
      <div className="space-y-8">
        {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
          <div key={category}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {categoryLabels[category] || category}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoryTools.map(tool => {
                const isSelected = selectedToolIds.includes(tool.id)
                const canSelect = isSelected || selectedToolIds.length < 4
                
                return (
                  <button
                    key={tool.id}
                    onClick={() => canSelect && toggleTool(tool.id)}
                    disabled={!canSelect}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
                        : canSelect
                          ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800'
                          : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {tool.tagline}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tool.agent_friendly && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                          🤖
                        </span>
                      )}
                      {tool.open_source && (
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                          📦
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Back Link */}
      <div className="mt-10 text-center">
        <Link href="/" className="text-blue-500 hover:text-blue-600">
          ← {locale === 'zh-CN' ? '返回首页' : 'Back to Home'}
        </Link>
      </div>

      {/* Compare Modal */}
      {showModal && selectedTools.length >= 2 && (
        <CompareModal
          tools={selectedTools}
          locale={locale}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}