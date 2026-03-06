import { tools, categories } from '@/lib/tools'
import ToolCard from '@/components/ToolCard'

interface SearchParams {
  category?: string
  q?: string
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const activeCategory = params.category || 'all'
  const query = params.q || ''

  let displayTools = tools
  if (query) {
    // 搜索时忽略分类筛选
    displayTools = tools.filter(t =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.tagline.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    )
  } else if (activeCategory !== 'all') {
    displayTools = tools.filter(t => t.category === activeCategory)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          The tool directory built for AI agents
        </h1>
        <p className="text-lg text-gray-500 mb-2">
          Discover infrastructure tools designed specifically for AI agents —
          not adapted from human tools.
        </p>
        <p className="text-sm text-blue-600 font-mono mb-3">
          GET https://www.agentdex.top/api/tools — machine-readable, agent-friendly
        </p>
        {/* Agent 入口 */}
        <a
          href="/agent.md"
          className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-200 transition"
        >
          🤖 Agent? Read /agent.md
        </a>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form method="GET">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search tools..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* Category Filter - 搜索时隐藏 */}
      {!query && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <a
              key={cat.id}
              href={`/?category=${cat.id}`}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {cat.label}
            </a>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-6 text-sm text-gray-400 mb-8">
        <span>{tools.length} tools indexed</span>
        <span>{tools.filter(t => t.agent_friendly).length} agent-friendly</span>
        <span>{tools.filter(t => t.open_source).length} open source</span>
      </div>

      {/* Search Results Header */}
      {query && (
        <div className="mb-4 text-sm text-gray-600">
          Found {displayTools.length} result{displayTools.length !== 1 ? 's' : ''} for &quot;{query}&quot;
          {' — '}
          <a href="/" className="text-blue-500 hover:underline">Clear search</a>
        </div>
      )}

      {/* Tool Grid */}
      {displayTools.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>No tools found. <a href="/" className="text-blue-500 hover:underline">Clear filters</a></p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTools.map(tool => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}

      {/* Submit CTA */}
      <div className="mt-16 bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Know a tool that should be here?
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Submit via API or open a GitHub issue.
        </p>
        <div className="flex justify-center gap-3">
          <a
            href="/for-agents"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            Submit via API (for agents)
          </a>
          <a
            href="https://github.com/surfsun/agentdex/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Open GitHub Issue (for humans)
          </a>
        </div>
      </div>
    </div>
  )
}