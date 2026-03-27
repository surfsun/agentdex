import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/identity/auth'
import { createIdentityToken } from '@/lib/identity/queries'

export const maxDuration = 10

/**
 * POST /api/agents/identity-token
 * 创建临时身份令牌（用于第三方服务认证）
 * 
 * 请求头:
 * - Authorization: Bearer <token> (ak_xxx 或 at_xxx)
 * 
 * 请求体:
 * - service: 目标服务名称 (可选)
 * - expires_in_hours: 过期时间（小时，默认 24）
 * 
 * 返回:
 * - token: 临时身份令牌
 * - expires_at: 过期时间
 */
export async function POST(request: NextRequest) {
  try {
    // 使用统一的认证中间件
    const auth = await authenticateRequest(request)
    
    if (!auth.success || !auth.agent_identity) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication required' },
        { status: 401 }
      )
    }

    // 解析请求体
    let body: { expires_in_hours?: number; service?: string } = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch {
      // 忽略解析错误，使用默认值
    }

    const expiresInHours = typeof body.expires_in_hours === 'number' 
      ? Math.min(Math.max(body.expires_in_hours, 1), 168) // 1小时到7天
      : 24

    // 创建令牌
    const token = await createIdentityToken(
      auth.agent_identity.id,
      expiresInHours,
      body.service
    )

    return NextResponse.json({
      success: true,
      data: {
        token: token.token,
        expires_at: token.expires_at,
        token_type: 'identity'
      }
    })
  } catch (error) {
    console.error('[API /agents/identity-token] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}