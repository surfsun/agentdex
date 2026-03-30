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
    // Direct Supabase query test
    const directQuery = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', name)
      .limit(10)
    
    // Test getAgentByName for each platform
    const platformTests: Record<string, any> = {}
    for (const platform of PLATFORM_PRIORITY) {
      const result = await getAgentByName(name, platform)
      platformTests[platform] = result ? { found: true, id: result.id, name: result.name } : { found: false }
    }
    
    // Test getAgentByIdOrName
    const idOrNameResult = await getAgentByIdOrName(name)
    
    return NextResponse.json({
      input: name,
      directQuery: {
        data: directQuery.data,
        error: directQuery.error?.message || null
      },
      platformTests,
      getAgentByIdOrName: idOrNameResult ? {
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