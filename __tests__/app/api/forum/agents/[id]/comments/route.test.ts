import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '@/app/api/forum/agents/[id]/comments/route'
import { listCommentsByAuthor } from '@/lib/forum/queries'

// Mock queries
vi.mock('@/lib/forum/queries', () => ({
  listCommentsByAuthor: vi.fn(),
}))

describe('/api/forum/agents/[id]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET', () => {
    const createRequest = (id: string, params?: string) => {
      const url = params
        ? `http://localhost/api/forum/agents/${id}/comments?${params}`
        : `http://localhost/api/forum/agents/${id}/comments`
      return new Request(url)
    }

    it('返回默认分页的评论列表', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          post_id: 'post-1',
          content: 'Test comment 1',
          author_id: 'agent-123',
          author_name: 'TestAgent',
          parent_id: null,
          likes_count: 5,
          created_at: '2026-03-27T00:00:00Z',
        },
        {
          id: 'comment-2',
          post_id: 'post-2',
          content: 'Test comment 2',
          author_id: 'agent-123',
          author_name: 'TestAgent',
          parent_id: 'comment-1',
          likes_count: 2,
          created_at: '2026-03-28T00:00:00Z',
        },
      ]

      vi.mocked(listCommentsByAuthor).mockResolvedValueOnce({
        comments: mockComments,
        total: 2,
      })

      const request = createRequest('agent-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'agent-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockComments)
      expect(data.total).toBe(2)
      expect(data.page).toBe(1)
      expect(data.limit).toBe(10)
      expect(data.has_more).toBe(false)
      expect(listCommentsByAuthor).toHaveBeenCalledWith('agent-123', {
        page: 1,
        limit: 10,
      })
    })

    it('支持自定义分页参数', async () => {
      vi.mocked(listCommentsByAuthor).mockResolvedValueOnce({
        comments: [],
        total: 100,
      })

      const request = createRequest('agent-123', 'page=3&limit=20')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'agent-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.page).toBe(3)
      expect(data.limit).toBe(20)
      expect(data.has_more).toBe(true) // 3 * 20 = 60 < 100
      expect(listCommentsByAuthor).toHaveBeenCalledWith('agent-123', {
        page: 3,
        limit: 20,
      })
    })

    it('正确计算 has_more', async () => {
      // 测试边界情况：刚好没有更多
      vi.mocked(listCommentsByAuthor).mockResolvedValueOnce({
        comments: [],
        total: 10,
      })

      const request = createRequest('agent-123', 'page=1&limit=10')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'agent-123' }),
      })
      const data = await response.json()

      expect(data.has_more).toBe(false) // 1 * 10 = 10 >= 10

      // 测试有更多的情况
      vi.mocked(listCommentsByAuthor).mockResolvedValueOnce({
        comments: [],
        total: 11,
      })

      const request2 = createRequest('agent-123', 'page=1&limit=10')
      const response2 = await GET(request2, {
        params: Promise.resolve({ id: 'agent-123' }),
      })
      const data2 = await response2.json()

      expect(data2.has_more).toBe(true) // 1 * 10 = 10 < 11
    })

    it('返回 400 当缺少 agent ID', async () => {
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
      vi.mocked(listCommentsByAuthor).mockRejectedValueOnce(
        new Error('Database error')
      )

      const request = createRequest('agent-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'agent-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch comments')
    })

    it('返回空列表当 agent 没有评论', async () => {
      vi.mocked(listCommentsByAuthor).mockResolvedValueOnce({
        comments: [],
        total: 0,
      })

      const request = createRequest('agent-no-comments')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'agent-no-comments' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
      expect(data.total).toBe(0)
      expect(data.has_more).toBe(false)
    })

    it('包含评论元数据', async () => {
      const mockComments = [
        {
          id: 'meta-comment',
          post_id: 'post-1',
          content: 'Meta test',
          author_id: 'agent-123',
          author_name: 'TestAgent',
          parent_id: null,
          likes_count: 50,
          created_at: '2026-03-27T00:00:00Z',
        },
      ]

      vi.mocked(listCommentsByAuthor).mockResolvedValueOnce({
        comments: mockComments,
        total: 1,
      })

      const request = createRequest('agent-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'agent-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data[0].likes_count).toBe(50)
      expect(data.data[0].parent_id).toBeNull()
    })

    it('处理嵌套评论（有 parent_id）', async () => {
      const mockComments = [
        {
          id: 'reply-comment',
          post_id: 'post-1',
          content: 'This is a reply',
          author_id: 'agent-123',
          author_name: 'TestAgent',
          parent_id: 'parent-comment-id',
          likes_count: 0,
          created_at: '2026-03-27T00:00:00Z',
        },
      ]

      vi.mocked(listCommentsByAuthor).mockResolvedValueOnce({
        comments: mockComments,
        total: 1,
      })

      const request = createRequest('agent-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'agent-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data[0].parent_id).toBe('parent-comment-id')
    })

    it('处理无效的分页参数', async () => {
      vi.mocked(listCommentsByAuthor).mockResolvedValueOnce({
        comments: [],
        total: 0,
      })

      const request = createRequest('agent-123', 'page=invalid&limit=abc')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'agent-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('支持中文评论内容', async () => {
      const mockComments = [
        {
          id: 'chinese-comment',
          post_id: 'post-1',
          content: '这是一条中文评论',
          author_id: 'agent-123',
          author_name: '测试机器人',
          parent_id: null,
          likes_count: 0,
          created_at: '2026-03-27T00:00:00Z',
        },
      ]

      vi.mocked(listCommentsByAuthor).mockResolvedValueOnce({
        comments: mockComments,
        total: 1,
      })

      const request = createRequest('agent-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'agent-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data[0].content).toBe('这是一条中文评论')
      expect(data.data[0].author_name).toBe('测试机器人')
    })

    it('处理多行评论内容', async () => {
      const mockComments = [
        {
          id: 'multiline-comment',
          post_id: 'post-1',
          content: '第一行\n第二行\n第三行',
          author_id: 'agent-123',
          author_name: 'TestAgent',
          parent_id: null,
          likes_count: 0,
          created_at: '2026-03-27T00:00:00Z',
        },
      ]

      vi.mocked(listCommentsByAuthor).mockResolvedValueOnce({
        comments: mockComments,
        total: 1,
      })

      const request = createRequest('agent-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'agent-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data[0].content).toBe('第一行\n第二行\n第三行')
    })

    it('处理来自不同帖子的评论', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          post_id: 'post-a',
          content: 'Comment on post A',
          author_id: 'agent-123',
          author_name: 'TestAgent',
          parent_id: null,
          likes_count: 0,
          created_at: '2026-03-27T00:00:00Z',
        },
        {
          id: 'comment-2',
          post_id: 'post-b',
          content: 'Comment on post B',
          author_id: 'agent-123',
          author_name: 'TestAgent',
          parent_id: null,
          likes_count: 0,
          created_at: '2026-03-28T00:00:00Z',
        },
      ]

      vi.mocked(listCommentsByAuthor).mockResolvedValueOnce({
        comments: mockComments,
        total: 2,
      })

      const request = createRequest('agent-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'agent-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data[0].post_id).toBe('post-a')
      expect(data.data[1].post_id).toBe('post-b')
    })
  })
})