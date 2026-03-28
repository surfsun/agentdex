/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/agents/refresh-token/route'

// Mock refreshAccessToken
vi.mock('@/lib/identity/queries', () => ({
  refreshAccessToken: vi.fn()
}))

import { refreshAccessToken } from '@/lib/identity/queries'

// Helper: 创建 POST 请求
function createRequest(body: unknown, contentType?: string): Request {
  const req = new Request('http://localhost/api/agents/refresh-token', {
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
  const req = new Request('http://localhost/api/agents/refresh-token', {
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
  const req = new Request('http://localhost/api/agents/refresh-token', {
    method: 'POST',
    body: JSON.stringify(body)
  })
  return req
}

describe('/api/agents/refresh-token', () => {
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
      const req = createNoContentTypeRequest({ api_key: 'ak_test' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid content type')
    })

    it('拒绝无效 JSON body', async () => {
      const req = new Request('http://localhost/api/agents/refresh-token', {
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
    it('拒绝缺少 api_key', async () => {
      const req = createRequest({})
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: api_key')
    })

    it('拒绝空 api_key', async () => {
      const req = createRequest({ api_key: '' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: api_key')
    })

    it('拒绝 null api_key', async () => {
      const req = createRequest({ api_key: null })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: api_key')
    })

    it('拒绝非字符串 api_key', async () => {
      const req = createRequest({ api_key: 12345 })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: api_key')
    })

    it('拒绝非 ak_ 前缀的 token', async () => {
      const req = createRequest({ api_key: 'at_test123' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid API key format. Expected ak_xxx')
    })

    it('拒绝不带前缀的 token', async () => {
      const req = createRequest({ api_key: 'plainstring' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid API key format. Expected ak_xxx')
    })
  })

  describe('成功刷新 token', () => {
    it('成功刷新 access token', async () => {
      vi.mocked(refreshAccessToken).mockResolvedValue({
        success: true,
        access_token: 'at_newtoken123',
        expires_in: 86400,
        agent_identity: {
          id: 'agent-123',
          agent_name: 'TestAgent',
          agent_slug: 'test-agent',
          status: 'active'
        }
      })

      const req = createRequest({ api_key: 'ak_test123' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.access_token).toBe('at_newtoken123')
      expect(data.data.expires_in).toBe(86400)
      expect(data.data.agent_identity.id).toBe('agent-123')
      expect(refreshAccessToken).toHaveBeenCalledWith('ak_test123')
    })

    it('trim api_key 前后空格', async () => {
      vi.mocked(refreshAccessToken).mockResolvedValue({
        success: true,
        access_token: 'at_trimmed',
        expires_in: 86400,
        agent_identity: { id: 'agent-trim' }
      })

      const req = createRequest({ api_key: '  ak_trimmed  ' })
      const res = await POST(req)

      expect(refreshAccessToken).toHaveBeenCalledWith('ak_trimmed')
    })

    it('返回完整的 agent_identity 信息', async () => {
      vi.mocked(refreshAccessToken).mockResolvedValue({
        success: true,
        access_token: 'at_full',
        expires_in: 86400,
        agent_identity: {
          id: 'agent-full',
          agent_name: 'FullAgent',
          agent_slug: 'full-agent-slug',
          status: 'active'
        }
      })

      const req = createRequest({ api_key: 'ak_full' })
      const res = await POST(req)
      const data = await res.json()

      expect(data.data.agent_identity).toEqual({
        id: 'agent-full',
        agent_name: 'FullAgent',
        agent_slug: 'full-agent-slug',
        status: 'active'
      })
    })
  })

  describe('认证失败处理', () => {
    it('处理无效 API Key', async () => {
      vi.mocked(refreshAccessToken).mockResolvedValue({
        success: false,
        error: 'Invalid API key'
      })

      const req = createRequest({ api_key: 'ak_invalid' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid API key')
    })

    it('处理过期或已禁用的 API Key', async () => {
      vi.mocked(refreshAccessToken).mockResolvedValue({
        success: false,
        error: 'API key not found or inactive'
      })

      const req = createRequest({ api_key: 'ak_inactive' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('API key not found or inactive')
    })

    it('处理找不到 agent_identity', async () => {
      vi.mocked(refreshAccessToken).mockResolvedValue({
        success: false,
        error: 'Agent identity not found'
      })

      const req = createRequest({ api_key: 'ak_noagent' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Agent identity not found')
    })

    it('处理创建新 token 失败', async () => {
      vi.mocked(refreshAccessToken).mockResolvedValue({
        success: false,
        error: 'Failed to create new access token'
      })

      const req = createRequest({ api_key: 'ak_failtoken' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create new access token')
    })
  })

  describe('错误处理', () => {
    it('处理 refreshAccessToken 抛出的 Error', async () => {
      vi.mocked(refreshAccessToken).mockRejectedValue(new Error('Database connection failed'))

      const req = createRequest({ api_key: 'ak_error' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('处理非 Error 类型异常', async () => {
      vi.mocked(refreshAccessToken).mockRejectedValue('string error')

      const req = createRequest({ api_key: 'ak_string' })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('响应格式验证', () => {
    it('成功响应包含 success: true', async () => {
      vi.mocked(refreshAccessToken).mockResolvedValue({
        success: true,
        access_token: 'at_test',
        expires_in: 86400,
        agent_identity: { id: 'test' }
      })

      const req = createRequest({ api_key: 'ak_test' })
      const res = await POST(req)
      const data = await res.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('access_token')
      expect(data.data).toHaveProperty('expires_in')
      expect(data.data).toHaveProperty('agent_identity')
    })

    it('失败响应包含 success: false', async () => {
      vi.mocked(refreshAccessToken).mockResolvedValue({
        success: false,
        error: 'Test error'
      })

      const req = createRequest({ api_key: 'ak_test' })
      const res = await POST(req)
      const data = await res.json()

      expect(data).toHaveProperty('success', false)
      expect(data).toHaveProperty('error')
    })

    it('响应包含 UTF-8 charset', async () => {
      vi.mocked(refreshAccessToken).mockResolvedValue({
        success: true,
        access_token: 'at_utf8',
        expires_in: 86400,
        agent_identity: {
          id: 'agent-utf8',
          agent_name: '中文Agent',
          agent_slug: 'chinese-agent'
        }
      })

      const req = createRequest({ api_key: 'ak_utf8' })
      const res = await POST(req)

      const contentType = res.headers.get('content-type')
      expect(contentType).toContain('application/json')
      
      const data = await res.json()
      expect(data.data.agent_identity.agent_name).toBe('中文Agent')
    })
  })

  describe('边界场景', () => {
    it('处理长 api_key', async () => {
      const longKey = 'ak_' + 'a'.repeat(100)
      
      vi.mocked(refreshAccessToken).mockResolvedValue({
        success: true,
        access_token: 'at_long',
        expires_in: 86400,
        agent_identity: { id: 'agent-long' }
      })

      const req = createRequest({ api_key: longKey })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(refreshAccessToken).toHaveBeenCalledWith(longKey)
    })

    it('处理包含特殊字符的 api_key（理论上不应该存在）', async () => {
      // API Key 应该只包含字母数字，但代码应该正确传递任何输入
      vi.mocked(refreshAccessToken).mockResolvedValue({
        success: false,
        error: 'Invalid API key format'
      })

      const req = createRequest({ api_key: 'ak_special!@#' })
      const res = await POST(req)

      // 应该正确调用函数，让函数处理验证
      expect(refreshAccessToken).toHaveBeenCalledWith('ak_special!@#')
    })
  })
})