import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PostClient from '@/components/forum/PostClient'
import type { Post, Comment } from '@/lib/forum/types'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  )
}))

// Mock child components
vi.mock('@/components/forum/CommentTree', () => ({
  default: ({ comments, postId }: { comments: Comment[]; postId: string }) => (
    <div data-testid="comment-tree" data-post-id={postId}>
      {comments.length} comments
    </div>
  )
}))

vi.mock('@/components/forum/CommentForm', () => ({
  default: ({ postId }: { postId: string }) => (
    <div data-testid="comment-form" data-post-id={postId}>
      Comment Form
    </div>
  )
}))

vi.mock('@/components/forum/StructuredPostDisplay', () => ({
  default: ({ post }: { post: Post }) => (
    <div data-testid="structured-display" data-post-id={post.id}>
      Structured Content
    </div>
  )
}))

// Mock auth functions
const mockIsLoggedIn = vi.fn()
const mockGetAuthHeaders = vi.fn()
const mockClearAuth = vi.fn()

vi.mock('@/lib/identity/client-auth', () => ({
  isLoggedIn: () => mockIsLoggedIn(),
  getAuthHeaders: () => mockGetAuthHeaders(),
  clearAuth: () => mockClearAuth()
}))

// Helper to create mock post
function createMockPost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'test-post-id',
    title: '测试帖子标题',
    content: '这是测试帖子的内容。\n包含多行文本。',
    author: {
      id: 'author-id',
      name: 'TestAuthor',
      platform: 'agentdex',
      created_at: '2026-01-01T00:00:00Z'
    },
    tags: ['测试标签', 'AgentDex'],
    likes_count: 10,
    comments_count: 5,
    views_count: 100,
    is_pinned: false,
    created_at: new Date().toISOString(),
    post_type: 'normal',
    ...overrides
  }
}

// Helper to create mock comment
function createMockComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'comment-id',
    post_id: 'test-post-id',
    content: '这是一条评论',
    author: {
      id: 'commenter-id',
      name: 'Commenter',
      platform: 'agentdex',
      created_at: '2026-01-01T00:00:00Z'
    },
    likes_count: 2,
    parent_id: null,
    replies: [],
    created_at: new Date().toISOString(),
    ...overrides
  }
}

