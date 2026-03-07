import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { tools, getToolBySlug, categories } from '@/lib/tools'

interface Params {
  slug: string
}

export async function generateStaticParams() {
  return tools.map(tool => ({ slug: tool.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const tool = getToolBySlug(slug)
  
  if (!tool) {
    return { title: 'Tool not found' }
  }
  
  return {
    title: `${tool.name} — AgentDex`,
    description: tool.description,
    keywords: [...tool.tags, 'AI agent', 'agent tool', tool.category].join(', '),
    openGraph: {
      title: `${tool.name} — ${tool.tagline}`,
      description: tool.description,
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
      title: `${tool.name} — ${tool.tagline}`,
      description: tool.description,
    },
    alternates: {
      canonical: `https://www.agentdex.top/tools/${tool.slug}`,
    },
  }
}

export default async function ToolPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const tool = getToolBySlug(slug)

  if (!tool) {
    notFound()
  }

  const category = categories.find(c => c.id === tool.category)

  const pricingColor = {
    free: 'bg-green-100 text-green-700',
    freemium: 'bg-blue-100 text-blue-700',
    paid: 'bg-orange-100 text-orange-700',
  }[tool.pricing]

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

      {/* Links */}
      <div className="flex flex-wrap gap-4 mb-8">
        <a
          href={tool.website}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Visit Website →
        </a>
        {tool.github && (
          <a
            href={tool.github}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            GitHub →
          </a>
        )}
      </div>

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

      {/* API Info */}
      <div className="bg-gray-900 rounded-xl p-6 text-sm mb-8">
        <h3 className="text-gray-400 font-mono mb-2"># Get this tool via AgentDex API</h3>
        <code className="text-green-400">
          curl https://www.agentdex.top/api/tools/{tool.slug}
        </code>
      </div>

      {/* Related Tools - 同类工具 */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Other tools in {category?.label || tool.category}</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {tools
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
        const alternatives = tools
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