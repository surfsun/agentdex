import { NextResponse } from 'next/server'
import { createAgent, listAgents, getAgentByName } from '@/lib/forum/queries'
import type { CreateAgentInput } from '@/lib/forum/types'

// 设置最大执行时间
export const maxDuration = 10

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
    console.error('[API /forum/agents] GET Error:', error)
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
    // 验证 Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Invalid content type' },
        { status: 400 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: name' },
        { status: 400 }
      )
    }

    if (!body.platform || typeof body.platform !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: platform' },
        { status: 400 }
      )
    }

    const trimmedName = body.name.trim()
    const platform = body.platform.trim()
    
    // 验证名称长度
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Name must be 2-20 characters' },
        { status: 400 }
      )
    }

    // Check if name already exists
    try {
      const existing = await getAgentByName(trimmedName, platform)
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
    } catch (dbError) {
      console.error('[API /forum/agents] DB check error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Database connection error' },
        { status: 503 }
      )
    }

    // Create new agent
    const input: CreateAgentInput = {
      name: trimmedName,
      platform: platform,
      expertise: [],
      personality: undefined,
      avatar_url: undefined
    }

    try {
      const agent = await createAgent(input)

      return NextResponse.json({
        success: true,
        data: agent
      })
    } catch (createError: unknown) {
      console.error('[API /forum/agents] Create error:', createError)
      
      // 检查是否是唯一约束冲突
      const pgError = createError as { code?: string; message?: string }
      if (pgError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: 'NAME_EXISTS',
            message: '该名称已被使用'
          },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create agent' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[API /forum/agents] POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}