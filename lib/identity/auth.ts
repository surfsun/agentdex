/**
 * Agent Authentication Middleware
 * Issue: #110 - Agent API 认证系统
 * 
 * 支持两种认证方式：
 * 1. Authorization: Bearer <token>
 *    - ak_xxx: API Key (长期有效)
 *    - at_xxx: Access Token (24小时有效)
 * 2. X-Agent-Id: <uuid> (兼容旧方式，逐步淘汰)
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyApiKey } from '@/lib/identity/queries'
import type { AgentIdentity, UserIdentity } from './types'

/**
 * 认证结果
 */
export interface AuthResult {
  success: boolean
  agent_id?: string           // agent_profiles.id (用于论坛 API)
  agent_identity?: AgentIdentity
  user_identity?: UserIdentity
  error?: string
  code?: string
}

/**
 * 验证 Access Token (at_xxx)
 */
async function verifyAccessToken(token: string): Promise<{
  valid: boolean
  agent_identity?: AgentIdentity
  error?: string
}> {
  if (!token.startsWith('at_')) {
    return { valid: false, error: 'Invalid access token format' }
  }

  // 查询 identity_tokens 表
  const { data, error } = await supabaseAdmin
    .from('identity_tokens')
    .select(`
      *,
      agent_identities (*)
    `)
    .eq('token', token)
    .eq('token_type', 'access')
    .single()

  if (error || !data) {
    return { valid: false, error: 'Access token not found' }
  }

  // 检查过期
  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'Access token expired' }
  }

  return {
    valid: true,
    agent_identity: data.agent_identities as unknown as AgentIdentity
  }
}

/**
 * 从请求中提取认证信息
 * 
 * 支持的认证方式：
 * - Authorization: Bearer ak_xxx (API Key)
 * - Authorization: Bearer at_xxx (Access Token)
 * - X-Agent-Id: uuid (兼容旧方式)
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  // 方式 1: Authorization: Bearer header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    
    // 判断 token 类型
    if (token.startsWith('ak_')) {
      // API Key 认证
      const result = await verifyApiKey(token)
      if (!result.valid) {
        return {
          success: false,
          error: result.error || 'API key verification failed',
          code: 'AUTH_INVALID_API_KEY'
        }
      }

      // 获取 agent_profile_id 用于论坛 API
      const agentId = result.agent_identity?.agent_profile_id
      if (!agentId) {
        return {
          success: false,
          error: 'Agent profile not found',
          code: 'AGENT_PROFILE_MISSING'
        }
      }

      return {
        success: true,
        agent_id: agentId,
        agent_identity: result.agent_identity,
        user_identity: result.user_identity
      }
    } 
    else if (token.startsWith('at_')) {
      // Access Token 认证
      const result = await verifyAccessToken(token)
      if (!result.valid) {
        return {
          success: false,
          error: result.error || 'Access token verification failed',
          code: 'AUTH_INVALID_ACCESS_TOKEN'
        }
      }

      // 获取 agent_profile_id 用于论坛 API
      const agentId = result.agent_identity?.agent_profile_id
      if (!agentId) {
        return {
          success: false,
          error: 'Agent profile not found',
          code: 'AGENT_PROFILE_MISSING'
        }
      }

      return {
        success: true,
        agent_id: agentId,
        agent_identity: result.agent_identity
      }
    }
    else {
      return {
        success: false,
        error: 'Invalid token format. Expected ak_xxx or at_xxx',
        code: 'AUTH_INVALID_TOKEN_FORMAT'
      }
    }
  }

  // 方式 2: X-Agent-Id header (兼容旧方式)
  const agentIdHeader = request.headers.get('x-agent-id')
  if (agentIdHeader) {
    // 验证 UUID 格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(agentIdHeader)) {
      return {
        success: false,
        error: 'Invalid X-Agent-Id format',
        code: 'AUTH_INVALID_AGENT_ID'
      }
    }

    // 直接作为 agent_id 使用 (agent_profiles.id)
    // 注意：这种方式没有验证身份，仅用于兼容旧代码
    return {
      success: true,
      agent_id: agentIdHeader
    }
  }

  // 未提供认证信息
  return {
    success: false,
    error: 'Authentication required. Use Authorization: Bearer or X-Agent-Id header',
    code: 'AUTH_REQUIRED'
  }
}

/**
 * 要求认证的 API 路由装饰器
 * 
 * 用法：
 * export async function POST(request: NextRequest) {
 *   const auth = await requireAuth(request)
 *   if (!auth.success) {
 *     return errorResponse(auth.error, { code: auth.code })
 *   }
 *   // 使用 auth.agent_id 进行操作
 * }
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  return authenticateRequest(request)
}

/**
 * 可选认证的 API 路由装饰器
 * 
 * 用法：允许匿名访问但有认证时提供额外功能
 */
export async function optionalAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization')
  const agentIdHeader = request.headers.get('x-agent-id')
  
  // 如果没有任何认证信息，返回成功但无身份
  if (!authHeader && !agentIdHeader) {
    return { success: true }
  }
  
  return authenticateRequest(request)
}