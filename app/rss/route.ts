import { tools } from '@/lib/tools'

export async function GET() {
  const allTools = tools.slice(0, 50) // 最近 50 个工具

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AgentDex - New Tools</title>
    <link>https://www.agentdex.top</link>
    <description>The latest AI agent tools added to AgentDex</description>
    <language>en-us</language>
    <atom:link href="https://www.agentdex.top/rss" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${allTools.map(tool => `
    <item>
      <title>${tool.name}</title>
      <link>https://www.agentdex.top/tools/${tool.slug}</link>
      <description><![CDATA[${tool.description}]]></description>
      <category>${tool.category}</category>
      <pubDate>${new Date(tool.created_at).toUTCString()}</pubDate>
      <guid>https://www.agentdex.top/tools/${tool.slug}</guid>
    </item>
    `).join('')}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}