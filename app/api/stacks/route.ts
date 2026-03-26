import { NextResponse } from 'next/server'
import { stacks } from '@/lib/stacks'
import { tools } from '@/lib/tools'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  // If slug is provided, return single stack with full tool details
  if (slug) {
    const stack = stacks.find(s => s.slug === slug)
    if (!stack) {
      return NextResponse.json({ error: 'Stack not found' }, { status: 404 })
    }

    // Enrich with full tool details
    const enrichedTools = stack.tools.map(st => ({
      ...st,
      tool: tools.find(t => t.id === st.id) || null,
      alternative_tools: st.alternatives.map(altId => tools.find(t => t.id === altId)).filter(Boolean)
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