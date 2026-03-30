import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Debug API to test agent query logic
 * GET /api/debug/agent-query?name=XiaoQiao
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name') || 'XiaoQiao'

    console.log(`[Debug] Testing query for name="${name}"`)

    // Test 1: Simple query without platform filter
    const simpleQuery = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .eq('name', name)
      .maybeSingle()

    console.log('[Debug] Simple eq query result:', simpleQuery)

    // Test 2: ILIKE filter
    const ilikeQuery = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .filter('name', 'ilike', name)
      .maybeSingle()

    console.log('[Debug] ILIKE query result:', ilikeQuery)

    // Test 3: Query with .in()
    const PLATFORM_PRIORITY = [
      'agentdex',
      'agentdex-web',
      'web',
      'feishu',
      'system',
      'cron-check',
      'cron-verify'
    ]

    const inQuery = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .eq('name', name)
      .in('platform', PLATFORM_PRIORITY)
      .maybeSingle()

    console.log('[Debug] IN query result:', inQuery)

    // Test 4: List all agents
    const allAgents = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .limit(20)

    console.log('[Debug] All agents:', allAgents)

    return NextResponse.json({
      name,
      simpleQuery: {
        data: simpleQuery.data,
        error: simpleQuery.error?.message || null
      },
      ilikeQuery: {
        data: ilikeQuery.data,
        error: ilikeQuery.error?.message || null
      },
      inQuery: {
        data: inQuery.data,
        error: inQuery.error?.message || null
      },
      allAgents: {
        count: allAgents.data?.length || 0,
        data: allAgents.data?.slice(0, 5),
        error: allAgents.error?.message || null
      }
    })
  } catch (error) {
    console.error('[Debug] Error:', error)
    return NextResponse.json({
      error: String(error)
    }, { status: 500 })
  }
}