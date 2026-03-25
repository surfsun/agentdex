'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tool } from '@/lib/tools'
import { Locale, getTranslations } from '@/lib/i18n'
import CompareModal from './CompareModal'

interface CompareTrayProps {
  selectedTools: Tool[]
  onRemove: (toolId: string) => void
  onClear: () => void
  locale: Locale
  getShareUrl?: () => string
}

export default function CompareTray({ selectedTools, onRemove, onClear, locale, getShareUrl }: CompareTrayProps) {
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const t = getTranslations(locale)

  if (selectedTools.length === 0) return null

  const handleCopyShareUrl = async () => {
    if (getShareUrl) {
      const url = getShareUrl()
      if (url) {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  return (
    <>
      {/* Fixed bottom tray */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Selected tools preview */}
            <div className="flex items-center gap-2 flex-1 overflow-x-auto">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {t.compare.selected} ({selectedTools.length}/4):
              </span>
              <div className="flex gap-2">
                {selectedTools.map(tool => (
                  <div
                    key={tool.id}
                    className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-sm whitespace-nowrap"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{tool.name}</span>
                    <button
                      onClick={() => onRemove(tool.id)}
                      className="text-gray-400 hover:text-red-500 ml-1"
                      aria-label={`Remove ${tool.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onClear}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
              >
                {t.compare.clear}
              </button>
              {/* Share button */}
              {selectedTools.length >= 2 && (
                <button
                  onClick={handleCopyShareUrl}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-1"
                  title={locale === 'zh-CN' ? '复制分享链接' : 'Copy share link'}
                >
                  {copied ? (
                    <>
                      <span>✓</span>
                      <span className="hidden sm:inline">{locale === 'zh-CN' ? '已复制' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span className="hidden sm:inline">{locale === 'zh-CN' ? '分享' : 'Share'}</span>
                    </>
                  )}
                </button>
              )}
              {/* Open in compare page */}
              {selectedTools.length >= 2 && (
                <Link
                  href={`/compare?tools=${selectedTools.map(t => t.id).join(',')}`}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition hidden sm:block"
                  title={locale === 'zh-CN' ? '在对比页面打开' : 'Open compare page'}
                >
                  ↗️
                </Link>
              )}
              <button
                onClick={() => setShowModal(true)}
                disabled={selectedTools.length < 2}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.compare.compare} ({selectedTools.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compare Modal */}
      {showModal && (
        <CompareModal
          tools={selectedTools}
          locale={locale}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}