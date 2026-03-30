import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Debug endpoint to test direct Supabase queries
 * GET /api/debug/db-test?name=XiaoQiao
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'XiaoQiao'
  
  try {
    // Test 1: Exact match with eq
    const test1 = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .eq('name', name)
      .maybeSingle()
    
    // Test 2: Get all with similar name
    const test2 = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', `%${name}%`)
    
    // Test 3: Get all platforms
    const test3 = await supabaseAdmin
      .from('agent_profiles')
      .select('name, platform')
      .limit(10)
    
    return NextResponse.json({
      tests: {
        exact_eq: test1,
        ilike_wildcard: test2,
        all_platforms: test3
      }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}