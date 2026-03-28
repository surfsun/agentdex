/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/agents/identity-token/route'
import { NextRequest } from 'next/server'

// Mock auth and queries
vi.mock('@/lib/identity/auth', () => ({
  authenticateRequest: vi.fn()
}))

vi.mock('@/lib/identity/queries', () => ({
  createIdentityToken: vi.fn()
}))

import { authenticateRequest } from '@/lib/identity/auth'
import { createIdentityToken } from '@/lib/identity/queries'

// Helper: 创建 NextRequest
function createRequest(body?: unknown, headers?: Record<string, string>): NextRequest {
  const req = new NextRequest('http://localhost/api/agents/identity-token', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  })
  return req
}

// Helper: 创建带 Authorization header 的请求
function createAuthRequest(token: string, body?: unknown): NextRequest {
  return createRequest(body, { authorization: `Bearer ${token}` })
}

describe('/api/agents/identity-token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('认证验证', () => {
    it('拒绝无 Authorization header', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Missing Authorization header'
      })

      const req = createRequest()
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing Authorization header')
    })

    it('拒绝无效的 Bearer token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Invalid token'
      })

      const req = createAuthRequest('invalid_token')
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid token')
    })

    it('拒绝过期 token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Token expired'
      })

      const req = createAuthRequest('at_expired')
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Token expired')
    })
  })

  describe('成功创建令牌', () => {
    it('使用默认参数创建令牌', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: {
          id: 'agent-123',
          agent_name: 'TestAgent',
          agent_slug: 'test-agent'
        }
      })

      vi.mocked(createIdentityToken).mockResolvedValue({
        id: 'token-123',
        token: 'it_newtoken123',
        token_type: 'identity',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

      const req = createAuthRequest('at_valid')
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.token).toBe('it_newtoken123')
      expect(data.data.token_type).toBe('identity')
      expect(createIdentityToken).toHaveBeenCalledWith('agent-123', 24, undefined)
    })

    it('指定 expires_in_hours', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: {
          id: 'agent-456',
          agent_name: 'TestAgent'
        }
      })

      vi.mocked(createIdentityToken).mockResolvedValue({
        id: 'token-456',
        token: 'it_newtoken456',
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      })

      const req = createAuthRequest('at_valid', { expires_in_hours: 48 })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(createIdentityToken).toHaveBeenCalledWith('agent-456', 48, undefined)
    })

    it('指定 service 参数', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: {
          id: 'agent-789',
          agent_name: 'TestAgent'
        }
      })

      vi.mocked(createIdentityToken).mockResolvedValue({
        id: 'token-789',
        token: 'it_newtoken789',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

      const req = createAuthRequest('at_valid', { service: 'external-service' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(createIdentityToken).toHaveBeenCalledWith('agent-789', 24, 'external-service')
    })

    it('同时指定 expires_in_hours 和 service', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: {
          id: 'agent-full',
          agent_name: 'TestAgent'
        }
      })

      vi.mocked(createIdentityToken).mockResolvedValue({
        id: 'token-full',
        token: 'it_fulltoken',
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      })

      const req = createAuthRequest('at_valid', {
        expires_in_hours: 72,
        service: 'custom-service'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(createIdentityToken).toHaveBeenCalledWith('agent-full', 72, 'custom-service')
    })
  })

  describe('expires_in_hours 边界处理', () => {
    it('最小值限制为 1 小时', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-min' }
      })

      vi.mocked(createIdentityToken).mockResolvedValue({
        token: 'it_min',
        expires_at: new Date().toISOString()
      })

      const req = createAuthRequest('at_valid', { expires_in_hours: 0 })
      const res = await POST(req)

      expect(createIdentityToken).toHaveBeenCalledWith('agent-min', 1, undefined)
    })

    it('最大值限制为 168 小时（7天）', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-max' }
      })

      vi.mocked(createIdentityToken).mockResolvedValue({
        token: 'it_max',
        expires_at: new Date().toISOString()
      })

      const req = createAuthRequest('at_valid', { expires_in_hours: 200 })
      const res = await POST(req)

      expect(createIdentityToken).toHaveBeenCalledWith('agent-max', 168, undefined)
    })

    it('处理负数', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-neg' }
      })

      vi.mocked(createIdentityToken).mockResolvedValue({
        token: 'it_neg',
        expires_at: new Date().toISOString()
      })

      const req = createAuthRequest('at_valid', { expires_in_hours: -5 })
      const res = await POST(req)

      expect(createIdentityToken).toHaveBeenCalledWith('agent-neg', 1, undefined)
    })

    it('处理非数字类型', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-str' }
      })

      vi.mocked(createIdentityToken).mockResolvedValue({
        token: 'it_str',
        expires_at: new Date().toISOString()
      })

      const req = createAuthRequest('at_valid', { expires_in_hours: 'not a number' })
      const res = await POST(req)

      // 非数字时使用默认值 24
      expect(createIdentityToken).toHaveBeenCalledWith('agent-str', 24, undefined)
    })
  })

  describe('请求体处理', () => {
    it('处理空 body', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-empty' }
      })

      vi.mocked(createIdentityToken).mockResolvedValue({
        token: 'it_empty',
        expires_at: new Date().toISOString()
      })

      const req = createAuthRequest('at_valid')
      const res = await POST(req)

      expect(createIdentityToken).toHaveBeenCalledWith('agent-empty', 24, undefined)
    })

    it('处理无效 JSON body（优雅忽略）', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-invalid' }
      })

      vi.mocked(createIdentityToken).mockResolvedValue({
        token: 'it_invalid',
        expires_at: new Date().toISOString()
      })

      // 创建一个带无效 JSON body 的请求
      const req = new NextRequest('http://localhost/api/agents/identity-token', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer at_valid',
          'content-type': 'application/json'
        },
        body: 'not valid json'
      })
      const res = await POST(req)

      // 无效 JSON 应被优雅忽略，使用默认值
      expect(createIdentityToken).toHaveBeenCalledWith('agent-invalid', 24, undefined)
    })
  })

  describe('错误处理', () => {
    it('处理 createIdentityToken 失败', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-error' }
      })

      vi.mocked(createIdentityToken).mockRejectedValue(new Error('Database error'))

      const req = createAuthRequest('at_valid')
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('处理非 Error 类型异常', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-string-error' }
      })

      vi.mocked(createIdentityToken).mockRejectedValue('string error')

      const req = createAuthRequest('at_valid')
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('响应格式验证', () => {
    it('成功响应包含完整字段', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-format' }
      })

      vi.mocked(createIdentityToken).mockResolvedValue({
        token: 'it_format',
        expires_at: '2026-03-30T00:00:00Z'
      })

      const req = createAuthRequest('at_valid')
      const res = await POST(req)
      const data = await res.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('token')
      expect(data.data).toHaveProperty('expires_at')
      expect(data.data).toHaveProperty('token_type', 'identity')
    })
  })

  describe('API Key vs Access Token', () => {
    it('API Key (ak_xxx) 可用于创建 identity token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-ak' }
      })

      vi.mocked(createIdentityToken).mockResolvedValue({
        token: 'it_ak',
        expires_at: new Date().toISOString()
      })

      const req = createAuthRequest('ak_testapikey')
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('Access Token (at_xxx) 可用于创建 identity token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-at' }
      })

      vi.mocked(createIdentityToken).mockResolvedValue({
        token: 'it_at',
        expires_at: new Date().toISOString()
      })

      const req = createAuthRequest('at_testaccesstoken')
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})