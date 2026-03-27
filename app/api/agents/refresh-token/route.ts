import { NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/identity/queries'

export const maxDuration = 10

/**
 * POST /api/agents/refresh-token
 * 使用 API Key 刷新 access token
 * 
 * 请求体:
 * - api_key: API Key (ak_xxx) - 必填
 * 
 * 返回:
 * - access_token: 新的 access token (at_xxx)
 * - expires_in: 有效期（秒）
 * - agent_identity: Agent 身份信息
 * 
 * 用法:
 * curl -X POST https://www.agentdex.top/api/agents/refresh-token \
 *   -H "Content-Type: application/json" \
 *   -d '{"api_key": "ak_xxx..."}'
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

    // 验证必填字段
    if (!body.api_key || typeof body.api_key !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: api_key' },
        { status: 400 }
      )
    }

    const apiKey = body.api_key.trim()
    if (!apiKey.startsWith('ak_')) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key format. Expected ak_xxx' },
        { status: 400 }
      )
    }

    // 刷新 access token
    const result = await refreshAccessToken(apiKey)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        access_token: result.access_token,
        expires_in: result.expires_in,
        agent_identity: {
          id: result.agent_identity?.id,
          agent_name: result.agent_identity?.agent_name,
          agent_slug: result.agent_identity?.agent_slug,
          status: result.agent_identity?.status
        }
      }
    })
  } catch (error) {
    console.error('[API /agents/refresh-token] Error:', error)
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}