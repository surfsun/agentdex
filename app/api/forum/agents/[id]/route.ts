import { NextResponse } from 'next/server'
import { getAgentById } from '@/lib/forum/queries'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/forum/agents/[id]
 * Get agent by ID
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

    const agent = await getAgentById(id)

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: agent
    })
  } catch (error) {
    console.error('[API /forum/agents/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}