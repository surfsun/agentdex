import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AuthButton } from '@/components/auth/AuthButton'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ href, children, className, onClick }: any) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}))

describe('AuthButton', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('未登录状态', () => {
    it('显示登录按钮', () => {
      render(<AuthButton agentId={null} agentName={null} onLogout={() => {}} />)
      
      const loginButton = screen.getByRole('link', { name: '登录' })
      expect(loginButton).toBeInTheDocument()
      expect(loginButton).toHaveAttribute('href', '/login')
    })

    it('登录按钮有正确的样式', () => {
      render(<AuthButton agentId={null} agentName={null} onLogout={() => {}} />)
      
      const loginButton = screen.getByRole('link', { name: '登录' })
      expect(loginButton).toHaveClass('bg-blue-600')
      expect(loginButton).toHaveClass('text-white')
    })
  })

  describe('已登录状态', () => {
    it('显示用户头像和名称', () => {
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={() => {}} />)
      
      // 用户名首字母作为头像
      expect(screen.getByText('T')).toBeInTheDocument()
      // 用户名显示
      expect(screen.getByText('TestAgent')).toBeInTheDocument()
    })

    it('点击按钮显示下拉菜单', async () => {
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={() => {}} />)
      
      // 菜单初始不显示
      expect(screen.queryByText('我的主页')).not.toBeInTheDocument()
      
      // 点击按钮
      const button = screen.getByRole('button')
      await act(async () => {
        fireEvent.click(button)
      })
      
      // 菜单显示
      expect(screen.getByText('我的主页')).toBeInTheDocument()
      expect(screen.getByText('退出登录')).toBeInTheDocument()
    })

    it('菜单包含我的主页链接', async () => {
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={() => {}} />)
      
      const button = screen.getByRole('button')
      await act(async () => {
        fireEvent.click(button)
      })
      
      const profileLink = screen.getByRole('link', { name: '我的主页' })
      expect(profileLink).toHaveAttribute('href', '/forum/agent/agent-123')
    })

    it('点击退出登录调用 onLogout', async () => {
      const onLogout = vi.fn()
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={onLogout} />)
      
      // 打开菜单
      const button = screen.getByRole('button')
      await act(async () => {
        fireEvent.click(button)
      })
      
      // 点击退出登录
      const logoutButton = screen.getByRole('button', { name: '退出登录' })
      await act(async () => {
        fireEvent.click(logoutButton)
      })
      
      expect(onLogout).toHaveBeenCalledOnce()
    })

    it('点击菜单外部关闭菜单', async () => {
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={() => {}} />)
      
      // 打开菜单
      const button = screen.getByRole('button')
      await act(async () => {
        fireEvent.click(button)
      })
      
      expect(screen.getByText('我的主页')).toBeInTheDocument()
      
      // 点击外部 overlay
      const overlay = document.querySelector('.fixed.inset-0')
      await act(async () => {
        fireEvent.click(overlay!)
      })
      
      expect(screen.queryByText('我的主页')).not.toBeInTheDocument()
    })

    it('用户名过长时截断显示', () => {
      render(<AuthButton agentId="agent-123" agentName="VeryLongAgentNameThatShouldBeTruncated" onLogout={() => {}} />)
      
      const nameSpan = screen.getByText('VeryLongAgentNameThatShouldBeTruncated')
      expect(nameSpan).toHaveClass('truncate')
      expect(nameSpan).toHaveClass('max-w-[100px]')
    })

    it('用户名首字母大写显示', () => {
      render(<AuthButton agentId="agent-123" agentName="lowercase" onLogout={() => {}} />)
      
      // 首字母应该大写
      expect(screen.getByText('L')).toBeInTheDocument()
    })

    it('agentName 为空时显示问号', () => {
      render(<AuthButton agentId="agent-123" agentName="" onLogout={() => {}} />)
      
      expect(screen.getByText('?')).toBeInTheDocument()
    })

    it('再次点击按钮关闭菜单', async () => {
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={() => {}} />)
      
      const button = screen.getByRole('button')
      
      // 打开菜单
      await act(async () => {
        fireEvent.click(button)
      })
      expect(screen.getByText('我的主页')).toBeInTheDocument()
      
      // 再次点击关闭
      await act(async () => {
        fireEvent.click(button)
      })
      expect(screen.queryByText('我的主页')).not.toBeInTheDocument()
    })

    it('点击我的主页后关闭菜单', async () => {
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={() => {}} />)
      
      // 打开菜单
      const button = screen.getByRole('button')
      await act(async () => {
        fireEvent.click(button)
      })
      
      // 点击我的主页
      const profileLink = screen.getByRole('link', { name: '我的主页' })
      await act(async () => {
        fireEvent.click(profileLink)
      })
      
      // 菜单关闭
      expect(screen.queryByText('退出登录')).not.toBeInTheDocument()
    })

    it('下拉菜单有正确的 z-index', async () => {
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={() => {}} />)
      
      const button = screen.getByRole('button')
      await act(async () => {
        fireEvent.click(button)
      })
      
      // overlay z-10
      const overlay = document.querySelector('.fixed.inset-0')
      expect(overlay).toHaveClass('z-10')
      
      // 菜单 z-20
      const menu = document.querySelector('.absolute.right-0')
      expect(menu).toHaveClass('z-20')
    })
  })

  describe('中文用户名', () => {
    it('正确显示中文用户名', () => {
      render(<AuthButton agentId="agent-123" agentName="求伯君" onLogout={() => {}} />)
      
      expect(screen.getByText('求')).toBeInTheDocument()
      expect(screen.getByText('求伯君')).toBeInTheDocument()
    })

    it('中文用户名截断', () => {
      render(<AuthButton agentId="agent-123" agentName="这是一个非常长的中文用户名需要截断" onLogout={() => {}} />)
      
      const nameSpan = screen.getByText('这是一个非常长的中文用户名需要截断')
      expect(nameSpan).toHaveClass('truncate')
    })
  })

  describe('样式和交互', () => {
    it('头像有渐变背景', () => {
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={() => {}} />)
      
      const avatar = screen.getByText('T').closest('div')
      expect(avatar).toHaveClass('bg-gradient-to-br')
      expect(avatar).toHaveClass('from-blue-400')
      expect(avatar).toHaveClass('to-purple-500')
    })

    it('退出登录按钮是红色文本', async () => {
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={() => {}} />)
      
      const button = screen.getByRole('button')
      await act(async () => {
        fireEvent.click(button)
      })
      
      const logoutButton = screen.getByRole('button', { name: '退出登录' })
      expect(logoutButton).toHaveClass('text-red-600')
    })

    it('按钮有 hover 样式', () => {
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={() => {}} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-gray-200')
    })

    it('头像是圆形', () => {
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={() => {}} />)
      
      const avatar = screen.getByText('T').closest('div')
      expect(avatar).toHaveClass('rounded-full')
    })

    it('头像有居中样式', () => {
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={() => {}} />)
      
      const avatar = screen.getByText('T').closest('div')
      expect(avatar).toHaveClass('flex')
      expect(avatar).toHaveClass('items-center')
      expect(avatar).toHaveClass('justify-center')
    })
  })

  describe('菜单关闭场景', () => {
    it('退出登录后菜单关闭', async () => {
      const onLogout = vi.fn()
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={onLogout} />)
      
      const button = screen.getByRole('button')
      await act(async () => {
        fireEvent.click(button)
      })
      
      const logoutButton = screen.getByRole('button', { name: '退出登录' })
      await act(async () => {
        fireEvent.click(logoutButton)
      })
      
      // 菜单应该关闭
      expect(screen.queryByText('我的主页')).not.toBeInTheDocument()
    })

    it('onLogout 被调用一次', async () => {
      const onLogout = vi.fn()
      render(<AuthButton agentId="agent-123" agentName="TestAgent" onLogout={onLogout} />)
      
      const button = screen.getByRole('button')
      await act(async () => {
        fireEvent.click(button)
      })
      
      const logoutButton = screen.getByRole('button', { name: '退出登录' })
      await act(async () => {
        fireEvent.click(logoutButton)
      })
      
      expect(onLogout).toHaveBeenCalledTimes(1)
    })
  })

  describe('边界场景', () => {
    it('agentId 为 undefined 时显示登录按钮', () => {
      render(<AuthButton agentId={undefined as any} agentName={undefined as any} onLogout={() => {}} />)
      
      const loginButton = screen.getByRole('link', { name: '登录' })
      expect(loginButton).toBeInTheDocument()
    })

    it('agentId 为空字符串时显示登录按钮', () => {
      render(<AuthButton agentId="" agentName="" onLogout={() => {}} />)
      
      const loginButton = screen.getByRole('link', { name: '登录' })
      expect(loginButton).toBeInTheDocument()
    })

    it('agentId 有值但 agentName 为 null 时显示问号头像', () => {
      render(<AuthButton agentId="agent-123" agentName={null as any} onLogout={() => {}} />)
      
      expect(screen.getByText('?')).toBeInTheDocument()
    })

    it('用户名只有空格时显示空格首字母（组件不崩溃）', () => {
      // 空格用户名是异常边界，组件应该正常渲染而不崩溃
      render(<AuthButton agentId="agent-123" agentName="   " onLogout={() => {}} />)
      
      // 验证组件正常渲染（有按钮）
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })
})