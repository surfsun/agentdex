import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { stacks, getStackBySlug, getToolsForStack, getDifficultyLabel, getDifficultyColor } from '@/lib/stacks'
import { Locale, getLocaleFromCookie } from '@/lib/i18n'

interface Props {
  params: Promise<{ slug: string }>
}

// 使用动态渲染
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const stack = getStackBySlug(slug)
  
  if (!stack) {
    return { title: 'Stack Not Found' }
  }
  
  return {
    title: `${stack.name} — AgentDex Stacks`,
    description: stack.description,
  }
}

export default async function StackPage({ params }: Props) {
  const { slug } = await params
  const stack = getStackBySlug(slug)
  
  if (!stack) {
    notFound()
  }
  
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)
  
  const stackTools = await getToolsForStack(stack)
  const stackName = locale === 'zh-CN' && stack.name_zh ? stack.name_zh : stack.name
  const stackDesc = locale === 'zh-CN' && stack.description_zh ? stack.description_zh : stack.description

  // Get related stacks
  const relatedStacks = stack.related_stacks
    .map(relSlug => stacks.find(s => s.slug === relSlug))
    .filter(s => s !== undefined)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-blue-500 hover:underline">AgentDex</Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link href="/stacks" className="text-blue-500 hover:underline">
          {locale === 'zh-CN' ? '工具栈' : 'Stacks'}
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{stackName}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{stack.icon}</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{stackName}</h1>
            <div className="flex items-center gap-2 mt-1">
              {stack.verified && (
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                  ✓ {locale === 'zh-CN' ? '已验证' : 'Verified'}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">{stackDesc}</p>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {locale === 'zh-CN' ? '集成时间' : 'Integration Time'}
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            ⏱️ {stack.integration_time}
          </span>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {locale === 'zh-CN' ? '月度成本' : 'Monthly Cost'}
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            💰 {stack.monthly_cost}
          </span>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {locale === 'zh-CN' ? '难度' : 'Difficulty'}
          </div>
          <span className={`text-lg font-semibold ${getDifficultyColor(stack.difficulty)}`}>
            {getDifficultyLabel(stack.difficulty, locale)}
          </span>
        </div>
      </div>

      {/* Tools */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'zh-CN' ? '工具列表' : 'Tools'}
        </h2>
        <div className="space-y-4">
          {stackTools.map(({ id, role, role_zh, purpose, purpose_zh, required, alternativeTools, tool }) => (
            <div
              key={id}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {tool ? (
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {tool.name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-gray-900 dark:text-white">{id}</span>
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    — {locale === 'zh-CN' && role_zh ? role_zh : role}
                  </span>
                </div>
                {required ? (
                  <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                    {locale === 'zh-CN' ? '必需' : 'Required'}
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                    {locale === 'zh-CN' ? '可选' : 'Optional'}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {locale === 'zh-CN' && purpose_zh ? purpose_zh : purpose}
              </p>
              {tool && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tool.agent_friendly && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                      🤖 Agent-friendly
                    </span>
                  )}
                  {tool.open_source && (
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                      📦 OSS
                    </span>
                  )}
                  {tool.api_available && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                      🔌 API
                    </span>
                  )}
                </div>
              )}
              {alternativeTools.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {locale === 'zh-CN' ? '替代方案: ' : 'Alternatives: '}
                  </span>
                  {alternativeTools.map((alt, index) => (
                    <span key={alt.id}>
                      <Link href={`/tools/${alt.slug}`} className="text-blue-500 hover:underline">
                        {alt.name}
                      </Link>
                      {index < alternativeTools.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'zh-CN' ? '适用场景' : 'Use Cases'}
        </h2>
        <div className="flex flex-wrap gap-3">
          {stack.use_cases.map((useCase, index) => (
            <span
              key={index}
              className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm"
            >
              {locale === 'zh-CN' ? useCase.zh : useCase.en}
            </span>
          ))}
        </div>
      </section>

      {/* Quick Start */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'zh-CN' ? '快速开始' : 'Quick Start'}
        </h2>
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
            <code>{stack.quick_start}</code>
          </pre>
          <span className="absolute top-2 right-2 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
            bash
          </span>
        </div>
      </section>

      {/* API */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          API
        </h2>
        <div className="bg-gray-900 rounded-xl p-4">
          <code className="text-green-400 text-sm">
            curl https://www.agentdex.top/api/stacks/{stack.slug}
          </code>
        </div>
      </section>

      {/* Related Stacks */}
      {relatedStacks.length > 0 && (
        <section className="mb-10 border-t border-gray-200 dark:border-gray-700 pt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {locale === 'zh-CN' ? '相关工具栈' : 'Related Stacks'}
          </h2>
          <div className="flex flex-wrap gap-3">
            {relatedStacks.map(relatedStack => {
              if (!relatedStack) return null
              const relatedName = locale === 'zh-CN' && relatedStack.name_zh ? relatedStack.name_zh : relatedStack.name
              return (
                <Link
                  key={relatedStack.id}
                  href={`/stacks/${relatedStack.slug}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <span>{relatedStack.icon}</span>
                  <span className="text-gray-700 dark:text-gray-300">{relatedName}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Back Link */}
      <div className="mt-8">
        <Link href="/stacks" className="text-blue-500 hover:text-blue-700 text-sm">
          ← {locale === 'zh-CN' ? '返回工具栈列表' : 'Back to Stacks'}
        </Link>
      </div>
    </div>
  )
}