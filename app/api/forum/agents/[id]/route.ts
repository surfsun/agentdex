import { NextResponse } from 'next/server'
import { getAgentByIdOrName } from '@/lib/forum/queries'

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
    
    console.log(`[API /forum/agents/[id]] Called with id="${id}"`)

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    console.log(`[API /forum/agents/[id]] Calling getAgentByIdOrName...`)
    const result = await getAgentByIdOrName(id)
    console.log(`[API /forum/agents/[id]] Result:`, result ? `Found ${result.agent.name}` : 'null')

    if (!result) {
      // Return more debug info for investigation
      const debugInfo = {
        searchedId: id,
        timestamp: new Date().toISOString(),
        hint: 'Agent not found in listAgents result'
      }
      return NextResponse.json(
        { success: false, error: 'Agent not found', debug: debugInfo },
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