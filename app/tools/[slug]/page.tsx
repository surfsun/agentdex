import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { getToolBySlug, getAllTools, categories } from '@/lib/db'
import { Tool } from '@/lib/tools'
import { getStacksForTool, getDifficultyLabel, getDifficultyColor } from '@/lib/stacks'
import { getSkillsForTool } from '@/lib/skills'
import { Locale, getLocaleFromCookie } from '@/lib/i18n'
import AddToCompareButton from '@/components/AddToCompareButton'
import IntegrationTab from '@/components/IntegrationTab'
import CostCalculator from '@/components/CostCalculator'

interface Params {
  slug: string
}

// 使用动态渲染，不再静态生成
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const tool = await getToolBySlug(slug)
  
  if (!tool) {
    return { title: 'Tool not found' }
  }
  
  return {
    title: `${tool.name} — AgentDex`,
    description: tool.description,
    keywords: [...tool.tags, 'AI agent', 'agent tool', tool.category].join(', '),
    openGraph: {
      title: `${tool.name} — ${tool.tagline || ''}`,
      description: tool.description || '',
      url: `https://www.agentdex.top/tools/${tool.slug}`,
      siteName: 'AgentDex',
      type: 'article',
      images: [
        {
          url: 'https://www.agentdex.top/og-image.svg',
          width: 1200,
          height: 630,
          alt: `${tool.name} - AgentDex`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.name} — ${tool.tagline || ''}`,
      description: tool.description || '',
    },
    alternates: {
      canonical: `https://www.agentdex.top/tools/${tool.slug}`,
    },
  }
}

