'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Locale } from '@/lib/i18n'

interface SubmitClientProps {
  locale: Locale
}

// Categories
const categories = [
  { value: 'framework', label: 'Framework', labelZh: '框架' },
  { value: 'memory', label: 'Memory', labelZh: '记忆' },
  { value: 'execution', label: 'Execution', labelZh: '执行' },
  { value: 'web', label: 'Web & Data', labelZh: '网页与数据' },
  { value: 'observability', label: 'Observability', labelZh: '可观测性' },
  { value: 'integration', label: 'Integration', labelZh: '集成' },
  { value: 'evaluation', label: 'Evaluation', labelZh: '评估' },
  { value: 'security', label: 'Security', labelZh: '安全' },
  { value: 'orchestration', label: 'Orchestration', labelZh: '编排' },
  { value: 'communication', label: 'Communication', labelZh: '通信' },
]

// Pricing options
const pricingOptions = [
  { value: 'free', label: 'Free', labelZh: '免费' },
  { value: 'freemium', label: 'Freemium', labelZh: '免费增值' },
  { value: 'paid', label: 'Paid', labelZh: '付费' },
]

export default function SubmitClient({ locale }: SubmitClientProps) {
  const isZh = locale === 'zh-CN'

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    tagline: '',
    description: '',
    category: '',
    github: '',
    pricing: '',
    agent_friendly: false,
    api_available: false,
    open_source: false,
    tags: '',
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [issueUrl, setIssueUrl] = useState('')

  // Update form field
  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Validate URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Basic validation
    if (!formData.name.trim()) {
      setError(isZh ? '请输入工具名称' : 'Tool name is required')
      setLoading(false)
      return
    }

    if (!isValidUrl(formData.website)) {
      setError(isZh ? '请输入有效的网址' : 'Please enter a valid website URL')
      setLoading(false)
      return
    }

    if (!formData.category) {
      setError(isZh ? '请选择分类' : 'Please select a category')
      setLoading(false)
      return
    }

    if (!formData.tagline.trim()) {
      setError(isZh ? '请输入一句话描述' : 'Tagline is required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/tools/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          website: formData.website.trim(),
          tagline: formData.tagline.trim(),
          description: formData.description.trim(),
          category: formData.category,
          github: formData.github.trim() || null,
          pricing: formData.pricing || 'unknown',
          agent_friendly: formData.agent_friendly,
          api_available: formData.api_available,
          open_source: formData.open_source,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        if (data.issue_url) {
          setIssueUrl(data.issue_url)
        }
      } else {
        setError(data.error || (isZh ? '提交失败，请稍后重试' : 'Submission failed. Please try again.'))
      }
    } catch {
      setError(isZh ? '网络错误，请稍后重试' : 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {isZh ? '🎉 提交成功！' : '🎉 Submission Received!'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {isZh
            ? '感谢您的提交！我们会在 48 小时内审核。'
            : 'Thank you for your submission! We will review it within 48 hours.'}
        </p>
        {issueUrl && (
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-6"
          >
            <span>📋</span>
            {isZh ? '查看提交状态' : 'Track your submission'}
          </a>
        )}
        <div className="pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            {isZh ? '返回首页' : 'Back to Home'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isZh ? '🚀 提交工具' : '🚀 Submit a Tool'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isZh
            ? '将您的 AI Agent 工具添加到 AgentDex 目录'
            : 'Add your AI Agent tool to the AgentDex directory'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tool Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isZh ? '工具名称' : 'Tool Name'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder={isZh ? '例如：Dify' : 'e.g., Dify'}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Website URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isZh ? '官网地址' : 'Website URL'} <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => updateField('website', e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isZh ? '分类' : 'Category'} <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{isZh ? '请选择分类' : 'Select a category'}</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {isZh ? cat.labelZh : cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isZh ? '一句话描述' : 'Tagline'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => updateField('tagline', e.target.value)}
            placeholder={isZh ? '简短描述工具的核心价值（最多100字）' : 'Brief description of the tool (max 100 chars)'}
            maxLength={100}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.tagline.length}/100
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isZh ? '详细描述' : 'Description'} ({isZh ? '可选' : 'optional'})
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder={isZh ? '详细介绍工具的功能和特点' : 'Detailed description of features and capabilities'}
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* GitHub URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            GitHub URL ({isZh ? '可选' : 'optional'})
          </label>
          <input
            type="url"
            value={formData.github}
            onChange={(e) => updateField('github', e.target.value)}
            placeholder="https://github.com/..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isZh ? '标签' : 'Tags'} ({isZh ? '可选，用逗号分隔' : 'optional, comma-separated'})
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => updateField('tags', e.target.value)}
            placeholder={isZh ? '例如：LLM, Agent, 自动化' : 'e.g., LLM, Agent, automation'}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Pricing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isZh ? '定价模式' : 'Pricing Model'} ({isZh ? '可选' : 'optional'})
          </label>
          <select
            value={formData.pricing}
            onChange={(e) => updateField('pricing', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{isZh ? '请选择' : 'Select'}</option>
            {pricingOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {isZh ? opt.labelZh : opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.agent_friendly}
              onChange={(e) => updateField('agent_friendly', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">
              🤖 {isZh ? '专为 Agent 设计' : 'Agent-friendly (designed for AI agents)'}
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.api_available}
              onChange={(e) => updateField('api_available', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">
              🔌 {isZh ? '提供 API' : 'API available'}
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.open_source}
              onChange={(e) => updateField('open_source', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">
              📦 {isZh ? '开源' : 'Open source'}
            </span>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {isZh ? '提交中...' : 'Submitting...'}
              </>
            ) : (
              <>
                <span>🚀</span>
                {isZh ? '提交工具' : 'Submit Tool'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Back Link */}
      <div className="mt-8 text-center">
        <Link
          href="/"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ← {isZh ? '返回首页' : 'Back to Home'}
        </Link>
      </div>
    </div>
  )
}