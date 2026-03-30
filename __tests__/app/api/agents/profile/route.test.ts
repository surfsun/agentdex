/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH } from '@/app/api/agents/profile/route'

// Mock auth 和 queries
vi.mock('@/lib/identity/auth', () => ({
  authenticateRequest: vi.fn()
}))

vi.mock('@/lib/forum/queries', () => ({
  updateAgentProfile: vi.fn(),
  getAgentById: vi.fn()
}))

vi.mock('@/lib/api-response', () => ({
  jsonResponse: vi.fn((data, init) => {
    const status = init?.status || 200
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'content-type': 'application/json' }
    })
  }),
  errorResponse: vi.fn((message, init) => {
    const status = init?.status || 500
    return new Response(JSON.stringify({
      success: false,
      error: message,
      code: init?.code
    }), {
      status,
      headers: { 'content-type': 'application/json' }
    })
  }),
  jsonResponseWithHint: vi.fn((data, hint) => {
    return new Response(JSON.stringify({
      ...data,
      _agent_hint: hint
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  })
}))

import { authenticateRequest } from '@/lib/identity/auth'
import { updateAgentProfile, getAgentById } from '@/lib/forum/queries'

// Helper: 创建 GET 请求
function createProfileRequest(headers?: Record<string, string>): Request {
  return new Request('http://localhost/api/agents/profile', {
    method: 'GET',
    headers: headers || {}
  })
}

// Helper: 创建 PATCH 请求
function createPatchRequest(body: object, headers?: Record<string, string>): Request {
  return new Request('http://localhost/api/agents/profile', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })
}

