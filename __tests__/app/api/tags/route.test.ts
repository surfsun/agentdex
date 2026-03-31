import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/tags/route'

// Mock dependencies
vi.mock('@/lib/supabase', () => {
  const createChain = (result: { data: any[] | null; error: any | null }) => {
    const chain = {
      select: vi.fn().mockReturnThis()
    }
    // Make chain thenable
    chain.then = (resolve: (value: any) => void) => {
      resolve(result)
      return Promise.resolve(result)
    }
    return chain
  }

  return {
    supabase: {
      from: vi.fn().mockImplementation((table: string) => createChain({ data: [], error: null }))
    }
  }
})

import { supabase } from '@/lib/supabase'

// Helper to create Request with query params
function createTagsRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/tags')
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return new Request(url)
}

describe('/api/tags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET - 标签统计', () => {
    it('返回所有标签统计', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Post 1', tags: ['技术讨论', '工具推荐'], created_at: '2026-03-27', author_id: 'agent-1' },
        { id: 'post-2', title: 'Post 2', tags: ['技术讨论'], created_at: '2026-03-27', author_id: 'agent-2' },
        { id: 'post-3', title: 'Post 3', tags: ['问答求助', '技术讨论'], created_at: '2026-03-27', author_id: 'agent-3' }
      ]

      vi.mocked(supabase.from).mockImplementation(() => {
        const chain = { select: vi.fn().mockReturnThis() }
        chain.then = (resolve: (value: any) => void) => {
          resolve({ data: mockPosts, error: null })
          return Promise.resolve({ data: mockPosts, error: null })
        }
        return chain
      })

      const response = await GET(createTagsRequest())
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.total_tags).toBe(3) // 技术讨论, 工具推荐, 问答求助
      expect(data.tags).toBeDefined()
      expect(data.tags.length).toBe(3)
    })

    it('标签按使用次数排序', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Post 1', tags: ['技术讨论'], created_at: '2026-03-27', author_id: 'agent-1' },
        { id: 'post-2', title: 'Post 2', tags: ['技术讨论', '工具推荐'], created_at: '2026-03-27', author_id: 'agent-2' },
        { id: 'post-3', title: 'Post 3', tags: ['技术讨论'], created_at: '2026-03-27', author_id: 'agent-3' }
      ]

      vi.mocked(supabase.from).mockImplementation(() => {
        const chain = { select: vi.fn().mockReturnThis() }
        chain.then = (resolve: (value: any) => void) => {
          resolve({ data: mockPosts, error: null })
          return Promise.resolve({ data: mockPosts, error: null })
        }
        return chain
      })

      const response = await GET(createTagsRequest())
      const data = await response.json()

      expect(data.tags[0].name).toBe('技术讨论') // 3 times
      expect(data.tags[0].count).toBe(3)
      expect(data.tags[1].name).toBe('工具推荐') // 1 time
      expect(data.tags[1].count).toBe(1)
    })

    it('popular_tags 返回前 10 个', async () => {
      const mockPosts = Array.from({ length: 15 }, (_, i) => ({
        id: `post-${i}`,
        title: `Post ${i}`,
        tags: [`tag-${i % 15}`],
        created_at: '2026-03-27',
        author_id: 'agent-1'
      }))

      vi.mocked(supabase.from).mockImplementation(() => {
        const chain = { select: vi.fn().mockReturnThis() }
        chain.then = (resolve: (value: any) => void) => {
          resolve({ data: mockPosts, error: null })
          return Promise.resolve({ data: mockPosts, error: null })
        }
        return chain
      })

      const response = await GET(createTagsRequest())
      const data = await response.json()

      expect(data.popular_tags.length).toBe(10)
    })

    it('响应包含 _agent_hint', async () => {
      vi.mocked(supabase.from).mockImplementation(() => {
        const chain = { select: vi.fn().mockReturnThis() }
        chain.then = (resolve: (value: any) => void) => {
          resolve({ data: [], error: null })
          return Promise.resolve({ data: [], error: null })
        }
        return chain
      })

      const response = await GET(createTagsRequest())
      const data = await response.json()

      expect(data._agent_hint).toBeDefined()
      expect(data._agent_hint.description).toContain('标签统计')
      expect(data._agent_hint.next_actions).toBeDefined()
      expect(data._agent_hint.endpoints).toBeDefined()
    })
  })

  describe('GET - 指定标签筛选', () => {
    it('指定 tag 参数返回该标签下的帖子', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Tech Post 1', tags: ['技术讨论'], created_at: '2026-03-27', author_id: 'agent-1' },
        { id: 'post-2', title: 'Tool Post', tags: ['工具推荐'], created_at: '2026-03-27', author_id: 'agent-2' },
        { id: 'post-3', title: 'Tech Post 2', tags: ['技术讨论', '问答求助'], created_at: '2026-03-27', author_id: 'agent-3' }
      ]

      vi.mocked(supabase.from).mockImplementation(() => {
        const chain = { select: vi.fn().mockReturnThis() }
        chain.then = (resolve: (value: any) => void) => {
          resolve({ data: mockPosts, error: null })
          return Promise.resolve({ data: mockPosts, error: null })
        }
        return chain
      })

      const response = await GET(createTagsRequest({ tag: '技术讨论' }))
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.tag).toBe('技术讨论')
      expect(data.count).toBe(2)
      expect(data.posts.length).toBe(2)
      expect(data.posts[0].title).toBe('Tech Post 1')
      expect(data.posts[1].title).toBe('Tech Post 2')
    })

    it('标签下的帖子只返回 id, title, created_at', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Tech Post', tags: ['技术讨论'], created_at: '2026-03-27', author_id: 'agent-1' }
      ]

      vi.mocked(supabase.from).mockImplementation(() => {
        const chain = { select: vi.fn().mockReturnThis() }
        chain.then = (resolve: (value: any) => void) => {
          resolve({ data: mockPosts, error: null })
          return Promise.resolve({ data: mockPosts, error: null })
        }
        return chain
      })

      const response = await GET(createTagsRequest({ tag: '技术讨论' }))
      const data = await response.json()

      expect(data.posts[0]).toHaveProperty('id')
      expect(data.posts[0]).toHaveProperty('title')
      expect(data.posts[0]).toHaveProperty('created_at')
      expect(data.posts[0]).not.toHaveProperty('tags')
      expect(data.posts[0]).not.toHaveProperty('author_id')
    })

    it('不存在标签返回空列表', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Post 1', tags: ['技术讨论'], created_at: '2026-03-27', author_id: 'agent-1' }
      ]

      vi.mocked(supabase.from).mockImplementation(() => {
        const chain = { select: vi.fn().mockReturnThis() }
        chain.then = (resolve: (value: any) => void) => {
          resolve({ data: mockPosts, error: null })
          return Promise.resolve({ data: mockPosts, error: null })
        }
        return chain
      })

      const response = await GET(createTagsRequest({ tag: '不存在标签' }))
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.tag).toBe('不存在标签')
      expect(data.count).toBe(0)
      expect(data.posts).toEqual([])
    })

    it('指定标签响应包含 _agent_hint', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Post 1', tags: ['技术讨论'], created_at: '2026-03-27', author_id: 'agent-1' }
      ]

      vi.mocked(supabase.from).mockImplementation(() => {
        const chain = { select: vi.fn().mockReturnThis() }
        chain.then = (resolve: (value: any) => void) => {
          resolve({ data: mockPosts, error: null })
          return Promise.resolve({ data: mockPosts, error: null })
        }
        return chain
      })

      const response = await GET(createTagsRequest({ tag: '技术讨论' }))
      const data = await response.json()

      expect(data._agent_hint).toBeDefined()
      expect(data._agent_hint.description).toContain('技术讨论')
      expect(data._agent_hint.next_actions).toBeDefined()
      expect(data._agent_hint.endpoints).toBeDefined()
    })
  })

  describe('GET - 边界场景', () => {
    it('空帖子返回空标签列表', async () => {
      vi.mocked(supabase.from).mockImplementation(() => {
        const chain = { select: vi.fn().mockReturnThis() }
        chain.then = (resolve: (value: any) => void) => {
          resolve({ data: [], error: null })
          return Promise.resolve({ data: [], error: null })
        }
        return chain
      })

      const response = await GET(createTagsRequest())
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.total_tags).toBe(0)
      expect(data.tags).toEqual([])
      expect(data.popular_tags).toEqual([])
    })

    it('帖子无 tags 字段不影响统计', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Post 1', tags: null, created_at: '2026-03-27', author_id: 'agent-1' },
        { id: 'post-2', title: 'Post 2', tags: undefined, created_at: '2026-03-27', author_id: 'agent-2' },
        { id: 'post-3', title: 'Post 3', created_at: '2026-03-27', author_id: 'agent-3' }
      ]

      vi.mocked(supabase.from).mockImplementation(() => {
        const chain = { select: vi.fn().mockReturnThis() }
        chain.then = (resolve: (value: any) => void) => {
          resolve({ data: mockPosts, error: null })
          return Promise.resolve({ data: mockPosts, error: null })
        }
        return chain
      })

      const response = await GET(createTagsRequest())
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.total_tags).toBe(0)
    })

    it('空字符串标签被忽略（空字符串是 falsy）', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Post 1', tags: ['技术讨论', '', '  '], created_at: '2026-03-27', author_id: 'agent-1' }
      ]

      vi.mocked(supabase.from).mockImplementation(() => {
        const chain = { select: vi.fn().mockReturnThis() }
        chain.then = (resolve: (value: any) => void) => {
          resolve({ data: mockPosts, error: null })
          return Promise.resolve({ data: mockPosts, error: null })
        }
        return chain
      })

      const response = await GET(createTagsRequest())
      const data = await response.json()

      // API 逻辑：if (tag && typeof tag === 'string')
      // 空字符串 '' 是 falsy，会被忽略
      // 空格字符串 '  ' 是 truthy，会被保留
      expect(data.total_tags).toBe(2) // '技术讨论', '  '
    })
  })

  describe('GET - 错误处理', () => {
    it('数据库错误返回 500', async () => {
      vi.mocked(supabase.from).mockImplementation(() => {
        const chain = { select: vi.fn().mockReturnThis() }
        chain.then = (resolve: (value: any) => void) => {
          resolve({ data: null, error: { message: 'Database connection failed' } })
          return Promise.resolve({ data: null, error: { message: 'Database connection failed' } })
        }
        return chain
      })

      const response = await GET(createTagsRequest())
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database error')
      expect(data.details).toBe('Database connection failed')
    })

    it('未知错误返回 500', async () => {
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const response = await GET(createTagsRequest())
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('GET - 中文标签', () => {
    it('正确处理中文标签', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Post 1', tags: ['技术讨论', '工具推荐', '项目展示'], created_at: '2026-03-27', author_id: 'agent-1' },
        { id: 'post-2', title: 'Post 2', tags: ['技术讨论', '问答求助'], created_at: '2026-03-27', author_id: 'agent-2' }
      ]

      vi.mocked(supabase.from).mockImplementation(() => {
        const chain = { select: vi.fn().mockReturnThis() }
        chain.then = (resolve: (value: any) => void) => {
          resolve({ data: mockPosts, error: null })
          return Promise.resolve({ data: mockPosts, error: null })
        }
        return chain
      })

      const response = await GET(createTagsRequest())
      const data = await response.json()

      expect(data.tags[0].name).toBe('技术讨论')
      expect(data.tags[1].name).toBe('工具推荐')
    })

    it('URL 编码的中文标签自动解码（searchParams.get 解码）', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Post 1', tags: ['技术讨论'], created_at: '2026-03-27', author_id: 'agent-1' }
      ]

      vi.mocked(supabase.from).mockImplementation(() => {
        const chain = { select: vi.fn().mockReturnThis() }
        chain.then = (resolve: (value: any) => void) => {
          resolve({ data: mockPosts, error: null })
          return Promise.resolve({ data: mockPosts, error: null })
        }
        return chain
      })

      // URL.searchParams.set 会自动编码，但 searchParams.get 会自动解码
      const url = new URL('http://localhost/api/tags')
      url.searchParams.set('tag', '技术讨论')
      const request = new Request(url)

      const response = await GET(request)
      const data = await response.json()

      expect(data.tag).toBe('技术讨论')
    })
  })
})