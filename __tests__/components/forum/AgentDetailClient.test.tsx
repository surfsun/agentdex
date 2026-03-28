import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AgentDetailClient from '@/app/forum/agent/[id]/AgentDetailClient'
import type { AgentProfile, Post, Comment } from '@/lib/forum/types'

// Mock Next.js components
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, unoptimized, className }: { src: string; alt: string; unoptimized?: boolean; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-unoptimized={unoptimized} />
  ),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Test data factory
const createMockAgent = (overrides?: Partial<AgentProfile>): AgentProfile => ({
  id: 'agent-123',
  name: 'TestAgent',
  platform: 'agentdex',
  avatar_url: null,
  personality: 'A test agent for unit testing',
  expertise: ['testing', 'vitest'],
  created_at: '2026-03-27T10:00:00Z',
  posts_count: 5,
  comments_count: 10,
  ...overrides,
})

const createMockPost = (overrides?: Partial<Post>): Post => ({
  id: 'post-123',
  title: 'Test Post',
  content: 'This is test content',
  author_id: 'agent-123',
  author_name: 'TestAgent',
  author_avatar_url: null,
  tags: ['test', 'vitest'],
  likes_count: 5,
  comments_count: 3,
  views_count: 100,
  is_pinned: false,
  created_at: '2026-03-27T10:00:00Z',
  updated_at: '2026-03-27T10:00:00Z',
  ...overrides,
})

const createMockComment = (overrides?: Partial<Comment & { post?: { id: string; title: string } }>): Comment & { post?: { id: string; title: string } } => ({
  id: 'comment-123',
  content: 'Test comment content',
  author_id: 'agent-123',
  author_name: 'TestAgent',
  author_avatar_url: null,
  post_id: 'post-123',
  parent_id: null,
  likes_count: 2,
  replies_count: 0,
  depth: 0,
  created_at: '2026-03-27T10:00:00Z',
  updated_at: '2026-03-27T10:00:00Z',
  post: { id: 'post-123', title: 'Test Post' },
  ...overrides,
})

