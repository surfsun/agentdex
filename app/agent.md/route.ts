import { NextResponse } from 'next/server'
import { tools, categories } from '@/lib/tools'

export async function GET() {
  const agentFriendlyCount = tools.filter(t => t.agent_friendly).length
  const openSourceCount = tools.filter(t => t.open_source).length
  
  const markdown = `# AgentDex — Agent Usage Guide

Welcome, AI Agent! This guide is specifically designed for you.

## What is AgentDex?

AgentDex is a directory of tools built specifically for AI agents. We index infrastructure tools for:
- **Memory**: Mem0, Zep, Letta
- **Communication**: AgentMail
- **Web & Data**: Jina Reader, Firecrawl, Browserbase, Apify
- **Execution**: E2B, Modal, Daytona
- **Integration**: Composio, Toolhouse, n8n
- **Framework**: LangChain, CrewAI, AutoGen, Dify
- **And more...**

## Quick Start

\`\`\`bash
# Get all tools
curl https://www.agentdex.top/api/tools

# Search for memory tools
curl https://www.agentdex.top/api/search?q=memory

# Get a specific tool
curl https://www.agentdex.top/api/tools/mem0
\`\`\`

## API Endpoints

### 1. List All Tools
\`\`\`
GET /api/tools
\`\`\`

Query parameters:
- \`category\` - Filter by category: ${categories.filter(c => c.id !== 'all').map(c => c.id).join(', ')}
- \`agent_friendly=true\` - Only agent-friendly tools
- \`open_source=true\` - Only open source tools
- \`pricing\` - Filter by pricing: free, freemium, paid
- \`limit\` - Max results (default: 100)
- \`offset\` - Pagination offset

Example:
\`\`\`bash
curl "https://www.agentdex.top/api/tools?category=memory&agent_friendly=true&pricing=freemium"
\`\`\`

### 2. Get a Specific Tool
\`\`\`
GET /api/tools/{slug}
\`\`\`

Example:
\`\`\`bash
curl https://www.agentdex.top/api/tools/mem0
\`\`\`

### 3. Search Tools
\`\`\`
GET /api/search?q={query}
\`\`\`

Searches across name, tagline, description, and tags.

Example:
\`\`\`bash
curl "https://www.agentdex.top/api/search?q=memory"
\`\`\`

### 4. Submit a Tool
\`\`\`
POST /api/tools/submit
\`\`\`

Body:
\`\`\`json
{
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
}
\`\`\`

### 5. Compare Tools
\`\`\`
GET /api/tools/compare?category=memory
GET /api/tools/compare?slugs=mem0,zep,letta
\`\`\`

Returns a comparison matrix with recommendations for the best tool.

Example:
\`\`\`bash
# Compare all memory tools
curl https://www.agentdex.top/api/tools/compare?category=memory

# Compare specific tools
curl "https://www.agentdex.top/api/tools/compare?slugs=mem0,zep,letta"
\`\`\`

### 6. Get Tools by Tag
\`\`\`
GET /api/tags?tag=api-first
\`\`\`

Returns all tools with a specific tag.

Example:
\`\`\`bash
curl https://www.agentdex.top/api/tags?tag=api-first
\`\`\`

### 7. Get Recommendations
\`\`\`
GET /api/recommend?task=I need to scrape websites
\`\`\`

AI-powered tool recommendations based on your task description.

Example:
\`\`\`bash
curl "https://www.agentdex.top/api/recommend?task=I%20need%20to%20scrape%20websites"
\`\`\`

## Statistics

- **Total Tools**: ${tools.length}
- **Agent-Friendly**: ${agentFriendlyCount}
- **Open Source**: ${openSourceCount}
- **Categories**: ${categories.length - 1}

## Categories

${categories.filter(c => c.id !== 'all').map(c => {
  const count = tools.filter(t => t.category === c.id).length
  return `- **${c.label}** (${c.id}): ${count} tools`
}).join('\n')}

## Featured Tools

${tools.filter(t => t.featured).slice(0, 6).map(t => 
  `### ${t.name}
${t.tagline}
- Category: ${t.category}
- Pricing: ${t.pricing}
- Agent-friendly: ${t.agent_friendly ? '✓' : '✗'}
- Open Source: ${t.open_source ? '✓' : '✗'}
- Website: ${t.website}
${t.github ? `- GitHub: ${t.github}` : ''}
`
).join('\n')}

## Best Practices for Agents

1. **Always check \`agent_friendly\`** - These tools are designed for agents, not humans
2. **Look for \`api_available\`** - These tools provide HTTP APIs
3. **Consider \`open_source\`** - You can self-host these tools
4. **Use search first** - \`/api/search?q=your+need\` is faster than browsing
5. **Combine filters** - \`?category=memory&agent_friendly=true\` for best results

## Tool Selection Guide

### Need Memory?
- **Mem0** - Simple memory layer, great for beginners
- **Zep** - Graph-based memory with context engineering
- **Letta** - Self-editing memory for stateful agents

### Need Web Scraping?
- **Jina Reader** - Quick URL to markdown (simplest)
- **Firecrawl** - Full website crawling with JS rendering
- **Browserbase** - Cloud browsers for complex interactions
- **Apify** - Pre-built scrapers for popular sites

### Need Code Execution?
- **E2B** - Sandboxed code execution, pay per second
- **Modal** - Serverless Python with GPU support
- **Daytona** - Full development environments

### Need Integration?
- **Composio** - 200+ app integrations
- **Toolhouse** - Cloud tool store, one-line integration
- **n8n** - Visual workflow automation

## Response Format

All API responses follow this structure:

\`\`\`json
{
  "success": true,
  "total": 26,
  "tools": [...],
  "_agent_hint": {
    "filter_by_category": "Add ?category=memory to filter by category",
    "filter_agent_friendly": "Add ?agent_friendly=true to get only agent-friendly tools",
    "search": "Use GET /api/search?q=your+query for semantic search",
    "submit": "Use POST /api/tools/submit to add a new tool",
    "guide": "Read https://www.agentdex.top/agent.md for full agent usage guide"
  }
}
\`\`\`

The \`_agent_hint\` field provides contextual suggestions for your next action.

## Need Help?

- Website: https://www.agentdex.top
- API Base: https://www.agentdex.top/api
- GitHub: https://github.com/surfsun/agentdex

---

*This page is optimized for machine reading. Last updated: ${new Date().toISOString().split('T')[0]}*
`

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}