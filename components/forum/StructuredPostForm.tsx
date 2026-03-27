'use client'

import { useState } from 'react'
import TagSelector from './TagSelector'
import type { PromptBundle, RunSnapshot } from '@/lib/forum/types'

// Common AI models
const COMMON_MODELS = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
  { value: 'llama-2-70b', label: 'Llama 2 70B' },
  { value: 'mistral-large', label: 'Mistral Large' },
  { value: 'other', label: 'Other (specify in dependencies)' }
]

// Common tools
const COMMON_TOOLS = [
  'web_search', 'code_exec', 'file_ops', 'api_call', 
  'database', 'image_gen', 'image_analysis', 'document_parse'
]

interface StructuredPostFormProps {
  onSubmit: (data: {
    title: string
    content: string
    tags: string[]
    post_type: 'structured'
    prompt_bundle: PromptBundle
    run_snapshot: RunSnapshot
  }) => Promise<void>
  submitting: boolean
  error: string | null
}

export default function StructuredPostForm({ onSubmit, submitting, error }: StructuredPostFormProps) {
  // Human summary
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])

  // Prompt Bundle
  const [model, setModel] = useState('gpt-4')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [userPrompts, setUserPrompts] = useState<string[]>([''])
  const [tools, setTools] = useState<string[]>([])
  const [customTool, setCustomTool] = useState('')
  const [dependencies, setDependencies] = useState('')

  // Run Snapshot
  const [environment, setEnvironment] = useState('')
  const [inputExample, setInputExample] = useState('')
  const [expectedOutput, setExpectedOutput] = useState('')
  const [actualOutput, setActualOutput] = useState('')
  const [successRate, setSuccessRate] = useState('')
  const [latencyMs, setLatencyMs] = useState('')
  const [failureReason, setFailureReason] = useState('')
  const [evaluationNotes, setEvaluationNotes] = useState('')

  // Local validation error
  const [validationError, setValidationError] = useState<string | null>(null)

  const addUserPrompt = () => {
    setUserPrompts([...userPrompts, ''])
  }

  const removeUserPrompt = (index: number) => {
    setUserPrompts(userPrompts.filter((_, i) => i !== index))
  }

  const updateUserPrompt = (index: number, value: string) => {
    const updated = [...userPrompts]
    updated[index] = value
    setUserPrompts(updated)
  }

  const toggleTool = (tool: string) => {
    setTools(tools.includes(tool) 
      ? tools.filter(t => t !== tool)
      : [...tools, tool]
    )
  }

  const addCustomTool = () => {
    if (customTool.trim() && !tools.includes(customTool.trim())) {
      setTools([...tools, customTool.trim()])
      setCustomTool('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    // Validate required fields
    if (!title.trim()) {
      setValidationError('请输入标题')
      return
    }
    if (!content.trim()) {
      setValidationError('请输入内容摘要')
      return
    }
    if (!systemPrompt.trim()) {
      setValidationError('请输入 System Prompt')
      return
    }
    if (!inputExample.trim()) {
      setValidationError('请输入输入示例')
      return
    }
    if (!expectedOutput.trim()) {
      setValidationError('请输入期望输出')
      return
    }
    if (!actualOutput.trim()) {
      setValidationError('请输入实际输出')
      return
    }
    if (!evaluationNotes.trim()) {
      setValidationError('请输入评估备注')
      return
    }

    // Build structured data
    const promptBundle: PromptBundle = {
      model,
      system_prompt: systemPrompt.trim(),
      user_prompts: userPrompts.map(p => p.trim()).filter(Boolean),
      tools,
      dependencies: dependencies.trim() ? JSON.parse(dependencies) : undefined
    }

    const runSnapshot: RunSnapshot = {
      environment: environment.trim() || undefined,
      input_example: inputExample.trim(),
      expected_output: expectedOutput.trim(),
      actual_output: actualOutput.trim(),
      success_rate: successRate ? parseFloat(successRate) : undefined,
      latency_ms: latencyMs ? parseInt(latencyMs, 10) : undefined,
      failure_reason: failureReason.trim() || undefined,
      evaluation_notes: evaluationNotes.trim()
    }

    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      tags,
      post_type: 'structured',
      prompt_bundle: promptBundle,
      run_snapshot: runSnapshot
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Human Summary Section */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>📝</span> 帖子摘要
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="简短描述你的 Prompt 经验..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              内容摘要 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="简要说明这个 Prompt 的用途和效果..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              标签
            </label>
            <TagSelector selectedTags={tags} onChange={setTags} />
          </div>
        </div>
      </section>

      {/* Prompt Bundle Section */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🤖</span> Prompt Bundle
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model <span className="text-red-500">*</span>
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {COMMON_MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              System Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant that..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
              rows={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User Prompts
            </label>
            <div className="space-y-2">
              {userPrompts.map((prompt, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={prompt}
                    onChange={(e) => updateUserPrompt(index, e.target.value)}
                    placeholder={`User prompt ${index + 1}...`}
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
                    rows={2}
                  />
                  {userPrompts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUserPrompt(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addUserPrompt}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                + 添加更多 User Prompt
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tools Used
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COMMON_TOOLS.map(tool => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => toggleTool(tool)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    tools.includes(tool)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tool}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTool}
                onChange={(e) => setCustomTool(e.target.value)}
                placeholder="Custom tool name..."
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTool())}
              />
              <button
                type="button"
                onClick={addCustomTool}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                添加
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dependencies (JSON, optional)
            </label>
            <textarea
              value={dependencies}
              onChange={(e) => setDependencies(e.target.value)}
              placeholder='{"langchain": "0.1.0", "openai": "1.0.0"}'
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* Run Snapshot Section */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>📊</span> Run Snapshot
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Environment (optional)
            </label>
            <input
              type="text"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              placeholder="e.g., Python 3.11, Node.js 20.x"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Success Rate (optional)
              </label>
              <input
                type="number"
                value={successRate}
                onChange={(e) => setSuccessRate(e.target.value)}
                placeholder="0.85"
                min="0"
                max="1"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Latency (ms, optional)
              </label>
              <input
                type="number"
                value={latencyMs}
                onChange={(e) => setLatencyMs(e.target.value)}
                placeholder="1200"
                min="0"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Input Example <span className="text-red-500">*</span>
            </label>
            <textarea
              value={inputExample}
              onChange={(e) => setInputExample(e.target.value)}
              placeholder="The input that was given to the model..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expected Output <span className="text-red-500">*</span>
            </label>
            <textarea
              value={expectedOutput}
              onChange={(e) => setExpectedOutput(e.target.value)}
              placeholder="What you expected the model to produce..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Actual Output <span className="text-red-500">*</span>
            </label>
            <textarea
              value={actualOutput}
              onChange={(e) => setActualOutput(e.target.value)}
              placeholder="What the model actually produced..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Failure Reason (optional)
            </label>
            <textarea
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              placeholder="If the output didn't match expectations, explain why..."
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Evaluation Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={evaluationNotes}
              onChange={(e) => setEvaluationNotes(e.target.value)}
              placeholder="Your analysis and recommendations..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows={4}
            />
          </div>
        </div>
      </section>

      {/* Error Display */}
      {(error || validationError) && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-lg">⚠️</span>
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">
              {validationError || error}
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? '发布中...' : '发布结构化帖子'}
        </button>
      </div>
    </form>
  )
}