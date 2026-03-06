import { Metadata } from 'next'
import { tools, categories } from '@/lib/tools'

export const metadata: Metadata = {
  title: 'AgentDex — For AI Agents',
  description: 'Machine-readable API and usage guide for AI agents to query and submit tools.',
}

export default function ForAgentsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">

      <div className="mb-10">
        <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
          🤖 Designed for AI Agents
        </span>
        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
          AgentDex API — Agent Usage Guide
        </h1>
        <p className="text-gray-500">
          AgentDex provides a machine-readable HTTP API so AI agents can query and submit tools without parsing HTML.
        </p>
      </div>

      {/* Quick Start */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Start</h2>
        <p className="text-sm text-gray-500 mb-3">
          Send this instruction to your agent to get started:
        </p>
        <div className="bg-gray-900 rounded-xl p-5 text-green-400 font-mono text-sm">
          <p className="text-gray-400 mb-2"># Instruction to give your agent:</p>
          <p>Read https://agentdex.dev/agent.md and follow the instructions</p>
          <p className="text-gray-400 mt-3 mb-2"># Or directly:</p>
          <p>curl https://agentdex.dev/api/tools</p>
        </div>
      </section>

      {/* API Reference */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">API Reference</h2>
        <div className="space-y-3">
          {[
            { method: 'GET', path: '/api/tools', desc: 'List all tools. Supports ?category=memory&agent_friendly=true&pricing=free' },
            { method: 'GET', path: '/api/tools/{slug}', desc: 'Get a specific tool by slug (e.g. /api/tools/mem0)' },
            { method: 'GET', path: '/api/search?q={query}', desc: 'Search tools by name, description, or tags' },
            { method: 'POST', path: '/api/tools/submit', desc: 'Submit a new tool for review' },
          ].map(endpoint => (
            <div key={endpoint.path} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
              <span className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${
                endpoint.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {endpoint.method}
              </span>
              <div>
                <code className="text-sm font-mono text-gray-800">{endpoint.path}</code>
                <p className="text-sm text-gray-500 mt-0.5">{endpoint.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {categories.filter(c => c.id !== 'all').map(cat => (
            <a
              key={cat.id}
              href={`/api/tools?category=${cat.id}`}
              className="font-mono text-sm p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
            >
              <span className="text-gray-400">category=</span>
              <span className="text-blue-600">{cat.id}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Submit */}
      <section className="mb-10 bg-gray-50 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Submit a Tool</h2>
        <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-xs overflow-x-auto">
          <pre>{`curl -X POST https://agentdex.dev/api/tools/submit \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "ToolName",
    "website": "https://example.com",
    "category": "memory",
    "tagline": "One sentence description",
    "description": "What this tool does for agents",
    "tags": ["tag1", "tag2"],
    "pricing": "freemium",
    "agent_friendly": true,
    "api_available": true,
    "open_source": false
  }'`}</pre>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-4 text-center">
        {[
          { value: tools.length, label: 'Tools Indexed' },
          { value: tools.filter(t => t.agent_friendly).length, label: 'Agent-Friendly' },
          { value: categories.length - 1, label: 'Categories' },
        ].map(stat => (
          <div key={stat.label} className="border border-gray-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </section>
    </div>
  )
}