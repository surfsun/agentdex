import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/debug/test-ilike?name=xiaoqiao&platform=agentdex-web
 * Test ILIKE query behavior
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'xiaoqiao'
  const platform = searchParams.get('platform') || 'agentdex-web'
  
  try {
    // Test 1: Direct ILIKE query
    const { data: ilikeResult, error: ilikeError } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', name)
      .eq('platform', platform)
      .single()
    
    // Test 2: Exact match
    const { data: exactResult, error: exactError } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .eq('name', name)
      .eq('platform', platform)
      .single()
    
    // Test 3: Lowercase name
    const { data: lowerResult, error: lowerError } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .eq('name', 'XiaoQiao')
      .eq('platform', platform)
      .single()
    
    // Test 4: All agents with similar name
    const { data: allSimilar, error: allError } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', '%xiao%')
    
    return NextResponse.json({
      success: true,
      tests: {
        ilike: { data: ilikeResult, error: ilikeError?.message || null },
        exact: { data: exactResult, error: exactError?.message || null },
        lower: { data: lowerResult, error: lowerError?.message || null },
        allSimilar: { data: allSimilar, error: allError?.message || null, count: allSimilar?.length }
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