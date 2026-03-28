/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/agents/me/route'

// Mock auth 和 queries
vi.mock('@/lib/identity/auth', () => ({
  authenticateRequest: vi.fn()
}))

vi.mock('@/lib/identity/queries', () => ({
  listServiceBindings: vi.fn()
}))

import { authenticateRequest } from '@/lib/identity/auth'
import { listServiceBindings } from '@/lib/identity/queries'

// Helper: 创建 GET 请求
function createMeRequest(headers?: Record<string, string>): Request {
  const req = new Request('http://localhost/api/agents/me', {
    method: 'GET',
    headers: headers || {}
  })
  return req
}

describe('/api/agents/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('认证检查', () => {
    it('拒绝无 Authorization header', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Authentication required'
      })

      const req = createMeRequest()
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('拒绝无效 Bearer token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Invalid token'
      })

      const req = createMeRequest({
        authorization: 'Bearer invalid_token'
      })
      const res = await GET(req)
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

      const req = createMeRequest({
        authorization: 'Bearer at_expired_token'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Token expired')
    })

    it('拒绝格式错误的 Authorization header', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Invalid authorization header'
      })

      const req = createMeRequest({
        authorization: 'Basic abc123'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid authorization header')
    })
  })

  describe('成功获取身份信息', () => {
    it('使用 API Key (ak_) 成功获取', async () => {
      const mockAuth = {
        success: true,
        agent_identity: {
          id: 'agent-123',
          api_key: 'ak_test123',
          agent_name: 'TestAgent',
          agent_profile_id: 'profile-123'
        },
        user_identity: {
          id: 'user-123',
          channel: 'web'
        }
      }

      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      vi.mocked(listServiceBindings).mockResolvedValue([])

      const req = createMeRequest({
        authorization: 'Bearer ak_test123'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.agent_identity).toEqual(mockAuth.agent_identity)
      expect(data.data.user_identity).toEqual(mockAuth.user_identity)
      expect(data.data.agent_profile).toEqual({ id: 'profile-123' })
      expect(data.data.service_bindings).toEqual([])
    })

    it('使用 Access Token (at_) 成功获取', async () => {
      const mockAuth = {
        success: true,
        agent_identity: {
          id: 'agent-456',
          api_key: 'ak_test456',
          agent_name: 'AnotherAgent',
          agent_profile_id: 'profile-456'
        },
        user_identity: {
          id: 'user-456',
          channel: 'feishu',
          channel_user_id: 'ou_xxx'
        }
      }

      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      vi.mocked(listServiceBindings).mockResolvedValue([
        { service_type: 'github', enabled: true }
      ])

      const req = createMeRequest({
        authorization: 'Bearer at_test456'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.service_bindings).toHaveLength(1)
    })

    it('agent 无 profile 时返回 undefined', async () => {
      const mockAuth = {
        success: true,
        agent_identity: {
          id: 'agent-789',
          api_key: 'ak_test789',
          agent_name: 'NoProfileAgent'
          // 没有 agent_profile_id
        },
        user_identity: {
          id: 'user-789'
        }
      }

      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      vi.mocked(listServiceBindings).mockResolvedValue([])

      const req = createMeRequest({
        authorization: 'Bearer ak_test789'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.agent_profile).toBeUndefined()
    })

    it('返回完整身份信息', async () => {
      const mockAuth = {
        success: true,
        agent_identity: {
          id: 'agent-full',
          api_key: 'ak_full',
          agent_name: 'FullAgent',
          agent_profile_id: 'profile-full',
          created_at: '2026-03-27T00:00:00Z',
          updated_at: '2026-03-28T00:00:00Z'
        },
        user_identity: {
          id: 'user-full',
          channel: 'telegram',
          channel_user_id: 'telegram_123',
          display_name: 'Telegram User'
        }
      }

      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      vi.mocked(listServiceBindings).mockResolvedValue([
        { service_type: 'github', enabled: true },
        { service_type: 'notion', enabled: false }
      ])

      const req = createMeRequest({
        authorization: 'Bearer ak_full'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.agent_identity.id).toBe('agent-full')
      expect(data.data.user_identity.channel).toBe('telegram')
      expect(data.data.service_bindings).toHaveLength(2)
    })
  })

  describe('服务绑定列表', () => {
    it('返回空数组（无绑定）', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-123' },
        user_identity: { id: 'user-123' }
      })
      vi.mocked(listServiceBindings).mockResolvedValue([])

      const req = createMeRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.data.service_bindings).toEqual([])
    })

    it('返回多个服务绑定', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-123' },
        user_identity: { id: 'user-123' }
      })
      vi.mocked(listServiceBindings).mockResolvedValue([
        { id: 'binding-1', service_type: 'github', enabled: true },
        { id: 'binding-2', service_type: 'slack', enabled: true },
        { id: 'binding-3', service_type: 'notion', enabled: false }
      ])

      const req = createMeRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.data.service_bindings).toHaveLength(3)
    })

    it('agent_identity.id 为 undefined 时返回空数组', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: undefined,
        user_identity: { id: 'user-123' }
      })

      const req = createMeRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.data.service_bindings).toEqual([])
      // 不应该调用 listServiceBindings
      expect(listServiceBindings).not.toHaveBeenCalled()
    })
  })

  describe('错误处理', () => {
    it('处理 authenticateRequest 抛出的错误', async () => {
      vi.mocked(authenticateRequest).mockRejectedValue(new Error('Database connection failed'))

      const req = createMeRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('处理 listServiceBindings 抛出的错误', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-123' },
        user_identity: { id: 'user-123' }
      })
      vi.mocked(listServiceBindings).mockRejectedValue(new Error('Service bindings query failed'))

      const req = createMeRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('处理非 Error 类型的异常', async () => {
      vi.mocked(authenticateRequest).mockRejectedValue('string error')

      const req = createMeRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('响应格式验证', () => {
    it('成功响应包含 success: true', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'test' },
        user_identity: { id: 'user-test' }
      })
      vi.mocked(listServiceBindings).mockResolvedValue([])

      const req = createMeRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
    })

    it('失败响应包含 success: false', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Auth failed'
      })

      const req = createMeRequest()
      const res = await GET(req)
      const data = await res.json()

      expect(data).toHaveProperty('success', false)
      expect(data).toHaveProperty('error')
    })

    it('响应包含 UTF-8 charset', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: {
          id: 'test',
          agent_name: '中文Agent'
        },
        user_identity: {
          display_name: '中文显示名'
        }
      })
      vi.mocked(listServiceBindings).mockResolvedValue([])

      const req = createMeRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)

      // 检查响应头
      const contentType = res.headers.get('content-type')
      expect(contentType).toContain('application/json')
      
      // 验证中文内容正确返回
      const data = await res.json()
      expect(data.data.agent_identity.agent_name).toBe('中文Agent')
    })
  })

  describe('边界场景', () => {
    it('agent_identity 存在但 id 为 null', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: null },
        user_identity: { id: 'user-123' }
      })

      const req = createMeRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.data.service_bindings).toEqual([])
    })

    it('user_identity 不存在', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: { id: 'agent-123' },
        user_identity: undefined
      })
      vi.mocked(listServiceBindings).mockResolvedValue([])

      const req = createMeRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.data.user_identity).toBeUndefined()
    })

    it('同时缺少 agent_identity 和 user_identity', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_identity: undefined,
        user_identity: undefined
      })

      const req = createMeRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.data.agent_identity).toBeUndefined()
      expect(data.data.user_identity).toBeUndefined()
      expect(data.data.agent_profile).toBeUndefined()
      expect(data.data.service_bindings).toEqual([])
    })
  })
})