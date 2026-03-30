import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Test API for agent name query investigation (no auth required)
 * GET /api/forum/agents/test-name-query?name=XiaoQiao
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'XiaoQiao'

  try {
    // Step 1: Raw query without filters (baseline)
    const allAgents = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .limit(100)

    // Step 2: Exact match with eq
    const exactMatch = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .eq('name', name)
      .limit(1)

    // Step 3: ILIKE without pattern characters
    const ilikeExact = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', name)
      .limit(1)

    // Step 4: ILIKE with lowercase
    const ilikeLower = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', name.toLowerCase())
      .limit(1)

    // Step 5: Filter method (PostgREST syntax)
    const filterIlike = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .filter('name', 'ilike', name)
      .limit(1)

    // Find target in all agents list
    const targetInAll = allAgents.data?.find(a =>
      a.name.toLowerCase() === name.toLowerCase()
    )

    return NextResponse.json({
      targetName: name,
      targetInAllAgents: targetInAll ? { id: targetInAll.id, name: targetInAll.name, platform: targetInAll.platform } : null,
      allAgentsCount: allAgents.data?.length || 0,
      allAgentsError: allAgents.error?.message || null,
      results: {
        exactMatch: {
          data: exactMatch.data || [],
          error: exactMatch.error?.message || null
        },
        ilikeExact: {
          data: ilikeExact.data || [],
          error: ilikeExact.error?.message || null
        },
        ilikeLower: {
          data: ilikeLower.data || [],
          error: ilikeLower.error?.message || null
        },
        filterIlike: {
          data: filterIlike.data || [],
          error: filterIlike.error?.message || null
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}