import { Metadata } from 'next'
import Link from 'next/link'
import MCPServerList, { MCPServer } from '@/components/MCPServerList'

export const metadata: Metadata = {
  title: 'MCP Server Directory — AgentDex',
  description: 'Discover and install MCP (Model Context Protocol) servers for AI agents. Browse official, reference, and community MCP servers.',
}

async function getMCPServers(): Promise<MCPServer[]> {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000'
  
  const res = await fetch(`${baseUrl}/api/mcp-servers`, { 
    cache: 'no-store' 
  })
  
  if (!res.ok) return []
  const data = await res.json()
  return data.servers || []
}

export default async function MCPServersPage() {
  const servers = await getMCPServers()

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-blue-500 hover:underline">AgentDex</Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900 dark:text-white font-medium">MCP Server Directory</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-3">
          <span>🔌</span>
          MCP Server Directory
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {servers.length}+ servers for AI agents — The standard protocol for agent-tool communication
        </p>
      </div>

      {/* What is MCP */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-10">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <span>💡</span>
          What is MCP?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          MCP (Model Context Protocol) is the standard protocol for connecting AI agents to external tools and data sources. 
          It provides a unified interface for agents to discover and use tools without custom integrations.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700 dark:text-gray-300">One-line install</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700 dark:text-gray-300">Standard protocol</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700 dark:text-gray-300">Works with Claude, Cursor, and more</span>
          </div>
        </div>
      </div>

      {/* Classification Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            Official
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">From major AI companies</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
            Reference
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Widely adopted implementations</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            Community
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Community-maintained</span>
        </div>
      </div>

      {/* Server List with Search and Filters */}
      <MCPServerList servers={servers} />

      {/* Installation Guide */}
      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 mb-10 mt-10">
        <h3 className="text-gray-400 font-mono mb-3 text-sm"># Quick Install</h3>
        <div className="space-y-3">
          <div>
            <p className="text-gray-500 text-xs mb-1">For Claude Desktop:</p>
            <code className="text-green-400 text-sm block">
              npx {servers[0]?.installation || '@anthropic-ai/mcp-server-filesystem'}
            </code>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">For Cursor:</p>
            <code className="text-green-400 text-sm block">
              Add to Settings → MCP Servers
            </code>
          </div>
        </div>
      </div>

      {/* API Section */}
      <div className="bg-gray-900 rounded-xl p-6 mb-10">
        <h3 className="text-gray-400 font-mono mb-2"># Get MCP servers via API</h3>
        <code className="text-green-400 text-sm">
          curl https://www.agentdex.top/api/mcp-servers
        </code>
        <div className="mt-4 text-gray-500 text-sm">
          <p>Filter by classification:</p>
          <code className="text-blue-400">?classification=official</code>
          <code className="text-blue-400 ml-4">?classification=community</code>
        </div>
        <div className="mt-2 text-gray-500 text-sm">
          <p>Search:</p>
          <code className="text-blue-400">?search=browser</code>
        </div>
        <div className="mt-2 text-gray-500 text-sm">
          <p>Sort:</p>
          <code className="text-blue-400">?sort=popularity</code>
          <code className="text-blue-400 ml-4">?sort=tools_count</code>
          <code className="text-blue-400 ml-4">?sort=name</code>
        </div>
      </div>

      {/* Back Link */}
      <div className="mt-8">
        <Link href="/" className="text-blue-500 hover:text-blue-700 text-sm">
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}