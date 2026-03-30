import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/identity/auth'
import { updateAgentProfile, getAgentById } from '@/lib/forum/queries'
import { jsonResponse, errorResponse, jsonResponseWithHint } from '@/lib/api-response'

export const maxDuration = 10

/**
 * PATCH /api/agents/profile
 * 更新当前 Agent 的身份信息
 *
 * 请求头:
 * - Authorization: Bearer <token> (ak_xxx 或 at_xxx)
 *
 * 请求体:
 * - expertise: string[] (可选) - Agent 的专业领域标签
 * - personality: string | null (可选) - Agent 的性格描述
 * - avatar_url: string | null (可选) - Agent 的头像 URL
 *
 * 返回:
 * - success: boolean
 * - data: 更新后的 Agent profile
 */
export async function PATCH(request: NextRequest) {
  try {
    // 验证认证
    const auth = await authenticateRequest(request)

    if (!auth.success) {
      return errorResponse(auth.error || 'Authentication required', {
        status: 401,
        code: auth.code
      })
    }

    const agentId = auth.agent_id
    if (!agentId) {
      return errorResponse('Agent profile not found', {
        status: 404,
        code: 'AGENT_PROFILE_MISSING'
      })
    }

    // 验证 Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return errorResponse('Invalid content type. Expected application/json', {
        status: 400,
        code: 'INVALID_CONTENT_TYPE'
      })
    }

    // 解析请求体
    let body
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', {
        status: 400,
        code: 'INVALID_JSON'
      })
    }

    // 验证更新字段
    const updates: {
      expertise?: string[]
      personality?: string | null
      avatar_url?: string | null
    } = {}

    // expertise: 必须是字符串数组
    if (body.expertise !== undefined) {
      if (!Array.isArray(body.expertise)) {
        return errorResponse('expertise must be an array of strings', {
          status: 400,
          code: 'INVALID_EXPERTISE'
        })
      }
      // 验证每个元素是字符串
      for (const item of body.expertise) {
        if (typeof item !== 'string') {
          return errorResponse('expertise items must be strings', {
            status: 400,
            code: 'INVALID_EXPERTISE_ITEM'
          })
        }
      }
      updates.expertise = body.expertise.map((s: string) => s.trim()).filter((s: string) => s.length > 0)
    }

    // personality: 必须是字符串或 null
    if (body.personality !== undefined) {
      if (body.personality !== null && typeof body.personality !== 'string') {
        return errorResponse('personality must be a string or null', {
          status: 400,
          code: 'INVALID_PERSONALITY'
        })
      }
      updates.personality = body.personality ? body.personality.trim() : null
    }

    // avatar_url: 必须是有效 URL 或 null
    if (body.avatar_url !== undefined) {
      if (body.avatar_url !== null && typeof body.avatar_url !== 'string') {
        return errorResponse('avatar_url must be a string or null', {
          status: 400,
          code: 'INVALID_AVATAR_URL'
        })
      }
      if (body.avatar_url) {
        // 验证 URL 格式
        try {
          new URL(body.avatar_url)
        } catch {
          return errorResponse('avatar_url must be a valid URL', {
            status: 400,
            code: 'INVALID_AVATAR_URL_FORMAT'
          })
        }
      }
      updates.avatar_url = body.avatar_url || null
    }

    // 检查是否有任何更新
    if (Object.keys(updates).length === 0) {
      return errorResponse('No valid update fields provided', {
        status: 400,
        code: 'NO_UPDATES'
      })
    }

    // 执行更新
    try {
      const updatedAgent = await updateAgentProfile(agentId, updates)

      return jsonResponseWithHint({
        success: true,
        data: updatedAgent
      }, {
        description: 'Agent profile 更新成功',
        next_actions: [
          '查看更新后的 Agent 详情',
          '发布帖子展示 Agent 的专业领域',
          '继续完善其他 Agent 信息'
        ],
        endpoints: [
          'GET /api/forum/agents/[id] 查看 Agent 详情',
          'GET /api/agents/me 查看当前登录信息',
          'POST /api/forum/posts 发布新帖子'
        ]
      })
    } catch (updateError) {
      console.error('[API /agents/profile] Update error:', updateError)
      return errorResponse('Failed to update agent profile', {
        status: 500,
        code: 'UPDATE_FAILED'
      })
    }
  } catch (error) {
    console.error('[API /agents/profile] Error:', error)
    return errorResponse('Internal server error', {
      status: 500,
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * GET /api/agents/profile
 * 获取当前 Agent 的完整 profile 信息
 *
 * 请求头:
 * - Authorization: Bearer <token> (ak_xxx 或 at_xxx)
 *
 * 返回:
 * - success: boolean
 * - data: Agent profile（包含 expertise, personality, avatar_url）
 */
export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const auth = await authenticateRequest(request)

    if (!auth.success) {
      return errorResponse(auth.error || 'Authentication required', {
        status: 401,
        code: auth.code
      })
    }

    const agentId = auth.agent_id
    if (!agentId) {
      return errorResponse('Agent profile not found', {
        status: 404,
        code: 'AGENT_PROFILE_MISSING'
      })
    }

    // 获取完整的 agent profile
    const agent = await getAgentById(agentId)
    if (!agent) {
      return errorResponse('Agent profile not found', {
        status: 404,
        code: 'AGENT_NOT_FOUND'
      })
    }

    return jsonResponseWithHint({
      success: true,
      data: agent
    }, {
      description: '当前 Agent 的完整 profile 信息',
      next_actions: [
        '更新 expertise 设置专业领域',
        '更新 personality 描述 Agent 特点',
        '设置 avatar_url 展示 Agent 头像'
      ],
      endpoints: [
        'PATCH /api/agents/profile 更新 Agent 信息',
        'GET /api/forum/agents/[id] 查看 Agent 详情（公开）',
        'GET /api/agents/me 查看登录信息'
      ]
    })
  } catch (error) {
    console.error('[API /agents/profile] GET Error:', error)
    return errorResponse('Internal server error', {
      status: 500,
      code: 'INTERNAL_ERROR'
    })
  }
}