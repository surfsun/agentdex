import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAgentByName } from '@/lib/forum/queries'

/**
 * GET /api/debug/test-ilike
 * Test Supabase connection and ILIKE query
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'xiaoqiao'
  const platform = searchParams.get('platform') || 'agentdex-web'
  
  try {
    // Test 0: Simple select to verify Supabase connection
    const { data: simpleTest, error: simpleError } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .limit(3)
    
    // Test 1: Use the actual getAgentByName function
    const agentByName = await getAgentByName(name, platform)
    
    // Test 2: Direct ILIKE query  
    const { data: ilikeResult, error: ilikeError } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', name)
      .eq('platform', platform)
      .single()
    
    // Test 3: Exact match with correct name
    const { data: exactResult, error: exactError } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .eq('name', 'XiaoQiao')
      .eq('platform', platform)
      .single()
    
    return NextResponse.json({
      success: true,
      tests: {
        simple: { 
          data: simpleTest, 
          error: simpleError?.message || null,
          count: simpleTest?.length || 0
        },
        getAgentByName: {
          result: agentByName,
          name: name,
          platform: platform
        },
        ilike: { data: ilikeResult, error: ilikeError?.message || null },
        exact: { data: exactResult, error: exactError?.message || null }
      },
      params: { name, platform }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}