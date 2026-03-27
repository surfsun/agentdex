/**
 * Client-side Authentication Utilities
 * 
 * 管理前端认证状态，支持 Bearer token 认证方式。
 * 存储在 localStorage：
 * - agentId: agent_profiles.id
 * - agentName: agent name
 * - accessToken: at_xxx (24小时有效)
 * - apiKey: ak_xxx (长期有效，用于刷新 token)
 */

const STORAGE_KEYS = {
  AGENT_ID: 'agentId',
  AGENT_NAME: 'agentName',
  ACCESS_TOKEN: 'accessToken',
  API_KEY: 'apiKey',
  TOKEN_EXPIRES: 'tokenExpires',
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  const token = getAccessToken()
  return !!token && !isTokenExpired()
}

/**
 * 获取 Access Token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
}

/**
 * 获取 Agent ID
 */
export function getAgentId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.AGENT_ID)
}

/**
 * 获取 Agent Name
 */
export function getAgentName(): string | null {
  return localStorage.getItem(STORAGE_KEYS.AGENT_NAME)
}

/**
 * 检查 Token 是否过期
 */
export function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES)
  if (!expiresAt) return true
  
  const expiresDate = new Date(expiresAt)
  // 提前 5 分钟判定过期，避免边界问题
  const bufferMs = 5 * 60 * 1000
  return new Date().getTime() > expiresDate.getTime() - bufferMs
}

/**
 * 获取认证 Header
 * 
 * 优先使用 Bearer token，如果过期则返回 null
 */
export function getAuthHeaders(): Record<string, string> | null {
  const token = getAccessToken()
  
  if (!token) {
    return null
  }
  
  if (isTokenExpired()) {
    // Token 过期，清除并返回 null
    clearAuth()
    return null
  }
  
  return {
    'Authorization': `Bearer ${token}`,
  }
}

/**
 * 获取认证 Header (兼容旧方式)
 * 
 * 同时返回 Bearer token 和 X-Agent-Id
 */
export function getAuthHeadersLegacy(): Record<string, string> | null {
  const token = getAccessToken()
  const agentId = getAgentId()
  
  if (!agentId) {
    return null
  }
  
  const headers: Record<string, string> = {
    'X-Agent-Id': agentId,
  }
  
  // 如果有有效 token，添加 Bearer header
  if (token && !isTokenExpired()) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

/**
 * 存储认证信息
 */
export function storeAuth(data: {
  agentId: string
  agentName: string
  accessToken: string
  apiKey?: string
  expiresIn: number // 秒数
}): void {
  const expiresAt = new Date(Date.now() + data.expiresIn * 1000)
  
  localStorage.setItem(STORAGE_KEYS.AGENT_ID, data.agentId)
  localStorage.setItem(STORAGE_KEYS.AGENT_NAME, data.agentName)
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken)
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES, expiresAt.toISOString())
  
  if (data.apiKey) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, data.apiKey)
  }
}

/**
 * 清除认证信息
 */
export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEYS.AGENT_ID)
  localStorage.removeItem(STORAGE_KEYS.AGENT_NAME)
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES)
  // 保留 API Key，可用于重新获取 token
}

/**
 * 完全清除所有认证数据（包括 API Key）
 */
export function clearAllAuth(): void {
  localStorage.removeItem(STORAGE_KEYS.AGENT_ID)
  localStorage.removeItem(STORAGE_KEYS.AGENT_NAME)
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES)
  localStorage.removeItem(STORAGE_KEYS.API_KEY)
}

/**
 * 使用 API Key 刷新 Access Token
 * 
 * TODO: 需要实现 /api/agents/refresh-token API
 */
export async function refreshAccessToken(): Promise<boolean> {
  const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY)
  
  if (!apiKey) {
    return false
  }
  
  try {
    const res = await fetch('/api/agents/refresh-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.data?.access_token) {
        storeAuth({
          agentId: getAgentId() || '',
          agentName: getAgentName() || '',
          accessToken: data.data.access_token,
          expiresIn: data.data.expires_in,
        })
        return true
      }
    }
  } catch (error) {
    console.error('Failed to refresh token:', error)
  }
  
  return false
}

/**
 * 带认证的 fetch 封装
 * 
 * 自动添加 Authorization header，处理 token 过期
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = getAuthHeaders()
  
  if (!headers) {
    throw new Error('AUTH_REQUIRED')
  }
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...headers,
    },
  })
}