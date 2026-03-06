import { NextResponse } from 'next/server'
import { tools, categories } from '@/lib/tools'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const agentFriendly = searchParams.get('agent_friendly')
  const openSource = searchParams.get('open_source')
  const pricing = searchParams.get('pricing')
  const slugs = searchParams.get('slugs') // 批量获取工具，如 ?slugs=mem0,zep,letta
  const featured = searchParams.get('featured') // 只获取精选工具
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  let result = [...tools]

  // 批量获取指定工具
  if (slugs) {
    const slugList = slugs.split(',').map(s => s.trim())
    result = result.filter(t => slugList.includes(t.slug))
    return NextResponse.json({
      success: true,
      total: result.length,
      requested: slugList.length,
      tools: result,
      _agent_hint: {
        all_tools: 'GET /api/tools',
        single_tool: 'GET /api/tools/{slug}',
        compare: 'GET /api/tools/compare?slugs=mem0,zep',
      }
    })
  }

  // 只获取精选工具
  if (featured === 'true') {
    result = result.filter(t => t.featured)
  }

  if (category && category !== 'all') {
    result = result.filter(t => t.category === category)
  }
  if (agentFriendly === 'true') {
    result = result.filter(t => t.agent_friendly)
  }
  if (openSource === 'true') {
    result = result.filter(t => t.open_source)
  }
  if (pricing) {
    result = result.filter(t => t.pricing === pricing)
  }

  const paginated = result.slice(offset, offset + limit)

  return NextResponse.json({
    success: true,
    total: result.length,
    limit,
    offset,
    has_more: offset + limit < result.length,
    categories: categories.map(c => c.id),
    tools: paginated,
    // Agent 使用提示
    _agent_hint: {
      filter_by_category: 'Add ?category=memory to filter by category',
      filter_agent_friendly: 'Add ?agent_friendly=true to get only agent-friendly tools',
      search: 'Use GET /api/search?q=your+query for semantic search',
      submit: 'Use POST /api/tools/submit to add a new tool',
      guide: 'Read https://www.agentdex.top/agent.md for full agent usage guide',
    }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    }
  })
}