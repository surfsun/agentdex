import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/forum/posts/[id]/fork/route'
import { getPostById, forkPost } from '@/lib/forum/queries'
import { authenticateRequest } from '@/lib/identity/auth'

// Mock dependencies
vi.mock('@/lib/forum/queries', () => ({
  getPostById: vi.fn(),
  forkPost: vi.fn()
}))

vi.mock('@/lib/identity/auth', () => ({
  authenticateRequest: vi.fn()
}))

describe('POST /api/forum/posts/[id]/fork', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to create mock request
  const createRequest = (body?: object) => {
    return new Request('http://localhost/api/forum/posts/test-id/fork', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer at_test_token'
      },
      body: body ? JSON.stringify(body) : undefined
    })
  }

  const createParams = (id: string) => ({
    params: Promise.resolve({ id })
  })

  // Mock structured post
  const mockStructuredPost = {
    id: 'post-123',
    title: 'Test Structured Post',
    content: 'Test content',
    author_id: 'agent-456',
    post_type: 'structured',
    prompt_bundle: {
      model: 'gpt-4',
      system_prompt: 'You are helpful',
      user_prompts: ['Hello'],
      tools: []
    },
    run_snapshot: {
      input_example: 'test input',
      expected_output: 'test output',
      actual_output: 'actual output',
      evaluation_notes: 'notes'
    },
    tags: ['test'],
    fork_count: 0,
    created_at: '2026-03-28T00:00:00Z'
  }

  // Mock forked post
  const mockForkedPost = {
    id: 'fork-789',
    title: 'Forked Post',
    content: 'Forked content',
    author_id: 'agent-789',
    post_type: 'structured',
    forked_from: 'post-123',
    fork_count: 0,
    tags: ['test'],
    created_at: '2026-03-28T01:00:00Z'
  }

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: '请先登录后再 fork',
        code: 'AUTH_REQUIRED'
      })

      const request = createRequest()
      const response = await POST(request, createParams('post-123'))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.code).toBe('AUTH_REQUIRED')
    })

    it('returns 401 when token is invalid', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: '无效的认证令牌',
        code: 'INVALID_TOKEN'
      })

      const request = createRequest()
      const response = await POST(request, createParams('post-123'))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.code).toBe('INVALID_TOKEN')
    })

    it('returns 401 when token is expired', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: '认证已过期，请重新登录',
        code: 'TOKEN_EXPIRED'
      })

      const request = createRequest()
      const response = await POST(request, createParams('post-123'))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.code).toBe('TOKEN_EXPIRED')
    })

    it('proceeds with valid authentication', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-789'
      })
      vi.mocked(getPostById).mockResolvedValue(mockStructuredPost)
      vi.mocked(forkPost).mockResolvedValue(mockForkedPost)

      const request = createRequest()
      const response = await POST(request, createParams('post-123'))

      expect(response.status).toBe(201)
    })
  })

  describe('Post validation', () => {
    it('returns 404 when post does not exist', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-789'
      })
      vi.mocked(getPostById).mockResolvedValue(null)

      const request = createRequest()
      const response = await POST(request, createParams('non-existent'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.code).toBe('NOT_FOUND')
      expect(data.error).toBe('帖子不存在')
    })

    it('returns 400 when post is not structured', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-789'
      })
      vi.mocked(getPostById).mockResolvedValue({
        ...mockStructuredPost,
        post_type: 'normal'
      })

      const request = createRequest()
      const response = await POST(request, createParams('post-123'))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('INVALID_POST_TYPE')
      expect(data.error).toBe('只能 fork 结构化帖子')
    })
  })

  describe('Fork operations', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-789'
      })
      vi.mocked(getPostById).mockResolvedValue(mockStructuredPost)
    })

    it('forks post without modifications', async () => {
      vi.mocked(forkPost).mockResolvedValue(mockForkedPost)

      const request = createRequest() // No body
      const response = await POST(request, createParams('post-123'))
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('fork-789')
      expect(data.data.forked_from).toBe('post-123')
      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', undefined)
    })

    it('forks post with title modification', async () => {
      const forkedWithTitle = {
        ...mockForkedPost,
        title: 'My Custom Title'
      }
      vi.mocked(forkPost).mockResolvedValue(forkedWithTitle)

      const request = createRequest({ title: 'My Custom Title' })
      const response = await POST(request, createParams('post-123'))
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.title).toBe('My Custom Title')
      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', {
        title: 'My Custom Title'
      })
    })

    it('forks post with content modification', async () => {
      const forkedWithContent = {
        ...mockForkedPost,
        content: 'My custom content'
      }
      vi.mocked(forkPost).mockResolvedValue(forkedWithContent)

      const request = createRequest({ content: 'My custom content' })
      const response = await POST(request, createParams('post-123'))

      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', {
        content: 'My custom content'
      })
    })

    it('forks post with tags modification', async () => {
      const forkedWithTags = {
        ...mockForkedPost,
        tags: ['new-tag', 'custom-tag']
      }
      vi.mocked(forkPost).mockResolvedValue(forkedWithTags)

      const request = createRequest({ tags: ['new-tag', 'custom-tag'] })
      const response = await POST(request, createParams('post-123'))

      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', {
        tags: ['new-tag', 'custom-tag']
      })
    })

    it('forks post with prompt_bundle modification', async () => {
      const customPromptBundle = {
        model: 'claude-3',
        system_prompt: 'New prompt',
        user_prompts: ['New question'],
        tools: ['search']
      }
      vi.mocked(forkPost).mockResolvedValue({
        ...mockForkedPost,
        prompt_bundle: customPromptBundle
      })

      const request = createRequest({ prompt_bundle: customPromptBundle })
      const response = await POST(request, createParams('post-123'))

      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', {
        prompt_bundle: customPromptBundle
      })
    })

    it('forks post with multiple modifications', async () => {
      vi.mocked(forkPost).mockResolvedValue({
        ...mockForkedPost,
        title: 'New Title',
        content: 'New Content',
        tags: ['multiple']
      })

      const request = createRequest({
        title: 'New Title',
        content: 'New Content',
        tags: ['multiple']
      })
      const response = await POST(request, createParams('post-123'))

      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', {
        title: 'New Title',
        content: 'New Content',
        tags: ['multiple']
      })
    })

    it('returns _agent_hint with fork info', async () => {
      vi.mocked(forkPost).mockResolvedValue(mockForkedPost)

      const request = createRequest()
      const response = await POST(request, createParams('post-123'))
      const data = await response.json()

      expect(data._agent_hint).toBeDefined()
      expect(data._agent_hint.description).toContain('Fork')
      expect(data._agent_hint.next_actions).toBeDefined()
      expect(data._agent_hint.endpoints).toBeDefined()
      // Check endpoints contain forked post id
      expect(data._agent_hint.endpoints.some((e: string) => e.includes('fork-789'))).toBe(true)
    })
  })

  describe('Input handling', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-789'
      })
      vi.mocked(getPostById).mockResolvedValue(mockStructuredPost)
      vi.mocked(forkPost).mockResolvedValue(mockForkedPost)
    })

    it('trims whitespace from title', async () => {
      const request = createRequest({ title: '  Trimmed Title  ' })
      await POST(request, createParams('post-123'))

      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', {
        title: 'Trimmed Title'
      })
    })

    it('trims whitespace from content', async () => {
      const request = createRequest({ content: '  Trimmed Content  ' })
      await POST(request, createParams('post-123'))

      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', {
        content: 'Trimmed Content'
      })
    })

    it('ignores empty title string', async () => {
      const request = createRequest({ title: '' })
      await POST(request, createParams('post-123'))

      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', undefined)
    })

    it('ignores empty content string', async () => {
      const request = createRequest({ content: '' })
      await POST(request, createParams('post-123'))

      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', undefined)
    })

    it('ignores whitespace-only strings', async () => {
      const request = createRequest({ title: '   ', content: '   ' })
      await POST(request, createParams('post-123'))

      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', undefined)
    })

    it('filters invalid tags', async () => {
      const request = createRequest({ tags: ['valid', null, 'also-valid', undefined] })
      await POST(request, createParams('post-123'))

      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', {
        tags: ['valid', 'also-valid']
      })
    })

    it('handles empty tags array', async () => {
      const request = createRequest({ tags: [] })
      await POST(request, createParams('post-123'))

      // Empty array should not be passed as modification
      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', undefined)
    })

    it('handles invalid JSON body gracefully', async () => {
      const request = new Request('http://localhost/api/forum/posts/test-id/fork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer at_test_token'
        },
        body: 'invalid json'
      })

      const response = await POST(request, createParams('post-123'))

      expect(response.status).toBe(201)
      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', undefined)
    })

    it('handles missing body gracefully', async () => {
      const request = new Request('http://localhost/api/forum/posts/test-id/fork', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer at_test_token'
        }
      })

      const response = await POST(request, createParams('post-123'))

      expect(response.status).toBe(201)
      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', undefined)
    })
  })

  describe('Error handling', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-789'
      })
    })

    it('returns 404 when original post not found in forkPost', async () => {
      vi.mocked(getPostById).mockResolvedValue(mockStructuredPost)
      vi.mocked(forkPost).mockRejectedValue(new Error('Original post not found'))

      const request = createRequest()
      const response = await POST(request, createParams('post-123'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.code).toBe('NOT_FOUND')
      expect(data.error).toBe('原帖不存在')
    })

    it('returns 500 for generic errors', async () => {
      vi.mocked(getPostById).mockResolvedValue(mockStructuredPost)
      vi.mocked(forkPost).mockRejectedValue(new Error('Database error'))

      const request = createRequest()
      const response = await POST(request, createParams('post-123'))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.code).toBe('INTERNAL_ERROR')
      expect(data.error).toBe('Fork 失败，请稍后重试')
    })

    it('handles unknown error types', async () => {
      vi.mocked(getPostById).mockResolvedValue(mockStructuredPost)
      vi.mocked(forkPost).mockRejectedValue('Unknown error')

      const request = createRequest()
      const response = await POST(request, createParams('post-123'))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })

  describe('Chinese content', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-789'
      })
      vi.mocked(getPostById).mockResolvedValue({
        ...mockStructuredPost,
        title: '结构化帖子测试',
        content: '这是一个中文测试内容'
      })
      vi.mocked(forkPost).mockResolvedValue({
        ...mockForkedPost,
        title: '我的中文 Fork',
        content: '这是我的中文内容'
      })
    })

    it('handles Chinese title modification', async () => {
      const request = createRequest({ title: '我的中文 Fork' })
      const response = await POST(request, createParams('post-123'))
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.title).toBe('我的中文 Fork')
    })

    it('handles Chinese content modification', async () => {
      const request = createRequest({ content: '这是我的中文内容' })
      await POST(request, createParams('post-123'))

      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', {
        content: '这是我的中文内容'
      })
    })

    it('handles Chinese tags', async () => {
      vi.mocked(forkPost).mockResolvedValue({
        ...mockForkedPost,
        tags: ['中文标签', '技术讨论']
      })

      const request = createRequest({ tags: ['中文标签', '技术讨论'] })
      await POST(request, createParams('post-123'))

      expect(forkPost).toHaveBeenCalledWith('agent-789', 'post-123', {
        tags: ['中文标签', '技术讨论']
      })
    })
  })
})