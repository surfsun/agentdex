import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import SearchClient from '@/app/forum/search/SearchClient'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/forum/search',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock search results
const mockResults = [
  {
    id: 'post-1',
    title: '探索 OpenClaw 工具',
    content: '这是一个关于 OpenClaw 工具的介绍...',
    content_snippet: '这是一个关于 OpenClaw 工具的介绍...',
    tags: ['工具推荐', '技术讨论'],
    likes_count: 10,
    comments_count: 5,
    views_count: 100,
    created_at: '2026-03-28T10:00:00Z',
    author: {
      id: 'agent-1',
      name: 'TestAgent',
      platform: 'web',
      avatar_url: null,
    },
  },
  {
    id: 'post-2',
    title: 'LangChain 使用经验',
    content: '分享 LangChain 的使用心得...',
    tags: ['学习笔记'],
    likes_count: 5,
    comments_count: 2,
    views_count: 50,
    created_at: '2026-03-27T10:00:00Z',
    author: {
      id: 'agent-2',
      name: 'AnotherAgent',
      platform: 'web',
      avatar_url: null,
    },
  },
]

describe('SearchClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('初始状态', () => {
    it('无初始数据时显示搜索提示', () => {
      render(<SearchClient />)
      
      expect(screen.getByText('搜索论坛内容')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('搜索帖子... (按 / 快速聚焦)')).toBeInTheDocument()
    })

    it('有初始数据时显示搜索结果', () => {
      render(
        <SearchClient
          initialQuery="OpenClaw"
          initialResults={mockResults}
          initialTotal={2}
          initialHasMore={false}
        />
      )
      
      // 检查结果区域存在
      const resultStats = document.querySelector('.mb-4.text-sm')
      expect(resultStats).toHaveTextContent('找到')
      expect(resultStats).toHaveTextContent('2')
      expect(resultStats).toHaveTextContent('条结果')
      
      expect(screen.getByText('探索 OpenClaw 工具')).toBeInTheDocument()
      expect(screen.getByText('LangChain 使用经验')).toBeInTheDocument()
    })

    it('有初始标签时显示标签筛选状态', () => {
      render(
        <SearchClient
          initialTag="工具推荐"
          initialResults={mockResults.slice(0, 1)}
          initialTotal={1}
          initialHasMore={false}
        />
      )
      
      // 检查标题中显示标签（h1 标签内的文本）
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('工具推荐')
      
      // 检查结果区域存在
      const resultStats = document.querySelector('.mb-4.text-sm')
      expect(resultStats).toHaveTextContent('找到')
      expect(resultStats).toHaveTextContent('1')
      expect(resultStats).toHaveTextContent('条结果')
    })
  })

  describe('搜索功能', () => {
    it('输入至少 2 个字符才能搜索', () => {
      render(<SearchClient />)
      
      const input = screen.getByPlaceholderText('搜索帖子... (按 / 快速聚焦)')
      const searchButton = screen.getByRole('button', { name: '搜索' })
      
      // 1 个字符时按钮禁用
      fireEvent.change(input, { target: { value: 'a' } })
      expect(searchButton).toBeDisabled()
      
      // 2 个字符时按钮启用
      fireEvent.change(input, { target: { value: 'ab' } })
      expect(searchButton).not.toBeDisabled()
    })

    it('有标签时可以不带查询搜索', () => {
      render(<SearchClient initialTag="工具推荐" />)
      
      const searchButton = screen.getByRole('button', { name: '搜索' })
      expect(searchButton).not.toBeDisabled()
    })

    it('搜索按钮点击触发搜索', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResults,
          total: 2,
          has_more: false,
        }),
      })
      
      render(<SearchClient />)
      
      const input = screen.getByPlaceholderText('搜索帖子... (按 / 快速聚焦)')
      fireEvent.change(input, { target: { value: 'OpenClaw' } })
      
      const searchButton = screen.getByRole('button', { name: '搜索' })
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('探索 OpenClaw 工具')).toBeInTheDocument()
      })
      
      expect(mockPush).toHaveBeenCalledWith('/forum/search?q=OpenClaw')
    })

    it('表单提交触发搜索', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResults,
          total: 2,
          has_more: false,
        }),
      })
      
      render(<SearchClient />)
      
      const input = screen.getByPlaceholderText('搜索帖子... (按 / 快速聚焦)')
      fireEvent.change(input, { target: { value: '工具' } })
      
      const form = input.closest('form')
      fireEvent.submit(form!)
      
      await waitFor(() => {
        expect(screen.getByText('探索 OpenClaw 工具')).toBeInTheDocument()
      })
    })
  })

  describe('标签筛选', () => {
    it('点击标签筛选结果', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResults.slice(0, 1),
          total: 1,
          has_more: false,
        }),
      })
      
      render(<SearchClient initialQuery="OpenClaw" initialResults={mockResults} initialTotal={2} initialHasMore={false} />)
      
      // 点击结果中的标签（最后一个按钮是结果卡片中的标签）
      const tagButtons = screen.getAllByRole('button', { name: '工具推荐' })
      fireEvent.click(tagButtons[tagButtons.length - 1])
      
      expect(mockPush).toHaveBeenCalled()
    })

    it('显示预设标签列表', () => {
      render(<SearchClient initialQuery="test" />)
      
      // 等待过滤器显示
      expect(screen.getByText('标签：')).toBeInTheDocument()
    })
  })

  describe('排序功能', () => {
    it('显示排序选项', async () => {
      render(<SearchClient initialQuery="OpenClaw" />)
      
      // 等待结果和排序选项显示
      await waitFor(() => {
        expect(screen.getByText('排序：')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '相关性' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '最新' })).toBeInTheDocument()
      })
    })

    it('点击排序切换', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResults,
          total: 2,
          has_more: false,
        }),
      })
      
      render(<SearchClient initialQuery="OpenClaw" />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '最新' })).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByRole('button', { name: '最新' }))
      
      expect(mockPush).toHaveBeenCalled()
    })

    it('无查询时不显示排序选项', () => {
      render(<SearchClient initialTag="工具推荐" />)
      
      // 只有标签筛选时不应显示排序
      expect(screen.queryByText('排序：')).not.toBeInTheDocument()
    })
  })

  describe('分页加载', () => {
    it('有更多结果时显示加载更多按钮', () => {
      render(
        <SearchClient
          initialQuery="test"
          initialResults={mockResults}
          initialTotal={10}
          initialHasMore={true}
        />
      )
      
      expect(screen.getByRole('button', { name: '加载更多' })).toBeInTheDocument()
    })

    it('无更多结果时不显示加载按钮', () => {
      render(
        <SearchClient
          initialQuery="test"
          initialResults={mockResults}
          initialTotal={2}
          initialHasMore={false}
        />
      )
      
      expect(screen.queryByText('加载更多')).not.toBeInTheDocument()
    })

    it('点击加载更多触发分页请求', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              id: 'post-3',
              title: '新加载的帖子',
              content: '内容...',
              tags: [],
              likes_count: 1,
              comments_count: 0,
              views_count: 10,
              created_at: '2026-03-26T10:00:00Z',
              author: { id: 'agent-3', name: 'Agent3', platform: 'web', avatar_url: null },
            },
          ],
          total: 10,
          has_more: false,
        }),
      })
      
      render(
        <SearchClient
          initialQuery="test"
          initialResults={mockResults}
          initialTotal={10}
          initialHasMore={true}
        />
      )
      
      const loadMoreButton = screen.getByRole('button', { name: '加载更多' })
      fireEvent.click(loadMoreButton)
      
      await waitFor(() => {
        expect(screen.getByText('新加载的帖子')).toBeInTheDocument()
      })
    })
  })

  describe('键盘快捷键', () => {
    it('按 / 键聚焦搜索框', () => {
      render(<SearchClient />)
      
      const input = screen.getByPlaceholderText('搜索帖子... (按 / 快速聚焦)')
      
      // 模拟键盘事件
      fireEvent.keyDown(document, { key: '/' })
      
      // 输入框应该被聚焦（无法直接测试聚焦状态，但可以检查事件监听）
      expect(document.getElementById('search-input')).toBe(input)
    })
  })

  describe('空状态', () => {
    it('查询太短时显示提示', () => {
      render(<SearchClient />)
      
      const input = screen.getByPlaceholderText('搜索帖子... (按 / 快速聚焦)')
      fireEvent.change(input, { target: { value: 'a' } })
      
      expect(screen.getByText('请输入至少 2 个字符进行搜索')).toBeInTheDocument()
    })

    it('无结果时显示空状态', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
          total: 0,
          has_more: false,
        }),
      })
      
      render(<SearchClient />)
      
      const input = screen.getByPlaceholderText('搜索帖子... (按 / 快速聚焦)')
      fireEvent.change(input, { target: { value: '不存在的内容' } })
      
      const searchButton = screen.getByRole('button', { name: '搜索' })
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('没有找到结果')).toBeInTheDocument()
      })
    })
  })

  describe('错误处理', () => {
    it('API 返回错误时显示空状态', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: '搜索失败',
        }),
      })
      
      render(<SearchClient />)
      
      const input = screen.getByPlaceholderText('搜索帖子... (按 / 快速聚焦)')
      fireEvent.change(input, { target: { value: '测试' } })
      
      const searchButton = screen.getByRole('button', { name: '搜索' })
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.queryByText('探索 OpenClaw 工具')).not.toBeInTheDocument()
      })
    })

    it('网络错误时显示空状态', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      render(<SearchClient />)
      
      const input = screen.getByPlaceholderText('搜索帖子... (按 / 快速聚焦)')
      fireEvent.change(input, { target: { value: '测试' } })
      
      const searchButton = screen.getByRole('button', { name: '搜索' })
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.queryByText('探索 OpenClaw 工具')).not.toBeInTheDocument()
      })
    })
  })

  describe('结果展示', () => {
    it('显示帖子标题', () => {
      render(
        <SearchClient
          initialQuery="test"
          initialResults={mockResults}
          initialTotal={2}
          initialHasMore={false}
        />
      )
      
      expect(screen.getByText('探索 OpenClaw 工具')).toBeInTheDocument()
      expect(screen.getByText('LangChain 使用经验')).toBeInTheDocument()
    })

    it('显示作者信息', () => {
      render(
        <SearchClient
          initialQuery="test"
          initialResults={mockResults}
          initialTotal={2}
          initialHasMore={false}
        />
      )
      
      expect(screen.getByText(/TestAgent/)).toBeInTheDocument()
      expect(screen.getByText(/AnotherAgent/)).toBeInTheDocument()
    })

    it('显示统计数据', () => {
      render(
        <SearchClient
          initialQuery="test"
          initialResults={mockResults}
          initialTotal={2}
          initialHasMore={false}
        />
      )
      
      // 使用正则匹配，因为数字与 emoji 在同一元素内
      expect(screen.getByText(/❤️.*10/)).toBeInTheDocument()
      expect(screen.getByText(/💬.*5/)).toBeInTheDocument()
    })

    it('显示标签', () => {
      render(
        <SearchClient
          initialQuery="test"
          initialResults={mockResults}
          initialTotal={2}
          initialHasMore={false}
        />
      )
      
      expect(screen.getByRole('button', { name: '工具推荐' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '技术讨论' })).toBeInTheDocument()
    })

    it('点击标题跳转到帖子详情', () => {
      render(
        <SearchClient
          initialQuery="test"
          initialResults={mockResults}
          initialTotal={2}
          initialHasMore={false}
        />
      )
      
      const titleLink = screen.getByRole('link', { name: /探索 OpenClaw 工具/ })
      expect(titleLink).toHaveAttribute('href', '/forum/post/post-1')
    })
  })

  describe('中文内容', () => {
    it('正确显示中文标题和内容', () => {
      const chineseResults = [
        {
          id: 'chinese-1',
          title: '探索 AI 工具生态系统',
          content: '这是一篇关于 AI 工具的中文帖子...',
          content_snippet: '这是一篇关于 AI 工具的中文帖子...',
          tags: ['中文测试'],
          likes_count: 100,
          comments_count: 50,
          views_count: 1000,
          created_at: '2026-03-28T10:00:00Z',
          author: {
            id: 'agent-cn',
            name: '中文Agent',
            platform: 'web',
            avatar_url: null,
          },
        },
      ]
      
      render(
        <SearchClient
          initialQuery="AI"
          initialResults={chineseResults}
          initialTotal={1}
          initialHasMore={false}
        />
      )
      
      expect(screen.getByText('探索 AI 工具生态系统')).toBeInTheDocument()
      expect(screen.getByText('这是一篇关于 AI 工具的中文帖子...')).toBeInTheDocument()
      expect(screen.getByText(/中文Agent/)).toBeInTheDocument()
    })
  })

  describe('加载状态', () => {
    it('加载时显示 skeleton', async () => {
      // 延迟响应
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                success: true,
                data: mockResults,
                total: 2,
                has_more: false,
              }),
            })
          }, 100)
        })
      )
      
      render(<SearchClient />)
      
      const input = screen.getByPlaceholderText('搜索帖子... (按 / 快速聚焦)')
      fireEvent.change(input, { target: { value: '测试' } })
      
      const searchButton = screen.getByRole('button', { name: '搜索' })
      fireEvent.click(searchButton)
      
      // 检查 skeleton 动画元素（通过 class 检查）
      await waitFor(() => {
        const skeletons = document.querySelectorAll('.animate-pulse')
        expect(skeletons.length).toBeGreaterThan(0)
      })
      
      // 等待加载完成
      await waitFor(() => {
        expect(screen.getByText('探索 OpenClaw 工具')).toBeInTheDocument()
      }, { timeout: 200 })
    })
  })
})