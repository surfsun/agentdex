import { NextResponse } from 'next/server'
import { getAgentByIdOrName, PLATFORM_PRIORITY, getAgentByName } from '@/lib/forum/queries'
import { supabaseAdmin } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/forum/agents/[id]
 * Get agent by ID or name
 * Supports:
 * - UUID: /api/forum/agents/8b155b74-e267-4a06-8fb5-be0412d5f245
 * - Name: /api/forum/agents/XiaoQiao (case-insensitive)
 */
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    console.log(`[API /forum/agents/[id]] Input: "${id}"`)
    
    // Debug: Test multiple query methods
    const debugResults: any = { input: id }
    
    // Method 1: Direct ILIKE without platform filter
    const { data: ilikeOnly, error: ilikeOnlyError } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', id)
    
    debugResults.ilike_only = {
      count: ilikeOnly?.length || 0,
      data: ilikeOnly,
      error: ilikeOnlyError?.message
    }
    
    // Method 2: ILIKE with platform filter (agentdex)
    const { data: ilikeAgentdex, error: ilikeAgentdexError } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', id)
      .eq('platform', 'agentdex')
    
    debugResults.ilike_agentdex = {
      count: ilikeAgentdex?.length || 0,
      data: ilikeAgentdex,
      error: ilikeAgentdexError?.message
    }
    
    // Method 3: ILIKE with platform filter (agentdex-web)
    const { data: ilikeWeb, error: ilikeWebError } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', id)
      .eq('platform', 'agentdex-web')
    
    debugResults.ilike_agentdex_web = {
      count: ilikeWeb?.length || 0,
      data: ilikeWeb,
      error: ilikeWebError?.message
    }
    
    // Method 4: Use getAgentByName for each platform
    debugResults.getByName = {}
    for (const platform of PLATFORM_PRIORITY) {
      const agent = await getAgentByName(id, platform)
      debugResults.getByName[platform] = agent ? { found: true, name: agent.name } : { found: false }
    }

    const result = await getAgentByIdOrName(id)

    if (!result) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Agent not found',
          debug: debugResults
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.agent,
      debug: debugResults
    })
  } catch (error) {
    console.error('[API /forum/agents/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent', details: String(error) },
      { status: 500 }
    )
  }
}