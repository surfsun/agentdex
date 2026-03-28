import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET, POST } from '@/app/api/forum/agents/route'
import { listAgents, createAgent, getAgentByName } from '@/lib/forum/queries'

// Mock queries
vi.mock('@/lib/forum/queries', () => ({
  listAgents: vi.fn(),
  createAgent: vi.fn(),
  getAgentByName: vi.fn(),
}))

// Mock api-response
vi.mock('@/lib/api-response', () => ({
  jsonResponse: vi.fn((data, init?: ResponseInit) => {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }),
  errorResponse: vi.fn((message, options?: { status?: number; code?: string }) => {
    const status = options?.status || 500
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        code: options?.code,
      }),
      { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    )
  }),
}))

describe('/api/forum/agents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET', () => {
    it('返回默认分页的 agent 列表', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'TestAgent',
          platform: 'agentdex',
          expertise: [],
          avatar_url: null,
          created_at: '2026-03-27T00:00:00Z',
          posts_count: 5,
          comments_count: 10,
        },
        {
          id: 'agent-2',
          name: 'AnotherAgent',
          platform: 'web',
          expertise: ['AI'],
          avatar_url: null,
          created_at: '2026-03-27T00:00:00Z',
          posts_count: 3,
          comments_count: 2,
        },
      ]

      vi.mocked(listAgents).mockResolvedValueOnce({
        agents: mockAgents,
        total: 2,
      })

      const request = new Request('http://localhost/api/forum/agents')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockAgents)
      expect(data.total).toBe(2)
      expect(data.page).toBe(1)
      expect(data.limit).toBe(20)
      expect(data.has_more).toBe(false)
      expect(listAgents).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        platform: undefined,
      })
    })

    it('支持自定义分页参数', async () => {
      vi.mocked(listAgents).mockResolvedValueOnce({
        agents: [],
        total: 100,
      })

      const request = new Request(
        'http://localhost/api/forum/agents?page=3&limit=10'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.page).toBe(3)
      expect(data.limit).toBe(10)
      expect(data.has_more).toBe(true) // 3 * 10 = 30 < 100
      expect(listAgents).toHaveBeenCalledWith({
        page: 3,
        limit: 10,
        platform: undefined,
      })
    })

    it('支持 platform 过滤', async () => {
      vi.mocked(listAgents).mockResolvedValueOnce({
        agents: [],
        total: 5,
      })

      const request = new Request(
        'http://localhost/api/forum/agents?platform=agentdex'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(listAgents).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        platform: 'agentdex',
      })
    })

    it('正确计算 has_more', async () => {
      // 测试边界情况：刚好没有更多
      vi.mocked(listAgents).mockResolvedValueOnce({
        agents: [],
        total: 20,
      })

      const request = new Request('http://localhost/api/forum/agents?page=1&limit=20')
      const response = await GET(request)
      const data = await response.json()

      expect(data.has_more).toBe(false) // 1 * 20 = 20 >= 20

      // 测试有更多的情况
      vi.mocked(listAgents).mockResolvedValueOnce({
        agents: [],
        total: 21,
      })

      const request2 = new Request('http://localhost/api/forum/agents?page=1&limit=20')
      const response2 = await GET(request2)
      const data2 = await response2.json()

      expect(data2.has_more).toBe(true) // 1 * 20 = 20 < 21
    })

    it('处理数据库错误', async () => {
      vi.mocked(listAgents).mockRejectedValueOnce(new Error('Database error'))

      const request = new Request('http://localhost/api/forum/agents')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch agents')
    })

    it('处理无效的分页参数（使用默认值）', async () => {
      vi.mocked(listAgents).mockResolvedValueOnce({
        agents: [],
        total: 0,
      })

      const request = new Request(
        'http://localhost/api/forum/agents?page=invalid&limit=abc'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // parseInt('invalid', 10) 返回 NaN，|| fallback 使用默认值
      expect(data.page).toBe(1)
      expect(data.limit).toBe(20)
    })

    it('响应包含 UTF-8 charset', async () => {
      vi.mocked(listAgents).mockResolvedValueOnce({
        agents: [],
        total: 0,
      })

      const request = new Request('http://localhost/api/forum/agents')
      const response = await GET(request)

      expect(response.headers.get('Content-Type')).toBe(
        'application/json; charset=utf-8'
      )
    })
  })

  describe('POST', () => {
    const createPostRequest = (body: object, headers?: Record<string, string>) => {
      return new Request('http://localhost/api/forum/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
      })
    }

    it('验证 Content-Type', async () => {
      const request = new Request('http://localhost/api/forum/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'test',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid content type')
    })

    it('验证 JSON body 格式', async () => {
      const request = new Request('http://localhost/api/forum/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid JSON body')
    })

    it('验证必填字段 name', async () => {
      const request = createPostRequest({ platform: 'agentdex' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: name')
    })

    it('验证必填字段 platform', async () => {
      const request = createPostRequest({ name: 'TestAgent' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: platform')
    })

    it('验证 name 类型', async () => {
      const request = createPostRequest({ name: 123, platform: 'agentdex' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: name')
    })

    it('验证 platform 类型', async () => {
      const request = createPostRequest({ name: 'TestAgent', platform: 123 })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: platform')
    })

    it('验证 name 长度下限（至少 2 字符）', async () => {
      const request = createPostRequest({ name: 'A', platform: 'agentdex' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Name must be 2-20 characters')
    })

    it('验证 name 长度上限（最多 20 字符）', async () => {
      const request = createPostRequest({
        name: 'ThisIsAVeryLongNameThatExceedsTwentyCharacters',
        platform: 'agentdex',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Name must be 2-20 characters')
    })

    it('trim name 前后的空格', async () => {
      vi.mocked(getAgentByName).mockResolvedValueOnce(null)
      vi.mocked(createAgent).mockResolvedValueOnce({
        id: 'new-agent',
        name: 'TestAgent',
        platform: 'agentdex',
        expertise: [],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      })

      const request = createPostRequest({
        name: '  TestAgent  ',
        platform: ' agentdex ',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('TestAgent')
      expect(getAgentByName).toHaveBeenCalledWith('TestAgent', 'agentdex')
      expect(createAgent).toHaveBeenCalledWith({
        name: 'TestAgent',
        platform: 'agentdex',
        expertise: [],
        personality: undefined,
        avatar_url: undefined,
      })
    })

    it('成功创建新 agent', async () => {
      vi.mocked(getAgentByName).mockResolvedValueOnce(null)
      vi.mocked(createAgent).mockResolvedValueOnce({
        id: 'new-agent-id',
        name: 'NewAgent',
        platform: 'agentdex',
        expertise: [],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      })

      const request = createPostRequest({
        name: 'NewAgent',
        platform: 'agentdex',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('NewAgent')
      expect(data.data.platform).toBe('agentdex')
    })

    it('拒绝已存在的 name', async () => {
      vi.mocked(getAgentByName).mockResolvedValueOnce({
        id: 'existing-agent',
        name: 'ExistingAgent',
        platform: 'agentdex',
        expertise: [],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      })

      const request = createPostRequest({
        name: 'ExistingAgent',
        platform: 'agentdex',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toBe('NAME_EXISTS')
      expect(data.message).toBe('该名称已被使用')
      expect(createAgent).not.toHaveBeenCalled()
    })

    it('处理 getAgentByName 数据库错误', async () => {
      vi.mocked(getAgentByName).mockRejectedValueOnce(
        new Error('Database connection error')
      )

      const request = createPostRequest({
        name: 'TestAgent',
        platform: 'agentdex',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection error')
    })

    it('处理 createAgent 唯一约束冲突（race condition）', async () => {
      vi.mocked(getAgentByName).mockResolvedValueOnce(null)
      vi.mocked(createAgent).mockRejectedValueOnce({
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      })

      const request = createPostRequest({
        name: 'RaceAgent',
        platform: 'agentdex',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toBe('NAME_EXISTS')
      expect(data.message).toBe('该名称已被使用')
    })

    it('处理 createAgent 其他数据库错误', async () => {
      vi.mocked(getAgentByName).mockResolvedValueOnce(null)
      vi.mocked(createAgent).mockRejectedValueOnce(new Error('Insert failed'))

      const request = createPostRequest({
        name: 'TestAgent',
        platform: 'agentdex',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create agent')
    })

    it('响应包含 UTF-8 charset', async () => {
      vi.mocked(getAgentByName).mockResolvedValueOnce(null)
      vi.mocked(createAgent).mockResolvedValueOnce({
        id: 'new-agent',
        name: 'Test',
        platform: 'agentdex',
        expertise: [],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      })

      const request = createPostRequest({
        name: 'Test',
        platform: 'agentdex',
      })
      const response = await POST(request)

      expect(response.headers.get('Content-Type')).toBe(
        'application/json; charset=utf-8'
      )
    })

    it('支持中文 agent 名称', async () => {
      vi.mocked(getAgentByName).mockResolvedValueOnce(null)
      vi.mocked(createAgent).mockResolvedValueOnce({
        id: 'chinese-agent',
        name: '智能助手',
        platform: 'agentdex',
        expertise: [],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      })

      const request = createPostRequest({
        name: '智能助手',
        platform: 'agentdex',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('智能助手')
    })

    it('处理 name 边界长度（正好 2 字符）', async () => {
      vi.mocked(getAgentByName).mockResolvedValueOnce(null)
      vi.mocked(createAgent).mockResolvedValueOnce({
        id: 'short-agent',
        name: 'AB',
        platform: 'agentdex',
        expertise: [],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      })

      const request = createPostRequest({
        name: 'AB',
        platform: 'agentdex',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('处理 name 边界长度（正好 20 字符）', async () => {
      const twentyCharName = 'ExactlyTwentyChars!!' // 20 chars
      vi.mocked(getAgentByName).mockResolvedValueOnce(null)
      vi.mocked(createAgent).mockResolvedValueOnce({
        id: 'long-agent',
        name: twentyCharName,
        platform: 'agentdex',
        expertise: [],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      })

      const request = createPostRequest({
        name: twentyCharName,
        platform: 'agentdex',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('处理 null body 字段', async () => {
      const request = createPostRequest({
        name: null,
        platform: 'agentdex',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing or invalid field: name')
    })
  })
})