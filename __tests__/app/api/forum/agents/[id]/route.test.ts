import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '@/app/api/forum/agents/[id]/route'
import { getAgentByIdOrName } from '@/lib/forum/queries'

// Mock queries
vi.mock('@/lib/forum/queries', () => ({
  getAgentByIdOrName: vi.fn(),
}))

describe('/api/forum/agents/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET', () => {
    const createRequest = (id: string) => {
      return new Request(`http://localhost/api/forum/agents/${id}`)
    }

    it('成功返回 agent 信息 (UUID)', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'TestAgent',
        platform: 'agentdex',
        expertise: ['AI', 'coding'],
        avatar_url: 'https://example.com/avatar.png',
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 5,
        comments_count: 10,
      }

      vi.mocked(getAgentByIdOrName).mockResolvedValueOnce({ agent: mockAgent, isUUID: true })

      const request = createRequest('agent-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'agent-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockAgent)
      expect(getAgentByIdOrName).toHaveBeenCalledWith('agent-123')
    })

    it('成功返回 agent 信息 (名称)', async () => {
      const mockAgent = {
        id: 'agent-uuid',
        name: 'XiaoQiao',
        platform: 'agentdex-web',
        expertise: [],
        avatar_url: null,
        created_at: '2026-03-29T00:00:00Z',
        posts_count: 11,
        comments_count: 0,
      }

      vi.mocked(getAgentByIdOrName).mockResolvedValueOnce({ agent: mockAgent, isUUID: false })

      const request = createRequest('xiaoqiao')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'xiaoqiao' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('XiaoQiao')
      expect(getAgentByIdOrName).toHaveBeenCalledWith('xiaoqiao')
    })

    it('返回 404 当 agent 不存在', async () => {
      vi.mocked(getAgentByIdOrName).mockResolvedValueOnce(null)

      const request = createRequest('non-existent')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'non-existent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Agent not found')
    })

    it('返回 400 当缺少 ID', async () => {
      const request = createRequest('')
      const response = await GET(request, {
        params: Promise.resolve({ id: '' }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Agent ID is required')
    })

    it('处理数据库错误', async () => {
      vi.mocked(getAgentByIdOrName).mockRejectedValueOnce(new Error('Database error'))

      const request = createRequest('agent-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'agent-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch agent')
    })

    it('返回包含统计数据的完整 agent 信息', async () => {
      const mockAgent = {
        id: 'stats-agent',
        name: 'StatsAgent',
        platform: 'agentdex',
        expertise: [],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 100,
        comments_count: 200,
      }

      vi.mocked(getAgentByIdOrName).mockResolvedValueOnce({ agent: mockAgent, isUUID: true })

      const request = createRequest('stats-agent')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'stats-agent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.posts_count).toBe(100)
      expect(data.data.comments_count).toBe(200)
    })

    it('支持中文 agent 名称', async () => {
      const mockAgent = {
        id: 'chinese-agent',
        name: '智能助手',
        platform: 'agentdex',
        expertise: ['NLP'],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 3,
        comments_count: 5,
      }

      vi.mocked(getAgentByIdOrName).mockResolvedValueOnce({ agent: mockAgent, isUUID: true })

      const request = createRequest('chinese-agent')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'chinese-agent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.name).toBe('智能助手')
    })

    it('正确处理 expertise 数组', async () => {
      const mockAgent = {
        id: 'expert-agent',
        name: 'ExpertAgent',
        platform: 'agentdex',
        expertise: ['AI', 'ML', 'NLP', 'Coding'],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      }

      vi.mocked(getAgentByIdOrName).mockResolvedValueOnce({ agent: mockAgent, isUUID: true })

      const request = createRequest('expert-agent')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'expert-agent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.expertise).toEqual(['AI', 'ML', 'NLP', 'Coding'])
    })

    it('处理空 expertise 数组', async () => {
      const mockAgent = {
        id: 'no-expert-agent',
        name: 'NoExpertAgent',
        platform: 'agentdex',
        expertise: [],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      }

      vi.mocked(getAgentByIdOrName).mockResolvedValueOnce({ agent: mockAgent, isUUID: true })

      const request = createRequest('no-expert-agent')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'no-expert-agent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.expertise).toEqual([])
    })

    it('处理 null avatar_url', async () => {
      const mockAgent = {
        id: 'no-avatar-agent',
        name: 'NoAvatarAgent',
        platform: 'agentdex',
        expertise: [],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      }

      vi.mocked(getAgentByIdOrName).mockResolvedValueOnce({ agent: mockAgent, isUUID: true })

      const request = createRequest('no-avatar-agent')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'no-avatar-agent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.avatar_url).toBeNull()
    })

    it('处理有效的 avatar_url', async () => {
      const mockAgent = {
        id: 'avatar-agent',
        name: 'AvatarAgent',
        platform: 'agentdex',
        expertise: [],
        avatar_url: 'https://cdn.example.com/avatars/avatar.png',
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      }

      vi.mocked(getAgentByIdOrName).mockResolvedValueOnce({ agent: mockAgent, isUUID: true })

      const request = createRequest('avatar-agent')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'avatar-agent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.avatar_url).toBe('https://cdn.example.com/avatars/avatar.png')
    })
  })
})