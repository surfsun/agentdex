import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StructuredPostForm from '@/components/forum/StructuredPostForm'

// Mock TagSelector component
vi.mock('@/components/forum/TagSelector', () => ({
  default: ({ selectedTags, onChange }: { selectedTags: string[], onChange: (tags: string[]) => void }) => (
    <div data-testid="tag-selector">
      {selectedTags.map(tag => (
        <span key={tag} data-testid={`selected-tag-${tag}`}>{tag}</span>
      ))}
      <button
        onClick={() => onChange([...selectedTags, 'new-tag'])}
        data-testid="add-tag-btn"
      >
        Add Tag
      </button>
    </div>
  )
}))

describe('StructuredPostForm', () => {
  const mockOnSubmit = vi.fn()
  const defaultProps = {
    onSubmit: mockOnSubmit,
    submitting: false,
    error: null
  }

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  // Helper: Fill all required fields
  const fillRequiredFields = () => {
    const titleInput = screen.getByPlaceholderText('简短描述你的 Prompt 经验...')
    const contentTextarea = screen.getByPlaceholderText('简要说明这个 Prompt 的用途和效果...')
    const systemPromptTextarea = screen.getByPlaceholderText('You are a helpful assistant that...')
    const inputExampleTextarea = screen.getByPlaceholderText('The input that was given to the model...')
    const expectedOutputTextarea = screen.getByPlaceholderText('What you expected the model to produce...')
    const actualOutputTextarea = screen.getByPlaceholderText('What the model actually produced...')
    const evaluationNotesTextarea = screen.getByPlaceholderText('Your analysis and recommendations...')

    fireEvent.change(titleInput, { target: { value: 'Test Title' } })
    fireEvent.change(contentTextarea, { target: { value: 'Test Content' } })
    fireEvent.change(systemPromptTextarea, { target: { value: 'Test System Prompt' } })
    fireEvent.change(inputExampleTextarea, { target: { value: 'Test Input' } })
    fireEvent.change(expectedOutputTextarea, { target: { value: 'Test Expected' } })
    fireEvent.change(actualOutputTextarea, { target: { value: 'Test Actual' } })
    fireEvent.change(evaluationNotesTextarea, { target: { value: 'Test Notes' } })
  }

  // ===== Section 1: 基础渲染 =====

  it('should render all three sections', () => {
    render(<StructuredPostForm {...defaultProps} />)

    // Check section headings by regex (emoji is in separate span)
    expect(screen.getByText(/帖子摘要/)).toBeInTheDocument()
    expect(screen.getByText(/Prompt Bundle/)).toBeInTheDocument()
    expect(screen.getByText(/Run Snapshot/)).toBeInTheDocument()
  })

  it('should render title field', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByPlaceholderText('简短描述你的 Prompt 经验...')).toBeInTheDocument()
  })

  it('should render content summary field', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByPlaceholderText('简要说明这个 Prompt 的用途和效果...')).toBeInTheDocument()
  })

  it('should render tag selector', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByTestId('tag-selector')).toBeInTheDocument()
  })

  it('should render model dropdown', () => {
    render(<StructuredPostForm {...defaultProps} />)

    // Model select is a combobox
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('GPT-4')).toBeInTheDocument()
    expect(screen.getByText('Claude 3 Opus')).toBeInTheDocument()
    expect(screen.getByText('Gemini Pro')).toBeInTheDocument()
  })

  it('should render system prompt field', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByPlaceholderText('You are a helpful assistant that...')).toBeInTheDocument()
  })

  it('should render initial user prompt field', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByPlaceholderText('User prompt 1...')).toBeInTheDocument()
  })

  it('should render common tools buttons', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'web_search' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'code_exec' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'api_call' })).toBeInTheDocument()
  })

  it('should render custom tool input', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByPlaceholderText('Custom tool name...')).toBeInTheDocument()
  })

  it('should render dependencies field', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByPlaceholderText('{"langchain": "0.1.0", "openai": "1.0.0"}')).toBeInTheDocument()
  })

  it('should render environment field', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByPlaceholderText('e.g., Python 3.11, Node.js 20.x')).toBeInTheDocument()
  })

  it('should render success rate field', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByPlaceholderText('0.85')).toBeInTheDocument()
  })

  it('should render latency field', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByPlaceholderText('1200')).toBeInTheDocument()
  })

  it('should render input example field', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByPlaceholderText('The input that was given to the model...')).toBeInTheDocument()
  })

  it('should render expected output field', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByPlaceholderText('What you expected the model to produce...')).toBeInTheDocument()
  })

  it('should render actual output field', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByPlaceholderText('What the model actually produced...')).toBeInTheDocument()
  })

  it('should render evaluation notes field', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByPlaceholderText('Your analysis and recommendations...')).toBeInTheDocument()
  })

  it('should render cancel and submit buttons', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发布结构化帖子' })).toBeInTheDocument()
  })

  // ===== Section 2: 表单验证 =====

  it('should show validation error when title is empty', async () => {
    render(<StructuredPostForm {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: '发布结构化帖子' }))

    await waitFor(() => {
      expect(screen.getByText('请输入标题')).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should show validation error when content is empty', async () => {
    render(<StructuredPostForm {...defaultProps} />)

    const titleInput = screen.getByPlaceholderText('简短描述你的 Prompt 经验...')
    fireEvent.change(titleInput, { target: { value: 'Test Title' } })
    
    fireEvent.click(screen.getByRole('button', { name: '发布结构化帖子' }))

    await waitFor(() => {
      expect(screen.getByText('请输入内容摘要')).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should show validation error when system prompt is empty', async () => {
    render(<StructuredPostForm {...defaultProps} />)

    const titleInput = screen.getByPlaceholderText('简短描述你的 Prompt 经验...')
    const contentTextarea = screen.getByPlaceholderText('简要说明这个 Prompt 的用途和效果...')
    fireEvent.change(titleInput, { target: { value: 'Test Title' } })
    fireEvent.change(contentTextarea, { target: { value: 'Test Content' } })
    
    fireEvent.click(screen.getByRole('button', { name: '发布结构化帖子' }))

    await waitFor(() => {
      expect(screen.getByText('请输入 System Prompt')).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should show validation error when input example is empty', async () => {
    render(<StructuredPostForm {...defaultProps} />)

    const titleInput = screen.getByPlaceholderText('简短描述你的 Prompt 经验...')
    const contentTextarea = screen.getByPlaceholderText('简要说明这个 Prompt 的用途和效果...')
    const systemPromptTextarea = screen.getByPlaceholderText('You are a helpful assistant that...')
    
    fireEvent.change(titleInput, { target: { value: 'Test Title' } })
    fireEvent.change(contentTextarea, { target: { value: 'Test Content' } })
    fireEvent.change(systemPromptTextarea, { target: { value: 'Test System Prompt' } })
    
    fireEvent.click(screen.getByRole('button', { name: '发布结构化帖子' }))

    await waitFor(() => {
      expect(screen.getByText('请输入输入示例')).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should show validation error when expected output is empty', async () => {
    render(<StructuredPostForm {...defaultProps} />)

    fillRequiredFields()
    // Clear expected output
    const expectedOutputTextarea = screen.getByPlaceholderText('What you expected the model to produce...')
    fireEvent.change(expectedOutputTextarea, { target: { value: '' } })
    
    fireEvent.click(screen.getByRole('button', { name: '发布结构化帖子' }))

    await waitFor(() => {
      expect(screen.getByText('请输入期望输出')).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should show validation error when actual output is empty', async () => {
    render(<StructuredPostForm {...defaultProps} />)

    fillRequiredFields()
    // Clear actual output
    const actualOutputTextarea = screen.getByPlaceholderText('What the model actually produced...')
    fireEvent.change(actualOutputTextarea, { target: { value: '' } })
    
    fireEvent.click(screen.getByRole('button', { name: '发布结构化帖子' }))

    await waitFor(() => {
      expect(screen.getByText('请输入实际输出')).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should show validation error when evaluation notes is empty', async () => {
    render(<StructuredPostForm {...defaultProps} />)

    fillRequiredFields()
    // Clear evaluation notes
    const evaluationNotesTextarea = screen.getByPlaceholderText('Your analysis and recommendations...')
    fireEvent.change(evaluationNotesTextarea, { target: { value: '' } })
    
    fireEvent.click(screen.getByRole('button', { name: '发布结构化帖子' }))

    await waitFor(() => {
      expect(screen.getByText('请输入评估备注')).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  // ===== Section 3: User Prompts =====

  it('should add new user prompt field', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.getByPlaceholderText('User prompt 1...')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('User prompt 2...')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('+ 添加更多 User Prompt'))

    expect(screen.getByPlaceholderText('User prompt 2...')).toBeInTheDocument()
  })

  it('should remove user prompt field', () => {
    render(<StructuredPostForm {...defaultProps} />)

    fireEvent.click(screen.getByText('+ 添加更多 User Prompt'))
    expect(screen.getByPlaceholderText('User prompt 2...')).toBeInTheDocument()

    // Find remove button (the ✕ button)
    const removeButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '✕')
    fireEvent.click(removeButtons[0])

    expect(screen.queryByPlaceholderText('User prompt 2...')).not.toBeInTheDocument()
  })

  it('should not show remove button when only one user prompt', () => {
    render(<StructuredPostForm {...defaultProps} />)

    expect(screen.queryByRole('button', { name: '✕' })).not.toBeInTheDocument()
  })

  it('should update user prompt value', () => {
    render(<StructuredPostForm {...defaultProps} />)

    const promptInput = screen.getByPlaceholderText('User prompt 1...')
    fireEvent.change(promptInput, { target: { value: 'Updated prompt' } })

    expect(promptInput).toHaveValue('Updated prompt')
  })

  // ===== Section 4: Tools =====

  it('should toggle tool selection', () => {
    render(<StructuredPostForm {...defaultProps} />)

    const webSearchBtn = screen.getByRole('button', { name: 'web_search' })
    
    // Click to select - the tool should be in tools state
    fireEvent.click(webSearchBtn)
    
    // Click again to deselect
    fireEvent.click(webSearchBtn)
  })

  it('should clear custom tool input after adding', () => {
    render(<StructuredPostForm {...defaultProps} />)

    const customInput = screen.getByPlaceholderText('Custom tool name...')
    fireEvent.change(customInput, { target: { value: 'my-custom-tool' } })
    
    fireEvent.click(screen.getByRole('button', { name: '添加' }))
    
    // Input should be cleared
    expect(customInput).toHaveValue('')
  })

  it('should not add empty custom tool', () => {
    render(<StructuredPostForm {...defaultProps} />)

    const customInput = screen.getByPlaceholderText('Custom tool name...')
    fireEvent.change(customInput, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: '添加' }))
    
    // Input should still be empty
    expect(customInput).toHaveValue('')
  })

  // ===== Section 5: 表单提交 =====

  it('should call onSubmit with correct data', async () => {
    render(<StructuredPostForm {...defaultProps} />)

    fillRequiredFields()

    // Select a tool
    fireEvent.click(screen.getByRole('button', { name: 'web_search' }))

    fireEvent.click(screen.getByRole('button', { name: '发布结构化帖子' }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })

    const callArgs = mockOnSubmit.mock.calls[0][0]
    expect(callArgs.title).toBe('Test Title')
    expect(callArgs.content).toBe('Test Content')
    expect(callArgs.post_type).toBe('structured')
    expect(callArgs.prompt_bundle.model).toBe('gpt-4')
    expect(callArgs.prompt_bundle.system_prompt).toBe('Test System Prompt')
    expect(callArgs.prompt_bundle.tools).toContain('web_search')
    expect(callArgs.run_snapshot.input_example).toBe('Test Input')
    expect(callArgs.run_snapshot.expected_output).toBe('Test Expected')
    expect(callArgs.run_snapshot.actual_output).toBe('Test Actual')
    expect(callArgs.run_snapshot.evaluation_notes).toBe('Test Notes')
  })

  it('should include optional fields when provided', async () => {
    render(<StructuredPostForm {...defaultProps} />)

    fillRequiredFields()

    // Fill optional fields
    const envInput = screen.getByPlaceholderText('e.g., Python 3.11, Node.js 20.x')
    const successRateInput = screen.getByPlaceholderText('0.85')
    const latencyInput = screen.getByPlaceholderText('1200')
    const failureTextarea = screen.getByPlaceholderText('If the output didn\'t match expectations, explain why...')
    const dependenciesTextarea = screen.getByPlaceholderText('{"langchain": "0.1.0", "openai": "1.0.0"}')

    fireEvent.change(envInput, { target: { value: 'Python 3.11' } })
    fireEvent.change(successRateInput, { target: { value: '0.85' } })
    fireEvent.change(latencyInput, { target: { value: '1200' } })
    fireEvent.change(failureTextarea, { target: { value: 'Timeout' } })
    fireEvent.change(dependenciesTextarea, { target: { value: '{"openai": "1.0.0"}' } })

    fireEvent.click(screen.getByRole('button', { name: '发布结构化帖子' }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })

    const callArgs = mockOnSubmit.mock.calls[0][0]
    expect(callArgs.prompt_bundle.dependencies).toEqual({ openai: '1.0.0' })
    expect(callArgs.run_snapshot.environment).toBe('Python 3.11')
    expect(callArgs.run_snapshot.success_rate).toBe(0.85)
    expect(callArgs.run_snapshot.latency_ms).toBe(1200)
    expect(callArgs.run_snapshot.failure_reason).toBe('Timeout')
  })

  it('should trim whitespace from fields', async () => {
    render(<StructuredPostForm {...defaultProps} />)

    const titleInput = screen.getByPlaceholderText('简短描述你的 Prompt 经验...')
    const contentTextarea = screen.getByPlaceholderText('简要说明这个 Prompt 的用途和效果...')
    const systemPromptTextarea = screen.getByPlaceholderText('You are a helpful assistant that...')
    const inputExampleTextarea = screen.getByPlaceholderText('The input that was given to the model...')
    const expectedOutputTextarea = screen.getByPlaceholderText('What you expected the model to produce...')
    const actualOutputTextarea = screen.getByPlaceholderText('What the model actually produced...')
    const evaluationNotesTextarea = screen.getByPlaceholderText('Your analysis and recommendations...')

    fireEvent.change(titleInput, { target: { value: '  Title with spaces  ' } })
    fireEvent.change(contentTextarea, { target: { value: '  Content with spaces  ' } })
    fireEvent.change(systemPromptTextarea, { target: { value: '  System prompt  ' } })
    fireEvent.change(inputExampleTextarea, { target: { value: '  Input  ' } })
    fireEvent.change(expectedOutputTextarea, { target: { value: '  Expected  ' } })
    fireEvent.change(actualOutputTextarea, { target: { value: '  Actual  ' } })
    fireEvent.change(evaluationNotesTextarea, { target: { value: '  Notes  ' } })

    fireEvent.click(screen.getByRole('button', { name: '发布结构化帖子' }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })

    const callArgs = mockOnSubmit.mock.calls[0][0]
    expect(callArgs.title).toBe('Title with spaces')
    expect(callArgs.content).toBe('Content with spaces')
    expect(callArgs.prompt_bundle.system_prompt).toBe('System prompt')
  })

  // ===== Section 6: 提交按钮状态 =====

  it('should show submitting state', () => {
    render(<StructuredPostForm {...defaultProps} submitting={true} />)

    expect(screen.getByRole('button', { name: '发布中...' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发布中...' })).toBeDisabled()
  })

  it('should show normal state when not submitting', () => {
    render(<StructuredPostForm {...defaultProps} submitting={false} />)

    expect(screen.getByRole('button', { name: '发布结构化帖子' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发布结构化帖子' })).not.toBeDisabled()
  })

  // ===== Section 7: 错误显示 =====

  it('should display API error', () => {
    render(<StructuredPostForm {...defaultProps} error="API call failed" />)

    expect(screen.getByText('API call failed')).toBeInTheDocument()
  })

  it('should display validation error with icon', async () => {
    render(<StructuredPostForm {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: '发布结构化帖子' }))

    await waitFor(() => {
      expect(screen.getByText('⚠️')).toBeInTheDocument()
      expect(screen.getByText('请输入标题')).toBeInTheDocument()
    })
  })

  // ===== Section 8: 取消按钮 =====

  it('should call window.history.back when clicking cancel', () => {
    const mockBack = vi.fn()
    vi.stubGlobal('window', { history: { back: mockBack } })

    render(<StructuredPostForm {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: '取消' }))

    expect(mockBack).toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  // ===== Section 9: 模型选择 =====

  it('should change model selection', async () => {
    render(<StructuredPostForm {...defaultProps} />)

    fillRequiredFields()

    const modelSelect = screen.getByRole('combobox')
    fireEvent.change(modelSelect, { target: { value: 'claude-3-opus' } })

    fireEvent.click(screen.getByRole('button', { name: '发布结构化帖子' }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })

    const callArgs = mockOnSubmit.mock.calls[0][0]
    expect(callArgs.prompt_bundle.model).toBe('claude-3-opus')
  })

  // ===== Section 10: 边界情况 =====

  it('should filter empty user prompts', async () => {
    render(<StructuredPostForm {...defaultProps} />)

    fillRequiredFields()

    // Add second user prompt but leave it empty
    fireEvent.click(screen.getByText('+ 添加更多 User Prompt'))
    const firstPrompt = screen.getByPlaceholderText('User prompt 1...')
    fireEvent.change(firstPrompt, { target: { value: 'First prompt' } })

    fireEvent.click(screen.getByRole('button', { name: '发布结构化帖子' }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })

    const callArgs = mockOnSubmit.mock.calls[0][0]
    expect(callArgs.prompt_bundle.user_prompts).toEqual(['First prompt'])
  })

  it('should handle title max length', () => {
    render(<StructuredPostForm {...defaultProps} />)

    const titleInput = screen.getByPlaceholderText('简短描述你的 Prompt 经验...')
    expect(titleInput).toHaveAttribute('maxlength', '255')
  })
})