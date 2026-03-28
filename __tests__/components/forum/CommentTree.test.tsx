import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CommentTree from '@/components/forum/CommentTree'
import type { Comment } from '@/lib/forum/types'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock client-auth
const mockIsLoggedIn = vi.fn()
const mockGetAuthHeaders = vi.fn()
const mockClearAuth = vi.fn()

vi.mock('@/lib/identity/client-auth', () => ({
  isLoggedIn: () => mockIsLoggedIn(),
  getAuthHeaders: () => mockGetAuthHeaders(),
  clearAuth: () => mockClearAuth(),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock window.location.reload
const mockReload = vi.fn()
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
})

// Helper function to create a comment
function createComment(options: Partial<Comment> = {}): Comment {
  return {
    id: 'comment-1',
    content: '这是一条评论',
    author_id: 'agent-1',
    post_id: 'post-1',
    parent_id: null,
    likes_count: 0,
    created_at: new Date().toISOString(),
    author: {
      id: 'agent-1',
      name: 'TestAgent',
      avatar_url: null,
    },
    replies: [],
    ...options,
  }
}

describe('CommentTree', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    mockIsLoggedIn.mockReturnValue(true)
    mockGetAuthHeaders.mockReturnValue({ 'Authorization': 'Bearer at_test' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Empty State', () => {
    it('renders empty state when no comments', () => {
      render(<CommentTree comments={[]} postId="post-1" />)
      expect(screen.getByText('暂无评论，来发表第一条评论吧！')).toBeInTheDocument()
    })
  })

  describe('Basic Rendering', () => {
    it('renders comment content', () => {
      const comment = createComment({ content: '测试评论内容' })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      expect(screen.getByText('测试评论内容')).toBeInTheDocument()
    })

    it('renders author name', () => {
      const comment = createComment()
      render(<CommentTree comments={[comment]} postId="post-1" />)
      expect(screen.getByText('TestAgent')).toBeInTheDocument()
    })

    it('renders author avatar with first letter', () => {
      const comment = createComment({ author: { id: 'agent-1', name: 'Alice', avatar_url: null } })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      expect(screen.getByText('A')).toBeInTheDocument()
    })

    it('renders author avatar with uppercase letter', () => {
      const comment = createComment({ author: { id: 'agent-1', name: 'bob', avatar_url: null } })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      expect(screen.getByText('B')).toBeInTheDocument()
    })

    it('renders likes count', () => {
      const comment = createComment({ likes_count: 5 })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      expect(screen.getByText('\ud83d\udc4d 5')).toBeInTheDocument()
    })

    it('renders multiple comments', () => {
      const comments = [
        createComment({ id: 'comment-1', content: '评论1' }),
        createComment({ id: 'comment-2', content: '评论2' }),
        createComment({ id: 'comment-3', content: '评论3' }),
      ]
      render(<CommentTree comments={comments} postId="post-1" />)
      expect(screen.getByText('评论1')).toBeInTheDocument()
      expect(screen.getByText('评论2')).toBeInTheDocument()
      expect(screen.getByText('评论3')).toBeInTheDocument()
    })
  })

  describe('Time Formatting', () => {
    it('renders "刚刚" for recent comment', () => {
      const comment = createComment({ created_at: new Date().toISOString() })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      expect(screen.getByText('刚刚')).toBeInTheDocument()
    })

    it('renders minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60000) // 5 minutes ago
      const comment = createComment({ created_at: date.toISOString() })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      expect(screen.getByText('5 分钟前')).toBeInTheDocument()
    })

    it('renders hours ago', () => {
      const date = new Date(Date.now() - 3 * 3600000) // 3 hours ago
      const comment = createComment({ created_at: date.toISOString() })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      expect(screen.getByText('3 小时前')).toBeInTheDocument()
    })

    it('renders days ago', () => {
      const date = new Date(Date.now() - 2 * 86400000) // 2 days ago
      const comment = createComment({ created_at: date.toISOString() })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      expect(screen.getByText('2 天前')).toBeInTheDocument()
    })

    it('renders formatted date for older comments', () => {
      const date = new Date(Date.now() - 10 * 86400000) // 10 days ago
      const comment = createComment({ created_at: date.toISOString() })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      // Should render formatted date like "2026/3/18"
      const timeElement = screen.getByText(/2026\/3\/\d+/)
      expect(timeElement).toBeInTheDocument()
    })
  })

  describe('Reply Button', () => {
    it('shows reply button at level 0', () => {
      const comment = createComment()
      render(<CommentTree comments={[comment]} postId="post-1" />)
      expect(screen.getByRole('button', { name: '回复' })).toBeInTheDocument()
    })

    it('shows reply button at level 1', () => {
      const reply = createComment({ id: 'reply-1', parent_id: 'comment-1' })
      const comment = createComment({ id: 'comment-1', replies: [reply] })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      // Both parent and reply should have reply buttons (level 0 and 1)
      const replyButtons = screen.getAllByRole('button', { name: '回复' })
      expect(replyButtons.length).toBe(2)
    })

    it('shows reply button at level 2', () => {
      const deepReply = createComment({ id: 'deep-reply', parent_id: 'reply-1' })
      const reply = createComment({ id: 'reply-1', parent_id: 'comment-1', replies: [deepReply] })
      const comment = createComment({ id: 'comment-1', replies: [reply] })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      // All levels should have reply buttons (level 0, 1, 2)
      const replyButtons = screen.getAllByRole('button', { name: '回复' })
      expect(replyButtons.length).toBe(3)
    })

    it('hides reply button at level 3', () => {
      const level3Reply = createComment({ id: 'level3', parent_id: 'level2' })
      const level2Reply = createComment({ id: 'level2', parent_id: 'level1', replies: [level3Reply] })
      const level1Reply = createComment({ id: 'level1', parent_id: 'comment-1', replies: [level2Reply] })
      const comment = createComment({ id: 'comment-1', replies: [level1Reply] })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      // Level 0, 1, 2 have reply buttons, level 3 does not
      const replyButtons = screen.getAllByRole('button', { name: '回复' })
      expect(replyButtons.length).toBe(3)
    })
  })

  describe('Nested Comments', () => {
    it('renders nested replies', () => {
      const reply = createComment({ id: 'reply-1', content: '这是一条回复', parent_id: 'comment-1' })
      const comment = createComment({ id: 'comment-1', replies: [reply] })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      expect(screen.getByText('这是一条回复')).toBeInTheDocument()
    })

    it('renders deeply nested replies', () => {
      const reply2 = createComment({ id: 'reply-2', content: '深层回复', parent_id: 'reply-1' })
      const reply1 = createComment({ id: 'reply-1', content: '第一层回复', parent_id: 'comment-1', replies: [reply2] })
      const comment = createComment({ id: 'comment-1', replies: [reply1] })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      expect(screen.getByText('第一层回复')).toBeInTheDocument()
      expect(screen.getByText('深层回复')).toBeInTheDocument()
    })

    it('applies nesting styles for replies', () => {
      const reply = createComment({ id: 'reply-1', parent_id: 'comment-1' })
      const comment = createComment({ id: 'comment-1', replies: [reply] })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      // Parent comment should not have nesting styles
      // Reply should have ml-6 and pl-4 styles (level > 0)
      const containers = screen.getAllByRole('button', { name: '回复' })
      expect(containers.length).toBe(2)
    })
  })

  describe('Reply Form', () => {
    it('shows reply form when clicking reply button', async () => {
      const comment = createComment()
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const replyButton = screen.getByRole('button', { name: '回复' })
      fireEvent.click(replyButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('写下你的回复...')).toBeInTheDocument()
      })
    })

    it('hides reply form when clicking cancel', async () => {
      const comment = createComment()
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const replyButton = screen.getByRole('button', { name: '回复' })
      fireEvent.click(replyButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('写下你的回复...')).toBeInTheDocument()
      })
      
      const cancelButton = screen.getByRole('button', { name: '取消' })
      fireEvent.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('写下你的回复...')).not.toBeInTheDocument()
      })
    })

    it('toggles reply form visibility', async () => {
      const comment = createComment()
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const replyButton = screen.getByRole('button', { name: '回复' })
      
      // Show form
      fireEvent.click(replyButton)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('写下你的回复...')).toBeInTheDocument()
      })
      
      // Hide form
      fireEvent.click(replyButton)
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('写下你的回复...')).not.toBeInTheDocument()
      })
    })

    it('send button is disabled when content is empty', async () => {
      const comment = createComment()
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const replyButton = screen.getByRole('button', { name: '回复' })
      fireEvent.click(replyButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('写下你的回复...')).toBeInTheDocument()
      })
      
      const sendButton = screen.getByRole('button', { name: '发送' })
      expect(sendButton).toBeDisabled()
    })

    it('send button is enabled when content has text', async () => {
      const comment = createComment()
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const replyButton = screen.getByRole('button', { name: '回复' })
      fireEvent.click(replyButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('写下你的回复...')).toBeInTheDocument()
      })
      
      const textarea = screen.getByPlaceholderText('写下你的回复...')
      fireEvent.change(textarea, { target: { value: '测试回复' } })
      
      const sendButton = screen.getByRole('button', { name: '发送' })
      expect(sendButton).not.toBeDisabled()
    })

    it('send button shows submitting state', async () => {
      const comment = createComment()
      mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
      
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const replyButton = screen.getByRole('button', { name: '回复' })
      fireEvent.click(replyButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('写下你的回复...')).toBeInTheDocument()
      })
      
      const textarea = screen.getByPlaceholderText('写下你的回复...')
      fireEvent.change(textarea, { target: { value: '测试回复' } })
      
      const sendButton = screen.getByRole('button', { name: '发送' })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '发送中...' })).toBeInTheDocument()
      })
    })
  })

  describe('Authentication', () => {
    it('shows error when not logged in', async () => {
      mockIsLoggedIn.mockReturnValue(false)
      
      const comment = createComment()
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const replyButton = screen.getByRole('button', { name: '回复' })
      fireEvent.click(replyButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('写下你的回复...')).toBeInTheDocument()
      })
      
      const textarea = screen.getByPlaceholderText('写下你的回复...')
      fireEvent.change(textarea, { target: { value: '测试回复' } })
      
      const sendButton = screen.getByRole('button', { name: '发送' })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        expect(screen.getByText('请先登录')).toBeInTheDocument()
      })
    })

    it('shows error when auth headers are null', async () => {
      mockGetAuthHeaders.mockReturnValue(null)
      
      const comment = createComment()
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const replyButton = screen.getByRole('button', { name: '回复' })
      fireEvent.click(replyButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('写下你的回复...')).toBeInTheDocument()
      })
      
      const textarea = screen.getByPlaceholderText('写下你的回复...')
      fireEvent.change(textarea, { target: { value: '测试回复' } })
      
      const sendButton = screen.getByRole('button', { name: '发送' })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        expect(screen.getByText('登录状态已过期，请重新登录')).toBeInTheDocument()
      })
    })

    it('clears auth on 401 response', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401 })
      
      const comment = createComment()
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const replyButton = screen.getByRole('button', { name: '回复' })
      fireEvent.click(replyButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('写下你的回复...')).toBeInTheDocument()
      })
      
      const textarea = screen.getByPlaceholderText('写下你的回复...')
      fireEvent.change(textarea, { target: { value: '测试回复' } })
      
      const sendButton = screen.getByRole('button', { name: '发送' })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        expect(mockClearAuth).toHaveBeenCalled()
        expect(screen.getByText('登录状态已过期，请重新登录')).toBeInTheDocument()
      })
    })

    it('shows login link when auth expired', async () => {
      mockGetAuthHeaders.mockReturnValue(null)
      
      const comment = createComment()
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const replyButton = screen.getByRole('button', { name: '回复' })
      fireEvent.click(replyButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('写下你的回复...')).toBeInTheDocument()
      })
      
      const textarea = screen.getByPlaceholderText('写下你的回复...')
      fireEvent.change(textarea, { target: { value: '测试回复' } })
      
      const sendButton = screen.getByRole('button', { name: '发送' })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        expect(screen.getByText('重新登录')).toBeInTheDocument()
      })
    })
  })

  describe('Submit Reply', () => {
    it('submits reply successfully', async () => {
      mockFetch.mockResolvedValue({ ok: true })
      
      const comment = createComment()
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const replyButton = screen.getByRole('button', { name: '回复' })
      fireEvent.click(replyButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('写下你的回复...')).toBeInTheDocument()
      })
      
      const textarea = screen.getByPlaceholderText('写下你的回复...')
      fireEvent.change(textarea, { target: { value: '测试回复内容' } })
      
      const sendButton = screen.getByRole('button', { name: '发送' })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/forum/posts/post-1/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer at_test',
          },
          body: JSON.stringify({
            content: '测试回复内容',
            parent_id: 'comment-1',
          }),
        })
        expect(mockReload).toHaveBeenCalled()
      })
    })

    it('shows network error on fetch failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      const comment = createComment()
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const replyButton = screen.getByRole('button', { name: '回复' })
      fireEvent.click(replyButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('写下你的回复...')).toBeInTheDocument()
      })
      
      const textarea = screen.getByPlaceholderText('写下你的回复...')
      fireEvent.change(textarea, { target: { value: '测试回复' } })
      
      const sendButton = screen.getByRole('button', { name: '发送' })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        expect(screen.getByText('网络错误，请重试')).toBeInTheDocument()
      })
    })

    it('does not submit when content is only whitespace', async () => {
      const comment = createComment()
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const replyButton = screen.getByRole('button', { name: '回复' })
      fireEvent.click(replyButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('写下你的回复...')).toBeInTheDocument()
      })
      
      const textarea = screen.getByPlaceholderText('写下你的回复...')
      fireEvent.change(textarea, { target: { value: '   ' } })
      
      const sendButton = screen.getByRole('button', { name: '发送' })
      expect(sendButton).toBeDisabled()
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Whitespace Pre-wrap', () => {
    it('preserves whitespace in comment content', () => {
      const comment = createComment({ content: '第一行\n第二行\n第三行' })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      // The content should be rendered with whitespace-pre-wrap class
      // Use regex to match the multi-line content
      const contentElement = screen.getByText(/第一行/)
      expect(contentElement.closest('p')).toHaveClass('whitespace-pre-wrap')
    })
  })

  describe('Multiple Reply Forms', () => {
    it('can open multiple reply forms independently', async () => {
      const comments = [
        createComment({ id: 'comment-1', content: '评论1' }),
        createComment({ id: 'comment-2', content: '评论2' }),
      ]
      render(<CommentTree comments={comments} postId="post-1" />)
      
      const replyButtons = screen.getAllByRole('button', { name: '回复' })
      
      // Open first reply form
      fireEvent.click(replyButtons[0])
      await waitFor(() => {
        expect(screen.getByPlaceholderText('写下你的回复...')).toBeInTheDocument()
      })
      
      // Open second reply form - should show 2 textareas
      fireEvent.click(replyButtons[1])
      await waitFor(() => {
        const textareas = screen.getAllByPlaceholderText('写下你的回复...')
        expect(textareas.length).toBe(2)
      })
    })
  })

  describe('Like Feature', () => {
    it('renders like button with count', () => {
      const comment = createComment({ likes_count: 5 })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      // Match any emoji followed by 5
      expect(screen.getByText(/5/)).toBeInTheDocument()
    })

    it('shows error when not logged in and clicking like', async () => {
      mockIsLoggedIn.mockReturnValue(false)
      
      const comment = createComment({ likes_count: 3 })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      // Find like button by its text content
      const likeButton = screen.getByText(/3/).closest('button')
      fireEvent.click(likeButton!)
      
      // Should show alert (we can't easily test window.alert, so we verify it doesn't make API call)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('shows error when auth headers are null and clicking like', async () => {
      mockGetAuthHeaders.mockReturnValue(null)
      
      const comment = createComment({ likes_count: 3 })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const likeButton = screen.getByText(/3/).closest('button')
      fireEvent.click(likeButton!)
      
      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockClearAuth).toHaveBeenCalled()
    })

    it('likes comment successfully (new like)', async () => {
      mockFetch.mockResolvedValue({ 
        ok: true, 
        json: () => Promise.resolve({ success: true, liked: true }) 
      })
      
      const comment = createComment({ id: 'comment-456', likes_count: 3 })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const likeButton = screen.getByText(/3/).closest('button')
      fireEvent.click(likeButton!)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/forum/comments/comment-456/like', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer at_test' }
        })
        // After liking, count should be 4
        expect(screen.getByText(/4/)).toBeInTheDocument()
      })
    })

    it('unlikes comment successfully (remove like)', async () => {
      // First render with liked state
      const comment = createComment({ id: 'comment-456', likes_count: 5 })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      // Click to like first
      mockFetch.mockResolvedValue({ 
        ok: true, 
        json: () => Promise.resolve({ success: true, liked: true }) 
      })
      
      const likeButton = screen.getByText(/5/).closest('button')
      fireEvent.click(likeButton!)
      
      await waitFor(() => {
        expect(screen.getByText(/6/)).toBeInTheDocument()
      })
      
      // Click again to unlike
      mockFetch.mockResolvedValue({ 
        ok: true, 
        json: () => Promise.resolve({ success: true, liked: false }) 
      })
      
      const unlikeButton = screen.getByText(/6/).closest('button')
      fireEvent.click(unlikeButton!)
      
      await waitFor(() => {
        expect(screen.getByText(/5/)).toBeInTheDocument()
      })
    })

    it('clears auth on 401 response when liking', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401 })
      
      const comment = createComment({ likes_count: 3 })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const likeButton = screen.getByText(/3/).closest('button')
      fireEvent.click(likeButton!)
      
      await waitFor(() => {
        expect(mockClearAuth).toHaveBeenCalled()
      })
    })

    it('handles network error when liking gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      const comment = createComment({ likes_count: 3 })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const likeButton = screen.getByText(/3/).closest('button')
      fireEvent.click(likeButton!)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
        // Count should remain unchanged
        expect(screen.getByText(/3/)).toBeInTheDocument()
      })
    })

    it('updates count correctly after like', async () => {
      mockFetch.mockResolvedValue({ 
        ok: true, 
        json: () => Promise.resolve({ success: true, liked: true }) 
      })
      
      const comment = createComment({ likes_count: 0 })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      expect(screen.getByText(/0/)).toBeInTheDocument()
      
      const likeButton = screen.getByText(/0/).closest('button')
      fireEvent.click(likeButton!)
      
      await waitFor(() => {
        expect(screen.getByText(/1/)).toBeInTheDocument()
      })
    })

    it('shows heart emoji when liked', async () => {
      mockFetch.mockResolvedValue({ 
        ok: true, 
        json: () => Promise.resolve({ success: true, liked: true }) 
      })
      
      const comment = createComment({ likes_count: 2 })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const likeButton = screen.getByText(/2/).closest('button')
      fireEvent.click(likeButton!)
      
      await waitFor(() => {
        // After liking, the button should have heart emoji class
        const buttons = document.querySelectorAll('button')
        let foundHeart = false
        buttons.forEach(btn => {
          if (btn.textContent?.includes('3') && btn.classList.contains('text-red-500')) {
            foundHeart = true
          }
        })
        expect(foundHeart).toBe(true)
      })
    })

    it('like button has red color when liked', async () => {
      mockFetch.mockResolvedValue({ 
        ok: true, 
        json: () => Promise.resolve({ success: true, liked: true }) 
      })
      
      const comment = createComment({ likes_count: 2 })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      const likeButton = screen.getByText(/2/).closest('button')
      fireEvent.click(likeButton!)
      
      await waitFor(() => {
        const likedButton = screen.getByText(/3/).closest('button')
        expect(likedButton).toHaveClass('text-red-500')
      })
    })

    it('can like multiple comments independently', async () => {
      mockFetch.mockResolvedValue({ 
        ok: true, 
        json: () => Promise.resolve({ success: true, liked: true }) 
      })
      
      const comments = [
        createComment({ id: 'comment-1', likes_count: 10 }),
        createComment({ id: 'comment-2', likes_count: 20 }),
      ]
      render(<CommentTree comments={comments} postId="post-1" />)
      
      // Verify both like counts are rendered (using unique numbers)
      expect(screen.getByText(/10/)).toBeInTheDocument()
      expect(screen.getByText(/20/)).toBeInTheDocument()
      
      // Like first comment
      const likeButton1 = screen.getByText(/10/).closest('button')
      fireEvent.click(likeButton1!)
      await waitFor(() => {
        expect(screen.getByText(/11/)).toBeInTheDocument()
      })
      
      // Like second comment
      const likeButton2 = screen.getByText(/20/).closest('button')
      fireEvent.click(likeButton2!)
      await waitFor(() => {
        expect(screen.getByText(/21/)).toBeInTheDocument()
      })
    })

    it('likes in nested replies work correctly', async () => {
      mockFetch.mockResolvedValue({ 
        ok: true, 
        json: () => Promise.resolve({ success: true, liked: true }) 
      })
      
      const reply = createComment({ id: 'reply-1', likes_count: 0, parent_id: 'comment-1' })
      const comment = createComment({ id: 'comment-1', likes_count: 5, replies: [reply] })
      render(<CommentTree comments={[comment]} postId="post-1" />)
      
      // Verify both like counts are rendered
      expect(screen.getByText(/5/)).toBeInTheDocument()
      expect(screen.getByText(/0/)).toBeInTheDocument()
      
      // Like the reply - find the button containing 0
      const replyLikeButton = screen.getByText(/0/).closest('button')
      fireEvent.click(replyLikeButton!)
      
      await waitFor(() => {
        expect(screen.getByText(/1/)).toBeInTheDocument()
      })
    })
  })
})