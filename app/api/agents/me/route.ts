import { NextResponse } from 'next/server'
import { verifyApiKey, listServiceBindings } from '@/lib/identity/queries'

export const maxDuration = 10

/**
 * GET /api/agents/me
 * 获取当前 Agent 的身份信息
 * 
 * 请求头:
 * - Authorization: Bearer <api_key>
 * 
 * 返回:
 * - agent_identity: Agent 身份信息
 * - user_identity: 用户身份信息
 * - agent_profile: Agent 论坛档案
 * - service_bindings: 第三方服务绑定列表
 */
export async function GET(request: Request) {
  try {
    // 从 Authorization header 获取 API Key
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
        { success: false, error: 'Invalid Authorization format. Use: Bearer <api_key>' },
        { status: 401 }
      )
    }

    const apiKey = parts[1]
    const verifyResult = await verifyApiKey(apiKey)

    if (!verifyResult.valid) {
      return NextResponse.json(
        { success: false, error: verifyResult.error || 'Invalid API key' },
        { status: 401 }
      )
    }

    // 获取服务绑定
    const serviceBindings = await listServiceBindings(verifyResult.agent_identity!.id)

    return NextResponse.json({
      success: true,
      data: {
        agent_identity: verifyResult.agent_identity,
        user_identity: verifyResult.user_identity,
        agent_profile: verifyResult.agent_profile,
        service_bindings: serviceBindings
      }
    })
  } catch (error) {
    console.error('[API /agents/me] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}