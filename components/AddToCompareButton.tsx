'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Tool } from '@/lib/tools'

interface AddToCompareButtonProps {
  tool: Tool
  locale?: 'en' | 'zh-CN'
}

const COMPARE_STORAGE_KEY = 'agentdex_compare_tools'
const MAX_COMPARE_TOOLS = 4

export default function AddToCompareButton({ tool, locale = 'en' }: AddToCompareButtonProps) {
  const [isSelected, setIsSelected] = useState(false)
  const [compareCount, setCompareCount] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    // Check if this tool is already selected
    const stored = localStorage.getItem(COMPARE_STORAGE_KEY)
    if (stored) {
      const ids: string[] = JSON.parse(stored)
      setIsSelected(ids.includes(tool.id))
      setCompareCount(ids.length)
    }
  }, [tool.id])

  const toggleCompare = () => {
    const stored = localStorage.getItem(COMPARE_STORAGE_KEY)
    let ids: string[] = stored ? JSON.parse(stored) : []

    if (isSelected) {
      // Remove from compare
      ids = ids.filter(id => id !== tool.id)
      setToastMessage(locale === 'zh-CN' ? `已从对比中移除 ${tool.name}` : `Removed ${tool.name} from comparison`)
    } else {
      // Add to compare
      if (ids.length >= MAX_COMPARE_TOOLS) {
        setToastMessage(locale === 'zh-CN' ? '最多只能对比 4 个工具' : 'Maximum 4 tools for comparison')
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)
        return
      }
      ids.push(tool.id)
      setToastMessage(locale === 'zh-CN' ? `已添加 ${tool.name} 到对比` : `Added ${tool.name} to comparison`)
    }

    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids))
    setIsSelected(ids.includes(tool.id))
    setCompareCount(ids.length)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)

    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('compareToolsUpdated', { detail: ids }))
  }

  const t = {
    addToCompare: locale === 'zh-CN' ? '添加到对比' : 'Add to Compare',
    removeFromCompare: locale === 'zh-CN' ? '从对比中移除' : 'Remove from Compare',
    compare: locale === 'zh-CN' ? '对比' : 'Compare',
    toolsSelected: locale === 'zh-CN' ? '个工具已选择' : 'tools selected',
    goToCompare: locale === 'zh-CN' ? '去对比' : 'Go to Compare',
  }

  return (
    <div className="relative">
      {/* Main button */}
      <button
        onClick={toggleCompare}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-600'
        }`}
      >
        {isSelected ? (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{t.removeFromCompare}</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{t.addToCompare}</span>
          </>
        )}
      </button>

      {/* Quick link to compare page */}
      {compareCount >= 2 && (
        <Link
          href={`/compare?tools=${tool.id}`}
          className="ml-2 inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-sm"
        >
          <span>⚖️</span>
          <span>{t.goToCompare}</span>
          <span className="bg-blue-500 px-1.5 py-0.5 rounded text-xs">{compareCount}</span>
        </Link>
      )}

      {/* Toast notification */}
      {showToast && (
        <div className="absolute top-full mt-2 left-0 z-50 animate-fade-in">
          <div className="bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
            {toastMessage}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}