describe('/api/agents/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==================== GET 方法测试 ====================
  describe('GET - 认证检查', () => {
    it('拒绝无 Authorization header', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Authentication required'
      })

      const req = createProfileRequest()
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

      const req = createProfileRequest({
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

      const req = createProfileRequest({
        authorization: 'Bearer at_expired_token'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Token expired')
    })
  })

  describe('GET - 成功获取 profile', () => {
    it('使用 API Key (ak_) 成功获取', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'TestAgent',
        platform: 'web',
        expertise: ['coding', 'testing'],
        personality: 'Helpful assistant',
        avatar_url: 'https://example.com/avatar.png'
      }

      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(getAgentById).mockResolvedValue(mockAgent)

      const req = createProfileRequest({
        authorization: 'Bearer ak_test123'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockAgent)
      expect(data._agent_hint).toBeDefined()
      expect(data._agent_hint.description).toContain('profile')
    })

    it('使用 Access Token (at_) 成功获取', async () => {
      const mockAgent = {
        id: 'agent-456',
        name: 'AnotherAgent',
        platform: 'feishu',
        expertise: [],
        personality: null,
        avatar_url: null
      }

      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-456'
      })
      vi.mocked(getAgentById).mockResolvedValue(mockAgent)

      const req = createProfileRequest({
        authorization: 'Bearer at_test456'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.expertise).toEqual([])
      expect(data.data.personality).toBeNull()
    })
  })

  describe('GET - 错误处理', () => {
    it('agent_id 缺失时返回 404', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: null
      })

      const req = createProfileRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.code).toBe('AGENT_PROFILE_MISSING')
    })

    it('getAgentById 返回 null 时返回 404', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(getAgentById).mockResolvedValue(null)

      const req = createProfileRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.code).toBe('AGENT_NOT_FOUND')
    })

    it('处理 authenticateRequest 抛出的错误', async () => {
      vi.mocked(authenticateRequest).mockRejectedValue(new Error('Database connection failed'))

      const req = createProfileRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INTERNAL_ERROR')
    })
  })

  // ==================== PATCH 方法测试 ====================
  describe('PATCH - 认证检查', () => {
    it('拒绝无 Authorization header', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Authentication required'
      })

      const req = createPatchRequest({ expertise: ['test'] })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('PATCH - Content-Type 检查', () => {
    it('拒绝非 JSON Content-Type', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })

      const req = new Request('http://localhost/api/agents/profile', {
        method: 'PATCH',
        headers: {
          'content-type': 'text/plain',
          'authorization': 'Bearer ak_test'
        },
        body: 'expertise=test'
      })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_CONTENT_TYPE')
    })
  })

  describe('PATCH - expertise 字段验证', () => {
    it('expertise 必须是数组', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })

      const req = createPatchRequest({ expertise: 'not-array' })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_EXPERTISE')
    })

    it('expertise 数组元素必须是字符串', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })

      const req = createPatchRequest({ expertise: ['valid', 123, null] })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_EXPERTISE_ITEM')
    })

    it('expertise 空字符串被过滤', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(updateAgentProfile).mockResolvedValue({
        id: 'agent-123',
        expertise: ['valid']
      })

      const req = createPatchRequest({ expertise: ['  valid  ', '  ', ''] })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.expertise).toEqual(['valid'])
    })

    it('expertise 空数组有效', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(updateAgentProfile).mockResolvedValue({
        id: 'agent-123',
        expertise: []
      })

      const req = createPatchRequest({ expertise: [] })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('PATCH - personality 字段验证', () => {
    it('personality 必须是字符串或 null', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })

      const req = createPatchRequest({ personality: 123 })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_PERSONALITY')
    })

    it('personality 为 null 有效', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(updateAgentProfile).mockResolvedValue({
        id: 'agent-123',
        personality: null
      })

      const req = createPatchRequest({ personality: null })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.personality).toBeNull()
    })

    it('personality 字符串被 trim', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(updateAgentProfile).mockResolvedValue({
        id: 'agent-123',
        personality: 'trimmed personality'
      })

      const req = createPatchRequest({ personality: '  trimmed personality  ' })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.personality).toBe('trimmed personality')
    })
  })

  describe('PATCH - avatar_url 字段验证', () => {
    it('avatar_url 必须是字符串或 null', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })

      const req = createPatchRequest({ avatar_url: 123 })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_AVATAR_URL')
    })

    it('avatar_url 必须是有效 URL', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })

      const req = createPatchRequest({ avatar_url: 'not-a-url' })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_AVATAR_URL_FORMAT')
    })

    it('avatar_url 为 null 有效', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(updateAgentProfile).mockResolvedValue({
        id: 'agent-123',
        avatar_url: null
      })

      const req = createPatchRequest({ avatar_url: null })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('avatar_url 有效 URL 格式', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(updateAgentProfile).mockResolvedValue({
        id: 'agent-123',
        avatar_url: 'https://example.com/avatar.png'
      })

      const req = createPatchRequest({ avatar_url: 'https://example.com/avatar.png' })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('PATCH - 无更新字段', () => {
    it('空请求体返回错误', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })

      const req = createPatchRequest({})
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('NO_UPDATES')
    })

    it('只有 undefined 字段返回错误', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })

      const req = createPatchRequest({
        expertise: undefined,
        personality: undefined,
        avatar_url: undefined
      })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('NO_UPDATES')
    })
  })

  describe('PATCH - 成功更新', () => {
    it('更新单个字段', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(updateAgentProfile).mockResolvedValue({
        id: 'agent-123',
        expertise: ['new-skill']
      })

      const req = createPatchRequest({ expertise: ['new-skill'] })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.expertise).toEqual(['new-skill'])
      expect(data._agent_hint).toBeDefined()
    })

    it('同时更新多个字段', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(updateAgentProfile).mockResolvedValue({
        id: 'agent-123',
        expertise: ['skill1', 'skill2'],
        personality: 'Friendly assistant',
        avatar_url: 'https://example.com/avatar.png'
      })

      const req = createPatchRequest({
        expertise: ['skill1', 'skill2'],
        personality: 'Friendly assistant',
        avatar_url: 'https://example.com/avatar.png'
      })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.expertise).toEqual(['skill1', 'skill2'])
      expect(data.data.personality).toBe('Friendly assistant')
      expect(data.data.avatar_url).toBe('https://example.com/avatar.png')
    })
  })

  describe('PATCH - 错误处理', () => {
    it('agent_id 缺失时返回 404', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: null
      })

      const req = createPatchRequest({ expertise: ['test'] })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.code).toBe('AGENT_PROFILE_MISSING')
    })

    it('updateAgentProfile 抛出错误', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(updateAgentProfile).mockRejectedValue(new Error('Update failed'))

      const req = createPatchRequest({ expertise: ['test'] })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.code).toBe('UPDATE_FAILED')
    })

    it('处理 JSON 解析错误', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })

      const req = new Request('http://localhost/api/agents/profile', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer ak_test'
        },
        body: 'invalid json'
      })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_JSON')
    })
  })

  describe('响应格式验证', () => {
    it('成功响应包含 _agent_hint', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(getAgentById).mockResolvedValue({
        id: 'agent-123',
        name: 'TestAgent'
      })

      const req = createProfileRequest({
        authorization: 'Bearer ak_test'
      })
      const res = await GET(req)
      const data = await res.json()

      expect(data._agent_hint).toBeDefined()
      expect(data._agent_hint.description).toBeDefined()
      expect(data._agent_hint.next_actions).toBeDefined()
      expect(data._agent_hint.endpoints).toBeDefined()
    })

    it('失败响应包含 code 字段', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Auth failed',
        code: 'AUTH_REQUIRED'
      })

      const req = createProfileRequest()
      const res = await GET(req)
      const data = await res.json()

      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
      expect(data.code).toBeDefined()
    })
  })

  describe('边界场景', () => {
    it('expertise 包含特殊字符', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(updateAgentProfile).mockResolvedValue({
        id: 'agent-123',
        expertise: ['中文技能', 'english-skill']
      })

      const req = createPatchRequest({ expertise: ['中文技能', 'english-skill'] })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.data.expertise).toEqual(['中文技能', 'english-skill'])
    })

    it('personality 包含换行符', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(updateAgentProfile).mockResolvedValue({
        id: 'agent-123',
        personality: 'Line1\nLine2\nLine3'
      })

      const req = createPatchRequest({ personality: 'Line1\nLine2\nLine3' })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(200)
    })

    it('空字符串 avatar_url 被转为 null', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
      vi.mocked(updateAgentProfile).mockResolvedValue({
        id: 'agent-123',
        avatar_url: null
      })

      const req = createPatchRequest({ avatar_url: '' })
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.data.avatar_url).toBeNull()
    })
  })
})