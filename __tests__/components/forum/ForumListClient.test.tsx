import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ForumListClient from '@/components/forum/ForumListClient'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ href, children, className, onClick }: any) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  )
}))

// Mock next/navigation
const mockPush = vi.fn()

// Create a mock searchParams that supports get() method
function createMockSearchParams(initial: Record<string, string> = {}) {
  const params = { ...initial }
  return {
    get: (key: string) => params[key] || null,
    toString: () => Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&'),
  }
}

let currentSearchParams = createMockSearchParams()

vi.mock('next/navigation', () => ({
  useSearchParams: () => currentSearchParams,
  useRouter: () => ({ push: mockPush }),
}))

// Helper to create mock post
function createMockPost(overrides = {}) {
  return {
    id: 'post-' + Math.random().toString(36).slice(2),
    title: '测试帖子',
    content: '这是测试内容',
    tags: ['讨论'],
    likes_count: 5,
    comments_count: 2,
    views_count: 100,
    pinned: false,
    post_type: 'normal',
    created_at: new Date().toISOString(),
    author: {
      id: 'author-id',
      name: 'TestAgent',
      platform: 'agentdex',
      avatar_url: null,
    },
    ...overrides,
  }
}

describe('ForumListClient', () => {
  const defaultPosts = [createMockPost(), createMockPost({ id: 'post-2', title: '第二个帖子' })]
  const defaultProps = {
    initialPosts: defaultPosts,
    initialTotal: 2,
    initialTag: '',
    initialSort: 'new' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    currentSearchParams = createMockSearchParams()
  })

  describe('SSR 初始渲染', () => {
    it('渲染初始帖子列表', () => {
      render(<ForumListClient {...defaultProps} />)
      expect(screen.getByText('测试帖子')).toBeInTheDocument()
      expect(screen.getByText('第二个帖子')).toBeInTheDocument()
    })

    it('显示帖子总数', () => {
      render(<ForumListClient {...defaultProps} />)
      expect(screen.getByText(/共 2 篇帖子/)).toBeInTheDocument()
    })

    it('渲染发布帖子按钮', () => {
      render(<ForumListClient {...defaultProps} />)
      expect(screen.getByText('发布帖子')).toBeInTheDocument()
    })

    it('渲染排序选项', () => {
      render(<ForumListClient {...defaultProps} />)
      expect(screen.getByText('📝 最新')).toBeInTheDocument()
      expect(screen.getByText('🔥 热门')).toBeInTheDocument()
    })
  })

  describe('标题显示', () => {
    it('无标签时显示默认标题', () => {
      render(<ForumListClient {...defaultProps} initialTag="" />)
      // 标题中 emoji 和文字分开，用正则匹配
      expect(screen.getByRole('heading', { name: /论坛/ })).toBeInTheDocument()
    })

    it('有标签时显示带标签的标题', () => {
      currentSearchParams = createMockSearchParams({ tag: '工具推荐' })
      render(<ForumListClient {...defaultProps} initialTag="工具推荐" />)
      expect(screen.getByRole('heading', { name: /工具推荐.*论坛/ })).toBeInTheDocument()
    })

    it('描述文字包含标签', () => {
      currentSearchParams = createMockSearchParams({ tag: '工具推荐' })
      render(<ForumListClient {...defaultProps} initialTag="工具推荐" />)
      expect(screen.getByText(/工具推荐 · 2 篇帖子/)).toBeInTheDocument()
    })
  })

  describe('帖子类型标记', () => {
    it('置顶帖子显示置顶标记', () => {
      render(<ForumListClient 
        {...defaultProps} 
        initialPosts={[createMockPost({ pinned: true })]} 
      />)
      expect(screen.getByText('置顶')).toBeInTheDocument()
    })

    it('结构化帖子显示结构化标记', () => {
      render(<ForumListClient 
        {...defaultProps} 
        initialPosts={[createMockPost({ post_type: 'structured' })]} 
      />)
      expect(screen.getByText('🤖 结构化')).toBeInTheDocument()
    })

    it('普通帖子不显示特殊标记', () => {
      render(<ForumListClient 
        {...defaultProps} 
        initialPosts={[createMockPost({ pinned: false, post_type: 'normal' })]} 
      />)
      expect(screen.queryByText('置顶')).not.toBeInTheDocument()
      expect(screen.queryByText('🤖 结构化')).not.toBeInTheDocument()
    })
  })

  describe('排序切换', () => {
    it('默认选中最新排序', () => {
      render(<ForumListClient {...defaultProps} initialSort="new" />)
      // 排序按钮文字包含 emoji，用正则匹配
      const newBtn = screen.getByRole('button', { name: /最新/ })
      expect(newBtn).toHaveClass('border-blue-600')
    })

    it('热门排序初始选中', () => {
      currentSearchParams = createMockSearchParams({ sort: 'hot' })
      render(<ForumListClient {...defaultProps} initialSort="hot" />)
      const hotBtn = screen.getByRole('button', { name: /热门/ })
      expect(hotBtn).toHaveClass('border-blue-600')
    })

    it('点击切换排序并更新 URL', () => {
      render(<ForumListClient {...defaultProps} initialSort="new" />)
      
      const hotBtn = screen.getByRole('button', { name: /热门/ })
      fireEvent.click(hotBtn!)

      expect(mockPush).toHaveBeenCalledWith('/forum?sort=hot')
    })
  })

  describe('标签筛选', () => {
    it('渲染标签按钮', () => {
      render(<ForumListClient {...defaultProps} />)
      // 标签名和 emoji 是分开的 span，所以只检查标签名
      expect(screen.getByText('工具推荐')).toBeInTheDocument()
      expect(screen.getByText('问答求助')).toBeInTheDocument()
    })

    it('选中标签显示高亮样式', () => {
      currentSearchParams = createMockSearchParams({ tag: '工具推荐' })
      render(<ForumListClient {...defaultProps} initialTag="工具推荐" />)
      // 找到标签名所在的按钮
      const tagName = screen.getByText('工具推荐')
      const tagBtn = tagName.closest('button')
      expect(tagBtn).toHaveClass('ring-2')
    })

    it('点击标签筛选并更新 URL', () => {
      render(<ForumListClient {...defaultProps} />)
      
      const tagName = screen.getByText('工具推荐')
      const tagBtn = tagName.closest('button')
      fireEvent.click(tagBtn!)

      expect(mockPush).toHaveBeenCalledWith('/forum?tag=%E5%B7%A5%E5%85%B7%E6%8E%A8%E8%8D%90')
    })

    it('再次点击同一标签取消筛选', () => {
      currentSearchParams = createMockSearchParams({ tag: '工具推荐' })
      render(<ForumListClient {...defaultProps} initialTag="工具推荐" />)
      
      const tagName = screen.getByText('工具推荐')
      const tagBtn = tagName.closest('button')
      fireEvent.click(tagBtn!)

      expect(mockPush).toHaveBeenCalledWith('/forum')
    })
  })

  describe('空状态', () => {
    it('无帖子时显示空状态', () => {
      render(<ForumListClient 
        {...defaultProps} 
        initialPosts={[]} 
        initialTotal={0} 
      />)
      expect(screen.getByText(/还没有帖子/)).toBeInTheDocument()
    })

    it('空状态显示快捷操作按钮', () => {
      render(<ForumListClient 
        {...defaultProps} 
        initialPosts={[]} 
        initialTotal={0} 
      />)
      expect(screen.getByText('分享工具')).toBeInTheDocument()
      expect(screen.getByText('提问求助')).toBeInTheDocument()
      expect(screen.getByText('发布教程')).toBeInTheDocument()
    })
  })

  describe('帖子作者显示', () => {
    it('显示作者名称', () => {
      render(<ForumListClient 
        {...defaultProps} 
        initialPosts={[createMockPost({ author: { id: 'a1', name: 'MyAgent', platform: 'agentdex' } })]} 
      />)
      expect(screen.getByText(/MyAgent/)).toBeInTheDocument()
    })

    it('作者不存在时显示 Anonymous', () => {
      render(<ForumListClient 
        {...defaultProps} 
        initialPosts={[createMockPost({ author: null as any })]} 
      />)
      expect(screen.getByText(/Anonymous/)).toBeInTheDocument()
    })
  })

  describe('帖子统计显示', () => {
    it('显示点赞数', () => {
      render(<ForumListClient 
        {...defaultProps} 
        initialPosts={[createMockPost({ likes_count: 4242 })]} 
      />)
      expect(screen.getByText(/4242/)).toBeInTheDocument()
    })

    it('显示评论数', () => {
      render(<ForumListClient 
        {...defaultProps} 
        initialPosts={[createMockPost({ comments_count: 1515 })]} 
      />)
      expect(screen.getByText(/1515/)).toBeInTheDocument()
    })

    it('显示浏览数', () => {
      render(<ForumListClient 
        {...defaultProps} 
        initialPosts={[createMockPost({ views_count: 9999 })]} 
      />)
      expect(screen.getByText(/9999/)).toBeInTheDocument()
    })
  })

  describe('帖子标签显示', () => {
    it('显示帖子标签', () => {
      render(<ForumListClient 
        {...defaultProps} 
        initialPosts={[createMockPost({ tags: ['独特标签A', '独特标签B'] })]} 
      />)
      const tagA = screen.getByText('独特标签A')
      expect(tagA).toBeInTheDocument()
      expect(screen.getByText('独特标签B')).toBeInTheDocument()
    })

    it('最多显示 3 个标签', () => {
      render(<ForumListClient 
        {...defaultProps} 
        initialPosts={[createMockPost({ tags: ['独特1', '独特2', '独特3', '独特4', '独特5'] })]} 
      />)
      expect(screen.getByText('独特1')).toBeInTheDocument()
      expect(screen.getByText('独特2')).toBeInTheDocument()
      expect(screen.getByText('独特3')).toBeInTheDocument()
      expect(screen.queryByText('独特4')).not.toBeInTheDocument()
      expect(screen.queryByText('独特5')).not.toBeInTheDocument()
    })

    it('无标签时不显示标签区域', () => {
      render(<ForumListClient 
        {...defaultProps} 
        initialPosts={[createMockPost({ tags: [] })]} 
      />)
      const tagBadges = document.querySelectorAll('.flex.gap-1\\.5.mt-3 .rounded-full')
      expect(tagBadges.length).toBe(0)
    })
  })

  describe('链接导航', () => {
    it('发布按钮链接到 /forum/new', () => {
      render(<ForumListClient {...defaultProps} />)
      const newPostLink = screen.getByText('发布帖子').closest('a')
      expect(newPostLink?.getAttribute('href')).toBe('/forum/new')
    })

    it('帖子标题链接到详情页', () => {
      const post = createMockPost({ id: 'test-post-123' })
      render(<ForumListClient {...defaultProps} initialPosts={[post]} />)
      
      const postLink = screen.getByText(post.title).closest('a')
      expect(postLink?.getAttribute('href')).toBe(`/forum/post/${post.id}`)
    })
  })

  describe('日期显示', () => {
    it('显示帖子创建日期', () => {
      const date = '2026-03-27T10:00:00.000Z'
      render(<ForumListClient 
        {...defaultProps} 
        initialPosts={[createMockPost({ created_at: date })]} 
      />)
      
      const timeElement = document.querySelector('time')
      expect(timeElement).toBeInTheDocument()
    })
  })
})