import { NextResponse } from 'next/server'
import { getAllTools } from '@/lib/db'
import { Tool } from '@/lib/tools'

export interface MCPServer {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  provider: string | null
  classification: 'official' | 'reference' | 'community'
  tools_count: number
  installation: string
  verified: boolean
  website: string | null
  github: string | null
  category: string
  tags: string[]
}

function inferProvider(tool: Tool): string {
  // Infer provider from name or github
  const name = tool.name.toLowerCase()
  const github = tool.github?.toLowerCase() || ''
  
  if (name.includes('anthropic') || github.includes('anthropic')) return 'Anthropic'
  if (name.includes('microsoft') || github.includes('microsoft')) return 'Microsoft'
  if (name.includes('google') || github.includes('google')) return 'Google'
  if (name.includes('mem0') || github.includes('mem0ai')) return 'Mem0'
  if (name.includes('browserbase') || github.includes('browserbase')) return 'Browserbase'
  if (name.includes('firecrawl') || github.includes('mendableai')) return 'Mendable'
  if (name.includes('e2b') || github.includes('e2b-dev')) return 'E2B'
  if (name.includes('composio') || github.includes('composiohq')) return 'Composio'
  if (name.includes('apify') || github.includes('apify')) return 'Apify'
  
  // Default to tool name
  return tool.name
}

function inferClassification(tool: Tool): 'official' | 'reference' | 'community' {
  // Official: From major AI companies
  const officialProviders = ['anthropic', 'microsoft', 'google', 'openai']
  const provider = inferProvider(tool).toLowerCase()
  
  if (officialProviders.some(p => provider.includes(p))) return 'official'
  
  // Reference: Well-known, widely adopted
  if (tool.featured && tool.verified) return 'reference'
  
  return 'community'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const classification = searchParams.get('classification')
  const search = searchParams.get('search')
  const sort = searchParams.get('sort') || 'popularity'

  // Get all tools with MCP support
  const allTools = await getAllTools()
  const mcpTools = allTools.filter(tool => tool.mcp?.supported)

  // Transform to MCP Server format
  let mcpServers: MCPServer[] = mcpTools.map(tool => ({
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    description: tool.description,
    provider: inferProvider(tool),
    classification: inferClassification(tool),
    tools_count: tool.mcp?.tools_count || 0,
    installation: tool.mcp?.installation || '',
    verified: tool.mcp?.verified || false,
    website: tool.website,
    github: tool.github,
    category: tool.category,
    tags: tool.tags
  }))

  // Apply filters
  if (classification && ['official', 'reference', 'community'].includes(classification)) {
    mcpServers = mcpServers.filter(s => s.classification === classification)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    mcpServers = mcpServers.filter(s => 
      s.name.toLowerCase().includes(searchLower) ||
      s.description?.toLowerCase().includes(searchLower) ||
      s.tags.some(t => t.toLowerCase().includes(searchLower))
    )
  }

  // Apply sorting
  switch (sort) {
    case 'tools_count':
      mcpServers.sort((a, b) => b.tools_count - a.tools_count)
      break
    case 'name':
      mcpServers.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'popularity':
    default:
      // Sort by verified first, then by tools_count
      mcpServers.sort((a, b) => {
        if (a.verified !== b.verified) return b.verified ? 1 : -1
        return b.tools_count - a.tools_count
      })
  }

  return NextResponse.json({
    servers: mcpServers,
    total: mcpServers.length,
    filters: {
      classification: classification || null,
      search: search || null,
      sort
    }
  })
}