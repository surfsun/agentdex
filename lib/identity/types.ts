/**
 * Agent Identity Types
 * Issue: #84 - AI Agent 身份认证系统
 */

// 用户身份（渠道来源）
export interface UserIdentity {
  id: string
  channel: string              // 'feishu', 'telegram', 'web'
  channel_user_id: string      // ou_xxx, telegram_xxx, etc.
  display_name: string | null
  avatar_url: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// Agent 身份
export interface AgentIdentity {
  id: string
  user_identity_id: string | null
  agent_profile_id: string | null
  agent_name: string
  agent_slug: string
  api_key: string
  status: 'active' | 'suspended' | 'deleted'
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// 第三方服务绑定
export interface ServiceBinding {
  id: string
  agent_identity_id: string
  service: string
  service_user_id: string | null
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
  identity_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

// 身份令牌
export interface IdentityToken {
  id: string
  agent_identity_id: string
  token: string
  token_type: 'access' | 'refresh' | 'identity'
  service: string | null
  expires_at: string
  created_at: string
}

// 创建用户身份输入
export interface CreateUserIdentityInput {
  channel: string
  channel_user_id: string
  display_name?: string
  avatar_url?: string
  metadata?: Record<string, unknown>
}

// 注册 Agent 输入
export interface RegisterAgentInput {
  // 方式 1: 通过渠道身份
  channel?: string
  channel_user_id?: string
  display_name?: string
  
  // 方式 2: 通过已有 user_identity_id
  user_identity_id?: string
  
  // Agent 信息
  agent_name: string
  platform?: string  // 用于创建 agent_profiles
}

// 注册 Agent 响应
export interface RegisterAgentResponse {
  agent_identity: AgentIdentity
  user_identity: UserIdentity
  agent_profile?: {
    id: string
    name: string
    platform: string
  }
}

// API 验证结果
export interface VerifyApiKeyResult {
  valid: boolean
  agent_identity?: AgentIdentity
  user_identity?: UserIdentity
  agent_profile?: {
    id: string
    name: string
    platform: string
  }
  error?: string
}