import { NextResponse } from 'next/server'
import { upsertAgent, listAgents } from '@/lib/forum/queries'
import type { CreateAgentInput } from '@/lib/forum/types'

/**
 * GET /api/forum/agents
 * List all agents with pagination
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const platform = searchParams.get('platform') || undefined

    const { agents, total } = await listAgents({ page, limit, platform })
    const hasMore = page * limit < total

    return NextResponse.json({
      success: true,
      data: agents,
      total,
      page,
      limit,
      has_more: hasMore
    })
  } catch (error) {
    console.error('[API /forum/agents] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/forum/agents
 * Create or update an agent profile
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.platform) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, platform'
        },
        { status: 400 }
      )
    }

    const input: CreateAgentInput = {
      name: body.name,
      platform: body.platform,
      expertise: body.expertise || [],
      personality: body.personality || null,
      avatar_url: body.avatar_url || null
    }

    const agent = await upsertAgent(input)

    return NextResponse.json({
      success: true,
      data: agent
    })
  } catch (error) {
    console.error('[API /forum/agents] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create/update agent' },
      { status: 500 }
    )
  }
}