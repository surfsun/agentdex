import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getScenarioBySlug, getToolsForScenario, getPriorityLabel, getPriorityColor, scenarios } from '@/lib/scenarios'
import { Locale, getLocaleFromCookie, getTranslations } from '@/lib/i18n'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return scenarios.map(scenario => ({
    slug: scenario.slug
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const scenario = getScenarioBySlug(slug)
  
  if (!scenario) {
    return { title: 'Scenario Not Found' }
  }
  
  return {
    title: `${scenario.name} — AgentDex Scenarios`,
    description: scenario.description,
  }
}

export default async function ScenarioPage({ params }: Props) {
  const { slug } = await params
  const scenario = getScenarioBySlug(slug)
  
  if (!scenario) {
    notFound()
  }
  
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)
  const t = getTranslations(locale)
  
  const scenarioTools = getToolsForScenario(scenario)
  const scenarioName = locale === 'zh-CN' && scenario.name_zh ? scenario.name_zh : scenario.name
  const scenarioDesc = locale === 'zh-CN' && scenario.description_zh ? scenario.description_zh : scenario.description

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-blue-500 hover:underline">AgentDex</Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600 dark:text-gray-400">{locale === 'zh-CN' ? '场景' : 'Scenarios'}</span>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{scenarioName}</span>
      </nav>
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{scenario.icon}</span>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{scenarioName}</h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">{scenarioDesc}</p>
      </div>
      
      {/* Recommended Tools */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'zh-CN' ? '推荐工具' : 'Recommended Tools'}
        </h2>
        <div className="grid gap-4">
          {scenarioTools.map(({ id, priority, use_case, use_case_zh, tool }) => (
            <Link
              key={id}
              href={`/tools/${tool.slug}`}
              className="block p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{tool.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {locale === 'zh-CN' && tool.tagline ? tool.tagline : tool.tagline}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    {locale === 'zh-CN' && use_case_zh ? use_case_zh : use_case}
                  </p>
                </div>
                <span className={`text-sm font-medium ${getPriorityColor(priority)}`}>
                  {getPriorityLabel(priority, locale)}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
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
            </Link>
          ))}
        </div>
      </section>
      
      {/* Tool Combinations */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'zh-CN' ? '工具组合建议' : 'Tool Combinations'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {scenario.combinations.map((combo, index) => {
            const comboName = locale === 'zh-CN' && combo.name_zh ? combo.name_zh : combo.name
            const comboDesc = locale === 'zh-CN' && combo.description_zh ? combo.description_zh : combo.description
            
            return (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{comboName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{comboDesc}</p>
                <div className="flex flex-wrap gap-2">
                  {combo.tools.map(toolId => {
                    const tool = scenarioTools.find(st => st.id === toolId)?.tool
                    if (!tool) return null
                    return (
                      <Link
                        key={toolId}
                        href={`/tools/${tool.slug}`}
                        className="text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 hover:border-blue-400"
                      >
                        {tool.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>
      
      {/* Quick Start */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'zh-CN' ? '快速开始' : 'Quick Start'}
        </h2>
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
            <code>{scenario.quick_start}</code>
          </pre>
          <span className="absolute top-2 right-2 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
            {scenario.quick_start_language}
          </span>
        </div>
      </section>
      
      {/* All Scenarios */}
      <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'zh-CN' ? '其他场景' : 'Other Scenarios'}
        </h2>
        <div className="flex flex-wrap gap-3">
          {scenarios.filter(s => s.slug !== scenario.slug).map(s => (
            <Link
              key={s.slug}
              href={`/scenarios/${s.slug}`}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <span>{s.icon}</span>
              <span className="text-gray-700 dark:text-gray-300">
                {locale === 'zh-CN' && s.name_zh ? s.name_zh : s.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}