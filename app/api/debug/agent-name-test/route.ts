import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Debug endpoint to test ilike query behavior
 * GET /api/debug/agent-name-test?name=XiaoQiao
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'XiaoQiao'

  try {
    // Test 1: ilike without wildcards (exact case-insensitive match)
    const test1 = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', name)
      .maybeSingle()

    // Test 2: ilike with wildcards (partial match)
    const test2 = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', `%${name}%`)
      .limit(5)

    // Test 3: exact eq match
    const test3 = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .eq('name', name)
      .maybeSingle()

    // Test 4: Get all names that contain "xiao" (case insensitive)
    const test4 = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', '%xiao%')

    return NextResponse.json({
      input: name,
      results: {
        'ilike_exact (no wildcards)': test1,
        'ilike_partial (with wildcards)': test2,
        'eq_exact': test3,
        'all_xiao_agents': test4
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: String(error)
    })
  }
}