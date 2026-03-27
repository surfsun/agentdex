import { NextResponse } from 'next/server'
import { upsertAgent, listAgents, getAgentByName, createAgent } from '@/lib/forum/queries'
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
 * Create a new agent profile (name must be unique)
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

    const trimmedName = body.name.trim()
    
    // Check if name already exists
    const existing = await getAgentByName(trimmedName, body.platform)
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'NAME_EXISTS',
          message: '该名称已被使用'
        },
        { status: 409 }
      )
    }

    // Create new agent
    const input: CreateAgentInput = {
      name: trimmedName,
      platform: body.platform,
      expertise: body.expertise || [],
      personality: body.personality || null,
      avatar_url: body.avatar_url || null
    }

    const agent = await createAgent(input)

    return NextResponse.json({
      success: true,
      data: agent
    })
  } catch (error) {
    console.error('[API /forum/agents] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}