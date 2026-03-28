import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AgentsListClient from '@/components/forum/AgentsListClient'
import type { AgentProfile } from '@/lib/forum/types'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Sample agent data
const createMockAgent = (overrides?: Partial<AgentProfile>): AgentProfile => ({
  id: 'agent-1',
  name: 'TestAgent',
  platform: 'agentdex',
  posts_count: 5,
  comments_count: 10,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  expertise: ['AI', 'coding'],
  personality: 'Helpful assistant',
  avatar_url: null,
  ...overrides,
})

describe('AgentsListClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('Initial State', () => {
    it('renders with initial agents', () => {
      const agents = [
        createMockAgent({ id: 'agent-1', name: 'AgentOne', posts_count: 5 }),
        createMockAgent({ id: 'agent-2', name: 'AgentTwo', posts_count: 3 }),
      ]
      
      render(<AgentsListClient initialAgents={agents} initialTotal={2} />)
      
      expect(screen.getByText('Agent 列表')).toBeInTheDocument()
      expect(screen.getByText('社区中的 2 位 Agent')).toBeInTheDocument()
      expect(screen.getByText('AgentOne')).toBeInTheDocument()
      expect(screen.getByText('AgentTwo')).toBeInTheDocument()
    })

    it('shows empty state when no agents', () => {
      render(<AgentsListClient initialAgents={[]} initialTotal={0} />)
      
      expect(screen.getByText('社区还没有 Agent')).toBeInTheDocument()
      expect(screen.getByText('创建 Agent 身份')).toBeInTheDocument()
    })

    it('shows total count correctly', () => {
      const agents = [createMockAgent()]
      render(<AgentsListClient initialAgents={agents} initialTotal={100} />)
      
      expect(screen.getByText('社区中的 100 位 Agent')).toBeInTheDocument()
    })
  })

  describe('Agent Card Display', () => {
    it('shows agent name', () => {
      const agents = [createMockAgent({ name: 'MyTestAgent' })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.getByText('MyTestAgent')).toBeInTheDocument()
    })

    it('shows agent platform', () => {
      const agents = [createMockAgent({ platform: 'claude' })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.getByText('claude')).toBeInTheDocument()
    })

    it('shows posts count', () => {
      const agents = [createMockAgent({ posts_count: 42 })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      // Find the element containing "42" and "帖子"
      const card = screen.getByText('42').closest('article')
      expect(card).toHaveTextContent('帖子')
    })

    it('shows comments count', () => {
      const agents = [createMockAgent({ comments_count: 99 })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      const card = screen.getByText('99').closest('article')
      expect(card).toHaveTextContent('评论')
    })

    it('shows expertise tags', () => {
      const agents = [createMockAgent({ expertise: ['React', 'TypeScript', 'Node.js'] })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('Node.js')).toBeInTheDocument()
    })

    it('shows only first 3 expertise tags', () => {
      const agents = [createMockAgent({ expertise: ['A', 'B', 'C', 'D', 'E'] })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
      expect(screen.getByText('C')).toBeInTheDocument()
      expect(screen.queryByText('D')).not.toBeInTheDocument()
      expect(screen.queryByText('E')).not.toBeInTheDocument()
    })

    it('shows personality text', () => {
      const agents = [createMockAgent({ personality: 'A friendly AI assistant' })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.getByText('A friendly AI assistant')).toBeInTheDocument()
    })

    it('shows avatar with first letter', () => {
      const agents = [createMockAgent({ name: 'Alpha' })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.getByText('A')).toBeInTheDocument()
    })

    it('shows ? for empty name', () => {
      const agents = [createMockAgent({ name: '' })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.getByText('?')).toBeInTheDocument()
    })
  })

  describe('Sort Tabs', () => {
    it('shows all sort options', () => {
      render(<AgentsListClient initialAgents={[]} initialTotal={0} />)
      
      expect(screen.getByText(/活跃度/)).toBeInTheDocument()
      expect(screen.getByText(/帖子数/)).toBeInTheDocument()
      expect(screen.getByText(/最近加入/)).toBeInTheDocument()
    })

    it('active sort is selected by default', () => {
      render(<AgentsListClient initialAgents={[]} initialTotal={0} />)
      
      const activeButton = screen.getByText(/活跃度/).closest('button')
      expect(activeButton).toHaveClass('border-blue-600')
    })

    it('changes sort on click', async () => {
      const agents = [createMockAgent()]
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: agents, total: 1 }),
      })
      
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      fireEvent.click(screen.getByText(/帖子数/))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })

    it('updates URL with sort parameter', async () => {
      const agents = [createMockAgent()]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      fireEvent.click(screen.getByText(/帖子数/))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/forum/agents?sort=posts')
      })
    })
  })

  describe('Platform Filter', () => {
    it('shows platform filter when multiple platforms exist', () => {
      const agents = [
        createMockAgent({ id: '1', platform: 'agentdex' }),
        createMockAgent({ id: '2', platform: 'claude' }),
      ]
      render(<AgentsListClient initialAgents={agents} initialTotal={2} />)
      
      expect(screen.getByText('平台：')).toBeInTheDocument()
      expect(screen.getByText('全部')).toBeInTheDocument()
      // Use getAllByText since platform names appear in both filter buttons and agent cards
      expect(screen.getAllByText('agentdex').length).toBeGreaterThan(0)
      expect(screen.getAllByText('claude').length).toBeGreaterThan(0)
    })

    it('hides platform filter when single platform', () => {
      const agents = [createMockAgent({ platform: 'agentdex' })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.queryByText('平台：')).not.toBeInTheDocument()
    })

    it('changes platform on click', async () => {
      const agents = [
        createMockAgent({ id: '1', platform: 'agentdex' }),
        createMockAgent({ id: '2', platform: 'claude' }),
      ]
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [agents[1]], total: 1 }),
      })
      
      render(<AgentsListClient initialAgents={agents} initialTotal={2} />)
      
      // Find the platform filter button, not the agent card platform badge
      const platformButtons = screen.getAllByText('claude')
      const filterButton = platformButtons.find(el => el.tagName === 'BUTTON')
      fireEvent.click(filterButton!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })

    it('updates URL with platform parameter', async () => {
      const agents = [
        createMockAgent({ id: '1', platform: 'agentdex' }),
        createMockAgent({ id: '2', platform: 'claude' }),
      ]
      render(<AgentsListClient initialAgents={agents} initialTotal={2} />)
      
      const platformButtons = screen.getAllByText('claude')
      const filterButton = platformButtons.find(el => el.tagName === 'BUTTON')
      fireEvent.click(filterButton!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/forum/agents?platform=claude')
      })
    })

    it('clears platform filter on "全部" click', async () => {
      const agents = [
        createMockAgent({ id: '1', platform: 'agentdex' }),
        createMockAgent({ id: '2', platform: 'claude' }),
      ]
      render(<AgentsListClient initialAgents={agents} initialTotal={2} initialPlatform="claude" />)
      
      fireEvent.click(screen.getByText('全部'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/forum/agents')
      })
    })
  })

  describe('Loading State', () => {
    it('shows loading skeleton when fetching', async () => {
      const agents = [createMockAgent()]
      mockFetch.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          json: () => Promise.resolve({ success: true, data: agents, total: 1 }),
        }), 100)
      }))
      
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      // Trigger fetch by changing sort
      fireEvent.click(screen.getByText(/帖子数/))
      
      await waitFor(() => {
        const skeletons = document.querySelectorAll('.animate-pulse')
        expect(skeletons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Empty State', () => {
    it('shows general empty state without platform', () => {
      render(<AgentsListClient initialAgents={[]} initialTotal={0} />)
      
      expect(screen.getByText('社区还没有 Agent')).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('shows "今天" for today', () => {
      const agents = [createMockAgent({ created_at: new Date().toISOString() })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.getByText(/今天/)).toBeInTheDocument()
    })

    it('shows "昨天" for yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const agents = [createMockAgent({ created_at: yesterday.toISOString() })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.getByText(/昨天/)).toBeInTheDocument()
    })

    it('shows "N 天前" for recent dates', () => {
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - 3)
      const agents = [createMockAgent({ created_at: daysAgo.toISOString() })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.getByText(/3 天前/)).toBeInTheDocument()
    })

    it('shows "N 周前" for dates within a month', () => {
      const weeksAgo = new Date()
      weeksAgo.setDate(weeksAgo.getDate() - 14)
      const agents = [createMockAgent({ created_at: weeksAgo.toISOString() })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.getByText(/2 周前/)).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('link to agent detail page', () => {
      const agents = [createMockAgent({ id: 'agent-123', name: 'TestAgent' })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      const agentLink = screen.getByText('TestAgent').closest('a')
      expect(agentLink).toHaveAttribute('href', '/forum/agent/agent-123')
    })

    it('link to create agent page', () => {
      render(<AgentsListClient initialAgents={[]} initialTotal={0} />)
      
      const createLinks = screen.getAllByText('创建 Agent')
      const createLink = createLinks[0].closest('a')
      expect(createLink).toHaveAttribute('href', '/login')
    })
  })

  describe('Chinese Content', () => {
    it('shows Chinese agent name correctly', () => {
      const agents = [createMockAgent({ name: '测试机器人' })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.getByText('测试机器人')).toBeInTheDocument()
    })

    it('shows Chinese expertise tags correctly', () => {
      const agents = [createMockAgent({ expertise: ['人工智能', '机器学习'] })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.getByText('人工智能')).toBeInTheDocument()
      expect(screen.getByText('机器学习')).toBeInTheDocument()
    })

    it('shows Chinese personality correctly', () => {
      const agents = [createMockAgent({ personality: '一个友好的中文助手' })]
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      expect(screen.getByText('一个友好的中文助手')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles fetch error gracefully', async () => {
      const agents = [createMockAgent()]
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      // Trigger fetch
      fireEvent.click(screen.getByText(/帖子数/))
      
      await waitFor(() => {
        // Should still show agents from initial state or empty
        expect(screen.getByText('Agent 列表')).toBeInTheDocument()
      })
    })

    it('handles API error response', async () => {
      const agents = [createMockAgent()]
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Server error' }),
      })
      
      render(<AgentsListClient initialAgents={agents} initialTotal={1} />)
      
      fireEvent.click(screen.getByText(/帖子数/))
      
      await waitFor(() => {
        expect(screen.getByText('Agent 列表')).toBeInTheDocument()
      })
    })
  })
})