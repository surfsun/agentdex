import { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { stacks, getDifficultyLabel, getDifficultyColor } from '@/lib/stacks'
import { Locale, getLocaleFromCookie } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Tool Stacks — AgentDex',
  description: 'Pre-configured tool combinations for common AI agent use cases. Get started quickly with verified tool stacks.',
}

export default async function StacksPage() {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-blue-500 hover:underline">AgentDex</Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900 dark:text-white font-medium">
          {locale === 'zh-CN' ? '工具栈' : 'Tool Stacks'}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-3">
          <span>🧩</span>
          {locale === 'zh-CN' ? '工具栈' : 'Tool Stacks'}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {locale === 'zh-CN' 
            ? '经过验证的工具组合方案，帮助您快速构建 AI Agent' 
            : 'Pre-configured tool combinations for common AI agent use cases'}
        </p>
      </div>

      {/* Intro */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 mb-10">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
          {locale === 'zh-CN' ? '什么是工具栈？' : 'What are Tool Stacks?'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {locale === 'zh-CN'
            ? '工具栈是为特定场景预配置的工具组合。每个栈都包含经过验证的工具、集成时间和成本估算，帮助您快速启动项目。'
            : 'Tool Stacks are pre-configured combinations of tools for specific scenarios. Each stack includes verified tools, integration time, and cost estimates to help you get started quickly.'}
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700 dark:text-gray-300">
              {locale === 'zh-CN' ? '验证可用' : 'Verified'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700 dark:text-gray-300">
              {locale === 'zh-CN' ? '成本透明' : 'Cost Transparent'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700 dark:text-gray-300">
              {locale === 'zh-CN' ? '快速集成' : 'Quick Integration'}
            </span>
          </div>
        </div>
      </div>

      {/* Stacks Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stacks.map(stack => {
          const stackName = locale === 'zh-CN' && stack.name_zh ? stack.name_zh : stack.name
          const stackDesc = locale === 'zh-CN' && stack.description_zh ? stack.description_zh : stack.description

          return (
            <Link
              key={stack.id}
              href={`/stacks/${stack.slug}`}
              className="group block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{stack.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {stackName}
                    </h3>
                    {stack.verified && (
                      <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                        ✓ {locale === 'zh-CN' ? '已验证' : 'Verified'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {stackDesc}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  ⏱️ {stack.integration_time}
                </span>
                <span className="flex items-center gap-1">
                  💰 {stack.monthly_cost}
                </span>
                <span className={getDifficultyColor(stack.difficulty)}>
                  {getDifficultyLabel(stack.difficulty, locale)}
                </span>
              </div>

              {/* Tools Preview */}
              <div className="flex flex-wrap gap-2">
                {stack.tools.slice(0, 3).map(tool => (
                  <span 
                    key={tool.id}
                    className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
                  >
                    {tool.id}
                  </span>
                ))}
                {stack.tools.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{stack.tools.length - 3} more
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* API Section */}
      <div className="mt-12 bg-gray-900 rounded-xl p-6">
        <h3 className="text-gray-400 font-mono mb-2"># Get stacks via API</h3>
        <code className="text-green-400 text-sm">
          curl https://www.agentdex.top/api/stacks
        </code>
      </div>

      {/* Back Link */}
      <div className="mt-8">
        <Link href="/" className="text-blue-500 hover:text-blue-700 text-sm">
          ← {locale === 'zh-CN' ? '返回首页' : 'Back to Home'}
        </Link>
      </div>
    </div>
  )
}