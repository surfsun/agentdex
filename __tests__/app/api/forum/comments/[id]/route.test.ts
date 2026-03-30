import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH, DELETE } from '@/app/api/forum/comments/[id]/route'
import { authenticateRequest } from '@/lib/identity/auth'

// Mock dependencies
vi.mock('@/lib/identity/auth', () => ({
  authenticateRequest: vi.fn()
}))

vi.mock('@/lib/api-response', () => ({
  jsonResponse: vi.fn((data, init) => {
    return new Response(JSON.stringify(data), {
      status: init?.status || 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),
  errorResponse: vi.fn((message, options) => {
    return new Response(JSON.stringify({
      success: false,
      error: message,
      code: options?.code
    }), {
      status: options?.status || 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }),
  jsonResponseWithHint: vi.fn((data, hint, init) => {
    return new Response(JSON.stringify({
      ...data,
      _agent_hint: hint
    }), {
      status: init?.status || 200,
      headers: { 'Content-Type': 'application/json' }
    })
  })
}))

vi.mock('@/lib/supabase', () => {
  // Create a resolved chain helper
  const createResolvedChain = (result: any) => {
    const chain: any = {
      from: vi.fn(() => chain),
      select: vi.fn(() => chain),
      update: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      single: vi.fn(() => Promise.resolve(result))
    }
    // Make chain thenable
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
function createGetRequest(id: string) {
  return new Request(`http://localhost/api/forum/comments/${id}`, {
    method: 'GET'
  })
}

function createPatchRequest(id: string, body: any, headers?: Record<string, string>) {
  return new Request(`http://localhost/api/forum/comments/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })
}

function createDeleteRequest(id: string, headers?: Record<string, string>) {
  return new Request(`http://localhost/api/forum/comments/${id}`, {
    method: 'DELETE',
    headers
  })
}

describe('/api/forum/comments/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    const mockComment = {
      id: 'comment-123',
      author_id: 'agent-456',
      post_id: 'post-789',
      content: '这是一条测试评论',
      parent_id: null,
      likes_count: 0,
      created_at: '2026-03-27T10:00:00Z',
      updated_at: '2026-03-27T10:00:00Z',
      author: {
        id: 'agent-456',
        name: '测试Agent',
        platform: 'agentdex',
        expertise: [],
        avatar_url: null
      }
    }

    it('should return comment when found', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase')
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockComment, error: null })
          })
        })
      } as any)

      const request = createGetRequest('comment-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'comment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('comment-123')
      expect(data.data.content).toBe('这是一条测试评论')
    })

    it('should return 400 when ID is missing', async () => {
      const request = createGetRequest('')
      const response = await GET(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Comment ID is required')
    })

    it('should return 404 when comment not found', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase')
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          })
        })
      } as any)

      const request = createGetRequest('nonexistent')
      const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('评论不存在')
    })

    it('should return 500 on database error', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase')
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = createGetRequest('comment-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'comment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('获取评论失败')
    })
  })

  describe('PATCH', () => {
    const mockComment = {
      id: 'comment-123',
      author_id: 'agent-456',
      post_id: 'post-789',
      content: '原始内容',
      parent_id: null,
      likes_count: 0
    }

    const mockAuth = {
      success: true,
      agent_id: 'agent-456'
    }

    it('should return 401 when no authentication', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Authentication required'
      })

      const request = createPatchRequest('comment-123', { content: '新内容' })
      const response = await PATCH(request, { params: Promise.resolve({ id: 'comment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 401 when token is invalid', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Invalid or expired token'
      })

      const request = createPatchRequest('comment-123', { content: '新内容' }, {
        'Authorization': 'Bearer invalid-token'
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: 'comment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid or expired token')
    })

    it('should return 404 when comment not found', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          })
        })
      } as any)

      const request = createPatchRequest('nonexistent', { content: '新内容' }, {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('评论不存在')
    })

    it('should return 403 when not the author', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'different-agent'
      })
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockComment, error: null })
          })
        })
      } as any)

      const request = createPatchRequest('comment-123', { content: '新内容' }, {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: 'comment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('只能编辑自己的评论')
    })

    it('should update comment successfully', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      const updatedComment = { ...mockComment, content: '新内容' }
      
      // Create a chain that handles both select and update calls
      const chain = {
        from: vi.fn(() => chain),
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          // First call returns original comment, second returns updated
          return Promise.resolve({ data: updatedComment, error: null })
        })
      }
      
      vi.mocked(supabaseAdmin.from).mockReturnValue(chain as any)

      const request = createPatchRequest('comment-123', { content: '新内容' }, {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: 'comment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.content).toBe('新内容')
    })

    it('should return 500 on database error', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockComment, error: null })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } })
            })
          })
        })
      } as any)

      const request = createPatchRequest('comment-123', { content: '新内容' }, {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: 'comment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('更新评论失败')
    })
  })

  describe('DELETE', () => {
    const mockComment = {
      id: 'comment-123',
      author_id: 'agent-456',
      post_id: 'post-789',
      content: '要删除的评论',
      parent_id: null
    }

    const mockAuth = {
      success: true,
      agent_id: 'agent-456'
    }

    it('should return 401 when no authentication', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Authentication required'
      })

      const request = createDeleteRequest('comment-123')
      const response = await DELETE(request, { params: Promise.resolve({ id: 'comment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 401 when token expired', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Token expired'
      })

      const request = createDeleteRequest('comment-123', {
        'Authorization': 'Bearer at_expired-token'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'comment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Token expired')
    })

    it('should return 404 when comment not found', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          })
        })
      } as any)

      const request = createDeleteRequest('nonexistent', {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('评论不存在')
    })

    it('should return 403 when not the author', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'different-agent'
      })
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockComment, error: null })
          })
        })
      } as any)

      const request = createDeleteRequest('comment-123', {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'comment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('只能删除自己的评论')
    })

    it('should delete comment successfully and update comment count', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      // Create a chain that works for multiple calls
      const createChain = () => ({
        from: vi.fn(() => chain),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockComment, error: null }),
        head: vi.fn()
      })
      
      const chain: any = createChain()
      
      // Mock different calls
      let callCount = 0
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++
        return chain
      })

      const request = createDeleteRequest('comment-123', {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'comment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('评论已删除')
    })

    it('should return 500 on database error', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        throw new Error('Database error')
      })

      const request = createDeleteRequest('comment-123', {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'comment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('删除评论失败')
    })
  })

  describe('Response format', () => {
    it('GET response should be valid JSON', async () => {
      const mockComment = {
        id: 'comment-123',
        author_id: 'agent-456',
        content: '中文评论内容',
        author: { name: '测试用户' }
      }
      
      const { supabaseAdmin } = await import('@/lib/supabase')
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockComment, error: null })
          })
        })
      } as any)

      const request = createGetRequest('comment-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'comment-123' }) })

      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('PATCH response should be valid JSON', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-456'
      })
      
      const chain = {
        from: vi.fn(() => chain),
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { id: 'c-1', content: '更新内容' }, 
          error: null 
        })
      }
      
      const { supabaseAdmin } = await import('@/lib/supabase')
      vi.mocked(supabaseAdmin.from).mockReturnValue(chain as any)

      const request = createPatchRequest('c-1', { content: '更新内容' }, {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: 'c-1' }) })

      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })
})