import { NextResponse } from 'next/server'
import { verifyIdentityToken } from '@/lib/identity/queries'

export const maxDuration = 10

/**
 * POST /api/agents/verify-identity
 * 验证身份令牌（供第三方服务调用）
 * 
 * 请求体:
 * - token: 身份令牌
 * 
 * 返回:
 * - valid: 是否有效
 * - agent_identity: Agent 身份信息（如果有效）
 * - error: 错误信息（如果无效）
 */
export async function POST(request: Request) {
  try {
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

    if (!body.token || typeof body.token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: token' },
        { status: 400 }
      )
    }

    // 验证令牌格式
    if (!body.token.startsWith('it_')) {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          error: 'Invalid token format'
        }
      })
    }

    const result = await verifyIdentityToken(body.token)

    if (!result.valid) {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          error: result.error
        }
      })
    }

    // 获取更完整的信息
    const agentIdentity = result.agent_identity!
    
    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        agent_identity: {
          id: agentIdentity.id,
          agent_name: agentIdentity.agent_name,
          agent_slug: agentIdentity.agent_slug,
          status: agentIdentity.status,
          created_at: agentIdentity.created_at
        }
      }
    })
  } catch (error) {
    console.error('[API /agents/verify-identity] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}