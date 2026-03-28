import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/forum/posts/[id]/like/route'

// Mock dependencies
vi.mock('@/lib/forum/queries', () => ({
  likeTarget: vi.fn(),
  getPostById: vi.fn()
}))

vi.mock('@/lib/identity/auth', () => ({
  authenticateRequest: vi.fn()
}))

import { likeTarget, getPostById } from '@/lib/forum/queries'
import { authenticateRequest } from '@/lib/identity/auth'

// Helper to create NextRequest with params
function createLikeRequest(id: string, headers: Record<string, string> = {}): NextRequest {
  const url = new URL(`http://localhost/api/forum/posts/${id}/like`)
  const request = new NextRequest(url, {
    method: 'POST',
    headers
  })
  return request
}

describe('/api/forum/posts/[id]/like', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST - 认证检查', () => {
    it('无认证 header 返回 401', async () => {
      const request = createLikeRequest('post-123')
      const params = Promise.resolve({ id: 'post-123' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: false,
        error: 'Authentication required'
      })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('无效 Access Token 返回 401', async () => {
      const request = createLikeRequest('post-123', {
        Authorization: 'Bearer at_invalid'
      })
      const params = Promise.resolve({ id: 'post-123' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: false,
        error: 'Invalid or expired access token'
      })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid or expired access token')
    })

    it('过期 Access Token 返回 401', async () => {
      const request = createLikeRequest('post-123', {
        Authorization: 'Bearer at_expired'
      })
      const params = Promise.resolve({ id: 'post-123' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: false,
        error: 'Access token has expired'
      })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Access token has expired')
    })

    it('有效 Bearer Token 通过认证', async () => {
      const request = createLikeRequest('post-123', {
        Authorization: 'Bearer at_valid123'
      })
      const params = Promise.resolve({ id: 'post-123' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: true,
        agent_id: 'agent-456'
      })

      vi.mocked(getPostById).mockResolvedValueOnce({
        id: 'post-123',
        title: 'Test Post',
        content: 'Content',
        author_id: 'agent-789'
      })

      vi.mocked(likeTarget).mockResolvedValueOnce(true)

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.liked).toBe(true)
      expect(authenticateRequest).toHaveBeenCalledWith(request)
    })

    it('API Key Bearer Token 通过认证', async () => {
      const request = createLikeRequest('post-123', {
        Authorization: 'Bearer ak_testkey'
      })
      const params = Promise.resolve({ id: 'post-123' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: true,
        agent_id: 'agent-456'
      })

      vi.mocked(getPostById).mockResolvedValueOnce({
        id: 'post-123',
        title: 'Test Post',
        content: 'Content',
        author_id: 'agent-789'
      })

      vi.mocked(likeTarget).mockResolvedValueOnce(true)

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('兼容 X-Agent-Id header', async () => {
      const request = createLikeRequest('post-123', {
        'X-Agent-Id': 'agent-456'
      })
      const params = Promise.resolve({ id: 'post-123' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: true,
        agent_id: 'agent-456'
      })

      vi.mocked(getPostById).mockResolvedValueOnce({
        id: 'post-123',
        title: 'Test Post',
        content: 'Content',
        author_id: 'agent-789'
      })

      vi.mocked(likeTarget).mockResolvedValueOnce(true)

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('POST - 参数验证', () => {
    it('缺少 ID 返回 400', async () => {
      const request = createLikeRequest('', {
        Authorization: 'Bearer at_valid'
      })
      const params = Promise.resolve({ id: '' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: true,
        agent_id: 'agent-456'
      })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Post ID is required')
    })
  })

  describe('POST - 帖子存在性检查', () => {
    it('帖子不存在返回 404', async () => {
      const request = createLikeRequest('non-existent', {
        Authorization: 'Bearer at_valid'
      })
      const params = Promise.resolve({ id: 'non-existent' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: true,
        agent_id: 'agent-456'
      })

      vi.mocked(getPostById).mockResolvedValueOnce(null)

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Post not found')
    })
  })

  describe('POST - 点赞操作', () => {
    it('首次点赞返回 liked: true', async () => {
      const request = createLikeRequest('post-123', {
        Authorization: 'Bearer at_valid'
      })
      const params = Promise.resolve({ id: 'post-123' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: true,
        agent_id: 'agent-456'
      })

      vi.mocked(getPostById).mockResolvedValueOnce({
        id: 'post-123',
        title: 'Test Post',
        content: 'Content',
        author_id: 'agent-789'
      })

      vi.mocked(likeTarget).mockResolvedValueOnce(true)

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.liked).toBe(true)
      expect(likeTarget).toHaveBeenCalledWith('agent-456', 'post', 'post-123')
    })

    it('取消点赞返回 liked: false', async () => {
      const request = createLikeRequest('post-123', {
        Authorization: 'Bearer at_valid'
      })
      const params = Promise.resolve({ id: 'post-123' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: true,
        agent_id: 'agent-456'
      })

      vi.mocked(getPostById).mockResolvedValueOnce({
        id: 'post-123',
        title: 'Test Post',
        content: 'Content',
        author_id: 'agent-789'
      })

      vi.mocked(likeTarget).mockResolvedValueOnce(false)

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.liked).toBe(false)
    })

    it('作者可以点赞自己的帖子', async () => {
      const request = createLikeRequest('post-123', {
        Authorization: 'Bearer at_valid'
      })
      const params = Promise.resolve({ id: 'post-123' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: true,
        agent_id: 'author-456'
      })

      vi.mocked(getPostById).mockResolvedValueOnce({
        id: 'post-123',
        title: 'Test Post',
        content: 'Content',
        author_id: 'author-456'
      })

      vi.mocked(likeTarget).mockResolvedValueOnce(true)

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.liked).toBe(true)
    })
  })

  describe('POST - 错误处理', () => {
    it('数据库错误返回 500', async () => {
      const request = createLikeRequest('post-123', {
        Authorization: 'Bearer at_valid'
      })
      const params = Promise.resolve({ id: 'post-123' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: true,
        agent_id: 'agent-456'
      })

      vi.mocked(getPostById).mockResolvedValueOnce({
        id: 'post-123',
        title: 'Test Post',
        content: 'Content',
        author_id: 'agent-789'
      })

      vi.mocked(likeTarget).mockRejectedValueOnce(new Error('Database connection failed'))

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to like/unlike post')
    })

    it('getPostById 错误返回 500', async () => {
      const request = createLikeRequest('post-123', {
        Authorization: 'Bearer at_valid'
      })
      const params = Promise.resolve({ id: 'post-123' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: true,
        agent_id: 'agent-456'
      })

      vi.mocked(getPostById).mockRejectedValueOnce(new Error('Database error'))

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to like/unlike post')
    })
  })

  describe('POST - 响应格式验证', () => {
    it('成功响应包含 success 和 liked', async () => {
      const request = createLikeRequest('post-123', {
        Authorization: 'Bearer at_valid'
      })
      const params = Promise.resolve({ id: 'post-123' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: true,
        agent_id: 'agent-456'
      })

      vi.mocked(getPostById).mockResolvedValueOnce({
        id: 'post-123',
        title: 'Test Post',
        content: 'Content',
        author_id: 'agent-789'
      })

      vi.mocked(likeTarget).mockResolvedValueOnce(true)

      const response = await POST(request, { params })
      const data = await response.json()

      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('liked')
      expect(typeof data.success).toBe('boolean')
      expect(typeof data.liked).toBe('boolean')
    })

    it('错误响应包含 success 和 error', async () => {
      const request = createLikeRequest('', {
        Authorization: 'Bearer at_valid'
      })
      const params = Promise.resolve({ id: '' })

      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        success: true,
        agent_id: 'agent-456'
      })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('error')
      expect(data.success).toBe(false)
      expect(typeof data.error).toBe('string')
    })
  })
})