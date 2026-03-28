import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH, DELETE } from '@/app/api/forum/posts/[id]/route'
import { getPostById, incrementPostViews } from '@/lib/forum/queries'
import { authenticateRequest } from '@/lib/identity/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Mock dependencies
vi.mock('@/lib/forum/queries', () => ({
  getPostById: vi.fn(),
  incrementPostViews: vi.fn()
}))

vi.mock('@/lib/identity/auth', () => ({
  authenticateRequest: vi.fn()
}))

vi.mock('@/lib/supabase', () => {
  const createChain = (result: any) => {
    const chain = {
      from: vi.fn(() => chain),
      update: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      select: vi.fn(() => chain),
      single: vi.fn(() => Promise.resolve(result))
    }
    return chain
  }
  
  return {
    supabaseAdmin: {
      from: vi.fn((table: string) => createChain({ data: null, error: null }))
    }
  }
})

// Helper to create mock request
function createGetRequest(id: string) {
  return new Request(`http://localhost/api/forum/posts/${id}`, {
    method: 'GET'
  })
}

function createPatchRequest(id: string, body: any, headers?: Record<string, string>) {
  return new Request(`http://localhost/api/forum/posts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })
}

function createDeleteRequest(id: string, headers?: Record<string, string>) {
  return new Request(`http://localhost/api/forum/posts/${id}`, {
    method: 'DELETE',
    headers
  })
}

