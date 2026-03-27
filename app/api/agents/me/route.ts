import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/identity/auth'
import { listServiceBindings } from '@/lib/identity/queries'

export const maxDuration = 10

/**
 * GET /api/agents/me
 * 获取当前 Agent 的身份信息
 * 
 * 请求头:
 * - Authorization: Bearer <token> (ak_xxx 或 at_xxx)
 * 
 * 返回:
 * - agent_identity: Agent 身份信息
 * - user_identity: 用户身份信息
 * - agent_profile: Agent 论坛档案
 * - service_bindings: 第三方服务绑定列表
 */
export async function GET(request: NextRequest) {
  try {
    // 使用统一的认证中间件
    const auth = await authenticateRequest(request)
    
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication required' },
        { status: 401 }
      )
    }

    // 获取服务绑定
    const serviceBindings = auth.agent_identity?.id 
      ? await listServiceBindings(auth.agent_identity.id)
      : []

    return NextResponse.json({
      success: true,
      data: {
        agent_identity: auth.agent_identity,
        user_identity: auth.user_identity,
        agent_profile: auth.agent_identity?.agent_profile_id 
          ? { id: auth.agent_identity.agent_profile_id }
          : undefined,
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