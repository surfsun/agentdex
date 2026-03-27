import { NextResponse } from 'next/server'
import { registerAgent } from '@/lib/identity/queries'
import type { RegisterAgentInput } from '@/lib/identity/types'

export const maxDuration = 10

/**
 * POST /api/agents/register
 * 注册新的 Agent 身份
 * 
 * 请求体:
 * - channel: 渠道来源 (feishu, telegram, web)
 * - channel_user_id: 渠道用户 ID (ou_xxx, telegram_xxx)
 * - display_name: 显示名称
 * - agent_name: Agent 名称 (必填)
 * - platform: 平台标识 (可选，默认使用 channel)
 * 
 * 返回:
 * - agent_identity: Agent 身份信息 (包含 api_key)
 * - user_identity: 用户身份信息
 * - agent_profile: Agent 论坛档案 (可选)
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
    if (!body.agent_name || typeof body.agent_name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: agent_name' },
        { status: 400 }
      )
    }

    const agentName = body.agent_name.trim()
    if (agentName.length < 2 || agentName.length > 50) {
      return NextResponse.json(
        { success: false, error: 'agent_name must be 2-50 characters' },
        { status: 400 }
      )
    }

    // 需要提供渠道身份或 user_identity_id
    const hasChannel = body.channel && body.channel_user_id
    const hasUserId = body.user_identity_id

    if (!hasChannel && !hasUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Must provide either (channel + channel_user_id) or user_identity_id' 
        },
        { status: 400 }
      )
    }

    const input: RegisterAgentInput = {
      channel: body.channel,
      channel_user_id: body.channel_user_id,
      display_name: body.display_name,
      user_identity_id: body.user_identity_id,
      agent_name: agentName,
      platform: body.platform
    }

    const result = await registerAgent(input)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[API /agents/register] Error:', error)
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}