describe('PostClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-28T15:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('基础渲染', () => {
    it('渲染帖子标题', () => {
      const post = createMockPost()
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('测试帖子标题')
    })

    it('渲染帖子内容', () => {
      const post = createMockPost()
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByText(/这是测试帖子的内容/)).toBeInTheDocument()
    })

    it('渲染作者信息', () => {
      const post = createMockPost()
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByText('TestAuthor')).toBeInTheDocument()
      expect(screen.getByText('T')).toBeInTheDocument() // Avatar first letter
    })

    it('渲染标签', () => {
      const post = createMockPost({ tags: ['标签1', '标签2', '标签3'] })
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByText('#标签1')).toBeInTheDocument()
      expect(screen.getByText('#标签2')).toBeInTheDocument()
      expect(screen.getByText('#标签3')).toBeInTheDocument()
    })

    it('无标签时不渲染标签区域', () => {
      const post = createMockPost({ tags: [] })
      render(<PostClient post={post} comments={[]} />)
      expect(screen.queryByText('#')).not.toBeInTheDocument()
    })

    it('渲染统计信息', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T15:00:00Z'))
      
      const post = createMockPost({ likes_count: 20, comments_count: 8, views_count: 500 })
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByText('20')).toBeInTheDocument() // likes count
      // 评论数被分割为多个 span，使用 getAllByText 验证存在
      expect(screen.getAllByText(/8/).length).toBeGreaterThan(0)
      expect(screen.getByText(/条评论/)).toBeInTheDocument()
      expect(screen.getByText(/500/)).toBeInTheDocument()
      expect(screen.getByText(/次浏览/)).toBeInTheDocument()
      
      vi.useRealTimers()
    })
  })

  describe('导航链接', () => {
    it('渲染返回论坛链接', () => {
      const post = createMockPost()
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByText('← 返回论坛')).toHaveAttribute('href', '/forum')
    })

    it('渲染作者 profile 链接', () => {
      const post = createMockPost({ author: { id: 'author-123', name: 'AuthorName', platform: 'agentdex', created_at: '2026-01-01T00:00:00Z' } })
      render(<PostClient post={post} comments={[]} />)
      const authorLinks = screen.getAllByRole('link')
      const authorProfileLink = authorLinks.find(link => link.getAttribute('href') === '/forum/agent/author-123')
      expect(authorProfileLink).toBeDefined()
    })

    it('渲染标签搜索链接', () => {
      const post = createMockPost({ tags: ['搜索标签'] })
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByText('#搜索标签')).toHaveAttribute('href', '/forum/search?tag=%E6%90%9C%E7%B4%A2%E6%A0%87%E7%AD%BE')
    })
  })

  describe('时间格式化', () => {
    it('刚刚发布显示 "刚刚"', () => {
      // 设置时间差小于 1 分钟
      const post = createMockPost({ created_at: '2026-03-28T15:00:30Z' }) // 30秒前
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByText(/刚刚/)).toBeInTheDocument()
    })

    it('30分钟前显示分钟', () => {
      const post = createMockPost({ created_at: '2026-03-28T14:30:00Z' })
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByText(/30 分钟前/)).toBeInTheDocument()
    })

    it('2小时前显示小时', () => {
      const post = createMockPost({ created_at: '2026-03-28T13:00:00Z' })
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByText(/2 小时前/)).toBeInTheDocument()
    })

    it('3天前显示天数', () => {
      const post = createMockPost({ created_at: '2026-03-25T15:00:00Z' })
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByText(/3 天前/)).toBeInTheDocument()
    })

    it('超过7天显示具体日期', () => {
      const post = createMockPost({ created_at: '2026-03-15T15:00:00Z' })
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByText(/2026/)).toBeInTheDocument()
    })
  })

  describe('结构化帖子显示', () => {
    it('普通帖子不显示结构化内容', () => {
      const post = createMockPost({ post_type: 'normal' })
      render(<PostClient post={post} comments={[]} />)
      expect(screen.queryByTestId('structured-display')).not.toBeInTheDocument()
    })

    it('结构化帖子显示 StructuredPostDisplay', () => {
      const post = createMockPost({
        post_type: 'structured',
        prompt_bundle: { model: 'gpt-4', dependencies: [], system_prompt: 'test', user_prompts: [], tools: [] },
        run_snapshot: { environment: 'test', success_rate: 0.8, latency_ms: 100 }
      })
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByTestId('structured-display')).toBeInTheDocument()
    })
  })

  describe('点赞功能', () => {
    beforeEach(() => {
      // 点赞功能测试使用 real timers
      vi.useRealTimers()
    })

    it('未登录点击点赞提示登录', async () => {
      mockIsLoggedIn.mockReturnValue(false)
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      const post = createMockPost()
      render(<PostClient post={post} comments={[]} />)
      
      const likeButton = screen.getByRole('button', { name: /10/ })
      fireEvent.click(likeButton)

      expect(alertSpy).toHaveBeenCalledWith('请先登录')
      alertSpy.mockRestore()
    })

    it('登录状态过期点击点赞提示重新登录', async () => {
      mockIsLoggedIn.mockReturnValue(true)
      mockGetAuthHeaders.mockReturnValue(null)
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      const post = createMockPost()
      render(<PostClient post={post} comments={[]} />)
      
      const likeButton = screen.getByRole('button', { name: /10/ })
      fireEvent.click(likeButton)

      expect(alertSpy).toHaveBeenCalledWith('登录状态已过期，请重新登录')
      expect(mockClearAuth).toHaveBeenCalled()
      alertSpy.mockRestore()
    })

    it('成功点赞更新状态', async () => {
      mockIsLoggedIn.mockReturnValue(true)
      mockGetAuthHeaders.mockReturnValue({ 'Authorization': 'Bearer test-token' })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ liked: true })
      })

      const post = createMockPost({ likes_count: 10 })
      render(<PostClient post={post} comments={[]} />)
      
      const likeButton = screen.getByRole('button', { name: /10/ })
      fireEvent.click(likeButton)

      await waitFor(() => {
        // After like, button should show 11 (count increased)
        expect(screen.getByText('11')).toBeInTheDocument()
        // Button should have liked state (red background)
        expect(likeButton).toHaveClass('bg-red-100')
      })
    })

    it('取消点赞更新状态', async () => {
      mockIsLoggedIn.mockReturnValue(true)
      mockGetAuthHeaders.mockReturnValue({ 'Authorization': 'Bearer test-token' })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ liked: false })
      })

      const post = createMockPost({ likes_count: 10 })
      render(<PostClient post={post} comments={[]} />)
      
      const likeButton = screen.getByRole('button', { name: /10/ })
      fireEvent.click(likeButton)

      await waitFor(() => {
        // After unlike, count should decrease
        expect(screen.getByText('9')).toBeInTheDocument()
        // Button should have normal state
        expect(likeButton).toHaveClass('bg-gray-100')
      })
    })

    it('API 返回 401 提示重新登录', async () => {
      mockIsLoggedIn.mockReturnValue(true)
      mockGetAuthHeaders.mockReturnValue({ 'Authorization': 'Bearer test-token' })
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      })

      const post = createMockPost()
      render(<PostClient post={post} comments={[]} />)
      
      const likeButton = screen.getByRole('button', { name: /10/ })
      fireEvent.click(likeButton)

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('登录状态已过期，请重新登录')
        expect(mockClearAuth).toHaveBeenCalled()
      })
      alertSpy.mockRestore()
    })

    it('网络错误处理', async () => {
      mockIsLoggedIn.mockReturnValue(true)
      mockGetAuthHeaders.mockReturnValue({ 'Authorization': 'Bearer test-token' })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const post = createMockPost()
      render(<PostClient post={post} comments={[]} />)
      
      const likeButton = screen.getByRole('button', { name: /10/ })
      fireEvent.click(likeButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to like:', expect.any(Error))
      })
      consoleSpy.mockRestore()
    })
  })

  describe('子组件渲染', () => {
    it('渲染 CommentForm', () => {
      const post = createMockPost()
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByTestId('comment-form')).toBeInTheDocument()
      expect(screen.getByTestId('comment-form')).toHaveAttribute('data-post-id', 'test-post-id')
    })

    it('渲染 CommentTree', () => {
      const post = createMockPost()
      const comments = [createMockComment(), createMockComment({ id: 'comment-2' })]
      render(<PostClient post={post} comments={comments} />)
      expect(screen.getByTestId('comment-tree')).toBeInTheDocument()
      expect(screen.getByTestId('comment-tree')).toHaveTextContent('2 comments')
    })

    it('渲染评论标题', () => {
      const post = createMockPost({ comments_count: 15 })
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('评论 (15)')
    })
  })

  describe('点赞按钮状态', () => {
    beforeEach(() => {
      vi.useRealTimers()
    })

    it('未点赞状态显示正常样式', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T15:00:00Z'))
      
      const post = createMockPost()
      render(<PostClient post={post} comments={[]} />)
      
      const likeButton = screen.getByRole('button', { name: /10/ })
      expect(likeButton).toHaveClass('bg-gray-100')
      expect(likeButton).toHaveTextContent('👍')
      
      vi.useRealTimers()
    })

    it('点赞后显示红色样式', async () => {
      mockIsLoggedIn.mockReturnValue(true)
      mockGetAuthHeaders.mockReturnValue({ 'Authorization': 'Bearer test-token' })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ liked: true })
      })

      const post = createMockPost()
      render(<PostClient post={post} comments={[]} />)
      
      const likeButton = screen.getByRole('button', { name: /10/ })
      fireEvent.click(likeButton)

      await waitFor(() => {
        expect(likeButton).toHaveClass('bg-red-100')
        expect(likeButton).toHaveTextContent('❤️')
      })
    })
  })

  describe('内容格式', () => {
    it('whitespace-pre-wrap 保留换行', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T15:00:00Z'))
      
      const post = createMockPost({ content: '第一行\n第二行\n第三行' })
      render(<PostClient post={post} comments={[]} />)
      
      // 找到内容文本，然后找包含它的 div
      const contentText = screen.getByText(/第一行/)
      // 向上查找包含 whitespace-pre-wrap class 的元素
      const contentContainer = contentText.closest('.whitespace-pre-wrap')
      expect(contentContainer).toBeInTheDocument()
      
      vi.useRealTimers()
    })

    it('长内容正常显示', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T15:00:00Z'))
      
      const longContent = '这是一段很长的内容...' + '更多内容'.repeat(100)
      const post = createMockPost({ content: longContent })
      render(<PostClient post={post} comments={[]} />)
      
      expect(screen.getByText(/这是一段很长的内容/)).toBeInTheDocument()
      
      vi.useRealTimers()
    })
  })

  describe('边界情况', () => {
    it('空标题渲染', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T15:00:00Z'))
      
      const post = createMockPost({ title: '' })
      render(<PostClient post={post} comments={[]} />)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      
      vi.useRealTimers()
    })

    it('空内容渲染', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T15:00:00Z'))
      
      const post = createMockPost({ content: '' })
      render(<PostClient post={post} comments={[]} />)
      // Should still render the article even if content is empty
      expect(screen.getByRole('article')).toBeInTheDocument()
      
      vi.useRealTimers()
    })

    it('0 统计正常显示', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T15:00:00Z'))
      
      const post = createMockPost({ likes_count: 0, comments_count: 0, views_count: 0 })
      render(<PostClient post={post} comments={[]} />)
      // 0 点赞数在按钮中
      const likeButtons = screen.getAllByRole('button')
      const likeButton = likeButtons.find(btn => btn.textContent?.includes('👍'))
      expect(likeButton).toHaveTextContent('0')
      // 评论数被分割，使用 getAllByText 验证存在
      expect(screen.getAllByText(/0/).length).toBeGreaterThan(0)
      expect(screen.getByText(/条评论/)).toBeInTheDocument()
      expect(screen.getByText(/次浏览/)).toBeInTheDocument()
      
      vi.useRealTimers()
    })

    it('大量标签渲染', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T15:00:00Z'))
      
      const manyTags = Array.from({ length: 10 }, (_, i) => `标签${i + 1}`)
      const post = createMockPost({ tags: manyTags })
      render(<PostClient post={post} comments={[]} />)
      
      // All tags should render (no limit in PostClient like PostCard)
      expect(screen.getByText('#标签1')).toBeInTheDocument()
      expect(screen.getByText('#标签10')).toBeInTheDocument()
      
      vi.useRealTimers()
    })
  })
})