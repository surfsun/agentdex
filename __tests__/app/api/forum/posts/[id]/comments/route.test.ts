import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/forum/posts/[id]/comments/route'
import { getPostById, getCommentsByPostId, buildCommentTree, createComment } from '@/lib/forum/queries'
import { authenticateRequest } from '@/lib/identity/auth'

// Mock dependencies
vi.mock('@/lib/forum/queries', () => ({
  getPostById: vi.fn(),
  getCommentsByPostId: vi.fn(),
  buildCommentTree: vi.fn(),
  createComment: vi.fn()
}))

vi.mock('@/lib/identity/auth', () => ({
  authenticateRequest: vi.fn()
}))

vi.mock('@/lib/supabase', () => {
  const createResolvedChain = (result: any) => {
    const chain: any = {
      from: vi.fn(() => chain),
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      single: vi.fn(() => Promise.resolve(result))
    }
    chain.then = (resolve: any) => resolve(result)
    return chain
  }
  
  return {
    supabaseAdmin: {
      from: vi.fn((table: string) => createResolvedChain({ data: null, error: null }))
    }
  }
})

// Helper to create mock request
function createGetRequest(postId: string) {
  return new Request(`http://localhost/api/forum/posts/${postId}/comments`, {
    method: 'GET'
  })
}

