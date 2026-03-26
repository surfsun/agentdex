'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tool } from '@/lib/tools'
import { Locale } from '@/lib/i18n'
import CompareModal from '@/components/CompareModal'

interface CompareClientProps {
  tools: Tool[]
  initialToolIds: string[]
  locale: Locale
}

export default function CompareClient({ tools, initialToolIds, locale }: CompareClientProps) {
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(initialToolIds)
  const [showModal, setShowModal] = useState(initialToolIds.length >= 2)

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

  // Group tools by category
  const toolsByCategory = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = []
    acc[tool.category].push(tool)
    return acc
  }, {} as Record<string, Tool[]>)

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
            <div className="flex items-center gap-2">
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