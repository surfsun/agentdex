import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/identity/auth'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Debug API for agent name query investigation
 * GET /api/debug/agent-query-debug?name=XiaoQiao
 * Security: Requires Bearer token authentication
 */
export async function GET(request: NextRequest) {
  // 认证检查
  const auth = await authenticateRequest(request)
  
  if (!auth.success) {
    return NextResponse.json({
      success: false,
      error: '认证失败，Debug API 需要有效认证',
      code: auth.code || 'AUTH_REQUIRED'
    }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'XiaoQiao'

  try {
    // Test 1: List all agents (baseline)
    const listResult = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .limit(100)

    // Test 2: Exact match with eq
    const exactResult = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .eq('name', name)

    // Test 3: ILIKE match (case-insensitive)
    const ilikeResult = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', name)

    // Test 4: ILIKE with pattern
    const ilikePatternResult = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', `%${name}%`)

    // Test 5: filter method (PostgREST syntax)
    const filterResult = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .filter('name', 'ilike', name)

    // Find if the target agent exists in list
    const targetInList = listResult.data?.find(a => 
      a.name.toLowerCase() === name.toLowerCase()
    )

    return NextResponse.json({
      success: true,
      debug: {
        targetName: name,
        targetInList: targetInList ? 'YES' : 'NO',
        listCount: listResult.data?.length || 0,
        results: {
          exactMatch: {
            count: exactResult.data?.length || 0,
            error: exactResult.error?.message || null,
            data: exactResult.data || []
          },
          ilikeMatch: {
            count: ilikeResult.data?.length || 0,
            error: ilikeResult.error?.message || null,
            data: ilikeResult.data || []
          },
          ilikePattern: {
            count: ilikePatternResult.data?.length || 0,
            error: ilikePatternResult.error?.message || null,
            data: ilikePatternResult.data || []
          },
          filterMethod: {
            count: filterResult.data?.length || 0,
            error: filterResult.error?.message || null,
            data: filterResult.data || []
          }
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}