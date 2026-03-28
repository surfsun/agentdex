/**
 * API Integration Tests for /api/forum/posts
 *
 * Tests the route layer: authentication, request validation, response format
 * Assumes lib/forum/queries logic is already tested separately
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the dependencies
vi.mock('@/lib/forum/queries', () => ({
  listPosts: vi.fn(),
  createPost: vi.fn()
}))

vi.mock('@/lib/identity/auth', () => ({
  authenticateRequest: vi.fn()
}))

// Import after mocking
import { GET, POST } from '@/app/api/forum/posts/route'
import { listPosts, createPost } from '@/lib/forum/queries'
import { authenticateRequest } from '@/lib/identity/auth'

// Helper to create NextRequest with JSON body
function createPostRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/forum/posts')
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })
}

// Helper to create GET request with query params
function createGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/forum/posts')
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  return new NextRequest(url, { method: 'GET' })
}

describe('GET /api/forum/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('正常列表查询', () => {
    it('should return posts with default pagination', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Test Post 1', content: 'Content 1' },
        { id: 'post-2', title: 'Test Post 2', content: 'Content 2' }
      ]

      vi.mocked(listPosts).mockResolvedValueOnce({
        posts: mockPosts,
        total: 100
      })

      const request = createGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockPosts)
      expect(data.total).toBe(100)
      expect(data.page).toBe(1)
      expect(data.limit).toBe(20)
      expect(data.has_more).toBe(true) // 1 * 20 < 100

      expect(listPosts).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort: 'new',
        tag: undefined
      })
    })

    it('should handle custom pagination params', async () => {
      vi.mocked(listPosts).mockResolvedValueOnce({
        posts: [],
        total: 50
      })

      const request = createGetRequest({ page: '3', limit: '10' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.page).toBe(3)
      expect(data.limit).toBe(10)
      expect(data.has_more).toBe(true) // 3 * 10 = 30 < 50

      expect(listPosts).toHaveBeenCalledWith({
        page: 3,
        limit: 10,
        sort: 'new',
        tag: undefined
      })
    })

    it('should correctly compute has_more when reaching end', async () => {
      vi.mocked(listPosts).mockResolvedValueOnce({
        posts: [],
        total: 25
      })

      const request = createGetRequest({ page: '5', limit: '10' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.has_more).toBe(false) // 5 * 10 = 50 >= 25
    })

    it('should handle sorting param', async () => {
      vi.mocked(listPosts).mockResolvedValueOnce({
        posts: [],
        total: 0
      })

      const request = createGetRequest({ sort: 'hot' })
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(listPosts).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort: 'hot',
        tag: undefined
      })
    })

    it('should handle tag filtering', async () => {
      vi.mocked(listPosts).mockResolvedValueOnce({
        posts: [],
        total: 0
      })

      const request = createGetRequest({ tag: 'agent-tools' })
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(listPosts).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort: 'new',
        tag: 'agent-tools'
      })
    })

    it('should combine multiple params', async () => {
      vi.mocked(listPosts).mockResolvedValueOnce({
        posts: [],
        total: 25
      })

      const request = createGetRequest({
        page: '2',
        limit: '15',
        sort: 'hot',
        tag: 'llm'
      })
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(listPosts).toHaveBeenCalledWith({
        page: 2,
        limit: 15,
        sort: 'hot',
        tag: 'llm'
      })
    })
  })

  describe('错误处理', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(listPosts).mockRejectedValueOnce(new Error('Database connection failed'))

      const request = createGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('获取帖子列表失败')
    })
  })
})

describe('POST /api/forum/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('认证检查', () => {
    it('should return 401 when no auth header', async () => {
      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: false,
        error: '请先登录后再发布',
        code: 'AUTH_REQUIRED'
      })

      const request = createPostRequest({
        title: 'Test',
        content: 'Content'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('请先登录')
      expect(data.code).toBe('AUTH_REQUIRED')

      expect(createPost).not.toHaveBeenCalled()
    })

    it('should return 401 when invalid token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: false,
        error: '无效的访问令牌',
        code: 'INVALID_TOKEN'
      })

      const request = createPostRequest(
        { title: 'Test', content: 'Content' },
        { Authorization: 'Bearer invalid_token' }
      )
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_TOKEN')
    })

    it('should return 401 when expired token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: false,
        error: '访问令牌已过期，请重新登录',
        code: 'TOKEN_EXPIRED'
      })

      const request = createPostRequest(
        { title: 'Test', content: 'Content' },
        { Authorization: 'Bearer at_expired' }
      )
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.code).toBe('TOKEN_EXPIRED')
    })

    it('should accept valid Bearer token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: true,
        agent_id: 'agent-123'
      })

      vi.mocked(createPost).mockResolvedValueOnce({
        id: 'new-post-id',
        title: 'Test Post',
        content: 'Test Content',
        author_id: 'agent-123'
      } as any)

      const request = createPostRequest(
        { title: 'Test Post', content: 'Test Content' },
        { Authorization: 'Bearer at_valid_token' }
      )
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('new-post-id')

      expect(authenticateRequest).toHaveBeenCalledWith(request)
      expect(createPost).toHaveBeenCalledWith('agent-123', {
        title: 'Test Post',
        content: 'Test Content',
        tags: [],
        post_type: 'normal',
        prompt_bundle: undefined,
        run_snapshot: undefined
      })
    })
  })

  describe('参数验证', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
    })

    it('should reject empty title', async () => {
      const request = createPostRequest({ title: '', content: 'Content' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('标题不能为空')
      expect(data.code).toBe('TITLE_REQUIRED')
    })

    it('should reject whitespace-only title', async () => {
      const request = createPostRequest({ title: '   ', content: 'Content' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('TITLE_REQUIRED')
    })

    it('should reject empty content', async () => {
      const request = createPostRequest({ title: 'Title', content: '' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('内容不能为空')
      expect(data.code).toBe('CONTENT_REQUIRED')
    })

    it('should reject title over 255 chars', async () => {
      const longTitle = 'a'.repeat(256)
      const request = createPostRequest({ title: longTitle, content: 'Content' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('255')
      expect(data.code).toBe('TITLE_TOO_LONG')
    })

    it('should accept title with exactly 255 chars', async () => {
      vi.mocked(createPost).mockResolvedValueOnce({ id: 'post-id' } as any)

      const maxTitle = 'a'.repeat(255)
      const request = createPostRequest({ title: maxTitle, content: 'Content' })
      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should reject invalid JSON body', async () => {
      const url = new URL('http://localhost/api/forum/posts')
      const request = new NextRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('请求格式错误')
      expect(data.code).toBe('INVALID_REQUEST')
    })
  })

  describe('正常帖子创建', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })

      vi.mocked(createPost).mockResolvedValue({
        id: 'new-post-id',
        author_id: 'agent-123',
        title: 'Test Post',
        content: 'Test Content',
        tags: ['llm', 'tools'],
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        status: 'published',
        pinned: false,
        is_seed: false,
        post_type: 'normal',
        prompt_bundle: null,
        run_snapshot: null,
        forked_from: null,
        fork_count: 0,
        created_at: '2026-03-28T10:00:00Z',
        updated_at: '2026-03-28T10:00:00Z'
      } as any)
    })

    it('should create post with minimal params', async () => {
      const request = createPostRequest({
        title: 'Simple Post',
        content: 'Just content'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('new-post-id')
      expect(data.data.title).toBe('Test Post')

      expect(createPost).toHaveBeenCalledWith('agent-123', {
        title: 'Simple Post',
        content: 'Just content',
        tags: [],
        post_type: 'normal',
        prompt_bundle: undefined,
        run_snapshot: undefined
      })
    })

    it('should create post with tags', async () => {
      const request = createPostRequest({
        title: 'Tagged Post',
        content: 'Content',
        tags: ['llm', 'agent', 'tools']
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createPost).toHaveBeenCalledWith('agent-123', {
        title: 'Tagged Post',
        content: 'Content',
        tags: ['llm', 'agent', 'tools'],
        post_type: 'normal',
        prompt_bundle: undefined,
        run_snapshot: undefined
      })
    })

    it('should filter non-string tags', async () => {
      const request = createPostRequest({
        title: 'Mixed Tags',
        content: 'Content',
        tags: ['valid', 123, null, 'also-valid', { obj: true }]
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createPost).toHaveBeenCalledWith('agent-123', {
        title: 'Mixed Tags',
        content: 'Content',
        tags: ['valid', 'also-valid'],
        post_type: 'normal',
        prompt_bundle: undefined,
        run_snapshot: undefined
      })
    })

    it('should handle missing tags array', async () => {
      const request = createPostRequest({
        title: 'No Tags',
        content: 'Content'
        // tags not provided
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createPost).toHaveBeenCalledWith('agent-123', {
        title: 'No Tags',
        content: 'Content',
        tags: [],
        post_type: 'normal',
        prompt_bundle: undefined,
        run_snapshot: undefined
      })
    })
  })

  describe('结构化帖子创建', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })

      vi.mocked(createPost).mockResolvedValue({
        id: 'structured-post-id',
        post_type: 'structured'
      } as any)
    })

    const validPromptBundle = {
      model: 'gpt-4',
      system_prompt: 'You are a helpful assistant',
      user_prompts: ['Help me with X'],
      tools: ['search', 'calculator']
    }

    const validRunSnapshot = {
      input_example: 'Input data',
      expected_output: 'Expected result',
      actual_output: 'Actual result',
      evaluation_notes: 'Notes on the run'
    }

    it('should create structured post with valid data', async () => {
      const request = createPostRequest({
        title: 'Structured Test',
        content: 'Detailed analysis',
        post_type: 'structured',
        prompt_bundle: validPromptBundle,
        run_snapshot: validRunSnapshot
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(createPost).toHaveBeenCalledWith('agent-123', {
        title: 'Structured Test',
        content: 'Detailed analysis',
        tags: [],
        post_type: 'structured',
        prompt_bundle: validPromptBundle,
        run_snapshot: validRunSnapshot
      })
    })

    it('should require model for structured post', async () => {
      const request = createPostRequest({
        title: 'Bad Structured',
        content: 'Content',
        post_type: 'structured',
        prompt_bundle: { ...validPromptBundle, model: undefined }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Model selection is required')
      expect(data.code).toBe('INVALID_STRUCTURED_DATA')
    })

    it('should require system_prompt for structured post', async () => {
      const request = createPostRequest({
        title: 'Bad Structured',
        content: 'Content',
        post_type: 'structured',
        prompt_bundle: { ...validPromptBundle, system_prompt: '' }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('System prompt is required')
    })

    it('should require user_prompts array', async () => {
      const request = createPostRequest({
        title: 'Bad Structured',
        content: 'Content',
        post_type: 'structured',
        prompt_bundle: { ...validPromptBundle, user_prompts: 'not an array' }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('User prompts must be an array')
    })

    it('should require tools array', async () => {
      const request = createPostRequest({
        title: 'Bad Structured',
        content: 'Content',
        post_type: 'structured',
        prompt_bundle: { ...validPromptBundle, tools: null }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Tools must be an array')
    })

    it('should require input_example for run_snapshot', async () => {
      const request = createPostRequest({
        title: 'Bad Snapshot',
        content: 'Content',
        post_type: 'structured',
        prompt_bundle: validPromptBundle,
        run_snapshot: { ...validRunSnapshot, input_example: undefined }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Input example is required')
    })

    it('should require expected_output for run_snapshot', async () => {
      const request = createPostRequest({
        title: 'Bad Snapshot',
        content: 'Content',
        post_type: 'structured',
        prompt_bundle: validPromptBundle,
        run_snapshot: { ...validRunSnapshot, expected_output: '' }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Expected output is required')
    })

    it('should require actual_output for run_snapshot', async () => {
      const request = createPostRequest({
        title: 'Bad Snapshot',
        content: 'Content',
        post_type: 'structured',
        prompt_bundle: validPromptBundle,
        run_snapshot: { ...validRunSnapshot, actual_output: null }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Actual output is required')
    })

    it('should require evaluation_notes for run_snapshot', async () => {
      const request = createPostRequest({
        title: 'Bad Snapshot',
        content: 'Content',
        post_type: 'structured',
        prompt_bundle: validPromptBundle,
        run_snapshot: { ...validRunSnapshot, evaluation_notes: '' }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Evaluation notes are required')
    })

    it('should accept structured post without run_snapshot', async () => {
      const request = createPostRequest({
        title: 'Partial Structured',
        content: 'Content',
        post_type: 'structured',
        prompt_bundle: validPromptBundle
        // no run_snapshot
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createPost).toHaveBeenCalledWith('agent-123', {
        title: 'Partial Structured',
        content: 'Content',
        tags: [],
        post_type: 'structured',
        prompt_bundle: validPromptBundle,
        run_snapshot: undefined
      })
    })

    it('should accept structured post without prompt_bundle', async () => {
      vi.mocked(createPost).mockResolvedValueOnce({
        id: 'snapshot-only',
        post_type: 'structured'
      } as any)

      const request = createPostRequest({
        title: 'Snapshot Only',
        content: 'Content',
        post_type: 'structured',
        run_snapshot: validRunSnapshot
        // no prompt_bundle
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createPost).toHaveBeenCalledWith('agent-123', {
        title: 'Snapshot Only',
        content: 'Content',
        tags: [],
        post_type: 'structured',
        prompt_bundle: undefined,
        run_snapshot: validRunSnapshot
      })
    })
  })

  describe('数据库错误处理', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
    })

    it('should handle foreign key error (user not found)', async () => {
      vi.mocked(createPost).mockRejectedValueOnce(
        new Error('foreign key constraint fails: agent_profiles')
      )

      const request = createPostRequest({
        title: 'Test',
        content: 'Content'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('用户不存在')
      expect(data.code).toBe('USER_NOT_FOUND')
    })

    it('should handle connection error', async () => {
      vi.mocked(createPost).mockRejectedValueOnce(
        new Error('connection refused: ECONNREFUSED')
      )

      const request = createPostRequest({
        title: 'Test',
        content: 'Content'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toContain('数据库连接失败')
      expect(data.code).toBe('DB_CONNECTION_ERROR')
    })

    it('should handle timeout error', async () => {
      vi.mocked(createPost).mockRejectedValueOnce(
        new Error('query timeout after 30s')
      )

      const request = createPostRequest({
        title: 'Test',
        content: 'Content'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.code).toBe('DB_CONNECTION_ERROR')
    })

    it('should handle unknown error with 500', async () => {
      vi.mocked(createPost).mockRejectedValueOnce(
        new Error('something unexpected')
      )

      const request = createPostRequest({
        title: 'Test',
        content: 'Content'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('发布失败')
      expect(data.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('响应格式验证', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: true,
        agent_id: 'agent-123'
      })
    })

    it('should return UTF-8 charset in response', async () => {
      vi.mocked(createPost).mockResolvedValueOnce({
        id: 'test-id'
      } as any)

      const request = createPostRequest({
        title: '中文标题测试',
        content: '中文内容测试'
      })
      const response = await POST(request)

      expect(response.headers.get('Content-Type')).toContain('utf-8')
    })

    it('should return correct status code 201 for creation', async () => {
      vi.mocked(createPost).mockResolvedValueOnce({
        id: 'new-id'
      } as any)

      const request = createPostRequest({
        title: 'Test',
        content: 'Content'
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should include success field in all responses', async () => {
      vi.mocked(createPost).mockResolvedValueOnce({
        id: 'test-id'
      } as any)

      const request = createPostRequest({
        title: 'Test',
        content: 'Content'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('success')
      expect(data.success).toBe(true)
    })
  })
})