import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CommentForm from '@/components/forum/CommentForm'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock MarkdownEditor (dynamic import)
vi.mock('@/components/forum/MarkdownEditor', () => ({
  default: ({ value, onChange, placeholder, disabled }: { value: string; onChange: (v: string) => void; placeholder: string; disabled?: boolean }) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      disabled={disabled}
    />
  ),
}))

// Mock auth functions
const mockIsLoggedIn = vi.fn()
const mockGetAuthHeaders = vi.fn()
const mockClearAuth = vi.fn()

vi.mock('@/lib/identity/client-auth', () => ({
  isLoggedIn: () => mockIsLoggedIn(),
  getAuthHeaders: () => mockGetAuthHeaders(),
  clearAuth: () => mockClearAuth(),
}))

describe('CommentForm', () => {
  const mockOnSubmitted = vi.fn()
  const postId = 'test-post-id'

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoggedIn.mockReturnValue(true)
    mockGetAuthHeaders.mockReturnValue({ 'Authorization': 'Bearer at_test' })
  })

  describe('基础渲染', () => {
    it('渲染标题', () => {
      render(<CommentForm postId={postId} />)

      expect(screen.getByText('发表评论')).toBeInTheDocument()
    })

    it('渲染文本输入框', () => {
      render(<CommentForm postId={postId} />)

      expect(screen.getByPlaceholderText(/分享你的想法/)).toBeInTheDocument()
    })

    it('渲染发送按钮', () => {
      render(<CommentForm postId={postId} />)

      expect(screen.getByRole('button', { name: '发送评论' })).toBeInTheDocument()
    })

    it('空内容时发送按钮禁用', () => {
      render(<CommentForm postId={postId} />)

      const submitBtn = screen.getByRole('button', { name: '发送评论' })
      expect(submitBtn).toBeDisabled()
    })

    it('有内容时发送按钮启用', () => {
      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '这是一条评论' } })

      const submitBtn = screen.getByRole('button', { name: '发送评论' })
      expect(submitBtn).not.toBeDisabled()
    })

    it('textarea 默认 3 行', () => {
      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      expect(textarea).toHaveAttribute('rows', '3')
    })
  })

  describe('内容输入', () => {
    it('输入内容更新 textarea 值', () => {
      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '新评论内容' } })

      expect(textarea).toHaveValue('新评论内容')
    })

    it('空白内容不启用发送按钮', () => {
      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '   ' } })

      const submitBtn = screen.getByRole('button', { name: '发送评论' })
      expect(submitBtn).toBeDisabled()
    })

    it('提交中 textarea 禁用', async () => {
      // 模拟慢速响应 - 使用未完成的 Promise
      global.fetch = vi.fn().mockReturnValue(
        new Promise(() => {}) // 永不 resolve
      )

      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '内容' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      // 提交中 textarea 应被禁用
      expect(textarea).toBeDisabled()
    })
  })

  describe('认证检查', () => {
    it('未登录时显示错误', () => {
      mockIsLoggedIn.mockReturnValue(false)

      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '内容' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      expect(screen.getByText('请先登录')).toBeInTheDocument()
    })

    it('认证 headers 为 null 时显示过期错误', () => {
      mockGetAuthHeaders.mockReturnValue(null)

      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '内容' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      expect(screen.getByText('登录状态已过期，请重新登录')).toBeInTheDocument()
      expect(mockClearAuth).toHaveBeenCalled()
    })

    it('过期错误显示重新登录链接', () => {
      mockGetAuthHeaders.mockReturnValue(null)

      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '内容' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      const loginLink = screen.getByRole('link', { name: '重新登录' })
      expect(loginLink).toHaveAttribute('href', '/login')
    })
  })

  describe('表单提交', () => {
    beforeEach(() => {
      global.fetch = vi.fn()
    })

    it('提交成功后清空内容', async () => {
      mockFetchSuccess()

      render(<CommentForm postId={postId} onSubmitted={mockOnSubmitted} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '测试评论' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      await waitFor(() => {
        expect(textarea).toHaveValue('')
      })
    })

    it('提交成功后调用 onSubmitted', async () => {
      mockFetchSuccess()

      render(<CommentForm postId={postId} onSubmitted={mockOnSubmitted} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '测试评论' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      await waitFor(() => {
        expect(mockOnSubmitted).toHaveBeenCalled()
      })
    })

    it('提交成功后调用 window.location.reload', async () => {
      mockFetchSuccess()

      // Mock window.location.reload
      const originalLocation = window.location
      const reloadMock = vi.fn()
      // @ts-expect-error - mock location for test
      delete window.location
      window.location = { reload: reloadMock }

      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '测试评论' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      await waitFor(() => {
        expect(reloadMock).toHaveBeenCalled()
      })

      // Restore
      window.location = originalLocation
    })

    it('401 错误显示过期信息', async () => {
      mockFetchUnauthorized()

      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '测试评论' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      await waitFor(() => {
        expect(screen.getByText('登录状态已过期，请重新登录')).toBeInTheDocument()
        expect(mockClearAuth).toHaveBeenCalled()
      })
    })

    it('其他错误显示错误信息', async () => {
      mockFetchError({ error: '服务器错误' })

      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '测试评论' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      await waitFor(() => {
        expect(screen.getByText('服务器错误')).toBeInTheDocument()
      })
    })

    it('网络错误显示提示', async () => {
      mockFetchNetworkError()

      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '测试评论' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      await waitFor(() => {
        expect(screen.getByText('网络错误，请重试')).toBeInTheDocument()
      })
    })
  })

  describe('提交按钮状态', () => {
    beforeEach(() => {
      global.fetch = vi.fn()
    })

    it('提交中显示发送中文字', async () => {
      // 模拟慢速响应
      global.fetch = vi.fn().mockReturnValue(
        new Promise(() => {}) // 永不 resolve
      )

      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '测试评论' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      expect(screen.getByRole('button', { name: '发送中...' })).toBeInTheDocument()
    })

    it('提交中按钮禁用', async () => {
      // 模拟慢速响应
      global.fetch = vi.fn().mockReturnValue(
        new Promise(() => {}) // 永不 resolve
      )

      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '测试评论' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      const submitBtn = screen.getByRole('button', { name: '发送中...' })
      expect(submitBtn).toBeDisabled()
    })

    it('提交完成后按钮恢复', async () => {
      mockFetchSuccess()

      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '测试评论' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '发送评论' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '发送评论' })).toBeDisabled()
      })
    })
  })

  describe('错误显示', () => {
    beforeEach(() => {
      global.fetch = vi.fn()
    })

    it('错误信息显示为红色', async () => {
      mockFetchError({ error: '测试错误' })

      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '测试评论' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      await waitFor(() => {
        const errorText = screen.getByText('测试错误')
        expect(errorText.className).toContain('text-red-500')
      })
    })

    it('错误后可再次提交', async () => {
      mockFetchError({ error: '第一次错误' })

      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '测试评论' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      await waitFor(() => {
        expect(screen.getByText('第一次错误')).toBeInTheDocument()
      })

      // 第二次提交成功
      mockFetchSuccess()
      fireEvent.change(textarea, { target: { value: '再次提交' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      await waitFor(() => {
        expect(screen.queryByText('第一次错误')).not.toBeInTheDocument()
      })
    })
  })

  describe('onSubmitted 参数', () => {
    beforeEach(() => {
      global.fetch = vi.fn()
    })

    it('无 onSubmitted 参数时正常工作', async () => {
      mockFetchSuccess()

      render(<CommentForm postId={postId} />)

      const textarea = screen.getByPlaceholderText(/分享你的想法/)
      fireEvent.change(textarea, { target: { value: '测试评论' } })
      fireEvent.click(screen.getByRole('button', { name: '发送评论' }))

      await waitFor(() => {
        expect(textarea).toHaveValue('')
      })
    })
  })
})

// Helper functions for mocking fetch
function mockFetchSuccess() {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  } as Response)
}

function mockFetchUnauthorized() {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: false,
    status: 401,
    json: async () => ({ error: 'Unauthorized' }),
  } as Response)
}

function mockFetchError(data: { error: string }) {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: false,
    status: 500,
    json: async () => data,
  } as Response)
}

function mockFetchNetworkError() {
  vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))
}