describe('/api/forum/posts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    const mockPost = {
      id: 'post-123',
      author_id: 'agent-456',
      title: '测试帖子',
      content: '这是测试内容',
      tags: ['测试'],
      likes_count: 0,
      comments_count: 0,
      views_count: 10,
      status: 'published',
      created_at: '2026-03-27T10:00:00Z',
      updated_at: '2026-03-27T10:00:00Z'
    }

    it('should return post when found', async () => {
      vi.mocked(getPostById).mockResolvedValue(mockPost)
      vi.mocked(incrementPostViews).mockResolvedValue(undefined)

      const request = createGetRequest('post-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('post-123')
      expect(data.data.title).toBe('测试帖子')
      expect(getPostById).toHaveBeenCalledWith('post-123')
      expect(incrementPostViews).toHaveBeenCalledWith('post-123')
    })

    it('should return 404 when post not found', async () => {
      vi.mocked(getPostById).mockResolvedValue(null)

      const request = createGetRequest('non-existent')
      const response = await GET(request, { params: Promise.resolve({ id: 'non-existent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Post not found')
    })

    it('should return 400 when id is missing', async () => {
      const request = createGetRequest('')
      const response = await GET(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Post ID is required')
    })

    it('should handle database error', async () => {
      vi.mocked(getPostById).mockRejectedValue(new Error('Database error'))

      const request = createGetRequest('post-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch post')
    })
  })

  describe('PATCH', () => {
    const mockPost = {
      id: 'post-123',
      author_id: 'agent-456',
      title: '原标题',
      content: '原内容',
      tags: ['原标签']
    }

    const updatedPost = {
      id: 'post-123',
      author_id: 'agent-456',
      title: '新标题',
      content: '新内容',
      tags: ['新标签']
    }

    it('should return 401 when no authentication', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })

      const request = createPatchRequest('post-123', { title: '新标题' })
      const response = await PATCH(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
      expect(data.code).toBe('AUTH_REQUIRED')
    })

    it('should return 401 when invalid token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      })

      const request = createPatchRequest('post-123', { title: '新标题' }, {
        Authorization: 'Bearer invalid-token'
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid token')
    })

    it('should return 404 when post not found', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-456'
      })
      vi.mocked(getPostById).mockResolvedValue(null)

      const request = createPatchRequest('non-existent', { title: '新标题' }, {
        Authorization: 'Bearer at_valid-token'
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: 'non-existent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Post not found')
    })

    it('should return 403 when not author', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'different-agent'
      })
      vi.mocked(getPostById).mockResolvedValue(mockPost)

      const request = createPatchRequest('post-123', { title: '新标题' }, {
        Authorization: 'Bearer at_valid-token'
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('You can only edit your own posts')
    })

    it('should update post successfully', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-456'
      })
      vi.mocked(getPostById).mockResolvedValue(mockPost)

      // Mock successful update
      const updateChain = {
        from: vi.fn(() => updateChain),
        update: vi.fn(() => updateChain),
        eq: vi.fn(() => updateChain),
        select: vi.fn(() => updateChain),
        single: vi.fn(() => Promise.resolve({ data: updatedPost, error: null }))
      }
      vi.mocked(supabaseAdmin.from).mockReturnValue(updateChain as any)

      const request = createPatchRequest('post-123', { title: '新标题', content: '新内容' }, {
        Authorization: 'Bearer at_valid-token'
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('新标题')
    })

    it('should update only provided fields', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-456'
      })
      vi.mocked(getPostById).mockResolvedValue(mockPost)

      const updateChain = {
        from: vi.fn(() => updateChain),
        update: vi.fn((updates) => {
          // Verify only title is updated, content uses original
          expect(updates.title).toBe('新标题')
          expect(updates.content).toBe('原内容')
          return updateChain
        }),
        eq: vi.fn(() => updateChain),
        select: vi.fn(() => updateChain),
        single: vi.fn(() => Promise.resolve({ data: { ...mockPost, title: '新标题' }, error: null }))
      }
      vi.mocked(supabaseAdmin.from).mockReturnValue(updateChain as any)

      const request = createPatchRequest('post-123', { title: '新标题' }, {
        Authorization: 'Bearer at_valid-token'
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: 'post-123' }) })

      expect(response.status).toBe(200)
    })

    it('should handle database error on update', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-456'
      })
      vi.mocked(getPostById).mockResolvedValue(mockPost)

      const updateChain = {
        from: vi.fn(() => updateChain),
        update: vi.fn(() => updateChain),
        eq: vi.fn(() => updateChain),
        select: vi.fn(() => updateChain),
        single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
      }
      vi.mocked(supabaseAdmin.from).mockReturnValue(updateChain as any)

      const request = createPatchRequest('post-123', { title: '新标题' }, {
        Authorization: 'Bearer at_valid-token'
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to update post')
    })
  })

  describe('DELETE', () => {
    const mockPost = {
      id: 'post-123',
      author_id: 'agent-456',
      title: '测试帖子',
      content: '测试内容'
    }

    it('should return 401 when no authentication', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })

      const request = createDeleteRequest('post-123')
      const response = await DELETE(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 401 when expired token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      })

      const request = createDeleteRequest('post-123', {
        Authorization: 'Bearer at_expired-token'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Token expired')
    })

    it('should return 404 when post not found', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-456'
      })
      vi.mocked(getPostById).mockResolvedValue(null)

      const request = createDeleteRequest('non-existent', {
        Authorization: 'Bearer at_valid-token'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'non-existent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Post not found')
    })

    it('should return 403 when not author', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'different-agent'
      })
      vi.mocked(getPostById).mockResolvedValue(mockPost)

      const request = createDeleteRequest('post-123', {
        Authorization: 'Bearer at_valid-token'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('You can only delete your own posts')
    })

    it('should delete post successfully', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-456'
      })
      vi.mocked(getPostById).mockResolvedValue(mockPost)

      const deleteChain = {
        from: vi.fn(() => deleteChain),
        delete: vi.fn(() => deleteChain),
        eq: vi.fn(() => deleteChain),
        // delete 不需要 select/single
      }
      vi.mocked(supabaseAdmin.from).mockReturnValue(deleteChain as any)

      const request = createDeleteRequest('post-123', {
        Authorization: 'Bearer at_valid-token'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Post deleted')
    })

    it('should handle database error on delete', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-456'
      })
      vi.mocked(getPostById).mockResolvedValue(mockPost)

      // Mock delete with error
      const deleteChain = {
        from: vi.fn(() => deleteChain),
        delete: vi.fn(() => deleteChain),
        eq: vi.fn(() => {
          throw new Error('Database error')
        })
      }
      vi.mocked(supabaseAdmin.from).mockReturnValue(deleteChain as any)

      const request = createDeleteRequest('post-123', {
        Authorization: 'Bearer at_valid-token'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'post-123' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to delete post')
    })
  })

  describe('Response format', () => {
    it('should return UTF-8 charset in Content-Type', async () => {
      const mockPost = {
        id: 'post-123',
        author_id: 'agent-456',
        title: '中文标题',
        content: '中文内容',
        tags: ['中文标签']
      }

      vi.mocked(getPostById).mockResolvedValue(mockPost)
      vi.mocked(incrementPostViews).mockResolvedValue(undefined)

      const request = createGetRequest('post-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'post-123' }) })

      const contentType = response.headers.get('Content-Type')
      expect(contentType).toContain('application/json')
      expect(contentType).toContain('charset=utf-8')
    })
  })
})