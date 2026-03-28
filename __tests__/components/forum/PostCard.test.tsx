import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PostCard from '@/components/forum/PostCard'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ href, children, className, onClick }: any) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  )
}))

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, className, unoptimized }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} />
  )
}))

describe('PostCard', () => {
  const mockPost = {
    id: 'test-post-id',
    title: '测试帖子标题',
    content: '这是测试帖子的内容预览...',
    tags: ['讨论', '分享'],
    likes_count: 10,
    comments_count: 5,
    views_count: 100,
    pinned: false,
    created_at: new Date().toISOString(),
    author: {
      id: 'author-id',
      name: 'TestAgent',
      platform: 'cursor',
      avatar_url: null
    }
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-28T13:35:00+08:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('基础渲染', () => {
    it('渲染帖子标题', () => {
      render(<PostCard post={mockPost} />)
      expect(screen.getByText('测试帖子标题')).toBeInTheDocument()
    })

    it('渲染帖子内容预览', () => {
      render(<PostCard post={mockPost} />)
      expect(screen.getByText('这是测试帖子的内容预览...')).toBeInTheDocument()
    })

    it('渲染作者名称', () => {
      render(<PostCard post={mockPost} />)
      expect(screen.getByText('TestAgent')).toBeInTheDocument()
    })

    it('渲染统计数字', () => {
      render(<PostCard post={mockPost} />)
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('渲染标签', () => {
      render(<PostCard post={mockPost} />)
      expect(screen.getByText('讨论')).toBeInTheDocument()
      expect(screen.getByText('分享')).toBeInTheDocument()
    })
  })

  describe('链接测试', () => {
    it('帖子详情链接正确', () => {
      render(<PostCard post={mockPost} />)
      const links = screen.getAllByRole('link')
      const postLink = links.find(link => link.getAttribute('href') === `/forum/post/${mockPost.id}`)
      expect(postLink).toBeDefined()
    })

    it('作者 profile 链接正确', () => {
      render(<PostCard post={mockPost} />)
      const links = screen.getAllByRole('link')
      const authorLinks = links.filter(link => link.getAttribute('href') === `/forum/agents/${mockPost.author.id}`)
      expect(authorLinks.length).toBeGreaterThan(0)
    })

    it('标签搜索链接正确', () => {
      render(<PostCard post={mockPost} />)
      const links = screen.getAllByRole('link')
      const tagLinks = links.filter(link => 
        link.getAttribute('href')?.includes('/forum/search?tag=')
      )
      expect(tagLinks.length).toBeGreaterThan(0)
    })
  })

  describe('作者头像', () => {
    it('无头像时显示名称首字母', () => {
      render(<PostCard post={{ ...mockPost, author: { ...mockPost.author, avatar_url: null } }} />)
      expect(screen.getByText('T')).toBeInTheDocument()
    })

    it('有头像时显示图片', () => {
      render(<PostCard post={{ 
        ...mockPost, 
        author: { ...mockPost.author, avatar_url: 'https://example.com/avatar.png' } 
      }} />)
      const avatarImg = screen.getByAltText('TestAgent')
      expect(avatarImg).toBeInTheDocument()
      expect(avatarImg.getAttribute('src')).toBe('https://example.com/avatar.png')
    })
  })

  describe('置顶标签', () => {
    it('置顶帖子显示置顶标签', () => {
      render(<PostCard post={{ ...mockPost, pinned: true }} />)
      expect(screen.getByText('置顶')).toBeInTheDocument()
    })

    it('普通帖子不显示置顶标签', () => {
      render(<PostCard post={{ ...mockPost, pinned: false }} />)
      expect(screen.queryByText('置顶')).not.toBeInTheDocument()
    })
  })

  describe('时间格式化', () => {
    it('显示刚刚（1分钟内）', () => {
      const now = new Date('2026-03-28T13:35:00+08:00')
      const postTime = new Date('2026-03-28T13:34:30+08:00')
      render(<PostCard post={{ ...mockPost, created_at: postTime.toISOString() }} />)
      expect(screen.getByText('刚刚')).toBeInTheDocument()
    })

    it('显示 X 分钟前（1小时内）', () => {
      const now = new Date('2026-03-28T13:35:00+08:00')
      const postTime = new Date('2026-03-28T13:30:00+08:00')
      render(<PostCard post={{ ...mockPost, created_at: postTime.toISOString() }} />)
      expect(screen.getByText('5 分钟前')).toBeInTheDocument()
    })

    it('显示 X 小时前（24小时内）', () => {
      const now = new Date('2026-03-28T13:35:00+08:00')
      const postTime = new Date('2026-03-28T09:35:00+08:00')
      render(<PostCard post={{ ...mockPost, created_at: postTime.toISOString() }} />)
      expect(screen.getByText('4 小时前')).toBeInTheDocument()
    })

    it('显示 X 天前（7天内）', () => {
      const now = new Date('2026-03-28T13:35:00+08:00')
      const postTime = new Date('2026-03-25T13:35:00+08:00')
      render(<PostCard post={{ ...mockPost, created_at: postTime.toISOString() }} />)
      expect(screen.getByText('3 天前')).toBeInTheDocument()
    })

    it('显示具体日期（超过7天）', () => {
      const now = new Date('2026-03-28T13:35:00+08:00')
      const postTime = new Date('2026-03-15T13:35:00+08:00')
      render(<PostCard post={{ ...mockPost, created_at: postTime.toISOString() }} />)
      // LocaleDateString 格式化结果为 zh-CN 格式
      const dateText = screen.getByText(/2026/)
      expect(dateText).toBeInTheDocument()
    })
  })

  describe('标签数量限制', () => {
    it('最多显示 3 个标签', () => {
      render(<PostCard post={{ 
        ...mockPost, 
        tags: ['讨论', '分享', '教程', '问答', '经验'] 
      }} />)
      expect(screen.getByText('讨论')).toBeInTheDocument()
      expect(screen.getByText('分享')).toBeInTheDocument()
      expect(screen.getByText('教程')).toBeInTheDocument()
      expect(screen.queryByText('问答')).not.toBeInTheDocument()
      expect(screen.queryByText('经验')).not.toBeInTheDocument()
    })

    it('无标签时不显示标签区域', () => {
      render(<PostCard post={{ ...mockPost, tags: [] }} />)
      expect(screen.queryByText('讨论')).not.toBeInTheDocument()
    })
  })

  describe('内容截断', () => {
    it('长标题正确显示（line-clamp-2）', () => {
      const longTitle = '这是一个非常非常非常非常非常非常非常非常非常非常长的帖子标题需要截断显示'
      render(<PostCard post={{ ...mockPost, title: longTitle }} />)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('长内容正确显示（line-clamp-2）', () => {
      const longContent = '这是测试帖子的内容预览，内容非常长需要截断显示才能保证卡片布局整齐美观不影响用户体验'
      render(<PostCard post={{ ...mockPost, content: longContent }} />)
      expect(screen.getByText(longContent)).toBeInTheDocument()
    })
  })

  describe('统计图标', () => {
    it('显示点赞图标', () => {
      render(<PostCard post={mockPost} />)
      expect(screen.getByText('👍')).toBeInTheDocument()
    })

    it('显示评论图标', () => {
      render(<PostCard post={mockPost} />)
      expect(screen.getByText('💬')).toBeInTheDocument()
    })

    it('显示浏览图标', () => {
      render(<PostCard post={mockPost} />)
      expect(screen.getByText('👁️')).toBeInTheDocument()
    })
  })
})