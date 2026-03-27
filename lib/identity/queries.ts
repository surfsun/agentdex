/**
 * Agent Identity Queries
 * Issue: #84 - AI Agent 身份认证系统
 */

import { supabaseAdmin } from '@/lib/supabase'
import { createAgent, getAgentByName } from '@/lib/forum/queries'
import type {
  UserIdentity,
  AgentIdentity,
  ServiceBinding,
  IdentityToken,
  CreateUserIdentityInput,
  RegisterAgentInput,
  RegisterAgentResponse,
  VerifyApiKeyResult
} from './types'

// ==================== User Identities ====================

/**
 * 创建或获取用户身份
 */
export async function upsertUserIdentity(input: CreateUserIdentityInput): Promise<UserIdentity> {
  const { data, error } = await supabaseAdmin
    .from('user_identities')
    .upsert({
      channel: input.channel,
      channel_user_id: input.channel_user_id,
      display_name: input.display_name || null,
      avatar_url: input.avatar_url || null,
      metadata: input.metadata || {}
    }, {
      onConflict: 'channel,channel_user_id'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 通过 ID 获取用户身份
 */
export async function getUserIdentityById(id: string): Promise<UserIdentity | null> {
  const { data, error } = await supabaseAdmin
    .from('user_identities')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

/**
 * 通过渠道身份获取用户
 */
export async function getUserIdentityByChannel(
  channel: string,
  channelUserId: string
): Promise<UserIdentity | null> {
  const { data, error } = await supabaseAdmin
    .from('user_identities')
    .select('*')
    .eq('channel', channel)
    .eq('channel_user_id', channelUserId)
    .single()

  if (error) return null
  return data
}

// ==================== Agent Identities ====================

/**
 * 生成 API Key
 */
function generateApiKey(): string {
  return 'ak_' + Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 36).toString(36)
  ).join('')
}

/**
 * 注册新 Agent
 */
export async function registerAgent(input: RegisterAgentInput): Promise<RegisterAgentResponse> {
  // 1. 获取或创建用户身份
  let userIdentity: UserIdentity
  
  if (input.user_identity_id) {
    const existing = await getUserIdentityById(input.user_identity_id)
    if (!existing) {
      throw new Error('User identity not found')
    }
    userIdentity = existing
  } else if (input.channel && input.channel_user_id) {
    userIdentity = await upsertUserIdentity({
      channel: input.channel,
      channel_user_id: input.channel_user_id,
      display_name: input.display_name
    })
  } else {
    throw new Error('Must provide either user_identity_id or channel + channel_user_id')
  }

  // 2. 创建 agent_profiles（用于论坛）
  let agentProfile: { id: string; name: string; platform: string } | undefined
  const platform = input.platform || input.channel || 'unknown'
  
  // 检查是否已存在同名 agent
  const existingProfile = await getAgentByName(input.agent_name, platform)
  if (existingProfile) {
    agentProfile = {
      id: existingProfile.id,
      name: existingProfile.name,
      platform: existingProfile.platform
    }
  } else {
    const profile = await createAgent({
      name: input.agent_name,
      platform: platform
    })
    agentProfile = {
      id: profile.id,
      name: profile.name,
      platform: profile.platform
    }
  }

  // 3. 创建 agent_identities
  const api_key = generateApiKey()
  
  const { data: agentIdentity, error } = await supabaseAdmin
    .from('agent_identities')
    .insert({
      user_identity_id: userIdentity.id,
      agent_profile_id: agentProfile?.id || null,
      agent_name: input.agent_name,
      agent_slug: await generateUniqueSlug(input.agent_name),
      api_key: api_key,
      status: 'active'
    })
    .select()
    .single()

  if (error) throw error

  return {
    agent_identity: agentIdentity,
    user_identity: userIdentity,
    agent_profile: agentProfile
  }
}

/**
 * 生成唯一的 agent_slug
 */
async function generateUniqueSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20)
  
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base}-${suffix}`
}

/**
 * 通过 API Key 获取 Agent Identity
 */
export async function getAgentIdentityByApiKey(apiKey: string): Promise<AgentIdentity | null> {
  const { data, error } = await supabaseAdmin
    .from('agent_identities')
    .select('*')
    .eq('api_key', apiKey)
    .eq('status', 'active')
    .single()

  if (error) return null
  return data
}

/**
 * 通过 ID 获取 Agent Identity
 */
export async function getAgentIdentityById(id: string): Promise<AgentIdentity | null> {
  const { data, error } = await supabaseAdmin
    .from('agent_identities')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

/**
 * 通过用户身份获取所有 Agent Identities
 */
export async function listAgentIdentitiesByUser(userId: string): Promise<AgentIdentity[]> {
  const { data, error } = await supabaseAdmin
    .from('agent_identities')
    .select('*')
    .eq('user_identity_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

// ==================== API Key Verification ====================

/**
 * 验证 API Key 并返回完整的身份信息
 */
export async function verifyApiKey(apiKey: string): Promise<VerifyApiKeyResult> {
  if (!apiKey || !apiKey.startsWith('ak_')) {
    return { valid: false, error: 'Invalid API key format' }
  }

  const agentIdentity = await getAgentIdentityByApiKey(apiKey)
  if (!agentIdentity) {
    return { valid: false, error: 'API key not found or inactive' }
  }

  // 获取用户身份
  let userIdentity: UserIdentity | null = null
  if (agentIdentity.user_identity_id) {
    userIdentity = await getUserIdentityById(agentIdentity.user_identity_id)
  }

  // 获取 agent profile
  let agentProfile: { id: string; name: string; platform: string } | undefined
  if (agentIdentity.agent_profile_id) {
    const { data: profile } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .eq('id', agentIdentity.agent_profile_id)
      .single()
    
    if (profile) {
      agentProfile = profile
    }
  }

  return {
    valid: true,
    agent_identity: agentIdentity,
    user_identity: userIdentity || undefined,
    agent_profile: agentProfile
  }
}

// ==================== Service Bindings ====================

/**
 * 创建或更新服务绑定
 */
export async function upsertServiceBinding(
  agentIdentityId: string,
  service: string,
  data: Partial<ServiceBinding>
): Promise<ServiceBinding> {
  const { data: result, error } = await supabaseAdmin
    .from('service_bindings')
    .upsert({
      agent_identity_id: agentIdentityId,
      service: service,
      service_user_id: data.service_user_id || null,
      access_token: data.access_token || null,
      refresh_token: data.refresh_token || null,
      expires_at: data.expires_at || null,
      identity_data: data.identity_data || {}
    }, {
      onConflict: 'agent_identity_id,service'
    })
    .select()
    .single()

  if (error) throw error
  return result
}

/**
 * 获取 Agent 的所有服务绑定
 */
export async function listServiceBindings(agentIdentityId: string): Promise<ServiceBinding[]> {
  const { data, error } = await supabaseAdmin
    .from('service_bindings')
    .select('*')
    .eq('agent_identity_id', agentIdentityId)

  if (error) return []
  return data
}

// ==================== Identity Tokens ====================

/**
 * 创建身份令牌
 */
export async function createIdentityToken(
  agentIdentityId: string,
  expiresInHours: number = 24,
  service?: string
): Promise<IdentityToken> {
  const token = 'it_' + Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 36).toString(36)
  ).join('')

  const { data, error } = await supabaseAdmin
    .from('identity_tokens')
    .insert({
      agent_identity_id: agentIdentityId,
      token: token,
      token_type: 'identity',
      service: service || null,
      expires_at: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 验证身份令牌
 */
export async function verifyIdentityToken(token: string): Promise<{
  valid: boolean
  agent_identity?: AgentIdentity
  error?: string
}> {
  const { data, error } = await supabaseAdmin
    .from('identity_tokens')
    .select(`
      *,
      agent_identities (*)
    `)
    .eq('token', token)
    .single()

  if (error || !data) {
    return { valid: false, error: 'Token not found' }
  }

  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'Token expired' }
  }

  return {
    valid: true,
    agent_identity: data.agent_identities as unknown as AgentIdentity
  }
}

/**
 * 清理过期令牌
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const { error } = await supabaseAdmin.rpc('cleanup_expired_tokens')
  if (error) {
    console.error('Failed to cleanup expired tokens:', error)
    return 0
  }
  return 1
}