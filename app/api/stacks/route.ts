import { NextResponse } from 'next/server'
import { stacks } from '@/lib/stacks'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  // 从数据库获取所有工具
  const { data: tools, error } = await supabase
    .from('tools')
    .select('*')
    .eq('status', 'active')

  if (error) {
    console.error('[API /stacks] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Database error', details: error.message },
      { status: 500 }
    )
  }

  // 创建工具 ID 到工具详情的映射
  const toolMap = new Map(tools?.map(t => [t.id, t]) || [])

  // If slug is provided, return single stack with full tool details
  if (slug) {
    const stack = stacks.find(s => s.slug === slug)
    if (!stack) {
      return NextResponse.json({ error: 'Stack not found' }, { status: 404 })
    }

    // Enrich with full tool details
    const enrichedTools = stack.tools.map(st => ({
      ...st,
      tool: toolMap.get(st.id) || null,
      alternative_tools: st.alternatives.map(altId => toolMap.get(altId)).filter(Boolean)
    }))

    return NextResponse.json({
      ...stack,
      tools: enrichedTools
    })
  }

  // Return all stacks with summary info
  const summary = stacks.map(stack => ({
    id: stack.id,
    slug: stack.slug,
    name: stack.name,
    name_zh: stack.name_zh,
    description: stack.description,
    description_zh: stack.description_zh,
    icon: stack.icon,
    integration_time: stack.integration_time,
    monthly_cost: stack.monthly_cost,
    difficulty: stack.difficulty,
    verified: stack.verified,
    tools_count: stack.tools.length,
    tool_ids: stack.tools.map(t => t.id)
  }))

  return NextResponse.json({
    stacks: summary,
    total: stacks.length,
    _agent_hint: 'Use /api/stacks?slug=web-browsing-agent to get full stack details with tool info'
  })
}