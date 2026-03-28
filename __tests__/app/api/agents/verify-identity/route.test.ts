/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/agents/verify-identity/route'

// Mock verifyIdentityToken
vi.mock('@/lib/identity/queries', () => ({
  verifyIdentityToken: vi.fn()
}))

import { verifyIdentityToken } from '@/lib/identity/queries'

// Helper: 创建 POST 请求
function createRequest(body: unknown, contentType?: string): Request {
  const req = new Request('http://localhost/api/agents/verify-identity', {
    method: 'POST',
    headers: {
      'content-type': contentType || 'application/json'
    },
    body: JSON.stringify(body)
  })
  return req
}

// Helper: 创建非 JSON 请求
function createNonJsonRequest(body: string, contentType?: string): Request {
  const req = new Request('http://localhost/api/agents/verify-identity', {
    method: 'POST',
    headers: {
      'content-type': contentType || 'text/plain'
    },
    body
  })
  return req
}

// Helper: 创建无 content-type 的请求
function createNoContentTypeRequest(body: unknown): Request {
  const req = new Request('http://localhost/api/agents/verify-identity', {
    method: 'POST',
    body: JSON.stringify(body)
  })
  return req
}

describe('/api/agents/verify-identity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('请求格式验证', () => {
    it('拒绝非 JSON content-type', async () => {
      const req = createNonJsonRequest('not json', 'text/plain')
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid content type')
    })

    it('拒绝缺少 content-type header', async () => {
      const req = createNoContentTypeRequest({ token: 'it_test' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid content type')
    })

    it('拒绝无效 JSON body', async () => {
      const req = new Request('http://localhost/api/agents/verify-identity', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'not valid json'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid JSON body')
    })
  })

  describe('参数验证', () => {
    it('拒绝缺少 token', async () => {
      const req = createRequest({})
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: token')
    })

    it('拒绝空 token', async () => {
      const req = createRequest({ token: '' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: token')
    })

    it('拒绝 null token', async () => {
      const req = createRequest({ token: null })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: token')
    })

    it('拒绝非字符串 token', async () => {
      const req = createRequest({ token: 12345 })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: token')
    })

    it('拒绝非 it_ 前缀的 token（返回 valid: false）', async () => {
      const req = createRequest({ token: 'at_test123' })
      const res = await POST(req)
      const data = await res.json()

      // 注意：非 it_ 前缀返回 200，但 valid: false
      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.valid).toBe(false)
      expect(data.data.error).toBe('Invalid token format')
    })

    it('拒绝不带前缀的 token（返回 valid: false）', async () => {
      const req = createRequest({ token: 'plainstring' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.valid).toBe(false)
      expect(data.data.error).toBe('Invalid token format')
    })

    it('拒绝 ak_ 前缀的 token（返回 valid: false）', async () => {
      const req = createRequest({ token: 'ak_test123' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.valid).toBe(false)
      expect(data.data.error).toBe('Invalid token format')
    })
  })

  describe('成功验证令牌', () => {
    it('成功验证有效的 identity token', async () => {
      vi.mocked(verifyIdentityToken).mockResolvedValue({
        valid: true,
        agent_identity: {
          id: 'agent-123',
          agent_name: 'TestAgent',
          agent_slug: 'test-agent',
          status: 'active',
          created_at: '2026-03-27T10:00:00Z'
        }
      })

      const req = createRequest({ token: 'it_validtoken123' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.valid).toBe(true)
      expect(data.data.agent_identity.id).toBe('agent-123')
      expect(data.data.agent_identity.agent_name).toBe('TestAgent')
      expect(verifyIdentityToken).toHaveBeenCalledWith('it_validtoken123')
    })

    it('返回完整的 agent_identity 信息', async () => {
      vi.mocked(verifyIdentityToken).mockResolvedValue({
        valid: true,
        agent_identity: {
          id: 'agent-full',
          agent_name: 'FullAgent',
          agent_slug: 'full-agent-slug',
          status: 'active',
          created_at: '2026-03-27T10:00:00Z'
        }
      })

      const req = createRequest({ token: 'it_full' })
      const res = await POST(req)
      const data = await res.json()

      expect(data.data.agent_identity).toEqual({
        id: 'agent-full',
        agent_name: 'FullAgent',
        agent_slug: 'full-agent-slug',
        status: 'active',
        created_at: '2026-03-27T10:00:00Z'
      })
    })

    it('处理中文 agent_name', async () => {
      vi.mocked(verifyIdentityToken).mockResolvedValue({
        valid: true,
        agent_identity: {
          id: 'agent-chinese',
          agent_name: '中文Agent',
          agent_slug: 'chinese-agent',
          status: 'active',
          created_at: '2026-03-27T10:00:00Z'
        }
      })

      const req = createRequest({ token: 'it_chinese' })
      const res = await POST(req)
      const data = await res.json()

      expect(data.data.valid).toBe(true)
      expect(data.data.agent_identity.agent_name).toBe('中文Agent')
    })
  })

  describe('无效令牌处理', () => {
    it('处理找不到的令牌', async () => {
      vi.mocked(verifyIdentityToken).mockResolvedValue({
        valid: false,
        error: 'Token not found'
      })

      const req = createRequest({ token: 'it_notfound' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.valid).toBe(false)
      expect(data.data.error).toBe('Token not found')
    })

    it('处理过期令牌', async () => {
      vi.mocked(verifyIdentityToken).mockResolvedValue({
        valid: false,
        error: 'Token expired'
      })

      const req = createRequest({ token: 'it_expired' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.valid).toBe(false)
      expect(data.data.error).toBe('Token expired')
    })

    it('处理已使用的令牌', async () => {
      vi.mocked(verifyIdentityToken).mockResolvedValue({
        valid: false,
        error: 'Token already used'
      })

      const req = createRequest({ token: 'it_used' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.valid).toBe(false)
      expect(data.data.error).toBe('Token already used')
    })
  })

  describe('错误处理', () => {
    it('处理 verifyIdentityToken 抛出的 Error', async () => {
      vi.mocked(verifyIdentityToken).mockRejectedValue(new Error('Database connection failed'))

      const req = createRequest({ token: 'it_error' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('处理非 Error 类型异常', async () => {
      vi.mocked(verifyIdentityToken).mockRejectedValue('string error')

      const req = createRequest({ token: 'it_string' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('响应格式验证', () => {
    it('成功验证响应包含完整字段', async () => {
      vi.mocked(verifyIdentityToken).mockResolvedValue({
        valid: true,
        agent_identity: {
          id: 'agent-format',
          agent_name: 'FormatAgent',
          agent_slug: 'format-agent',
          status: 'active',
          created_at: '2026-03-27T10:00:00Z'
        }
      })

      const req = createRequest({ token: 'it_format' })
      const res = await POST(req)
      const data = await res.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('valid', true)
      expect(data.data).toHaveProperty('agent_identity')
    })

    it('无效令牌响应包含 valid: false 和 error', async () => {
      vi.mocked(verifyIdentityToken).mockResolvedValue({
        valid: false,
        error: 'Token not found'
      })

      const req = createRequest({ token: 'it_invalid' })
      const res = await POST(req)
      const data = await res.json()

      expect(data).toHaveProperty('success', true)
      expect(data.data).toHaveProperty('valid', false)
      expect(data.data).toHaveProperty('error')
      // 无效令牌不返回 agent_identity
      expect(data.data).not.toHaveProperty('agent_identity')
    })

    it('响应包含 UTF-8 charset', async () => {
      vi.mocked(verifyIdentityToken).mockResolvedValue({
        valid: true,
        agent_identity: {
          id: 'agent-utf8',
          agent_name: 'UTF8Agent',
          status: 'active',
          created_at: '2026-03-27T10:00:00Z'
        }
      })

      const req = createRequest({ token: 'it_utf8' })
      const res = await POST(req)

      const contentType = res.headers.get('content-type')
      expect(contentType).toContain('application/json')
    })
  })

  describe('边界场景', () => {
    it('处理长 token', async () => {
      const longToken = 'it_' + 'a'.repeat(100)
      
      vi.mocked(verifyIdentityToken).mockResolvedValue({
        valid: false,
        error: 'Token not found'
      })

      const req = createRequest({ token: longToken })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(verifyIdentityToken).toHaveBeenCalledWith(longToken)
    })

    it('处理刚好 35 字符的 token（it_ + 32）', async () => {
      const normalToken = 'it_' + 'a'.repeat(32)
      
      vi.mocked(verifyIdentityToken).mockResolvedValue({
        valid: true,
        agent_identity: { id: 'agent-normal' }
      })

      const req = createRequest({ token: normalToken })
      const res = await POST(req)

      expect(verifyIdentityToken).toHaveBeenCalledWith(normalToken)
    })

    it('不同 status 的 agent_identity', async () => {
      vi.mocked(verifyIdentityToken).mockResolvedValue({
        valid: true,
        agent_identity: {
          id: 'agent-inactive',
          agent_name: 'InactiveAgent',
          status: 'inactive',
          created_at: '2026-03-27T10:00:00Z'
        }
      })

      const req = createRequest({ token: 'it_inactive' })
      const res = await POST(req)
      const data = await res.json()

      expect(data.data.valid).toBe(true)
      expect(data.data.agent_identity.status).toBe('inactive')
    })
  })

  describe('第三方服务调用场景', () => {
    it('模拟外部服务验证用户身份', async () => {
      vi.mocked(verifyIdentityToken).mockResolvedValue({
        valid: true,
        agent_identity: {
          id: 'agent-external',
          agent_name: 'ExternalServiceAgent',
          agent_slug: 'external-service-agent',
          status: 'active',
          created_at: '2026-03-27T10:00:00Z'
        }
      })

      // 外部服务可能只关心 valid 和基本身份信息
      const req = createRequest({ token: 'it_external_service' })
      const res = await POST(req)
      const data = await res.json()

      expect(data.data.valid).toBe(true)
      expect(data.data.agent_identity.id).toBe('agent-external')
      expect(data.data.agent_identity.agent_name).toBe('ExternalServiceAgent')
    })

    it('外部服务收到无效 token 时只得到 valid: false', async () => {
      vi.mocked(verifyIdentityToken).mockResolvedValue({
        valid: false,
        error: 'Token expired'
      })

      const req = createRequest({ token: 'it_expired_external' })
      const res = await POST(req)
      const data = await res.json()

      // 外部服务不应得到敏感信息
      expect(data.data.valid).toBe(false)
      expect(data.data.error).toBe('Token expired')
      expect(data.data).not.toHaveProperty('agent_identity')
    })
  })
})