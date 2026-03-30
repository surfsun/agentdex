import { NextResponse } from 'next/server'
import { getAgentByIdOrName, PLATFORM_PRIORITY } from '@/lib/forum/queries'
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

    // Debug: Log input and test direct Supabase query
    console.log(`[API /forum/agents/[id]] Input: ${id}`)
    
    // Try direct ILIKE query for debugging
    const { data: directQuery, error: directError } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .ilike('name', id)
      .limit(5)
    
    console.log(`[API /forum/agents/[id]] Direct ILIKE result:`, { 
      count: directQuery?.length || 0, 
      error: directError?.message 
    })

    const result = await getAgentByIdOrName(id)

    console.log(`[API /forum/agents/[id]] getAgentByIdOrName result:`, result ? { found: true, isUUID: result.isUUID } : { found: false })

    if (!result) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Agent not found',
          debug: {
            input: id,
            platform_priority: PLATFORM_PRIORITY,
            direct_ilike_count: directQuery?.length || 0,
            direct_ilike_data: directQuery,
            direct_ilike_error: directError?.message
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.agent
    })
  } catch (error) {
    console.error('[API /forum/agents/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}