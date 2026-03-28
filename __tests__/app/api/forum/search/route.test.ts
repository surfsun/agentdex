import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/forum/search/route'

// Mock dependencies
vi.mock('@/lib/supabase', () => {
  const createChain = (result: { data: any[] | null; error: any | null; count: number | null }) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockImplementation(() => Promise.resolve(result))
    }
    // Make chain thenable
    chain.then = (resolve: (value: any) => void) => {
      resolve(result)
      return Promise.resolve(result)
    }
    return chain
  }

  return {
    supabaseAdmin: {
      from: vi.fn().mockImplementation((table: string) => createChain({ data: [], error: null, count: 0 }))
    }
  }
})

import { supabaseAdmin } from '@/lib/supabase'

// Helper to create search URL
function createSearchUrl(params: Record<string, string>): URL {
  const url = new URL('http://localhost/api/forum/search')
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return url
}

// Helper to create Request
function createSearchRequest(params: Record<string, string>): Request {
  const url = createSearchUrl(params)
  return new Request(url)
}

describe('/api/forum/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET - 参数验证', () => {
    it('无参数返回提示信息', async () => {
      const request = createSearchRequest({})
      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toContain('请提供搜索关键词')
      expect(data.data).toEqual([])
      expect(data.total).toBe(0)
    })

    it('空字符串 q 参数返回提示信息', async () => {
      const request = createSearchRequest({ q: '' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toContain('请提供搜索关键词')
    })

    it('单字符 q 参数返回提示信息（需要至少2个字符）', async () => {
      const request = createSearchRequest({ q: 'a' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toContain('至少2个字符')
    })

    it('仅 tag 参数有效', async () => {
      const mockData = [{
        id: 'post-1',
        title: 'Test Post',
        content: 'Content',
        tags: ['技术讨论'],
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        created_at: '2026-03-27',
        author: { id: 'agent-1', name: 'TestAgent', platform: 'web', avatar_url: null }
      }]

      const chain = {
        select: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: mockData, error: null, count: 1 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: mockData, error: null, count: 1 })
        return Promise.resolve({ data: mockData, error: null, count: 1 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ tag: '技术讨论' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.tag).toBe('技术讨论')
      expect(data.total).toBe(1)
    })

    it('q 参数至少2个字符有效', async () => {
      const mockData = [{
        id: 'post-1',
        title: 'OpenClaw Test',
        content: 'Testing OpenClaw',
        tags: ['工具推荐'],
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        created_at: '2026-03-27',
        author: { id: 'agent-1', name: 'TestAgent', platform: 'web', avatar_url: null }
      }]

      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: mockData, error: null, count: 1 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: mockData, error: null, count: 1 })
        return Promise.resolve({ data: mockData, error: null, count: 1 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'OpenClaw' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.query).toBe('OpenClaw')
      expect(data.total).toBe(1)
    })
  })

  describe('GET - 全文搜索模式', () => {
    it('仅 q 参数进行全文搜索', async () => {
      const mockData = [{
        id: 'post-1',
        title: 'Agent Discussion',
        content: 'Discussing AI agents',
        tags: ['技术讨论'],
        likes_count: 5,
        comments_count: 2,
        views_count: 100,
        created_at: '2026-03-27T10:00:00Z',
        author: { id: 'agent-1', name: 'TestAgent', platform: 'agentdex', avatar_url: null }
      }]

      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: mockData, error: null, count: 1 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: mockData, error: null, count: 1 })
        return Promise.resolve({ data: mockData, error: null, count: 1 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'agent' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.query).toBe('agent')
      expect(data.tag).toBe('')
      expect(supabaseAdmin.from).toHaveBeenCalledWith('posts')
      expect(chain.textSearch).toHaveBeenCalledWith('search_vector', 'agent', {
        type: 'websearch',
        config: 'simple'
      })
    })

    it('搜索结果包含 content_snippet', async () => {
      const mockData = [{
        id: 'post-1',
        title: 'OpenClaw Browser',
        content: '今天测试了 OpenClaw，发现它可以让 AI Agent 操控浏览器',
        tags: ['工具推荐'],
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        created_at: '2026-03-27',
        author: { id: 'agent-1', name: 'TestAgent', platform: 'web', avatar_url: null }
      }]

      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: mockData, error: null, count: 1 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: mockData, error: null, count: 1 })
        return Promise.resolve({ data: mockData, error: null, count: 1 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'OpenClaw' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.data[0]).toHaveProperty('content_snippet')
      expect(data.data[0].content_snippet).toContain('OpenClaw')
    })

    it('搜索结果包含 title_highlighted', async () => {
      const mockData = [{
        id: 'post-1',
        title: 'OpenClaw 测试报告',
        content: '详细测试',
        tags: ['工具推荐'],
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        created_at: '2026-03-27',
        author: { id: 'agent-1', name: 'TestAgent', platform: 'web', avatar_url: null }
      }]

      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: mockData, error: null, count: 1 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: mockData, error: null, count: 1 })
        return Promise.resolve({ data: mockData, error: null, count: 1 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'OpenClaw' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.data[0]).toHaveProperty('title_highlighted')
      expect(data.data[0].title_highlighted).toContain('==HIGHLIGHT==')
    })

    it('空搜索结果返回空数组', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: [], error: null, count: 0 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: [], error: null, count: 0 })
        return Promise.resolve({ data: [], error: null, count: 0 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'nonexistent' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
      expect(data.total).toBe(0)
      expect(data.has_more).toBe(false)
    })
  })

  describe('GET - 标签筛选模式', () => {
    it('仅 tag 参数进行标签筛选', async () => {
      const mockData = [{
        id: 'post-1',
        title: 'Tool Post',
        content: 'Content',
        tags: ['工具推荐'],
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        created_at: '2026-03-27',
        author: { id: 'agent-1', name: 'TestAgent', platform: 'web', avatar_url: null }
      }]

      const chain = {
        select: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: mockData, error: null, count: 1 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: mockData, error: null, count: 1 })
        return Promise.resolve({ data: mockData, error: null, count: 1 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ tag: '工具推荐' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.query).toBe('')
      expect(data.tag).toBe('工具推荐')
      expect(chain.contains).toHaveBeenCalledWith('tags', ['工具推荐'])
    })

    it('URL 编码的 tag 参数正确解码', async () => {
      const mockData = [{
        id: 'post-1',
        title: 'Tech Post',
        content: 'Content',
        tags: ['技术讨论'],
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        created_at: '2026-03-27',
        author: { id: 'agent-1', name: 'TestAgent', platform: 'web', avatar_url: null }
      }]

      const chain = {
        select: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: mockData, error: null, count: 1 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: mockData, error: null, count: 1 })
        return Promise.resolve({ data: mockData, error: null, count: 1 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ tag: encodeURIComponent('技术讨论') })
      const response = await GET(request)
      const data = await response.json()

      expect(data.tag).toBe('技术讨论')
    })
  })

  describe('GET - 组合搜索模式', () => {
    it('q + tag 组合搜索', async () => {
      const mockData = [{
        id: 'post-1',
        title: 'OpenClaw Tool',
        content: 'Testing OpenClaw',
        tags: ['工具推荐'],
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        created_at: '2026-03-27',
        author: { id: 'agent-1', name: 'TestAgent', platform: 'web', avatar_url: null }
      }]

      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: mockData, error: null, count: 1 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: mockData, error: null, count: 1 })
        return Promise.resolve({ data: mockData, error: null, count: 1 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'OpenClaw', tag: '工具推荐' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.query).toBe('OpenClaw')
      expect(data.tag).toBe('工具推荐')
      expect(chain.textSearch).toHaveBeenCalled()
      expect(chain.contains).toHaveBeenCalled()
    })
  })

  describe('GET - 分页参数', () => {
    it('默认 page=1, limit=20', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: [], error: null, count: 0 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: [], error: null, count: 0 })
        return Promise.resolve({ data: [], error: null, count: 0 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'test' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.page).toBe(1)
      expect(data.limit).toBe(20)
      expect(chain.range).toHaveBeenCalledWith(0, 19) // (page-1)*limit to page*limit-1
    })

    it('自定义 page 和 limit', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: [], error: null, count: 0 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: [], error: null, count: 0 })
        return Promise.resolve({ data: [], error: null, count: 0 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'test', page: '2', limit: '30' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.page).toBe(2)
      expect(data.limit).toBe(30)
      expect(chain.range).toHaveBeenCalledWith(30, 59) // (2-1)*30 to 2*30-1
    })

    it('limit 最大为 50', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: [], error: null, count: 0 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: [], error: null, count: 0 })
        return Promise.resolve({ data: [], error: null, count: 0 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'test', limit: '100' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.limit).toBe(50) // capped at 50
    })

    it('has_more 正确计算', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: [], error: null, count: 25 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: [], error: null, count: 25 })
        return Promise.resolve({ data: [], error: null, count: 25 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'test', limit: '20' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.has_more).toBe(true) // 25 > 20
    })
  })

  describe('GET - 排序参数', () => {
    it('默认按 created_at 降序', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: [], error: null, count: 0 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: [], error: null, count: 0 })
        return Promise.resolve({ data: [], error: null, count: 0 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'test' })
      await GET(request)

      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })

  describe('GET - 错误处理', () => {
    it('数据库错误返回空结果（优雅降级）', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'DB error' }, count: null })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: null, error: { message: 'DB error' }, count: null })
        return Promise.resolve({ data: null, error: { message: 'DB error' }, count: null })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'test' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true) // Graceful degradation
      expect(data.data).toEqual([])
      expect(data.total).toBe(0)
    })

    it('textSearch 解析失败时使用 plain 搜索', async () => {
      // First call (websearch) fails, second call (plain) succeeds
      const mockData = [{
        id: 'post-1',
        title: 'Test',
        content: 'Content',
        tags: [],
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        created_at: '2026-03-27',
        author: { id: 'agent-1', name: 'TestAgent', platform: 'web', avatar_url: null }
      }]

      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockImplementation((_field: string, _term: string, opts: any) => {
          if (opts.type === 'websearch') {
            throw new Error('websearch parsing failed')
          }
          return chain
        }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: mockData, error: null, count: 1 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: mockData, error: null, count: 1 })
        return Promise.resolve({ data: mockData, error: null, count: 1 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(chain)

      const request = createSearchRequest({ q: 'test' })
      const response = await GET(request)
      const data = await response.json()

      // Should succeed with fallback
      expect(data.success).toBe(true)
    })
  })

  describe('GET - 响应格式验证', () => {
    it('响应包含必要字段', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: [], error: null, count: 0 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: [], error: null, count: 0 })
        return Promise.resolve({ data: [], error: null, count: 0 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'test' })
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('query')
      expect(data).toHaveProperty('tag')
      expect(data).toHaveProperty('data')
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('page')
      expect(data).toHaveProperty('limit')
      expect(data).toHaveProperty('has_more')
    })

    it('搜索结果包含 author 信息', async () => {
      const mockData = [{
        id: 'post-1',
        title: 'Test',
        content: 'Content',
        tags: [],
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        created_at: '2026-03-27',
        author: { id: 'agent-1', name: 'TestAgent', platform: 'agentdex', avatar_url: 'https://example.com/avatar.png' }
      }]

      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: mockData, error: null, count: 1 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: mockData, error: null, count: 1 })
        return Promise.resolve({ data: mockData, error: null, count: 1 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'test' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.data[0].author).toBeDefined()
      expect(data.data[0].author.name).toBe('TestAgent')
    })
  })

  describe('GET - 边界场景', () => {
    it('超长搜索词截断到 100 字符', async () => {
      const longQuery = 'a'.repeat(150)
      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: [], error: null, count: 0 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: [], error: null, count: 0 })
        return Promise.resolve({ data: [], error: null, count: 0 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: longQuery })
      const response = await GET(request)
      const data = await response.json()

      expect(data.query.length).toBeLessThanOrEqual(100)
    })

    it('无效 page 参数使用默认值 1', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: [], error: null, count: 0 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: [], error: null, count: 0 })
        return Promise.resolve({ data: [], error: null, count: 0 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'test', page: 'invalid' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.page).toBe(1) // NaN defaults to 1
    })

    it('无效 limit 参数使用默认值 20', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({ data: [], error: null, count: 0 })
      }
      chain.then = (resolve: (value: any) => void) => {
        resolve({ data: [], error: null, count: 0 })
        return Promise.resolve({ data: [], error: null, count: 0 })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain)

      const request = createSearchRequest({ q: 'test', limit: 'invalid' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.limit).toBe(20) // NaN defaults to 20
    })
  })
})