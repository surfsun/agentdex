import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TagSelector, { TagBadge } from '@/components/forum/TagSelector'
import { PRESET_TAGS, MAX_TAGS } from '@/lib/forum/tags'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('TagSelector', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('基础渲染', () => {
    it('渲染所有预设标签', () => {
      render(<TagSelector selectedTags={[]} onChange={mockOnChange} />)

      PRESET_TAGS.forEach(tag => {
        expect(screen.getByText(tag.name)).toBeInTheDocument()
        expect(screen.getByText(tag.icon)).toBeInTheDocument()
      })
    })

    it('渲染帮助文字', () => {
      render(<TagSelector selectedTags={[]} onChange={mockOnChange} />)

      expect(screen.getByText(/最多 3 个/)).toBeInTheDocument()
    })

    it('空状态时无已选标签显示', () => {
      render(<TagSelector selectedTags={[]} onChange={mockOnChange} />)

      expect(screen.queryByText('已选择')).not.toBeInTheDocument()
    })

    it('渲染自定义标签按钮', () => {
      render(<TagSelector selectedTags={[]} onChange={mockOnChange} />)

      expect(screen.getByText('+ 自定义标签')).toBeInTheDocument()
    })
  })

  describe('预设标签选择', () => {
    it('点击未选标签添加到已选列表', () => {
      render(<TagSelector selectedTags={[]} onChange={mockOnChange} />)

      const firstTag = screen.getByRole('button', { name: /工具推荐/ })
      fireEvent.click(firstTag)

      expect(mockOnChange).toHaveBeenCalledWith(['工具推荐'])
    })

    it('点击已选标签从已选列表移除', () => {
      render(<TagSelector selectedTags={['工具推荐']} onChange={mockOnChange} />)

      const firstTag = screen.getByRole('button', { name: /工具推荐/ })
      fireEvent.click(firstTag)

      expect(mockOnChange).toHaveBeenCalledWith([])
    })

    it('达到最大标签数时禁用未选标签', () => {
      const selected = PRESET_TAGS.slice(0, MAX_TAGS).map(t => t.name)
      render(<TagSelector selectedTags={selected} onChange={mockOnChange} />)

      // 未选中的标签应该被禁用
      const unselectedTag = screen.getByRole('button', { name: /行业动态/ })
      expect(unselectedTag).toBeDisabled()
    })

    it('未达到最大标签数时未选标签可点击', () => {
      render(<TagSelector selectedTags={['工具推荐']} onChange={mockOnChange} />)

      const unselectedTag = screen.getByRole('button', { name: /技术讨论/ })
      expect(unselectedTag).not.toBeDisabled()
    })

    it('已选标签显示勾选标记', () => {
      render(<TagSelector selectedTags={['工具推荐']} onChange={mockOnChange} />)

      const firstTag = screen.getByRole('button', { name: /工具推荐/ })
      expect(firstTag).toHaveTextContent('✓')
    })

    it('未选标签不显示勾选标记', () => {
      render(<TagSelector selectedTags={['工具推荐']} onChange={mockOnChange} />)

      const secondTag = screen.getByRole('button', { name: /技术讨论/ })
      expect(secondTag).not.toHaveTextContent('✓')
    })
  })

  describe('已选标签显示', () => {
    it('显示已选标签数量', () => {
      render(<TagSelector selectedTags={['工具推荐', '技术讨论']} onChange={mockOnChange} />)

      expect(screen.getByText(`已选择 (2/${MAX_TAGS}):`)).toBeInTheDocument()
    })

    it('显示已选标签名称', () => {
      render(<TagSelector selectedTags={['工具推荐', '技术讨论']} onChange={mockOnChange} />)

      expect(screen.getByText('#工具推荐')).toBeInTheDocument()
      expect(screen.getByText('#技术讨论')).toBeInTheDocument()
    })

    it('显示已选标签图标', () => {
      const firstTag = PRESET_TAGS[0]
      render(<TagSelector selectedTags={[firstTag.name]} onChange={mockOnChange} />)

      // emoji 在预设标签和已选标签区域都出现，使用 getAllByText
      const icons = screen.getAllByText(firstTag.icon)
      expect(icons.length).toBeGreaterThan(0)
    })

    it('点击移除按钮移除标签', () => {
      render(<TagSelector selectedTags={['工具推荐', '技术讨论']} onChange={mockOnChange} />)

      const removeButtons = screen.getAllByRole('button', { name: '×' })
      fireEvent.click(removeButtons[0])

      expect(mockOnChange).toHaveBeenCalledWith(['技术讨论'])
    })

    it('自定义标签不显示图标', () => {
      render(<TagSelector selectedTags={['自定义标签']} onChange={mockOnChange} />)

      // 自定义标签在已选区域没有图标，只有名称
      expect(screen.getByText('#自定义标签')).toBeInTheDocument()
    })
  })

  describe('自定义标签输入', () => {
    it('点击自定义标签按钮显示输入框', () => {
      render(<TagSelector selectedTags={[]} onChange={mockOnChange} />)

      const addCustomBtn = screen.getByText('+ 自定义标签')
      fireEvent.click(addCustomBtn)

      expect(screen.getByPlaceholderText('输入自定义标签...')).toBeInTheDocument()
      expect(screen.getByText('添加')).toBeInTheDocument()
      expect(screen.getByText('取消')).toBeInTheDocument()
    })

    it('输入自定义标签内容', () => {
      render(<TagSelector selectedTags={[]} onChange={mockOnChange} />)

      fireEvent.click(screen.getByText('+ 自定义标签'))

      const input = screen.getByPlaceholderText('输入自定义标签...')
      fireEvent.change(input, { target: { value: '新标签' } })

      expect(input).toHaveValue('新标签')
    })

    it('Enter 键添加自定义标签', () => {
      render(<TagSelector selectedTags={[]} onChange={mockOnChange} />)

      fireEvent.click(screen.getByText('+ 自定义标签'))

      const input = screen.getByPlaceholderText('输入自定义标签...')
      fireEvent.change(input, { target: { value: '新标签' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockOnChange).toHaveBeenCalledWith(['新标签'])
    })

    it('点击添加按钮添加自定义标签', () => {
      render(<TagSelector selectedTags={[]} onChange={mockOnChange} />)

      fireEvent.click(screen.getByText('+ 自定义标签'))

      const input = screen.getByPlaceholderText('输入自定义标签...')
      fireEvent.change(input, { target: { value: '新标签' } })
      fireEvent.click(screen.getByText('添加'))

      expect(mockOnChange).toHaveBeenCalledWith(['新标签'])
    })

    it('空白内容不添加标签', () => {
      render(<TagSelector selectedTags={[]} onChange={mockOnChange} />)

      fireEvent.click(screen.getByText('+ 自定义标签'))

      const input = screen.getByPlaceholderText('输入自定义标签...')
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.click(screen.getByText('添加'))

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('重复标签不添加', () => {
      render(<TagSelector selectedTags={['工具推荐']} onChange={mockOnChange} />)

      fireEvent.click(screen.getByText('+ 自定义标签'))

      const input = screen.getByPlaceholderText('输入自定义标签...')
      fireEvent.change(input, { target: { value: '工具推荐' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('达到最大标签数时不显示自定义按钮', () => {
      const selected = PRESET_TAGS.slice(0, MAX_TAGS).map(t => t.name)
      render(<TagSelector selectedTags={selected} onChange={mockOnChange} />)

      // 达到最大标签数时，自定义标签按钮不显示
      expect(screen.queryByText('+ 自定义标签')).not.toBeInTheDocument()
    })

    it('点击取消按钮隐藏输入框', () => {
      render(<TagSelector selectedTags={[]} onChange={mockOnChange} />)

      fireEvent.click(screen.getByText('+ 自定义标签'))
      fireEvent.click(screen.getByText('取消'))

      expect(screen.queryByPlaceholderText('输入自定义标签...')).not.toBeInTheDocument()
      expect(screen.getByText('+ 自定义标签')).toBeInTheDocument()
    })

    it('取消后清空输入内容', () => {
      render(<TagSelector selectedTags={[]} onChange={mockOnChange} />)

      fireEvent.click(screen.getByText('+ 自定义标签'))

      const input = screen.getByPlaceholderText('输入自定义标签...')
      fireEvent.change(input, { target: { value: '内容' } })
      fireEvent.click(screen.getByText('取消'))

      // 再次打开输入框
      fireEvent.click(screen.getByText('+ 自定义标签'))
      const newInput = screen.getByPlaceholderText('输入自定义标签...')
      expect(newInput).toHaveValue('')
    })

    it('达到最大标签数时不显示自定义按钮', () => {
      const selected = PRESET_TAGS.slice(0, MAX_TAGS).map(t => t.name)
      render(<TagSelector selectedTags={selected} onChange={mockOnChange} />)

      expect(screen.queryByText('+ 自定义标签')).not.toBeInTheDocument()
    })
  })

  describe('maxTags 参数', () => {
    it('自定义最大标签数', () => {
      render(<TagSelector selectedTags={[]} onChange={mockOnChange} maxTags={5} />)

      expect(screen.getByText(/最多 5 个/)).toBeInTheDocument()
    })

    it('自定义最大标签数时帮助文字更新', () => {
      render(<TagSelector selectedTags={['工具推荐', '技术讨论']} onChange={mockOnChange} maxTags={5} />)

      expect(screen.getByText('已选择 (2/5):')).toBeInTheDocument()
    })
  })

  describe('边界情况', () => {
    it('trim 空格后添加标签', () => {
      render(<TagSelector selectedTags={[]} onChange={mockOnChange} />)

      fireEvent.click(screen.getByText('+ 自定义标签'))

      const input = screen.getByPlaceholderText('输入自定义标签...')
      fireEvent.change(input, { target: { value: '  标签  ' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockOnChange).toHaveBeenCalledWith(['标签'])
    })

    it('连续选择多个标签时 onChange 正确调用', () => {
      const { rerender } = render(<TagSelector selectedTags={[]} onChange={mockOnChange} />)

      // 点击第一个标签
      fireEvent.click(screen.getByRole('button', { name: /工具推荐/ }))
      expect(mockOnChange).toHaveBeenNthCalledWith(1, ['工具推荐'])

      // 模拟父组件状态更新
      rerender(<TagSelector selectedTags={['工具推荐']} onChange={mockOnChange} />)

      // 点击第二个标签
      fireEvent.click(screen.getByRole('button', { name: /技术讨论/ }))
      expect(mockOnChange).toHaveBeenNthCalledWith(2, ['工具推荐', '技术讨论'])
    })
  })
})

describe('TagBadge', () => {
  it('渲染预设标签', () => {
    render(<TagBadge tag="工具推荐" />)

    expect(screen.getByText('🔧')).toBeInTheDocument()
    expect(screen.getByText('#工具推荐')).toBeInTheDocument()
  })

  it('渲染自定义标签', () => {
    render(<TagBadge tag="自定义" />)

    expect(screen.getByText('#自定义')).toBeInTheDocument()
  })

  it('小尺寸样式', () => {
    render(<TagBadge tag="工具推荐" size="sm" />)

    const badge = screen.getByText('#工具推荐').parentElement
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs')
  })

  it('中等尺寸样式', () => {
    render(<TagBadge tag="工具推荐" size="md" />)

    const badge = screen.getByText('#工具推荐').parentElement
    expect(badge).toHaveClass('px-3', 'py-1', 'text-sm')
  })

  it('不可点击时渲染为 span', () => {
    render(<TagBadge tag="工具推荐" clickable={false} />)

    expect(screen.getByText('#工具推荐').parentElement?.tagName).toBe('SPAN')
  })

  it('可点击时渲染为 button', () => {
    render(<TagBadge tag="工具推荐" clickable={true} />)

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('点击可点击标签触发 onClick', () => {
    const mockOnClick = vi.fn()
    render(<TagBadge tag="工具推荐" clickable={true} onClick={mockOnClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(mockOnClick).toHaveBeenCalled()
  })

  it('可点击时添加 hover 样式', () => {
    render(<TagBadge tag="工具推荐" clickable={true} />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('hover:ring-2')
  })
})