describe('AgentDetailClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('基础渲染', () => {
    it('渲染 agent 名称和 platform 标签', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={5}
          commentsTotal={10}
          locale="zh-CN"
        />
      )

      expect(screen.getByText('TestAgent')).toBeInTheDocument()
      expect(screen.getByText('agentdex')).toBeInTheDocument()
    })

    it('渲染 agent personality 描述', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={5}
          commentsTotal={10}
          locale="zh-CN"
        />
      )

      expect(screen.getByText('A test agent for unit testing')).toBeInTheDocument()
    })

    it('渲染 expertise 标签', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={5}
          commentsTotal={10}
          locale="zh-CN"
        />
      )

      expect(screen.getByText('testing')).toBeInTheDocument()
      expect(screen.getByText('vitest')).toBeInTheDocument()
    })

    it('无 expertise 时不渲染标签区域', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent({ expertise: [] })}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={5}
          commentsTotal={10}
          locale="zh-CN"
        />
      )

      expect(screen.queryByText('testing')).not.toBeInTheDocument()
    })

    it('渲染统计数据（帖子数、评论数、加入时间）', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={5}
          commentsTotal={10}
          locale="zh-CN"
        />
      )

      expect(screen.getByText(/5.*帖子/)).toBeInTheDocument()
      expect(screen.getByText(/10.*评论/)).toBeInTheDocument()
      expect(screen.getByText(/加入于/)).toBeInTheDocument()
    })
  })

  describe('头像显示', () => {
    it('无头像时显示首字母', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent({ avatar_url: null })}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={5}
          commentsTotal={10}
          locale="zh-CN"
        />
      )

      expect(screen.getByText('T')).toBeInTheDocument()
    })

    it('有头像时显示图片', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent({ avatar_url: 'https://example.com/avatar.png' })}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={5}
          commentsTotal={10}
          locale="zh-CN"
        />
      )

      const avatar = screen.getByAltText('TestAgent')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png')
    })
  })

  describe('Platform 标签', () => {
    it('显示正确的 platform icon 和颜色', () => {
      const { container } = render(
        <AgentDetailClient
          agent={createMockAgent({ platform: 'openai' })}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={5}
          commentsTotal={10}
          locale="zh-CN"
        />
      )

      expect(screen.getByText('🤖')).toBeInTheDocument()
      expect(screen.getByText('openai')).toBeInTheDocument()
    })

    it('未知 platform 使用默认样式', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent({ platform: 'unknown-platform' })}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={5}
          commentsTotal={10}
          locale="zh-CN"
        />
      )

      expect(screen.getByText('🤖')).toBeInTheDocument()
      expect(screen.getByText('unknown-platform')).toBeInTheDocument()
    })
  })

  describe('标签页切换', () => {
    it('默认显示帖子标签页', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost()]}
          initialComments={[]}
          postsTotal={1}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })

    it('切换到评论标签页显示评论', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[createMockComment()]}
          postsTotal={0}
          commentsTotal={1}
          locale="zh-CN"
        />
      )

      // Click comments tab
      const commentsTab = screen.getByRole('button', { name: /评论/ })
      fireEvent.click(commentsTab)

      expect(screen.getByText('Test comment content')).toBeInTheDocument()
    })

    it('标签页显示正确的计数', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={15}
          commentsTotal={20}
          locale="zh-CN"
        />
      )

      expect(screen.getByText(/帖子.*\(15\)/)).toBeInTheDocument()
      expect(screen.getByText(/评论.*\(20\)/)).toBeInTheDocument()
    })

    it('帖子标签页选中状态', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={5}
          commentsTotal={10}
          locale="zh-CN"
        />
      )

      const postsTab = screen.getByRole('button', { name: /帖子/ })
      expect(postsTab).toHaveClass('border-blue-500')
    })

    it('评论标签页选中状态', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={5}
          commentsTotal={10}
          locale="zh-CN"
        />
      )

      const commentsTab = screen.getByRole('button', { name: /评论/ })
      fireEvent.click(commentsTab)

      expect(commentsTab).toHaveClass('border-blue-500')
    })
  })

  describe('帖子列表', () => {
    it('渲染帖子标题和内容', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost()]}
          initialComments={[]}
          postsTotal={1}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      expect(screen.getByText('Test Post')).toBeInTheDocument()
      expect(screen.getByText('This is test content')).toBeInTheDocument()
    })

    it('显示帖子统计（点赞、评论）', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost({ likes_count: 10, comments_count: 5 })]}
          initialComments={[]}
          postsTotal={1}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('显示帖子标签', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost({ tags: ['vitest', 'react'] })]}
          initialComments={[]}
          postsTotal={1}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      expect(screen.getByText('#vitest')).toBeInTheDocument()
    })

    it('无帖子时显示空状态', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={0}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      expect(screen.getByText('暂无帖子')).toBeInTheDocument()
    })

    it('帖子链接指向详情页', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost({ id: 'post-abc' })]}
          initialComments={[]}
          postsTotal={1}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      const postLink = screen.getByRole('link', { name: /Test Post/ })
      expect(postLink).toHaveAttribute('href', '/forum/post/post-abc')
    })
  })

  describe('评论列表', () => {
    it('渲染评论内容', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[createMockComment()]}
          postsTotal={0}
          commentsTotal={1}
          locale="zh-CN"
        />
      )

      // Switch to comments tab
      fireEvent.click(screen.getByRole('button', { name: /评论/ }))

      expect(screen.getByText('Test comment content')).toBeInTheDocument()
    })

    it('显示评论统计', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[createMockComment({ likes_count: 8 })]}
          postsTotal={0}
          commentsTotal={1}
          locale="zh-CN"
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /评论/ }))

      expect(screen.getByText('8')).toBeInTheDocument()
    })

    it('显示"查看帖子"链接', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[createMockComment({ post: { id: 'post-xyz', title: 'Related Post' } })]}
          postsTotal={0}
          commentsTotal={1}
          locale="zh-CN"
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /评论/ }))

      const viewPostLink = screen.getByRole('link', { name: /查看帖子/ })
      expect(viewPostLink).toHaveAttribute('href', '/forum/post/post-xyz')
    })

    it('无评论时显示空状态', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost()]}
          initialComments={[]}
          postsTotal={1}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /评论/ }))

      expect(screen.getByText('暂无评论')).toBeInTheDocument()
    })
  })

  describe('加载更多', () => {
    it('显示"加载更多"按钮当有更多帖子', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost()]}
          initialComments={[]}
          postsTotal={5}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      expect(screen.getByRole('button', { name: '加载更多' })).toBeInTheDocument()
    })

    it('不显示"加载更多"当已加载全部帖子', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost(), createMockPost({ id: 'post-2' })]}
          initialComments={[]}
          postsTotal={2}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      expect(screen.queryByRole('button', { name: '加载更多' })).not.toBeInTheDocument()
    })

    it('点击加载更多触发 API 请求', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: [createMockPost({ id: 'post-2', title: 'Second Post' })],
        }),
      })

      render(
        <AgentDetailClient
          agent={createMockAgent({ id: 'agent-xyz' })}
          initialPosts={[createMockPost({ id: 'post-1' })]}
          initialComments={[]}
          postsTotal={2}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      fireEvent.click(screen.getByRole('button', { name: '加载更多' }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/forum/agents/agent-xyz/posts?page=2&limit=10')
      })
    })

    it('加载更多成功后显示新帖子', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: [createMockPost({ id: 'post-2', title: 'Second Post' })],
        }),
      })

      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost({ id: 'post-1', title: 'First Post' })]}
          initialComments={[]}
          postsTotal={2}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      fireEvent.click(screen.getByRole('button', { name: '加载更多' }))

      await waitFor(() => {
        expect(screen.getByText('Second Post')).toBeInTheDocument()
      })
    })

    it('加载中显示加载状态', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => 
          resolve({
            json: () => Promise.resolve({ success: true, data: [] }),
          }, 100)
        ))
      )

      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost({ id: 'post-1' })]}
          initialComments={[]}
          postsTotal={2}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      fireEvent.click(screen.getByRole('button', { name: '加载更多' }))

      expect(screen.getByRole('button', { name: '加载中...' })).toBeInTheDocument()

      vi.useRealTimers()
    })

    it('评论标签页显示"加载更多"按钮', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[createMockComment()]}
          postsTotal={0}
          commentsTotal={5}
          locale="zh-CN"
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /评论/ }))

      expect(screen.getByRole('button', { name: '加载更多' })).toBeInTheDocument()
    })
  })

  describe('导航链接', () => {
    it('返回论坛链接', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={0}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      const backLink = screen.getByRole('link', { name: /返回论坛/ })
      expect(backLink).toHaveAttribute('href', '/forum')
    })
  })

  describe('时间格式化', () => {
    it('显示"刚刚"对于最近的帖子', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-27T10:00:30Z'))

      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost({ created_at: '2026-03-27T10:00:00Z' })]}
          initialComments={[]}
          postsTotal={1}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      expect(screen.getByText('刚刚')).toBeInTheDocument()

      vi.useRealTimers()
    })

    it('显示"分钟前"对于几分钟前的帖子', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-27T10:30:00Z'))

      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost({ created_at: '2026-03-27T10:00:00Z' })]}
          initialComments={[]}
          postsTotal={1}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      expect(screen.getByText(/30.*分钟前/)).toBeInTheDocument()

      vi.useRealTimers()
    })

    it('显示"小时前"对于几小时前的帖子', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-27T14:00:00Z'))

      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost({ created_at: '2026-03-27T10:00:00Z' })]}
          initialComments={[]}
          postsTotal={1}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      expect(screen.getByText(/4.*小时前/)).toBeInTheDocument()

      vi.useRealTimers()
    })

    it('显示"天前"对于几天前的帖子', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-30T10:00:00Z'))

      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost({ created_at: '2026-03-27T10:00:00Z' })]}
          initialComments={[]}
          postsTotal={1}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      expect(screen.getByText(/3.*天前/)).toBeInTheDocument()

      vi.useRealTimers()
    })
  })

  describe('英文 locale', () => {
    it('显示英文文本', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={5}
          commentsTotal={10}
          locale="en-US"
        />
      )

      expect(screen.getByRole('link', { name: /Back to Forum/ })).toBeInTheDocument()
      expect(screen.getByText(/5.*posts/)).toBeInTheDocument()
      expect(screen.getByText(/10.*comments/)).toBeInTheDocument()
    })

    it('英文空状态', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={0}
          commentsTotal={0}
          locale="en-US"
        />
      )

      expect(screen.getByText('No posts yet')).toBeInTheDocument()
    })

    it('英文加载更多按钮', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost()]}
          initialComments={[]}
          postsTotal={5}
          commentsTotal={0}
          locale="en-US"
        />
      )

      expect(screen.getByRole('button', { name: 'Load More' })).toBeInTheDocument()
    })
  })

  describe('边界情况', () => {
    it('无 personality 时不显示描述', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent({ personality: null })}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={0}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      expect(screen.queryByText('A test agent for unit testing')).not.toBeInTheDocument()
    })

    it('空字符串 personality 不显示', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent({ personality: '' })}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={0}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      // Empty string personality should not render the paragraph element
      // The paragraph is only rendered when personality is truthy
      const personalityParagraph = screen.queryByText('A test agent for unit testing')
      expect(personalityParagraph).not.toBeInTheDocument()
    })

    it('大量 expertise 标签渲染', () => {
      const manyExpertise = ['skill1', 'skill2', 'skill3', 'skill4', 'skill5']
      render(
        <AgentDetailClient
          agent={createMockAgent({ expertise: manyExpertise })}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={0}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      manyExpertise.forEach(skill => {
        expect(screen.getByText(skill)).toBeInTheDocument()
      })
    })

    it('中文 agent 名称', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent({ name: '测试机器人' })}
          initialPosts={[]}
          initialComments={[]}
          postsTotal={0}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      expect(screen.getByText('测试机器人')).toBeInTheDocument()
    })

    it('中文帖子标题', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[createMockPost({ title: '关于 AI Agent 的思考' })]}
          initialComments={[]}
          postsTotal={1}
          commentsTotal={0}
          locale="zh-CN"
        />
      )

      expect(screen.getByText('关于 AI Agent 的思考')).toBeInTheDocument()
    })

    it('中文评论内容', () => {
      render(
        <AgentDetailClient
          agent={createMockAgent()}
          initialPosts={[]}
          initialComments={[createMockComment({ content: '这是一条中文评论' })]}
          postsTotal={0}
          commentsTotal={1}
          locale="zh-CN"
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /评论/ }))

      expect(screen.getByText('这是一条中文评论')).toBeInTheDocument()
    })
  })
})