'use client'

import { useState } from 'react'
import type { PromptBundle, RunSnapshot, Post } from '@/lib/forum/types'

interface StructuredPostDisplayProps {
  post: Post
}

export default function StructuredPostDisplay({ post }: StructuredPostDisplayProps) {
  const [viewMode, setViewMode] = useState<'human' | 'machine'>('human')
  const [copied, setCopied] = useState<'prompt' | 'repro' | null>(null)

  if (post.post_type !== 'structured' || !post.prompt_bundle || !post.run_snapshot) {
    return null
  }

  const promptBundle = post.prompt_bundle as PromptBundle
  const runSnapshot = post.run_snapshot as RunSnapshot

  const copyToClipboard = async (text: string, type: 'prompt' | 'repro') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const getPromptBundleJson = () => {
    return JSON.stringify(promptBundle, null, 2)
  }

  const getReproPackJson = () => {
    return JSON.stringify({
      post_id: post.id,
      title: post.title,
      prompt_bundle: promptBundle,
      run_snapshot: runSnapshot
    }, null, 2)
  }

  return (
    <div className="mt-6 space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('human')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              viewMode === 'human'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            人类可读
          </button>
          <button
            onClick={() => setViewMode('machine')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              viewMode === 'machine'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            JSON 导出
          </button>
        </div>

        {/* Copy Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => copyToClipboard(getPromptBundleJson(), 'prompt')}
            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
          >
            {copied === 'prompt' ? '✓ 已复制' : '复制 Prompt Bundle'}
          </button>
          <button
            onClick={() => copyToClipboard(getReproPackJson(), 'repro')}
            className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
          >
            {copied === 'repro' ? '✓ 已复制' : '复制 Repro Pack'}
          </button>
        </div>
      </div>

      {viewMode === 'human' ? (
        <div className="space-y-4">
          {/* Prompt Bundle Section */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>🤖</span> Prompt Bundle
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Model</span>
                <p className="font-mono text-gray-900 dark:text-white">{promptBundle.model}</p>
              </div>
              {promptBundle.dependencies && Object.keys(promptBundle.dependencies).length > 0 && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Dependencies</span>
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {Object.entries(promptBundle.dependencies).map(([k, v]) => `${k}@${v}`).join(', ')}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">System Prompt</span>
              <pre className="mt-1 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {promptBundle.system_prompt}
              </pre>
            </div>

            {promptBundle.user_prompts.length > 0 && (
              <div className="mt-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">User Prompts</span>
                <div className="mt-1 space-y-2">
                  {promptBundle.user_prompts.map((prompt, index) => (
                    <pre key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {prompt}
                    </pre>
                  ))}
                </div>
              </div>
            )}

            {promptBundle.tools.length > 0 && (
              <div className="mt-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">Tools</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {promptBundle.tools.map((tool) => (
                    <span key={tool} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-sm">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Run Snapshot Section */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>📊</span> Run Snapshot
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              {runSnapshot.environment && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Environment</span>
                  <p className="text-gray-900 dark:text-white">{runSnapshot.environment}</p>
                </div>
              )}
              {runSnapshot.success_rate !== undefined && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Success Rate</span>
                  <p className={`font-bold ${
                    runSnapshot.success_rate >= 0.8 ? 'text-green-600 dark:text-green-400' :
                    runSnapshot.success_rate >= 0.5 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {(runSnapshot.success_rate * 100).toFixed(0)}%
                  </p>
                </div>
              )}
              {runSnapshot.latency_ms !== undefined && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Latency</span>
                  <p className="text-gray-900 dark:text-white">{runSnapshot.latency_ms}ms</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Input Example</span>
                <pre className="mt-1 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {runSnapshot.input_example}
                </pre>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Expected Output</span>
                  <pre className="mt-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {runSnapshot.expected_output}
                  </pre>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Actual Output</span>
                  <pre className={`mt-1 p-3 rounded-lg border overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap ${
                    runSnapshot.failure_reason
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}>
                    {runSnapshot.actual_output}
                  </pre>
                </div>
              </div>

              {runSnapshot.failure_reason && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium">Failure Reason</span>
                  <p className="mt-1 text-red-800 dark:text-red-200">{runSnapshot.failure_reason}</p>
                </div>
              )}

              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Evaluation Notes</span>
                <p className="mt-1 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                  {runSnapshot.evaluation_notes}
                </p>
              </div>
            </div>
          </div>

          {/* Fork Info */}
          {post.forked_from && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Forked from post {post.forked_from}
            </div>
          )}
          {post.fork_count > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              This post has been forked {post.fork_count} time(s)
            </div>
          )}
        </div>
      ) : (
        /* Machine-readable JSON view */
        <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-green-400">
            {getReproPackJson()}
          </pre>
        </div>
      )}
    </div>
  )
}