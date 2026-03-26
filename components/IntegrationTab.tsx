'use client'

import { useState } from 'react'
import { CodeExamples } from '@/lib/tools'

interface IntegrationTabProps {
  toolName: string
  integrationMinutes?: number
  codeExamples?: CodeExamples
}

const languageLabels: Record<string, { label: string; icon: string }> = {
  python: { label: 'Python', icon: '🐍' },
  typescript: { label: 'TypeScript', icon: '📘' },
  go: { label: 'Go', icon: '🔵' },
  rust: { label: 'Rust', icon: '🦀' },
}

const stepLabels = {
  install: { en: 'Install', zh: '安装' },
  init: { en: 'Initialize', zh: '初始化' },
  basic: { en: 'Basic Usage', zh: '基本用法' },
  error_handling: { en: 'Error Handling', zh: '错误处理' },
}

export default function IntegrationTab({ toolName, integrationMinutes, codeExamples }: IntegrationTabProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python')
  const [copiedStep, setCopiedStep] = useState<string | null>(null)

  if (!codeExamples || Object.keys(codeExamples).length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Integration examples coming soon for {toolName}.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Check the official documentation for now.
        </p>
      </div>
    )
  }

  const availableLanguages = Object.keys(codeExamples)
  const currentExample = codeExamples[selectedLanguage as keyof CodeExamples]

  const copyToClipboard = async (text: string, step: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedStep(step)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Integration Time */}
      {integrationMinutes && (
        <div className="flex items-center gap-2 text-lg">
          <span className="text-2xl">⏱️</span>
          <span className="text-gray-700 dark:text-gray-300">
            Estimated integration time: 
            <span className="font-semibold text-gray-900 dark:text-white ml-2">
              ~{integrationMinutes} minutes
            </span>
          </span>
        </div>
      )}

      {/* Language Selector */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400 self-center mr-2">
          Select language:
        </span>
        {availableLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => setSelectedLanguage(lang)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedLanguage === lang
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {languageLabels[lang]?.icon} {languageLabels[lang]?.label || lang}
          </button>
        ))}
      </div>

      {/* Code Steps */}
      {currentExample && (
        <div className="space-y-4">
          {/* Step 1: Install */}
          <CodeStep
            stepNumber={1}
            title="Install"
            code={currentExample.install}
            stepId="install"
            copiedStep={copiedStep}
            onCopy={copyToClipboard}
          />

          {/* Step 2: Initialize */}
          <CodeStep
            stepNumber={2}
            title="Initialize"
            code={currentExample.init}
            stepId="init"
            copiedStep={copiedStep}
            onCopy={copyToClipboard}
          />

          {/* Step 3: Basic Usage */}
          <CodeStep
            stepNumber={3}
            title="Basic Usage"
            code={currentExample.basic}
            stepId="basic"
            copiedStep={copiedStep}
            onCopy={copyToClipboard}
          />

          {/* Step 4: Error Handling (optional) */}
          {currentExample.error_handling && (
            <CodeStep
              stepNumber={4}
              title="Error Handling ⚠️"
              code={currentExample.error_handling}
              stepId="error_handling"
              copiedStep={copiedStep}
              onCopy={copyToClipboard}
              isWarning
            />
          )}

          {/* Environment Variables */}
          {currentExample.env_vars && currentExample.env_vars.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>🔐</span>
                <span className="font-medium text-amber-800 dark:text-amber-200">
                  Environment Variables Required
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentExample.env_vars.map((envVar) => (
                  <code
                    key={envVar}
                    className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded text-sm font-mono"
                  >
                    {envVar}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface CodeStepProps {
  stepNumber: number
  title: string
  code: string
  stepId: string
  copiedStep: string | null
  onCopy: (text: string, step: string) => void
  isWarning?: boolean
}

function CodeStep({ stepNumber, title, code, stepId, copiedStep, onCopy, isWarning }: CodeStepProps) {
  return (
    <div className={`rounded-xl overflow-hidden border ${
      isWarning 
        ? 'border-amber-200 dark:border-amber-800' 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className={`px-4 py-3 flex items-center justify-between ${
        isWarning
          ? 'bg-amber-50 dark:bg-amber-900/30'
          : 'bg-gray-50 dark:bg-gray-800/50'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isWarning
              ? 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-200'
              : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
          }`}>
            {stepNumber}
          </span>
          <span className={`font-medium ${
            isWarning 
              ? 'text-amber-800 dark:text-amber-200' 
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {title}
          </span>
        </div>
        <button
          onClick={() => onCopy(code, stepId)}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
        >
          {copiedStep === stepId ? (
            <>
              <span className="text-green-500">✓</span>
              <span className="text-green-600 dark:text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span className="text-gray-600 dark:text-gray-400">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="bg-gray-900 dark:bg-gray-950 p-4 overflow-x-auto">
        <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap break-all">
          {code}
        </pre>
      </div>
    </div>
  )
}