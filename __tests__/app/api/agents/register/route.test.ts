/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/agents/register/route'

// Mock registerAgent
vi.mock('@/lib/identity/queries', () => ({
  registerAgent: vi.fn()
}))

import { registerAgent } from '@/lib/identity/queries'

// Helper: 创建 POST 请求
function createRegisterRequest(body: unknown, headers?: Record<string, string>): Request {
  const req = new Request('http://localhost/api/agents/register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })
  return req
}

// Helper: 创建非 JSON 请求
function createNonJsonRequest(body: string, contentType?: string): Request {
  const req = new Request('http://localhost/api/agents/register', {
    method: 'POST',
    headers: {
      'content-type': contentType || 'text/plain'
    },
    body
  })
  return req
}

describe('/api/agents/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('请求格式验证', () => {
    it('拒绝非 JSON content-type', async () => {
      const req = createNonJsonRequest('not json')
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid content type')
    })

    it('拒绝无效 JSON body', async () => {
      const req = new Request('http://localhost/api/agents/register', {
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

    it('拒绝缺少 content-type header', async () => {
      const req = new Request('http://localhost/api/agents/register', {
        method: 'POST',
        body: JSON.stringify({ agent_name: 'Test' })
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid content type')
    })
  })

  describe('参数验证', () => {
    it('拒绝缺少 agent_name', async () => {
      const req = createRegisterRequest({
        channel: 'web',
        channel_user_id: 'user123'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: agent_name')
    })

    it('拒绝空 agent_name', async () => {
      const req = createRegisterRequest({
        agent_name: ''
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: agent_name')
    })

    it('拒绝非字符串 agent_name', async () => {
      const req = createRegisterRequest({
        agent_name: 123
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: agent_name')
    })

    it('拒绝过短 agent_name (< 2 字符)', async () => {
      const req = createRegisterRequest({
        agent_name: 'A'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('agent_name must be 2-50 characters')
    })

    it('拒绝过长 agent_name (> 50 字符)', async () => {
      const req = createRegisterRequest({
        agent_name: 'ThisIsAVeryLongAgentNameThatExceedsTheMaximumAllowedLength'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('agent_name must be 2-50 characters')
    })

    it('拒绝缺少渠道身份和 user_identity_id', async () => {
      const req = createRegisterRequest({
        agent_name: 'TestAgent'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Must provide either (channel + channel_user_id) or user_identity_id')
    })

    it('拒绝只有 channel 缺少 channel_user_id', async () => {
      const req = createRegisterRequest({
        agent_name: 'TestAgent',
        channel: 'web'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Must provide either (channel + channel_user_id) or user_identity_id')
    })

    it('拒绝只有 channel_user_id 缺少 channel', async () => {
      const req = createRegisterRequest({
        agent_name: 'TestAgent',
        channel_user_id: 'user123'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Must provide either (channel + channel_user_id) or user_identity_id')
    })
  })

  describe('成功注册', () => {
    it('使用渠道身份成功注册', async () => {
      const mockResult = {
        agent_identity: {
          id: 'agent-123',
          api_key: 'ak_test123',
          agent_name: 'TestAgent'
        },
        user_identity: {
          id: 'user-123',
          channel: 'web',
          channel_user_id: 'user123'
        },
        agent_profile: {
          id: 'profile-123',
          name: 'TestAgent'
        },
        api_key: 'ak_test123',
        access_token: 'at_test123',
        expires_in: 86400
      }

      vi.mocked(registerAgent).mockResolvedValue(mockResult)

      const req = createRegisterRequest({
        agent_name: 'TestAgent',
        channel: 'web',
        channel_user_id: 'user123',
        display_name: '测试显示名'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockResult)
      expect(registerAgent).toHaveBeenCalledWith({
        channel: 'web',
        channel_user_id: 'user123',
        display_name: '测试显示名',
        agent_name: 'TestAgent',
        platform: undefined
      })
    })

    it('使用 user_identity_id 成功注册', async () => {
      const mockResult = {
        agent_identity: {
          id: 'agent-456',
          api_key: 'ak_test456',
          agent_name: 'AnotherAgent'
        },
        user_identity: {
          id: 'user-456',
          channel: 'feishu'
        },
        agent_profile: {
          id: 'profile-456'
        },
        api_key: 'ak_test456',
        access_token: 'at_test456',
        expires_in: 86400
      }

      vi.mocked(registerAgent).mockResolvedValue(mockResult)

      const req = createRegisterRequest({
        agent_name: 'AnotherAgent',
        user_identity_id: 'user-456',
        platform: 'agentdex'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockResult)
      expect(registerAgent).toHaveBeenCalledWith({
        channel: undefined,
        channel_user_id: undefined,
        display_name: undefined,
        user_identity_id: 'user-456',
        agent_name: 'AnotherAgent',
        platform: 'agentdex'
      })
    })

    it('trim agent_name 前后空格', async () => {
      const mockResult = {
        agent_identity: { id: 'agent-789' },
        api_key: 'ak_test789'
      }

      vi.mocked(registerAgent).mockResolvedValue(mockResult)

      const req = createRegisterRequest({
        agent_name: '  TrimmedAgent  ',
        channel: 'web',
        channel_user_id: 'user789'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(registerAgent).toHaveBeenCalledWith({
        channel: 'web',
        channel_user_id: 'user789',
        display_name: undefined,
        user_identity_id: undefined,
        agent_name: 'TrimmedAgent',
        platform: undefined
      })
    })

    it('包含所有可选参数', async () => {
      const mockResult = {
        agent_identity: { id: 'agent-full' },
        user_identity: { id: 'user-full' },
        agent_profile: { id: 'profile-full' },
        api_key: 'ak_full',
        access_token: 'at_full',
        expires_in: 3600
      }

      vi.mocked(registerAgent).mockResolvedValue(mockResult)

      const req = createRegisterRequest({
        agent_name: 'FullAgent',
        channel: 'feishu',
        channel_user_id: 'ou_xxx',
        display_name: '完整显示名',
        platform: 'custom-platform'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.expires_in).toBe(3600)
      expect(registerAgent).toHaveBeenCalledWith({
        channel: 'feishu',
        channel_user_id: 'ou_xxx',
        display_name: '完整显示名',
        user_identity_id: undefined,
        agent_name: 'FullAgent',
        platform: 'custom-platform'
      })
    })
  })

  describe('错误处理', () => {
    it('处理 registerAgent 抛出的错误', async () => {
      vi.mocked(registerAgent).mockRejectedValue(new Error('Database connection failed'))

      const req = createRegisterRequest({
        agent_name: 'TestAgent',
        channel: 'web',
        channel_user_id: 'user123'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('处理非 Error 类型的异常', async () => {
      vi.mocked(registerAgent).mockRejectedValue('string error')

      const req = createRegisterRequest({
        agent_name: 'TestAgent',
        channel: 'web',
        channel_user_id: 'user123'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('处理唯一性冲突（agent_name 已存在）', async () => {
      vi.mocked(registerAgent).mockRejectedValue(new Error('Agent name already exists'))

      const req = createRegisterRequest({
        agent_name: 'DuplicateAgent',
        channel: 'web',
        channel_user_id: 'user123'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Agent name already exists')
    })
  })

  describe('响应格式验证', () => {
    it('成功响应包含 success: true', async () => {
      vi.mocked(registerAgent).mockResolvedValue({
        agent_identity: { id: 'test' },
        api_key: 'ak_test'
      })

      const req = createRegisterRequest({
        agent_name: 'TestAgent',
        channel: 'web',
        channel_user_id: 'user123'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
    })

    it('失败响应包含 success: false', async () => {
      const req = createRegisterRequest({ agent_name: '' })
      const res = await POST(req)
      const data = await res.json()

      expect(data).toHaveProperty('success', false)
      expect(data).toHaveProperty('error')
    })

    it('响应包含 UTF-8 charset', async () => {
      vi.mocked(registerAgent).mockResolvedValue({
        agent_identity: { id: 'test' },
        api_key: 'ak_test'
      })

      const req = createRegisterRequest({
        agent_name: '中文Agent',
        display_name: '中文显示名',
        channel: 'web',
        channel_user_id: 'user123'
      })
      const res = await POST(req)

      // 检查响应头
      const contentType = res.headers.get('content-type')
      expect(contentType).toContain('application/json')
      
      // 验证中文内容正确返回
      const data = await res.json()
      expect(registerAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          agent_name: '中文Agent',
          display_name: '中文显示名'
        })
      )
    })
  })

  describe('边界场景', () => {
    it('agent_name 长度边界 (2 字符)', async () => {
      vi.mocked(registerAgent).mockResolvedValue({
        agent_identity: { id: 'test' },
        api_key: 'ak_test'
      })

      const req = createRegisterRequest({
        agent_name: 'AB',
        channel: 'web',
        channel_user_id: 'user123'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('agent_name 长度边界 (50 字符)', async () => {
      vi.mocked(registerAgent).mockResolvedValue({
        agent_identity: { id: 'test' },
        api_key: 'ak_test'
      })

      const req = createRegisterRequest({
        agent_name: 'ExactlyFiftyCharactersAgentNameHere12345',
        channel: 'web',
        channel_user_id: 'user123'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('特殊字符 agent_name', async () => {
      vi.mocked(registerAgent).mockResolvedValue({
        agent_identity: { id: 'test' },
        api_key: 'ak_test'
      })

      const req = createRegisterRequest({
        agent_name: 'Agent-Test_123',
        channel: 'web',
        channel_user_id: 'user123'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('中文字符 agent_name', async () => {
      vi.mocked(registerAgent).mockResolvedValue({
        agent_identity: { id: 'test' },
        api_key: 'ak_test'
      })

      const req = createRegisterRequest({
        agent_name: '测试Agent',
        channel: 'web',
        channel_user_id: 'user123'
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('null 值可选参数', async () => {
      vi.mocked(registerAgent).mockResolvedValue({
        agent_identity: { id: 'test' },
        api_key: 'ak_test'
      })

      const req = createRegisterRequest({
        agent_name: 'TestAgent',
        channel: 'web',
        channel_user_id: 'user123',
        display_name: null,
        platform: null
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(registerAgent).toHaveBeenCalledWith({
        channel: 'web',
        channel_user_id: 'user123',
        display_name: null,
        user_identity_id: undefined,
        agent_name: 'TestAgent',
        platform: null
      })
    })
  })
})