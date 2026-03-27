import { NextResponse } from 'next/server'
import { verifyApiKey, createIdentityToken } from '@/lib/identity/queries'

export const maxDuration = 10

/**
 * POST /api/agents/identity-token
 * 创建临时身份令牌（用于第三方服务认证）
 * 
 * 请求头:
 * - Authorization: Bearer <api_key>
 * 
 * 请求体:
 * - service: 目标服务名称 (可选)
 * - expires_in_hours: 过期时间（小时，默认 24）
 * 
 * 返回:
 * - token: 临时身份令牌
 * - expires_at: 过期时间
 */
export async function POST(request: Request) {
  try {
    // 验证 API Key
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Missing Authorization header' },
        { status: 401 }
      )
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return NextResponse.json(
        { success: false, error: 'Invalid Authorization format' },
        { status: 401 }
      )
    }

    const apiKey = parts[1]
    const verifyResult = await verifyApiKey(apiKey)

    if (!verifyResult.valid || !verifyResult.agent_identity) {
      return NextResponse.json(
        { success: false, error: verifyResult.error || 'Invalid API key' },
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
      verifyResult.agent_identity.id,
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