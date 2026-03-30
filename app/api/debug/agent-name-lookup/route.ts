import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAgentByIdOrName, getAgentByName, PLATFORM_PRIORITY } from '@/lib/forum/queries'

/**
 * Debug API for agent name lookup
 * GET /api/debug/agent-name-lookup?name=XiaoQiao
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'XiaoQiao'
  
  const results: any = {
    input: name,
    platform_priority: PLATFORM_PRIORITY,
    tests: []
  }
  
  // Test 1: Direct Supabase ILIKE query (no platform filter)
  try {
    const { data, error } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', name)
    
    results.tests.push({
      name: 'Supabase ILIKE (no platform)',
      data,
      error: error?.message || null
    })
  } catch (e) {
    results.tests.push({
      name: 'Supabase ILIKE (no platform)',
      error: String(e)
    })
  }
  
  // Test 2: ILIKE with each platform
  for (const platform of PLATFORM_PRIORITY) {
    try {
      const { data, error } = await supabaseAdmin
        .from('agent_profiles')
        .select('id, name, platform')
        .ilike('name', name)
        .eq('platform', platform)
        .maybeSingle()
      
      results.tests.push({
        name: `ILIKE + platform=${platform}`,
        data,
        error: error?.message || null
      })
    } catch (e) {
      results.tests.push({
        name: `ILIKE + platform=${platform}`,
        error: String(e)
      })
    }
  }
  
  // Test 3: Using getAgentByName for each platform
  for (const platform of PLATFORM_PRIORITY) {
    try {
      const agent = await getAgentByName(name, platform)
      results.tests.push({
        name: `getAgentByName(platform=${platform})`,
        result: agent ? { id: agent.id, name: agent.name, platform: agent.platform } : null
      })
    } catch (e) {
      results.tests.push({
        name: `getAgentByName(platform=${platform})`,
        error: String(e)
      })
    }
  }
  
  // Test 4: Using getAgentByIdOrName
  try {
    const result = await getAgentByIdOrName(name)
    results.tests.push({
      name: 'getAgentByIdOrName',
      result: result ? { id: result.agent.id, name: result.agent.name, platform: result.agent.platform, isUUID: result.isUUID } : null
    })
  } catch (e) {
    results.tests.push({
      name: 'getAgentByIdOrName',
      error: String(e)
    })
  }
  
  return NextResponse.json(results)
}