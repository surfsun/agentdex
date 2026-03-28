import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/stats/route'

// Mock dependencies
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn()
    }
  }
})

import { supabase } from '@/lib/supabase'

// Helper to create a thenable chain for count queries
function createCountChain(count: number | null, error: any | null) {
  const chain = {
    select: vi.fn().mockReturnThis()
  }
  chain.then = (resolve: (value: any) => void) => {
    resolve({ count, error, data: null })
    return Promise.resolve({ count, error, data: null })
  }
  return chain
}

// Helper to create a thenable chain for data queries
function createDataChain(data: any[] | null, error: any | null) {
  const chain = {
    select: vi.fn().mockReturnThis()
  }
  chain.then = (resolve: (value: any) => void) => {
    resolve({ data, error, count: null })
    return Promise.resolve({ data, error, count: null })
  }
  return chain
}

describe('/api/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET - 基础统计', () => {
    it('返回论坛统计数据', async () => {
      // Mock 5 parallel calls with proper table names
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'posts') {
          // First call for count, second call for tags data
          return createCountChain(5, null)
        }
        if (table === 'agent_profiles') {
          return createCountChain(10, null)
        }
        if (table === 'comments') {
          return createCountChain(20, null)
        }
        if (table === 'likes') {
          return createCountChain(50, null)
        }
        // This shouldn't happen in proper flow
        return createCountChain(0, null)
      })

      // Need to handle the second posts call for tags
      let postsCallCount = 0
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'posts') {
          postsCallCount++
          if (postsCallCount === 1) {
            return createCountChain(5, null)
          }
          // Second call for tags data
          return createDataChain([
            { tags: ['技术讨论', '工具推荐'] },
            { tags: ['技术讨论'] }
          ], null)
        }
        if (table === 'agent_profiles') {
          return createCountChain(10, null)
        }
        if (table === 'comments') {
          return createCountChain(20, null)
        }
        if (table === 'likes') {
          return createCountChain(50, null)
        }
        return createCountChain(0, null)
      })

      const response = await GET()
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.stats).toBeDefined()
      expect(data.stats.posts).toBe(5)
      expect(data.stats.agents).toBe(10)
      expect(data.stats.comments).toBe(20)
      expect(data.stats.likes).toBe(50)
      expect(data.stats.tags).toBe(2) // '技术讨论' and '工具推荐'
    })

    it('响应包含 _agent_hint', async () => {
      let postsCallCount = 0
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'posts') {
          postsCallCount++
          if (postsCallCount === 1) return createCountChain(0, null)
          return createDataChain([], null)
        }
        return createCountChain(0, null)
      })

      const response = await GET()
      const data = await response.json()

      expect(data._agent_hint).toBeDefined()
      expect(data._agent_hint.description).toContain('论坛统计')
      expect(data._agent_hint.posts_endpoint).toBeDefined()
      expect(data._agent_hint.agents_endpoint).toBeDefined()
      expect(data._agent_hint.tags_endpoint).toBeDefined()
    })

    it('响应包含 Cache-Control header', async () => {
      let postsCallCount = 0
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'posts') {
          postsCallCount++
          if (postsCallCount === 1) return createCountChain(0, null)
          return createDataChain([], null)
        }
        return createCountChain(0, null)
      })

      const response = await GET()

      expect(response.headers.get('Cache-Control')).toBeDefined()
      expect(response.headers.get('Cache-Control')).toContain('s-maxage=300')
    })
  })

  describe('GET - 标签统计', () => {
    it('正确计算独立标签数', async () => {
      let postsCallCount = 0
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'posts') {
          postsCallCount++
          if (postsCallCount === 1) return createCountChain(0, null)
          return createDataChain([
            { tags: ['技术讨论', '工具推荐', '项目展示'] },
            { tags: ['技术讨论', '问答求助'] },
            { tags: null },
            { tags: [] },
            { tags: ['工具推荐'] }
          ], null)
        }
        return createCountChain(0, null)
      })

      const response = await GET()
      const data = await response.json()

      // Tags: 技术讨论(2), 工具推荐(2), 项目展示(1), 问答求助(1) = 4 unique
      expect(data.stats.tags).toBe(4)
    })

    it('空标签数组不影响统计', async () => {
      let postsCallCount = 0
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'posts') {
          postsCallCount++
          if (postsCallCount === 1) return createCountChain(0, null)
          return createDataChain([{ tags: [] }, { tags: null }], null)
        }
        return createCountChain(0, null)
      })

      const response = await GET()
      const data = await response.json()

      expect(data.stats.tags).toBe(0)
    })
  })

  describe('GET - 错误处理', () => {
    it('catch 捕获异常返回错误响应', async () => {
      // Make supabase.from throw an error
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Connection failed')
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch stats')
      expect(data.stats).toEqual({ posts: 0, agents: 0, comments: 0, likes: 0, tags: 0 })
    })

    it('部分查询失败返回 0（优雅降级）', async () => {
      let postsCallCount = 0
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'posts') {
          postsCallCount++
          if (postsCallCount === 1) return createCountChain(5, null)
          return createDataChain([], null)
        }
        if (table === 'agent_profiles') {
          return createCountChain(null, { message: 'error' }) // fail
        }
        if (table === 'comments') {
          return createCountChain(10, null)
        }
        if (table === 'likes') {
          return createCountChain(null, { message: 'error' }) // fail
        }
        return createCountChain(0, null)
      })

      const response = await GET()
      const data = await response.json()

      expect(data.success).toBe(true) // Graceful degradation
      expect(data.stats.posts).toBe(5)
      expect(data.stats.agents).toBe(0) // fallback to 0
      expect(data.stats.comments).toBe(10)
      expect(data.stats.likes).toBe(0) // fallback to 0
    })
  })

  describe('GET - lastUpdated 字段', () => {
    it('响应包含 lastUpdated 时间戳', async () => {
      let postsCallCount = 0
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'posts') {
          postsCallCount++
          if (postsCallCount === 1) return createCountChain(0, null)
          return createDataChain([], null)
        }
        return createCountChain(0, null)
      })

      const response = await GET()
      const data = await response.json()

      expect(data.stats.lastUpdated).toBeDefined()
      expect(new Date(data.stats.lastUpdated).toISOString()).toBe(data.stats.lastUpdated)
    })
  })
})