function createPostRequest(postId: string, body: any, headers?: Record<string, string>) {
  return new Request(`http://localhost/api/forum/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })
}

describe('/api/forum/posts/[id]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    const mockPost = {
      id: 'post-123',
      author_id: 'agent-456',
      title: '测试帖子',
      content: '帖子内容',
      status: 'published'
    }

    const mockComments = [
      {
        id: 'comment-1',
        post_id: 'post-123',
        author_id: 'agent-1',
        content: '第一条评论',
        parent_id: null,
        likes_count: 0,
        created_at: '2026-03-27T10:00:00Z',
        author: { id: 'agent-1', name: '用户1' }
      },
      {
        id: 'comment-2',
        post_id: 'post-123',
        author_id: 'agent-2',
        content: '第二条评论',
        parent_id: 'comment-1',
        likes_count: 1,
        created_at: '2026-03-27T10:30:00Z',
        author: { id: 'agent-2', name: '用户2' }
      }
    ]

    const mockCommentTree = [
      {
        ...mockComments[0],
        replies: [mockComments[1]]
      }
    ]

    it('should return comment tree when post exists', async () => {
      vi.mocked(getPostById).mockResolvedValue(mockPost)
      vi.mocked(getCommentsByPostId).mockResolvedValue(mockComments)
      vi.mocked(buildCommentTree).mockReturnValue(mockCommentTree)

      const request = createGetRequest('post-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].replies).toHaveLength(1)
      expect(data.total).toBe(2)
      expect(getCommentsByPostId).toHaveBeenCalledWith('post-123')
      expect(buildCommentTree).toHaveBeenCalledWith(mockComments)
    })

    it('should return empty tree when no comments', async () => {
      vi.mocked(getPostById).mockResolvedValue(mockPost)
      vi.mocked(getCommentsByPostId).mockResolvedValue([])
      vi.mocked(buildCommentTree).mockReturnValue([])

      const request = createGetRequest('post-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(0)
      expect(data.total).toBe(0)
    })

    it('should return 400 when post ID is missing', async () => {
      const request = createGetRequest('')
      const response = await GET(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Post ID is required')
    })

    it('should return 404 when post not found', async () => {
      vi.mocked(getPostById).mockResolvedValue(null)

      const request = createGetRequest('nonexistent')
      const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Post not found')
    })

    it('should return 500 on database error', async () => {
      vi.mocked(getPostById).mockRejectedValue(new Error('Database error'))

      const request = createGetRequest('post-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch comments')
    })

    it('should handle nested replies correctly', async () => {
      const nestedComments = [
        { id: 'c1', parent_id: null, content: '根评论' },
        { id: 'c2', parent_id: 'c1', content: '一级回复' },
        { id: 'c3', parent_id: 'c2', content: '二级回复' },
        { id: 'c4', parent_id: 'c3', content: '三级回复' }
      ]
      
      const nestedTree = [
        {
          id: 'c1',
          replies: [
            {
              id: 'c2',
              replies: [
                {
                  id: 'c3',
                  replies: [{ id: 'c4' }]
                }
              ]
            }
          ]
        }
      ]

      vi.mocked(getPostById).mockResolvedValue(mockPost)
      vi.mocked(getCommentsByPostId).mockResolvedValue(nestedComments)
      vi.mocked(buildCommentTree).mockReturnValue(nestedTree)

      const request = createGetRequest('post-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.total).toBe(4)
    })
  })

  describe('POST', () => {
    const mockPost = {
      id: 'post-123',
      author_id: 'agent-456',
      title: '测试帖子',
      status: 'published'
    }

    const mockAuth = {
      success: true,
      agent_id: 'agent-123'
    }

    const mockNewComment = {
      id: 'comment-new',
      post_id: 'post-123',
      author_id: 'agent-123',
      content: '新评论内容',
      parent_id: null,
      likes_count: 0
    }

    it('should return 401 when no authentication', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Authentication required'
      })

      const request = createPostRequest('post-123', { content: '新评论' })
      const response = await POST(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 401 when invalid token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Invalid token'
      })

      const request = createPostRequest('post-123', { content: '新评论' }, {
        'Authorization': 'Bearer invalid'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid token')
    })

    it('should return 400 when post ID missing', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)

      const request = createPostRequest('', { content: '新评论' })
      const response = await POST(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Post ID is required')
    })

    it('should return 404 when post not found', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      vi.mocked(getPostById).mockResolvedValue(null)

      const request = createPostRequest('nonexistent', { content: '新评论' }, {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Post not found')
    })

    it('should return 400 when content is missing', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      vi.mocked(getPostById).mockResolvedValue(mockPost)

      const request = createPostRequest('post-123', {}, {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing required field: content')
    })

    it('should create root comment successfully', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      vi.mocked(getPostById).mockResolvedValue(mockPost)
      vi.mocked(createComment).mockResolvedValue(mockNewComment)

      const request = createPostRequest('post-123', { content: '新评论内容' }, {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.content).toBe('新评论内容')
      expect(createComment).toHaveBeenCalledWith('post-123', 'agent-123', {
        content: '新评论内容',
        parent_id: undefined
      })
    })

    it('should create reply comment successfully', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      vi.mocked(getPostById).mockResolvedValue(mockPost)
      
      const { supabaseAdmin } = await import('@/lib/supabase')
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { parent_id: null }, error: null })
          })
        })
      } as any)

      const replyComment = {
        ...mockNewComment,
        parent_id: 'comment-parent'
      }
      vi.mocked(createComment).mockResolvedValue(replyComment)

      const request = createPostRequest('post-123', { 
        content: '回复内容', 
        parent_id: 'comment-parent' 
      }, {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.parent_id).toBe('comment-parent')
    })

    it('should return 400 when nesting level exceeds maximum (3 levels)', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      vi.mocked(getPostById).mockResolvedValue(mockPost)
      
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      // Mock chain to simulate 3+ levels of nesting (max is 3)
      // getCommentNestingLevel traverses up the parent chain
      let callCount = 0
      vi.mocked(supabaseAdmin.from).mockImplementation(() => ({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => {
              callCount++
              // Level 1: parent_id = 'p2', Level 2: parent_id = 'p1', Level 3: parent_id = null
              // When replying to level 3 comment, nesting would be 4 (exceeds max)
              if (callCount === 1) return Promise.resolve({ data: { parent_id: 'parent-2' }, error: null })
              if (callCount === 2) return Promise.resolve({ data: { parent_id: 'parent-1' }, error: null })
              if (callCount === 3) return Promise.resolve({ data: { parent_id: null }, error: null })
              return Promise.resolve({ data: { parent_id: null }, error: null })
            })
          })
        })
      }) as any)

      const request = createPostRequest('post-123', { 
        content: '深层回复', 
        parent_id: 'comment-3' 
      }, {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      // API should reject when trying to reply to a level 3 comment
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Maximum nesting level (3) reached')
    })

    it('should return 500 on database error', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      vi.mocked(getPostById).mockResolvedValue(mockPost)
      vi.mocked(createComment).mockRejectedValue(new Error('Database error'))

      const request = createPostRequest('post-123', { content: '新评论' }, {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create comment')
    })
  })

  describe('Response format', () => {
    it('GET response should be valid JSON', async () => {
      vi.mocked(getPostById).mockResolvedValue({ id: 'p1', status: 'published' })
      vi.mocked(getCommentsByPostId).mockResolvedValue([])
      vi.mocked(buildCommentTree).mockReturnValue([])

      const request = createGetRequest('p1')
      const response = await GET(request, { params: Promise.resolve({ id: 'p1' }) })

      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('POST response should be valid JSON', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({ success: true, agent_id: 'a1' })
      vi.mocked(getPostById).mockResolvedValue({ id: 'p1', status: 'published' })
      vi.mocked(createComment).mockResolvedValue({ id: 'c1', content: '中文评论' })

      const request = createPostRequest('p1', { content: '中文评论' }, {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'p1' }) })

      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should handle Chinese characters in comment content', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({ success: true, agent_id: 'a1' })
      vi.mocked(getPostById).mockResolvedValue({ id: 'p1', status: 'published' })
      
      const chineseComment = {
        id: 'c1',
        content: '这是一条中文评论，包含特殊字符：😀🎉'
      }
      vi.mocked(createComment).mockResolvedValue(chineseComment)

      const request = createPostRequest('p1', { content: chineseComment.content }, {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'p1' }) })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.content).toBe(chineseComment.content)
    })
  })

  describe('Authentication variants', () => {
    it('should work with API Key (ak_) Bearer token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-api-key'
      })
      vi.mocked(getPostById).mockResolvedValue({ id: 'p1', status: 'published' })
      vi.mocked(createComment).mockResolvedValue({ id: 'c1', content: '评论' })

      const request = createPostRequest('p1', { content: '评论' }, {
        'Authorization': 'Bearer ak_test-api-key'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'p1' }) })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(authenticateRequest).toHaveBeenCalled()
    })

    it('should work with Access Token (at_) Bearer token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-access-token'
      })
      vi.mocked(getPostById).mockResolvedValue({ id: 'p1', status: 'published' })
      vi.mocked(createComment).mockResolvedValue({ id: 'c1', content: '评论' })

      const request = createPostRequest('p1', { content: '评论' }, {
        'Authorization': 'Bearer at_test-access-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'p1' }) })
      const data = await response.json()

      expect(response.status).toBe(201)
    })

    it('should work with legacy X-Agent-Id header', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'legacy-agent-id'
      })
      vi.mocked(getPostById).mockResolvedValue({ id: 'p1', status: 'published' })
      vi.mocked(createComment).mockResolvedValue({ id: 'c1', content: '评论' })

      const request = createPostRequest('p1', { content: '评论' }, {
        'X-Agent-Id': 'legacy-agent-id'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'p1' }) })
      const data = await response.json()

      expect(response.status).toBe(201)
    })
  })
})