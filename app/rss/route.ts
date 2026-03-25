import { tools, getRecentUpdates, ToolUpdate } from '@/lib/tools'

export async function GET() {
  const allTools = tools.slice(0, 50) // 最近 50 个工具
  const recentUpdates = getRecentUpdates(20) // 最近 20 个更新

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AgentDex - New Tools &amp; Updates</title>
    <link>https://www.agentdex.top</link>
    <description>The latest AI agent tools and updates added to AgentDex</description>
    <language>en-us</language>
    <atom:link href="https://www.agentdex.top/rss" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${generateChangelogItems(recentUpdates)}
    ${generateNewToolItems(allTools)}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

function generateChangelogItems(updates: ToolUpdate[]): string {
  return updates.map(update => {
    const changeType = update.latestChange.breaking ? '[BREAKING] ' : ''
    const changeDesc = update.latestChange.changes[0]?.description || 'API Update'
    return `
    <item>
      <title>${changeType}${update.tool.name} v${update.latestChange.version}</title>
      <link>https://www.agentdex.top/tools/${update.tool.slug}</link>
      <description><![CDATA[${changeDesc}]]></description>
      <category>changelog</category>
      <pubDate>${new Date(update.latestChange.date).toUTCString()}</pubDate>
      <guid isPermaLink="false">changelog-${update.tool.id}-${update.latestChange.version}</guid>
    </item>`
  }).join('')
}

function generateNewToolItems(tools: { name: string; slug: string; description: string; category: string; created_at: string }[]): string {
  return tools.map(tool => `
    <item>
      <title>New Tool: ${tool.name}</title>
      <link>https://www.agentdex.top/tools/${tool.slug}</link>
      <description><![CDATA[${tool.description}]]></description>
      <category>${tool.category}</category>
      <pubDate>${new Date(tool.created_at).toUTCString()}</pubDate>
      <guid>https://www.agentdex.top/tools/${tool.slug}</guid>
    </item>
    `).join('')
}