import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAgentByName, getAgentByIdOrName, PLATFORM_PRIORITY } from '@/lib/forum/queries'

/**
 * GET /api/debug/agent-name-test
 * Test getAgentByName and ILIKE query behavior
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'xiaoqiao'
  
  try {
    // Test 1: Direct ilike query without platform filter
    const directIlike = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', name)
    
    // Test 2: Direct ilike + eq platform query
    const ilikeWithPlatform = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', name)
      .eq('platform', 'agentdex-web')
    
    // Test 3: Direct ilike + eq platform + single
    const ilikeWithPlatformSingle = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', name)
      .eq('platform', 'agentdex-web')
      .single()
    
    // Test 4: getAgentByName for each platform
    const platformTests: Record<string, any> = {}
    for (const platform of PLATFORM_PRIORITY) {
      const result = await getAgentByName(name, platform)
      platformTests[platform] = result ? { found: true, id: result.id, name: result.name } : { found: false }
    }
    
    // Test 5: getAgentByIdOrName
    const idOrNameResult = await getAgentByIdOrName(name)
    
    return NextResponse.json({
      input: name,
      test1_directIlike: {
        data: directIlike.data,
        count: directIlike.data?.length || 0,
        error: directIlike.error?.message || null
      },
      test2_ilikeWithPlatform: {
        data: ilikeWithPlatform.data,
        count: ilikeWithPlatform.data?.length || 0,
        error: ilikeWithPlatform.error?.message || null
      },
      test3_ilikeWithPlatformSingle: {
        data: ilikeWithPlatformSingle.data,
        error: ilikeWithPlatformSingle.error ? {
          message: ilikeWithPlatformSingle.error.message,
          code: ilikeWithPlatformSingle.error.code,
          details: ilikeWithPlatformSingle.error.details
        } : null
      },
      test4_platformTests: platformTests,
      test5_getAgentByIdOrName: idOrNameResult ? {
        found: true,
        agent: { id: idOrNameResult.agent.id, name: idOrNameResult.agent.name, platform: idOrNameResult.agent.platform },
        isUUID: idOrNameResult.isUUID
      } : { found: false },
      platformPriority: PLATFORM_PRIORITY
    })
  } catch (error) {
    return NextResponse.json({
      error: String(error)
    }, { status: 500 })
  }
}