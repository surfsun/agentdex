import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '@/app/api/forum/agents/by-name/[name]/route'
import { getAgentByName } from '@/lib/forum/queries'

// Mock queries
vi.mock('@/lib/forum/queries', () => ({
  getAgentByName: vi.fn(),
}))

describe('/api/forum/agents/by-name/[name]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET', () => {
    const createRequest = (name: string) => {
      const encodedName = encodeURIComponent(name)
      return new Request(
        `http://localhost/api/forum/agents/by-name/${encodedName}`
      )
    }

    it('成功返回 agent 信息', async () => {
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

      vi.mocked(getAgentByName).mockResolvedValueOnce(mockAgent)

      const request = createRequest('TestAgent')
      const response = await GET(request, {
        params: Promise.resolve({ name: 'TestAgent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockAgent)
      expect(getAgentByName).toHaveBeenCalledWith('TestAgent', 'agentdex')
    })

    it('返回 404 当 agent 不存在', async () => {
      vi.mocked(getAgentByName).mockResolvedValueOnce(null)

      const request = createRequest('NonExistentAgent')
      const response = await GET(request, {
        params: Promise.resolve({ name: 'NonExistentAgent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Agent not found')
    })

    it('处理数据库错误', async () => {
      vi.mocked(getAgentByName).mockRejectedValueOnce(
        new Error('Database error')
      )

      const request = createRequest('TestAgent')
      const response = await GET(request, {
        params: Promise.resolve({ name: 'TestAgent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch agent')
    })

    it('解码 URL 编码的名称', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        platform: 'agentdex',
        expertise: [],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      }

      vi.mocked(getAgentByName).mockResolvedValueOnce(mockAgent)

      // URL encoded name: "Test%20Agent"
      const request = new Request(
        'http://localhost/api/forum/agents/by-name/Test%20Agent'
      )
      const response = await GET(request, {
        params: Promise.resolve({ name: 'Test%20Agent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.name).toBe('Test Agent')
      // getAgentByName 应接收解码后的名称
      expect(getAgentByName).toHaveBeenCalledWith('Test Agent', 'agentdex')
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

      vi.mocked(getAgentByName).mockResolvedValueOnce(mockAgent)

      // URL encoded Chinese: encodeURIComponent('智能助手') = '%E6%99%BA%E8%83%BD%E5%8A%A9%E6%89%8B'
      const request = new Request(
        'http://localhost/api/forum/agents/by-name/%E6%99%BA%E8%83%BD%E5%8A%A9%E6%89%8B'
      )
      const response = await GET(request, {
        params: Promise.resolve({ name: '%E6%99%BA%E8%83%BD%E5%8A%A9%E6%89%8B' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.name).toBe('智能助手')
      expect(getAgentByName).toHaveBeenCalledWith('智能助手', 'agentdex')
    })

    it('使用默认 platform agentdex', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'TestAgent',
        platform: 'agentdex',
        expertise: [],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      }

      vi.mocked(getAgentByName).mockResolvedValueOnce(mockAgent)

      const request = createRequest('TestAgent')
      const response = await GET(request, {
        params: Promise.resolve({ name: 'TestAgent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      // 确认调用时使用 'agentdex' 作为 platform
      expect(getAgentByName).toHaveBeenCalledWith('TestAgent', 'agentdex')
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

      vi.mocked(getAgentByName).mockResolvedValueOnce(mockAgent)

      const request = createRequest('StatsAgent')
      const response = await GET(request, {
        params: Promise.resolve({ name: 'StatsAgent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.posts_count).toBe(100)
      expect(data.data.comments_count).toBe(200)
    })

    it('处理包含特殊字符的名称', async () => {
      const mockAgent = {
        id: 'special-agent',
        name: 'Agent-123_v2',
        platform: 'agentdex',
        expertise: [],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      }

      vi.mocked(getAgentByName).mockResolvedValueOnce(mockAgent)

      const request = createRequest('Agent-123_v2')
      const response = await GET(request, {
        params: Promise.resolve({ name: 'Agent-123_v2' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.name).toBe('Agent-123_v2')
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

      vi.mocked(getAgentByName).mockResolvedValueOnce(mockAgent)

      const request = createRequest('NoExpertAgent')
      const response = await GET(request, {
        params: Promise.resolve({ name: 'NoExpertAgent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.expertise).toEqual([])
    })

    it('处理有 expertise 数组的 agent', async () => {
      const mockAgent = {
        id: 'expert-agent',
        name: 'ExpertAgent',
        platform: 'agentdex',
        expertise: ['AI', 'ML', 'NLP'],
        avatar_url: null,
        created_at: '2026-03-27T00:00:00Z',
        posts_count: 0,
        comments_count: 0,
      }

      vi.mocked(getAgentByName).mockResolvedValueOnce(mockAgent)

      const request = createRequest('ExpertAgent')
      const response = await GET(request, {
        params: Promise.resolve({ name: 'ExpertAgent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.expertise).toEqual(['AI', 'ML', 'NLP'])
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

      vi.mocked(getAgentByName).mockResolvedValueOnce(mockAgent)

      const request = createRequest('NoAvatarAgent')
      const response = await GET(request, {
        params: Promise.resolve({ name: 'NoAvatarAgent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.avatar_url).toBeNull()
    })

    it('处理有 avatar_url 的 agent', async () => {
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

      vi.mocked(getAgentByName).mockResolvedValueOnce(mockAgent)

      const request = createRequest('AvatarAgent')
      const response = await GET(request, {
        params: Promise.resolve({ name: 'AvatarAgent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.avatar_url).toBe(
        'https://cdn.example.com/avatars/avatar.png'
      )
    })

    it('处理大小写敏感的名称查找', async () => {
      // AgentDex 名称是大小写敏感的
      vi.mocked(getAgentByName).mockResolvedValueOnce(null)

      const request = createRequest('testagent') // lowercase
      const response = await GET(request, {
        params: Promise.resolve({ name: 'testagent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(getAgentByName).toHaveBeenCalledWith('testagent', 'agentdex')
    })
  })
})