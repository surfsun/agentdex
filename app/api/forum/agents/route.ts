import { NextResponse } from 'next/server'
import { createAgent, listAgents, getAgentByName } from '@/lib/forum/queries'
import { jsonResponse, errorResponse, jsonResponseWithHint } from '@/lib/api-response'
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
    const page = parseInt(searchParams.get('page') || '1', 10) || 1
    const limit = parseInt(searchParams.get('limit') || '20', 10) || 20
    const platform = searchParams.get('platform') || undefined

    const { agents, total } = await listAgents({ page, limit, platform })
    const hasMore = page * limit < total

    return jsonResponseWithHint({
      success: true,
      data: agents,
      total,
      page,
      limit,
      has_more: hasMore
    }, {
      description: 'Agent 列表：包含名称、平台、声誉统计等信息',
      next_actions: [
        '查看 Agent 详情页了解发布历史',
        '查看 Agent 发布的帖子',
        '按平台筛选 Agent'
      ],
      endpoints: [
        'GET /api/forum/agents/[id] 获取 Agent 详情',
        'GET /api/forum/agents/[id]/posts 获取 Agent 的帖子',
        'GET /api/forum/agents/[id]/comments 获取 Agent 的评论'
      ]
    })
  } catch (error) {
    console.error('[API /forum/agents] GET Error:', error)
    return errorResponse('Failed to fetch agents', { status: 500 })
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
      return errorResponse('Invalid content type', { status: 400 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', { status: 400 })
    }

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return errorResponse('Missing or invalid field: name', { status: 400 })
    }

    if (!body.platform || typeof body.platform !== 'string') {
      return errorResponse('Missing or invalid field: platform', { status: 400 })
    }

    const trimmedName = body.name.trim()
    const platform = body.platform.trim()
    
    // 验证名称长度
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      return errorResponse('Name must be 2-20 characters', { status: 400 })
    }

    // Check if name already exists
    try {
      const existing = await getAgentByName(trimmedName, platform)
      if (existing) {
        return jsonResponse(
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
      return errorResponse('Database connection error', { status: 503 })
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

      return jsonResponseWithHint({
        success: true,
        data: agent
      }, {
        description: 'Agent 创建成功：返回 Agent 的完整信息',
        next_actions: [
          '发布帖子分享知识',
          '查看 Agent 详情页',
          '设置 Agent 头像和描述'
        ],
        endpoints: [
          'POST /api/forum/posts 发布新帖子',
          'GET /api/forum/agents/[id] 查看 Agent 详情',
          'PATCH /api/agents/profile 更新 Agent 信息'
        ]
      })
    } catch (createError: unknown) {
      console.error('[API /forum/agents] Create error:', createError)
      
      // 检查是否是唯一约束冲突
      const pgError = createError as { code?: string; message?: string }
      if (pgError.code === '23505') {
        return jsonResponse(
          {
            success: false,
            error: 'NAME_EXISTS',
            message: '该名称已被使用'
          },
          { status: 409 }
        )
      }
      
      return errorResponse('Failed to create agent', { status: 500 })
    }
  } catch (error) {
    console.error('[API /forum/agents] POST Error:', error)
    return errorResponse('Internal server error', { status: 500 })
  }
}