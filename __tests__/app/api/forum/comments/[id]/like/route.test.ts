import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/forum/comments/[id]/like/route'
import { likeTarget } from '@/lib/forum/queries'
import { authenticateRequest } from '@/lib/identity/auth'

// Mock dependencies
vi.mock('@/lib/forum/queries', () => ({
  likeTarget: vi.fn()
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
function createPostRequest(commentId: string, headers?: Record<string, string>) {
  return new Request(`http://localhost/api/forum/comments/${commentId}/like`, {
    method: 'POST',
    headers
  })
}

describe('/api/forum/comments/[id]/like', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST', () => {
    const mockAuth = {
      success: true,
      agent_id: 'agent-123'
    }

    const mockComment = {
      id: 'comment-456',
      author_id: 'agent-other',
      content: '被点赞的评论'
    }

    it('should return 401 when no authentication', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Authentication required'
      })

      const request = createPostRequest('comment-456')
      const response = await POST(request, { params: Promise.resolve({ id: 'comment-456' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
      expect(likeTarget).not.toHaveBeenCalled()
    })

    it('should return 401 when token is invalid', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Invalid or expired token'
      })

      const request = createPostRequest('comment-456', {
        'Authorization': 'Bearer invalid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'comment-456' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid or expired token')
    })

    it('should return 400 when comment ID is missing', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)

      const request = createPostRequest('')
      const response = await POST(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Comment ID is required')
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

      const request = createPostRequest('nonexistent', {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Comment not found')
      expect(likeTarget).not.toHaveBeenCalled()
    })

    it('should like comment successfully (new like)', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockComment, error: null })
          })
        })
      } as any)
      
      vi.mocked(likeTarget).mockResolvedValue(true)

      const request = createPostRequest('comment-456', {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'comment-456' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.liked).toBe(true)
      expect(likeTarget).toHaveBeenCalledWith('agent-123', 'comment', 'comment-456')
    })

    it('should unlike comment successfully (remove like)', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockComment, error: null })
          })
        })
      } as any)
      
      vi.mocked(likeTarget).mockResolvedValue(false)

      const request = createPostRequest('comment-456', {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'comment-456' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.liked).toBe(false)
      expect(likeTarget).toHaveBeenCalledWith('agent-123', 'comment', 'comment-456')
    })

    it('should allow author to like own comment', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-other' // Same as comment author
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
      
      vi.mocked(likeTarget).mockResolvedValue(true)

      const request = createPostRequest('comment-456', {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'comment-456' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.liked).toBe(true)
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
        })
      } as any)
      
      vi.mocked(likeTarget).mockRejectedValue(new Error('Database error'))

      const request = createPostRequest('comment-456', {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'comment-456' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to like/unlike comment')
    })

    it('should return 500 when likeTarget throws', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockComment, error: null })
          })
        })
      } as any)
      
      vi.mocked(likeTarget).mockImplementation(() => {
        throw new Error('Like operation failed')
      })

      const request = createPostRequest('comment-456', {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'comment-456' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to like/unlike comment')
    })
  })

  describe('Response format', () => {
    it('should return valid JSON content type', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({ success: true, agent_id: 'a1' })
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null })
          })
        })
      } as any)
      
      vi.mocked(likeTarget).mockResolvedValue(true)

      const request = createPostRequest('c1', {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'c1' }) })

      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should return correct JSON structure', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({ success: true, agent_id: 'a1' })
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null })
          })
        })
      } as any)
      
      vi.mocked(likeTarget).mockResolvedValue(true)

      const request = createPostRequest('c1', {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'c1' }) })
      const data = await response.json()

      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('liked')
      expect(typeof data.success).toBe('boolean')
      expect(typeof data.liked).toBe('boolean')
    })
  })

  describe('Authentication variants', () => {
    it('should work with API Key (ak_) Bearer token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-api-key'
      })
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null })
          })
        })
      } as any)
      
      vi.mocked(likeTarget).mockResolvedValue(true)

      const request = createPostRequest('c1', {
        'Authorization': 'Bearer ak_test-api-key'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'c1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.liked).toBe(true)
    })

    it('should work with Access Token (at_) Bearer token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-access-token'
      })
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null })
          })
        })
      } as any)
      
      vi.mocked(likeTarget).mockResolvedValue(false)

      const request = createPostRequest('c1', {
        'Authorization': 'Bearer at_test-access-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'c1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.liked).toBe(false)
    })

    it('should work with legacy X-Agent-Id header', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'legacy-agent-id'
      })
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null })
          })
        })
      } as any)
      
      vi.mocked(likeTarget).mockResolvedValue(true)

      const request = createPostRequest('c1', {
        'X-Agent-Id': 'legacy-agent-id'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'c1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.liked).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should handle concurrent likes correctly', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({ success: true, agent_id: 'a1' })
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null })
          })
        })
      } as any)
      
      // likeTarget handles toggle logic
      vi.mocked(likeTarget).mockResolvedValue(true)

      const request1 = createPostRequest('c1', { 'Authorization': 'Bearer at_1' })
      const request2 = createPostRequest('c1', { 'Authorization': 'Bearer at_2' })

      const [response1, response2] = await Promise.all([
        POST(request1, { params: Promise.resolve({ id: 'c1' }) }),
        POST(request2, { params: Promise.resolve({ id: 'c1' }) })
      ])

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
    })

    it('should handle non-existent comment gracefully', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({ success: true, agent_id: 'a1' })
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        from: vi.fn(),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      } as any)

      const request = createPostRequest('nonexistent', {
        'Authorization': 'Bearer at_valid-token'
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(likeTarget).not.toHaveBeenCalled()
    })
  })
})