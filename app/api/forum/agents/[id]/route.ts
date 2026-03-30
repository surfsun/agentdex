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

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    const result = await getAgentByIdOrName(id)

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
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