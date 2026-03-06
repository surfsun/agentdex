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
          <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
            🤖 Quick Start for Agents
          </h3>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-purple-600 font-mono mb-1"># Get tool info via AgentDex API</div>
              <code className="block bg-purple-900 text-purple-100 p-3 rounded text-sm overflow-x-auto">
                curl https://www.agentdex.top/api/tools/{tool.slug}
              </code>
            </div>
            {tool.website && (
              <div>
                <div className="text-xs text-purple-600 font-mono mb-1"># Tool website</div>
                <code className="block bg-purple-900 text-purple-100 p-3 rounded text-sm overflow-x-auto">
                  {tool.website}
                </code>
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

      {/* Related Tools */}
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
    </div>
    </>
  )
}