import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import StructuredPostDisplay from '@/components/forum/StructuredPostDisplay'
import type { Post, PromptBundle, RunSnapshot } from '@/lib/forum/types'

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
}
Object.assign(navigator, { clipboard: mockClipboard })

// Helper to create a structured post
function createStructuredPost(overrides?: Partial<Post>): Post {
  const promptBundle: PromptBundle = {
    model: 'gpt-4',
    system_prompt: 'You are a helpful assistant.',
    user_prompts: ['Hello, how are you?'],
    tools: ['web_search', 'read_file'],
    dependencies: { openai: '4.0.0', vitest: '1.0.0' },
  }

  const runSnapshot: RunSnapshot = {
    input_example: 'test input',
    expected_output: 'test expected output',
    actual_output: 'test actual output',
    evaluation_notes: 'test evaluation notes',
    environment: 'Node.js 20',
    success_rate: 0.85,
    latency_ms: 1200,
  }

  return {
    id: 'post-123',
    title: 'Test Structured Post',
    content: 'Test content',
    author_id: 'author-123',
    author: {
      id: 'author-123',
      name: 'Test Author',
      avatar_url: null,
      bio: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    tags: ['test', 'structured'],
    likes_count: 10,
    comments_count: 5,
    views_count: 100,
    is_pinned: false,
    created_at: '2026-03-28T00:00:00Z',
    updated_at: '2026-03-28T00:00:00Z',
    post_type: 'structured',
    prompt_bundle: promptBundle,
    run_snapshot: runSnapshot,
    forked_from: null,
    fork_count: 0,
  }
}

describe('StructuredPostDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('条件渲染', () => {
    it('非结构化帖子不渲染', () => {
      const post = createStructuredPost()
      post.post_type = 'normal'
      render(<StructuredPostDisplay post={post} />)
      expect(screen.queryByText('人类可读')).not.toBeInTheDocument()
    })

    it('缺少 prompt_bundle 不渲染', () => {
      const post = createStructuredPost()
      post.prompt_bundle = null
      render(<StructuredPostDisplay post={post} />)
      expect(screen.queryByText('人类可读')).not.toBeInTheDocument()
    })

    it('缺少 run_snapshot 不渲染', () => {
      const post = createStructuredPost()
      post.run_snapshot = null
      render(<StructuredPostDisplay post={post} />)
      expect(screen.queryByText('人类可读')).not.toBeInTheDocument()
    })

    it('结构化帖子正常渲染', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('人类可读')).toBeInTheDocument()
      expect(screen.getByText('JSON 导出')).toBeInTheDocument()
    })
  })

  describe('视图切换按钮', () => {
    it('默认显示人类可读视图', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      // 人类可读按钮应该是选中状态（蓝色）
      expect(screen.getByRole('button', { name: '人类可读' })).toHaveClass('bg-blue-600')
    })

    it('切换到 JSON 导出视图', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      
      fireEvent.click(screen.getByRole('button', { name: 'JSON 导出' }))
      
      expect(screen.getByRole('button', { name: 'JSON 导出' })).toHaveClass('bg-blue-600')
      expect(screen.getByRole('button', { name: '人类可读' })).not.toHaveClass('bg-blue-600')
    })

    it('JSON 导出视图显示 Repro Pack', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      
      fireEvent.click(screen.getByRole('button', { name: 'JSON 导出' }))
      
      // JSON 内容显示在灰色背景区域
      expect(screen.getByText(/"post_id": "post-123"/)).toBeInTheDocument()
      expect(screen.getByText(/"title": "Test Structured Post"/)).toBeInTheDocument()
    })

    it('切换回人类可读视图', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      
      // 切换到 JSON
      fireEvent.click(screen.getByRole('button', { name: 'JSON 导出' }))
      // 切换回人类可读
      fireEvent.click(screen.getByRole('button', { name: '人类可读' }))
      
      expect(screen.getByRole('button', { name: '人类可读' })).toHaveClass('bg-blue-600')
      expect(screen.queryByText(/"post_id": "post-123"/)).not.toBeInTheDocument()
    })
  })

  describe('Prompt Bundle Section', () => {
    it('显示 Model', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('Model')).toBeInTheDocument()
      expect(screen.getByText('gpt-4')).toBeInTheDocument()
    })

    it('显示 Dependencies', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('Dependencies')).toBeInTheDocument()
      expect(screen.getByText('openai@4.0.0, vitest@1.0.0')).toBeInTheDocument()
    })

    it('无 Dependencies 不显示', () => {
      const post = createStructuredPost()
      post.prompt_bundle!.dependencies = {}
      render(<StructuredPostDisplay post={post} />)
      expect(screen.queryByText('Dependencies')).not.toBeInTheDocument()
    })

    it('显示 System Prompt', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('System Prompt')).toBeInTheDocument()
      expect(screen.getByText('You are a helpful assistant.')).toBeInTheDocument()
    })

    it('显示 User Prompts', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('User Prompts')).toBeInTheDocument()
      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
    })

    it('无 User Prompts 不显示该 section', () => {
      const post = createStructuredPost()
      post.prompt_bundle!.user_prompts = []
      render(<StructuredPostDisplay post={post} />)
      expect(screen.queryByText('User Prompts')).not.toBeInTheDocument()
    })

    it('显示多个 User Prompts', () => {
      const post = createStructuredPost()
      post.prompt_bundle!.user_prompts = ['Prompt 1', 'Prompt 2', 'Prompt 3']
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('Prompt 1')).toBeInTheDocument()
      expect(screen.getByText('Prompt 2')).toBeInTheDocument()
      expect(screen.getByText('Prompt 3')).toBeInTheDocument()
    })

    it('显示 Tools', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('Tools')).toBeInTheDocument()
      expect(screen.getByText('web_search')).toBeInTheDocument()
      expect(screen.getByText('read_file')).toBeInTheDocument()
    })

    it('无 Tools 不显示该 section', () => {
      const post = createStructuredPost()
      post.prompt_bundle!.tools = []
      render(<StructuredPostDisplay post={post} />)
      expect(screen.queryByText('Tools')).not.toBeInTheDocument()
    })

    it('显示 Prompt Bundle 标题带 emoji', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      // emoji 和文字在单独的 span 元素中
      expect(screen.getByText('Prompt Bundle')).toBeInTheDocument()
      expect(screen.getByText('🤖')).toBeInTheDocument()
    })
  })

  describe('Run Snapshot Section', () => {
    it('显示 Environment', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('Environment')).toBeInTheDocument()
      expect(screen.getByText('Node.js 20')).toBeInTheDocument()
    })

    it('无 Environment 不显示', () => {
      const post = createStructuredPost()
      post.run_snapshot!.environment = undefined
      render(<StructuredPostDisplay post={post} />)
      expect(screen.queryByText('Environment')).not.toBeInTheDocument()
    })

    it('显示 Success Rate >= 80% 绿色', () => {
      const post = createStructuredPost()
      post.run_snapshot!.success_rate = 0.85
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('85%')).toHaveClass('text-green-600')
    })

    it('显示 Success Rate >= 50% 黄色', () => {
      const post = createStructuredPost()
      post.run_snapshot!.success_rate = 0.65
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('65%')).toHaveClass('text-yellow-600')
    })

    it('显示 Success Rate < 50% 红色', () => {
      const post = createStructuredPost()
      post.run_snapshot!.success_rate = 0.35
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('35%')).toHaveClass('text-red-600')
    })

    it('无 Success Rate 不显示', () => {
      const post = createStructuredPost()
      post.run_snapshot!.success_rate = undefined
      render(<StructuredPostDisplay post={post} />)
      expect(screen.queryByText('Success Rate')).not.toBeInTheDocument()
    })

    it('显示 Latency', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('Latency')).toBeInTheDocument()
      expect(screen.getByText('1200ms')).toBeInTheDocument()
    })

    it('无 Latency 不显示', () => {
      const post = createStructuredPost()
      post.run_snapshot!.latency_ms = undefined
      render(<StructuredPostDisplay post={post} />)
      expect(screen.queryByText('Latency')).not.toBeInTheDocument()
    })

    it('显示 Input Example', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('Input Example')).toBeInTheDocument()
      expect(screen.getByText('test input')).toBeInTheDocument()
    })

    it('显示 Expected Output', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('Expected Output')).toBeInTheDocument()
      expect(screen.getByText('test expected output')).toBeInTheDocument()
    })

    it('显示 Actual Output', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('Actual Output')).toBeInTheDocument()
      expect(screen.getByText('test actual output')).toBeInTheDocument()
    })

    it('无 failure_reason 时 Actual Output 背景为蓝色', () => {
      const post = createStructuredPost()
      post.run_snapshot!.failure_reason = undefined
      render(<StructuredPostDisplay post={post} />)
      // Actual Output 区域应该有蓝色背景样式
      const actualOutputSection = screen.getByText('test actual output').closest('pre')
      expect(actualOutputSection).toHaveClass('bg-blue-50')
    })

    it('有 failure_reason 时 Actual Output 背景为红色', () => {
      const post = createStructuredPost()
      post.run_snapshot!.failure_reason = 'Test failed'
      render(<StructuredPostDisplay post={post} />)
      const actualOutputSection = screen.getByText('test actual output').closest('pre')
      expect(actualOutputSection).toHaveClass('bg-red-50')
    })

    it('显示 Failure Reason', () => {
      const post = createStructuredPost()
      post.run_snapshot!.failure_reason = 'API timeout'
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('Failure Reason')).toBeInTheDocument()
      expect(screen.getByText('API timeout')).toBeInTheDocument()
    })

    it('无 Failure Reason 不显示', () => {
      const post = createStructuredPost()
      post.run_snapshot!.failure_reason = undefined
      render(<StructuredPostDisplay post={post} />)
      expect(screen.queryByText('Failure Reason')).not.toBeInTheDocument()
    })

    it('显示 Evaluation Notes', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('Evaluation Notes')).toBeInTheDocument()
      expect(screen.getByText('test evaluation notes')).toBeInTheDocument()
    })

    it('显示 Run Snapshot 标题带 emoji', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      // emoji 和文字在单独的 span 元素中
      expect(screen.getByText('Run Snapshot')).toBeInTheDocument()
      expect(screen.getByText('📊')).toBeInTheDocument()
    })
  })

  describe('Fork Info', () => {
    it('无 forked_from 不显示', () => {
      const post = createStructuredPost()
      post.forked_from = null
      render(<StructuredPostDisplay post={post} />)
      expect(screen.queryByText(/Fork 自/)).not.toBeInTheDocument()
    })

    it('显示 forked_from', () => {
      const post = createStructuredPost()
      post.forked_from = 'post-456'
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText(/Fork 自/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '查看原帖' })).toBeInTheDocument()
    })

    it('无 fork_count 不显示', () => {
      const post = createStructuredPost()
      post.fork_count = 0
      render(<StructuredPostDisplay post={post} />)
      expect(screen.queryByText(/已被 Fork/)).not.toBeInTheDocument()
    })

    it('显示 fork_count', () => {
      const post = createStructuredPost()
      post.fork_count = 5
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText(/已被 Fork/)).toBeInTheDocument()
      expect(screen.getByText(/5 次/)).toBeInTheDocument()
    })
  })

  describe('复制功能', () => {
    it('显示复制按钮', () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByRole('button', { name: '复制 Prompt Bundle' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '复制 Repro Pack' })).toBeInTheDocument()
    })

    it('复制 Prompt Bundle 调用 clipboard API', async () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      
      fireEvent.click(screen.getByRole('button', { name: '复制 Prompt Bundle' }))
      
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled()
        // 复制的内容应该是 prompt_bundle 的 JSON
        const copiedText = mockClipboard.writeText.mock.calls[0][0]
        expect(copiedText).toContain('"model": "gpt-4"')
        expect(copiedText).toContain('"system_prompt": "You are a helpful assistant."')
      })
    })

    it('复制 Repro Pack 调用 clipboard API', async () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      
      fireEvent.click(screen.getByRole('button', { name: '复制 Repro Pack' }))
      
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled()
        // 复制的内容应该是完整的 repro pack JSON
        const copiedText = mockClipboard.writeText.mock.calls[0][0]
        expect(copiedText).toContain('"post_id": "post-123"')
        expect(copiedText).toContain('"title": "Test Structured Post"')
        expect(copiedText).toContain('"prompt_bundle"')
        expect(copiedText).toContain('"run_snapshot"')
      })
    })

    it('复制后显示 "已复制" 状态', async () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      
      fireEvent.click(screen.getByRole('button', { name: '复制 Prompt Bundle' }))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '✓ 已复制' })).toBeInTheDocument()
      })
    })

    it('复制 Repro Pack 后显示 "已复制" 状态', async () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      
      fireEvent.click(screen.getByRole('button', { name: '复制 Repro Pack' }))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '✓ 已复制' })).toBeInTheDocument()
      })
    })

    it('2 秒后恢复按钮状态', async () => {
      const post = createStructuredPost()
      render(<StructuredPostDisplay post={post} />)
      
      // 点击按钮触发 clipboard API 和 setTimeout
      fireEvent.click(screen.getByRole('button', { name: '复制 Prompt Bundle' }))
      
      // 等待 "已复制" 状态出现
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '✓ 已复制' })).toBeInTheDocument()
      })
      
      // 等待 2 秒后按钮恢复
      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: '复制 Prompt Bundle' })).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    }, 10000)
  })

  describe('边界情况', () => {
    it('成功率为边界值 80%', () => {
      const post = createStructuredPost()
      post.run_snapshot!.success_rate = 0.8
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('80%')).toHaveClass('text-green-600')
    })

    it('成功率为边界值 50%', () => {
      const post = createStructuredPost()
      post.run_snapshot!.success_rate = 0.5
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('50%')).toHaveClass('text-yellow-600')
    })

    it('成功率为边界值 49%', () => {
      const post = createStructuredPost()
      post.run_snapshot!.success_rate = 0.49
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('49%')).toHaveClass('text-red-600')
    })

    it('成功率为 0%', () => {
      const post = createStructuredPost()
      post.run_snapshot!.success_rate = 0
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('0%')).toHaveClass('text-red-600')
    })

    it('成功率为 100%', () => {
      const post = createStructuredPost()
      post.run_snapshot!.success_rate = 1
      render(<StructuredPostDisplay post={post} />)
      expect(screen.getByText('100%')).toHaveClass('text-green-600')
    })
  })
})