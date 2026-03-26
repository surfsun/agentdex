import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { categories } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const agentFriendly = searchParams.get('agent_friendly')
  const openSource = searchParams.get('open_source')
  const pricing = searchParams.get('pricing')
  const slugs = searchParams.get('slugs')
  const featured = searchParams.get('featured')
  const integrationLevel = searchParams.get('integration_level')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  // 批量获取指定工具
  if (slugs) {
    const slugList = slugs.split(',').map(s => s.trim())
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .in('slug', slugList)
      .eq('status', 'active')

    if (error) {
      console.error('[API /tools] Error:', error)
      return NextResponse.json(
        { success: false, error: 'Database error', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      total: data?.length || 0,
      requested: slugList.length,
      tools: data || [],
      _agent_hint: {
        all_tools: 'GET /api/tools',
        single_tool: 'GET /api/tools/{slug}',
        compare: 'GET /api/tools/compare?slugs=mem0,zep',
      }
    })
  }

  // 构建查询
  let query = supabase
    .from('tools')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  // 只获取精选工具
  if (featured === 'true') {
    query = query.eq('featured', true)
  }

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }
  if (agentFriendly === 'true') {
    query = query.eq('agent_friendly', true)
  }
  if (openSource === 'true') {
    query = query.eq('open_source', true)
  }
  if (pricing) {
    query = query.eq('pricing', pricing)
  }
  if (integrationLevel) {
    query = query.eq('integration_level', integrationLevel)
  }

  // 排序和分页
  const { data, error, count } = await query
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[API /tools] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Database error', details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    total: count || 0,
    limit,
    offset,
    has_more: offset + limit < (count || 0),
    categories: categories.map(c => c.id),
    tools: data || [],
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