export default async function ToolPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const tool = await getToolBySlug(slug)

  if (!tool) {
    notFound()
  }

  // 获取所有工具（用于相关工具推荐）
  const allTools: Tool[] = await getAllTools()

  // Get locale from cookie
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)

  const category = categories.find(c => c.id === tool.category)
  
  // Get stacks that contain this tool
  const toolStacks = getStacksForTool(tool.id)

  const pricingColor = {
    free: 'bg-green-100 text-green-700',
    freemium: 'bg-blue-100 text-blue-700',
    paid: 'bg-orange-100 text-orange-700',
  }[tool.pricing as 'free' | 'freemium' | 'paid'] || 'bg-gray-100 text-gray-700'

  // JSON-LD structured data for the tool
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: tool.website,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: tool.pricing === 'free' ? '0' : 'Varies',
      priceCurrency: 'USD',
    },
    aggregateRating: tool.agent_friendly ? {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      ratingCount: '1',
    } : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center justify-between">
          <div>
            <a href="/" className="hover:text-gray-700">Home</a>
            {' / '}
            <a href={`/?category=${tool.category}`} className="hover:text-gray-700">{category?.label || tool.category}</a>
            {' / '}
            <span className="text-gray-900">{tool.name}</span>
          </div>
          <a
            href="/"
            className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            ← Back to Home
          </a>
        </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{tool.name}</h1>
          <p className="text-xl text-gray-500">{tool.tagline}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {tool.agent_friendly && (
            <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full whitespace-nowrap">
              🤖 Agent-friendly
            </span>
          )}
          {tool.mcp?.supported && (
            <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full whitespace-nowrap">
              🔌 MCP Compatible
            </span>
          )}
          {tool.featured && (
            <span className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
              ⭐ Featured
            </span>
          )}
          {tool.verified && (
            <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
              ✓ Verified
            </span>
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Pricing</div>
          <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${pricingColor}`}>
            {tool.pricing}
          </span>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Category</div>
          <span className="text-sm font-medium text-gray-900">{category?.label || tool.category}</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">API Available</div>
          <span className="text-sm font-medium text-gray-900">{tool.api_available ? '✓ Yes' : '✗ No'}</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Open Source</div>
          <span className="text-sm font-medium text-gray-900">{tool.open_source ? '✓ Yes' : '✗ No'}</span>
        </div>
      </div>

      {/* Persona Capabilities */}
      {tool.persona && (
        <div className="mb-8 bg-pink-50 border border-pink-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-pink-800 mb-4 flex items-center gap-2">
            🎭 Persona Capabilities
          </h2>
          <p className="text-sm text-pink-700 mb-4">
            This tool supports Agent persona/personality features, allowing agents to maintain consistent identity and behavior.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {tool.persona.self_editing_memory && (
              <div className="bg-white p-3 rounded-lg border border-pink-100">
                <div className="text-xs text-pink-500 mb-1">Self-Editing Memory</div>
                <div className="text-sm font-medium text-gray-900">✓ Agent can modify its own persona</div>
              </div>
            )}
            {tool.persona.stateful_identity && (
              <div className="bg-white p-3 rounded-lg border border-pink-100">
                <div className="text-xs text-pink-500 mb-1">Stateful Identity</div>
                <div className="text-sm font-medium text-gray-900">✓ Consistent across sessions</div>
              </div>
            )}
            {tool.persona.model_agnostic && (
              <div className="bg-white p-3 rounded-lg border border-pink-100">
                <div className="text-xs text-pink-500 mb-1">Model Agnostic</div>
                <div className="text-sm font-medium text-gray-900">✓ Works with multiple LLMs</div>
              </div>
            )}
            {tool.persona.communication_style && (
              <div className="bg-white p-3 rounded-lg border border-pink-100">
                <div className="text-xs text-pink-500 mb-1">Communication Style</div>
                <div className="text-sm font-medium text-gray-900">{tool.persona.communication_style}</div>
              </div>
            )}
            {tool.persona.personality_traits && Object.keys(tool.persona.personality_traits).length > 0 && (
              <div className="bg-white p-3 rounded-lg border border-pink-100 col-span-2 md:col-span-1">
                <div className="text-xs text-pink-500 mb-1">Personality Traits</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(tool.persona.personality_traits).map(([trait, value]) => (
                    <span key={trait} className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                      {trait}: {value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-4">
            <a 
              href="/scenarios/persona-agent"
              className="text-sm text-pink-600 hover:text-pink-800 font-medium"
            >
              → Explore Persona Agent Scenario
            </a>
          </div>
        </div>
      )}

      {/* MCP Support */}
      {tool.mcp?.supported && (
        <div className="mb-8 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center gap-2">
            🔌 MCP (Model Context Protocol)
          </h2>
          <p className="text-sm text-indigo-700 mb-4">
            This tool supports the Model Context Protocol, allowing seamless integration with Claude Desktop and other MCP-compatible clients.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-white p-3 rounded-lg border border-indigo-100">
              <div className="text-xs text-indigo-500 mb-1">Server Type</div>
              <div className="text-sm font-medium text-gray-900">{tool.mcp.server_type || 'stdio'}</div>
            </div>
            {tool.mcp.tools_count && (
              <div className="bg-white p-3 rounded-lg border border-indigo-100">
                <div className="text-xs text-indigo-500 mb-1">Tools Available</div>
                <div className="text-sm font-medium text-gray-900">{tool.mcp.tools_count} tools</div>
              </div>
            )}
            {tool.mcp.verified && (
              <div className="bg-white p-3 rounded-lg border border-indigo-100">
                <div className="text-xs text-indigo-500 mb-1">Status</div>
                <div className="text-sm font-medium text-green-600">✓ Verified</div>
              </div>
            )}
          </div>
          {tool.mcp.installation && (
            <div className="bg-indigo-900 rounded-lg p-4">
              <div className="text-xs text-indigo-300 mb-2">Quick Install:</div>
              <code className="text-sm text-indigo-100">{tool.mcp.installation}</code>
            </div>
          )}
          <div className="mt-4 flex gap-4">
            <a 
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              → MCP Documentation
            </a>
            <a 
              href="/?mcp=true"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              → Browse MCP Tools
            </a>
          </div>
        </div>
      )}

      {/* Integration Examples */}
      {(tool.code_examples && Object.keys(tool.code_examples).length > 0) && (
        <div className="mb-8 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              ⚡ Integration Guide
            </h2>
            {tool.integration_minutes && (
              <span className="text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full">
                ⏱️ ~{tool.integration_minutes} min
              </span>
            )}
          </div>
          <IntegrationTab
            toolName={tool.name}
            integrationMinutes={tool.integration_minutes}
            codeExamples={tool.code_examples}
          />
          <div className="mt-6 pt-4 border-t border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              💡 Get these examples via API:{' '}
              <code className="text-xs bg-emerald-100 dark:bg-emerald-900 px-2 py-1 rounded">
                curl https://www.agentdex.top/api/tools/{tool.slug}/integration
              </code>
            </p>
          </div>
        </div>
      )}

      {/* Usage Analytics Card */}
      {(tool.github_stars || tool.open_source || tool.api_available) && (
        <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            📊 Usage Analytics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tool.github_stars && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                <div className="text-xs text-blue-500 dark:text-blue-400 mb-1">GitHub Stars</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tool.github_stars >= 1000 
                    ? `${(tool.github_stars / 1000).toFixed(1)}k` 
                    : tool.github_stars}
                </div>
                <div className="text-xs text-green-500 mt-1">⬆️ Growing</div>
              </div>
            )}
            {tool.github && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                <div className="text-xs text-blue-500 dark:text-blue-400 mb-1">Open Source</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tool.open_source ? '✓ Yes' : '✗ No'}
                </div>
                {tool.open_source && (
                  <a 
                    href={tool.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline mt-1 block"
                  >
                    View on GitHub →
                  </a>
                )}
              </div>
            )}
            {tool.api_available && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                <div className="text-xs text-blue-500 dark:text-blue-400 mb-1">API Available</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  ✓ Yes
                </div>
                <div className="text-xs text-purple-500 mt-1">🤖 Agent-ready</div>
              </div>
            )}
            {tool.integration_level && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                <div className="text-xs text-blue-500 dark:text-blue-400 mb-1">Integration</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {tool.integration_level.replace('_', ' ')}
                </div>
                {tool.quickstart_time && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ⏱️ {tool.quickstart_time}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            💡 More analytics (views, usage stats, voting) coming soon
          </div>
        </div>
      )}

      {/* Cost Calculator */}
      <div className="mb-8">
        <CostCalculator
          toolName={tool.name}
          toolSlug={tool.slug}
          pricing={tool.pricing || 'unknown'}
          pricingDetails={tool.pricing_details}
          locale={locale}
        />
      </div>

      {/* Description */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
        <p className="text-gray-600 leading-relaxed">{tool.description}</p>
        {tool.price_detail && (
          <p className="text-sm text-gray-500 mt-2">💰 {tool.price_detail}</p>
        )}
      </div>

      {/* Tags */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {tool.tags.map(tag => (
            <a 
              key={tag} 
              href={`/?q=${encodeURIComponent(tag)}`}
              className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition"
            >
              {tag}
            </a>
          ))}
        </div>
      </div>

      {/* Links & Compare */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        {tool.website && (
          <a
            href={tool.website ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Visit Website →
          </a>
        )}
        {tool.github && (
          <a
            href={tool.github ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            GitHub →
          </a>
        )}
        <AddToCompareButton tool={tool} />
      </div>

      {/* Compare with similar tools */}
      {(() => {
        const similarTools = allTools
          .filter(t => t.category === tool.category && t.id !== tool.id)
          .slice(0, 4)
        
        if (similarTools.length === 0) return null
        
        return (
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                ⚖️ {locale === 'zh-CN' ? '同类工具对比' : 'Compare with Alternatives'}
              </h3>
              <a 
                href={`/compare?tools=${tool.id},${similarTools.map(t => t.id).join(',')}`}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition"
              >
                {locale === 'zh-CN' ? '一键对比全部 →' : 'Compare All →'}
              </a>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {locale === 'zh-CN' 
                ? `探索与 ${tool.name} 类似的 ${similarTools.length} 个替代方案`
                : `Explore ${similarTools.length} alternatives similar to ${tool.name}`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {similarTools.map(t => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <a
                    href={`/tools/${t.slug}`}
                    className="flex-1"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{t.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{t.tagline}</div>
                  </a>
                  <a
                    href={`/compare?tools=${tool.id},${t.id}`}
                    className="ml-3 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-lg transition"
                  >
                    vs
                  </a>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Quick Start for Agents - 新增 */}
      {tool.api_available && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
            🤖 Quick Start for Agents
          </h3>
          <div className="space-y-4">
            {/* AgentDex API */}
            <div>
              <div className="text-xs text-purple-600 font-mono mb-1"># Get tool info via AgentDex API</div>
              <code className="block bg-purple-900 text-purple-100 p-3 rounded text-sm overflow-x-auto">
                curl https://www.agentdex.top/api/tools/{tool.slug}
              </code>
            </div>
            
            {/* 根据工具类型显示不同的使用示例 */}
            {tool.category === 'memory' && (
              <div>
                <div className="text-xs text-purple-600 font-mono mb-1"># Python quick start (Mem0 example)</div>
                <code className="block bg-purple-900 text-purple-100 p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap">{`from mem0 import Memory

m = Memory()
m.add("User prefers dark mode", user_id="user_123")
memories = m.search("preferences", user_id="user_123")`}</code>
              </div>
            )}
            
            {tool.category === 'web' && tool.slug === 'jina-reader' && (
              <div>
                <div className="text-xs text-purple-600 font-mono mb-1"># Convert any URL to markdown</div>
                <code className="block bg-purple-900 text-purple-100 p-3 rounded text-sm overflow-x-auto">
                  curl https://r.jina.ai/https://example.com
                </code>
              </div>
            )}
            
            {tool.category === 'web' && tool.slug === 'firecrawl' && (
              <div>
                <div className="text-xs text-purple-600 font-mono mb-1"># Crawl a website (Firecrawl)</div>
                <code className="block bg-purple-900 text-purple-100 p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap">{`curl -X POST https://api.firecrawl.dev/v1/crawl \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}</code>
              </div>
            )}
            
            {tool.category === 'execution' && tool.slug === 'e2b' && (
              <div>
                <div className="text-xs text-purple-600 font-mono mb-1"># Execute Python code in sandbox</div>
                <code className="block bg-purple-900 text-purple-100 p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap">{`from e2b_code_interpreter import Sandbox

with Sandbox() as sandbox:
    execution = sandbox.run_code("print('Hello!')")
    print(execution.stdout)`}</code>
              </div>
            )}
            
            {tool.category === 'framework' && tool.slug === 'langchain' && (
              <div>
                <div className="text-xs text-purple-600 font-mono mb-1"># Build a simple agent with LangChain</div>
                <code className="block bg-purple-900 text-purple-100 p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap">{`from langchain.agents import initialize_agent
from langchain.tools import Tool

tools = [Tool(name="calc", func=lambda x: eval(x))]
agent = initialize_agent(tools, llm, agent="zero-shot-react-description")`}</code>
              </div>
            )}
            
            {/* 通用网站链接 */}
            {tool.website && !['jina-reader', 'firecrawl', 'e2b', 'langchain', 'mem0'].includes(tool.slug) && (
              <div>
                <div className="text-xs text-purple-600 font-mono mb-1"># Tool website</div>
                <code className="block bg-purple-900 text-purple-100 p-3 rounded text-sm overflow-x-auto">
                  {tool.website}
                </code>
              </div>
            )}
            
            {/* 官方文档链接 */}
            {tool.github && (
              <div className="pt-2 border-t border-purple-200">
                <span className="text-xs text-purple-600">📚 Docs: </span>
                <a href={tool.github} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-700 hover:text-purple-900 underline">
                  {tool.github}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Changelog */}
      {tool.changelog && tool.changelog.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              📋 API Changelog
            </h2>
            {tool.api_version && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Current: v{tool.api_version}
              </span>
            )}
          </div>
          
          {/* Breaking Changes Warning */}
          {tool.changelog.some(c => c.breaking) && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-lg">⚠️</span>
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-200">Breaking Changes Detected</h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    This tool has recent breaking changes. Review the migration guides below before upgrading.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Changelog Entries */}
          <div className="space-y-4">
            {tool.changelog.map((entry, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-4 ${
                  entry.breaking 
                    ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-gray-900 dark:text-white">
                      v{entry.version}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {entry.date}
                    </span>
                    {entry.breaking && (
                      <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">
                        Breaking
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Changes List */}
                <ul className="space-y-2">
                  {entry.changes.map((change, changeIndex) => (
                    <li key={changeIndex} className="flex items-start gap-2">
                      <span className="flex-shrink-0 mt-1">
                        {change.type === 'breaking' && '💥'}
                        {change.type === 'feature' && '✨'}
                        {change.type === 'fix' && '🐛'}
                        {change.type === 'deprecation' && '⚠️'}
                        {change.type === 'security' && '🔒'}
                      </span>
                      <div className="text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {change.description}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                
                {/* Migration Guide */}
                {entry.migration_guide && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Migration Guide:</div>
                    <code className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                      {entry.migration_guide}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Info */}
      <div className="bg-gray-900 rounded-xl p-6 text-sm mb-8">
        <h3 className="text-gray-400 font-mono mb-2"># Get this tool via AgentDex API</h3>
        <code className="text-green-400">
          curl https://www.agentdex.top/api/tools/{tool.slug}
        </code>
      </div>

      {/* Tool Stacks - 所在的工具栈 */}
      {toolStacks.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🧩</span>
              {locale === 'zh-CN' ? '所在的工具栈' : 'Tool Stacks'}
            </h2>
            <Link
              href="/stacks"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {locale === 'zh-CN' ? '查看全部 →' : 'View All →'}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {toolStacks.map(stack => {
              const stackName = locale === 'zh-CN' && stack.name_zh ? stack.name_zh : stack.name
              const stackDesc = locale === 'zh-CN' && stack.description_zh ? stack.description_zh : stack.description
              const roleLabel = locale === 'zh-CN' && stack.role_zh ? stack.role_zh : stack.role
              
              return (
                <Link
                  key={stack.id}
                  href={`/stacks/${stack.slug}`}
                  className="group p-5 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{stack.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {stackName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                            {roleLabel}
                          </span>
                          {stack.required && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                              {locale === 'zh-CN' ? '必需' : 'Required'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {stackDesc}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>⏱️ {stack.integration_time}</span>
                    <span>💰 {stack.monthly_cost}</span>
                    <span className={getDifficultyColor(stack.difficulty)}>
                      {getDifficultyLabel(stack.difficulty, locale)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Related Skills - 使用此工具的 Skills */}
      {(() => {
        const relatedSkills = getSkillsForTool(tool.slug)
        if (relatedSkills.length === 0) return null
        
        return (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>🧠</span>
                {locale === 'zh-CN' ? '相关 Skills' : 'Related Skills'}
              </h2>
              <Link
                href="/skills"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {locale === 'zh-CN' ? '查看全部 →' : 'View All →'}
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {locale === 'zh-CN' 
                ? `以下 Agent Skills 使用了 ${tool.name}` 
                : `The following Agent Skills use ${tool.name}`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedSkills.map(skill => {
                const skillName = locale === 'zh-CN' && skill.name_zh ? skill.name_zh : skill.name
                const skillDesc = locale === 'zh-CN' && skill.description_zh ? skill.description_zh : skill.description
                
                return (
                  <Link
                    key={skill.id}
                    href={`/skills/${skill.id}`}
                    className="group p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{skill.icon}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                        {skillName}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {skillDesc}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-mono">
                        {skill.trigger}
                      </code>
                      {skill.verified && (
                        <span className="text-xs text-green-600 dark:text-green-400">✓ Verified</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Related Tools - 同类工具 */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Other tools in {category?.label || tool.category}</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {allTools
            .filter(t => t.category === tool.category && t.id !== tool.id)
            .slice(0, 4)
            .map(t => (
              <a
                key={t.id}
                href={`/tools/${t.slug}`}
                className="flex-shrink-0 border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition min-w-[200px]"
              >
                <div className="font-medium text-gray-900">{t.name}</div>
                <div className="text-sm text-gray-500 mt-1 line-clamp-1">{t.tagline}</div>
              </a>
            ))}
        </div>
      </div>

      {/* Alternatives - 替代工具推荐（基于标签相似度） */}
      {(() => {
        // 找到标签相似的工具（排除同分类，因为上面已经显示了）
        const alternatives = allTools
          .filter(t => t.id !== tool.id && t.category !== tool.category)
          .map(t => ({
            ...t,
            score: t.tags.filter(tag => tool.tags.includes(tag)).length
          }))
          .filter(t => t.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)

        if (alternatives.length === 0) return null

        return (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Similar tools you might like</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {alternatives.map(t => (
                <a
                  key={t.id}
                  href={`/tools/${t.slug}`}
                  className="flex-shrink-0 border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition min-w-[200px]"
                >
                  <div className="font-medium text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500 mt-1 line-clamp-1">{t.tagline}</div>
                  <div className="text-xs text-blue-500 mt-2">{categories.find(c => c.id === t.category)?.label || t.category}</div>
                </a>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
    </>
  )
}