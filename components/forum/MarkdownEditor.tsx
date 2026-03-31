'use client'

import { useState, useCallback, useRef, useEffect, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

// Type definitions for react-markdown components
interface BaseProps {
  children?: ReactNode
  className?: string
}

// Alias types for react-markdown components that only need base props
type PreProps = BaseProps
type CodeProps = BaseProps
type HeadingProps = BaseProps
type ListProps = BaseProps
type ListItemProps = BaseProps
type BlockquoteProps = BaseProps

interface LinkProps extends BaseProps {
  href?: string
}

type TableProps = BaseProps
type TableCellProps = BaseProps

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  className?: string
  disabled?: boolean
}

// Toolbar button configuration
const toolbarButtons = [
  { icon: 'B', title: '粗体', action: 'bold', syntax: '**', placeholder: '粗体文本' },
  { icon: 'I', title: '斜体', action: 'italic', syntax: '*', placeholder: '斜体文本' },
  { icon: 'S', title: '删除线', action: 'strikethrough', syntax: '~~', placeholder: '删除文本' },
  { icon: 'H', title: '标题', action: 'heading', syntax: '## ', placeholder: '标题' },
  { icon: '`', title: '代码', action: 'code', syntax: '`', placeholder: '代码' },
  { icon: '{}', title: '代码块', action: 'codeblock', syntax: '```', placeholder: '代码块' },
  { icon: '>', title: '引用', action: 'quote', syntax: '> ', placeholder: '引用文本' },
  { icon: '-', title: '列表', action: 'list', syntax: '- ', placeholder: '列表项' },
  { icon: '1.', title: '有序列表', action: 'orderedlist', syntax: '1. ', placeholder: '列表项' },
  { icon: '🔗', title: '链接', action: 'link', syntax: '[', placeholder: '链接文本' },
  { icon: '📷', title: '图片', action: 'image', syntax: '![', placeholder: '图片描述' },
  { icon: '|', title: '表格', action: 'table', syntax: '| ', placeholder: '表格' },
]

/**
 * Markdown 编辑器组件
 * 
 * 特性：
 * - 编辑 + 预览双面板模式
 * - 工具栏快捷操作
 * - 实时 Markdown 渲染预览
 * - 代码块语法高亮
 * - GFM 支持（表格、任务列表等）
 */
export default function MarkdownEditor({
  value,
  onChange,
  placeholder = '输入内容，支持 Markdown 格式...',
  minHeight = 300,
  className = '',
  disabled = false,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Insert syntax at cursor position
  const insertSyntax = useCallback((button: typeof toolbarButtons[0]) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    let insertion = ''
    let cursorOffset = 0

    switch (button.action) {
      case 'bold':
        insertion = `**${selectedText || button.placeholder}**`
        cursorOffset = selectedText ? insertion.length : 2
        break
      case 'italic':
        insertion = `*${selectedText || button.placeholder}*`
        cursorOffset = selectedText ? insertion.length : 1
        break
      case 'strikethrough':
        insertion = `~~${selectedText || button.placeholder}~~`
        cursorOffset = selectedText ? insertion.length : 2
        break
      case 'heading':
        insertion = `## ${selectedText || button.placeholder}`
        cursorOffset = 3
        break
      case 'code':
        insertion = `\`${selectedText || button.placeholder}\``
        cursorOffset = selectedText ? insertion.length : 1
        break
      case 'codeblock':
        insertion = `\n\`\`\`\n${selectedText || button.placeholder}\n\`\`\`\n`
        cursorOffset = 4
        break
      case 'quote':
        insertion = `> ${selectedText || button.placeholder}`
        cursorOffset = 2
        break
      case 'list':
        insertion = `- ${selectedText || button.placeholder}`
        cursorOffset = 2
        break
      case 'orderedlist':
        insertion = `1. ${selectedText || button.placeholder}`
        cursorOffset = 3
        break
      case 'link':
        insertion = `[${selectedText || '链接文本'}](url)`
        cursorOffset = selectedText ? insertion.length - 4 : 1
        break
      case 'image':
        insertion = `![${selectedText || '图片描述'}](url)`
        cursorOffset = selectedText ? insertion.length - 4 : 2
        break
      case 'table':
        insertion = `\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容 | 内容 | 内容 |\n`
        cursorOffset = 2
        break
      default:
        return
    }

    // Update value
    const newValue = value.substring(0, start) + insertion + value.substring(end)
    onChange(newValue)

    // Set cursor position after update
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start, start + insertion.length)
      } else {
        textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + button.placeholder.length)
      }
    }, 0)
  }, [value, onChange])

  // Handle keyboard shortcuts
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B for bold
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        insertSyntax(toolbarButtons.find(b => b.action === 'bold')!)
      }
      // Ctrl/Cmd + I for italic
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault()
        insertSyntax(toolbarButtons.find(b => b.action === 'italic')!)
      }
      // Ctrl/Cmd + K for link
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        insertSyntax(toolbarButtons.find(b => b.action === 'link')!)
      }
    }

    textarea.addEventListener('keydown', handleKeyDown)
    return () => textarea.removeEventListener('keydown', handleKeyDown)
  }, [insertSyntax])

  // Preview renderer components with proper types
  const previewComponents = {
    pre: ({ children }: PreProps) => {
      const childElement = children as React.ReactElement<CodeProps>
      const isCodeBlock = childElement?.props?.className?.includes('hljs')
      
      if (isCodeBlock) {
        const langClass = childElement?.props?.className || ''
        const langMatch = langClass.match(/language-(\w+)/)
        const lang = langMatch ? langMatch[1] : ''
        
        return (
          <div className="relative group">
            {lang && (
              <span className="absolute top-1 right-1 text-xs text-gray-400 font-mono">
                {lang}
              </span>
            )}
            <pre className="bg-gray-900 p-2 rounded text-sm overflow-x-auto my-2">
              {children}
            </pre>
          </div>
        )
      }
      return <pre className="bg-gray-100 p-2 rounded">{children}</pre>
    },
    code: ({ className, children }: CodeProps) => {
      const match = /language-(\w+)/.exec(className || '')
      if (!match) {
        return (
          <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-pink-600">
            {children}
          </code>
        )
      }
      return <code className={className}>{children}</code>
    },
    p: ({ children }: BaseProps) => (
      <p className="text-gray-700 mb-2 leading-relaxed">{children}</p>
    ),
    h1: ({ children }: HeadingProps) => (
      <h1 className="text-xl font-bold text-gray-900 mb-2 mt-3">{children}</h1>
    ),
    h2: ({ children }: HeadingProps) => (
      <h2 className="text-lg font-bold text-gray-900 mb-2 mt-2">{children}</h2>
    ),
    h3: ({ children }: HeadingProps) => (
      <h3 className="text-base font-semibold text-gray-900 mb-1 mt-2">{children}</h3>
    ),
    ul: ({ children }: ListProps) => (
      <ul className="list-disc list-inside text-gray-700 mb-2 space-y-0.5">{children}</ul>
    ),
    ol: ({ children }: ListProps) => (
      <ol className="list-decimal list-inside text-gray-700 mb-2 space-y-0.5">{children}</ol>
    ),
    li: ({ children }: ListItemProps) => (
      <li className="text-gray-700">{children}</li>
    ),
    blockquote: ({ children }: BlockquoteProps) => (
      <blockquote className="border-l-3 border-gray-300 pl-3 py-1 my-2 bg-gray-50 text-gray-600 italic">
        {children}
      </blockquote>
    ),
    a: ({ href, children }: LinkProps) => (
      <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    strong: ({ children }: BaseProps) => (
      <strong className="font-bold text-gray-900">{children}</strong>
    ),
    em: ({ children }: BaseProps) => (
      <em className="italic">{children}</em>
    ),
    table: ({ children }: TableProps) => (
      <div className="overflow-x-auto my-2">
        <table className="min-w-full border border-gray-200">{children}</table>
      </div>
    ),
    th: ({ children }: TableCellProps) => (
      <th className="border border-gray-200 px-2 py-1 bg-gray-50 font-semibold text-left">{children}</th>
    ),
    td: ({ children }: TableCellProps) => (
      <td className="border border-gray-200 px-2 py-1">{children}</td>
    ),
  }

  return (
    <div className={`markdown-editor ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-t-lg">
        {/* Format buttons */}
        {toolbarButtons.map((button) => (
          <button
            key={button.action}
            type="button"
            onClick={() => insertSyntax(button)}
            title={`${button.title} (${button.action === 'bold' ? 'Ctrl+B' : button.action === 'italic' ? 'Ctrl+I' : button.action === 'link' ? 'Ctrl+K' : ''})`}
            className="px-2 py-1 text-xs font-mono bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition border border-gray-200 dark:border-gray-500"
          >
            {button.icon}
          </button>
        ))}
        
        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1" />
        
        {/* View mode buttons */}
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={`px-3 py-1 text-xs rounded transition ${
            mode === 'edit'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500'
          }`}
        >
          编辑
        </button>
        <button
          type="button"
          onClick={() => setMode('split')}
          className={`px-3 py-1 text-xs rounded transition ${
            mode === 'split'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500'
          }`}
        >
          分屏
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`px-3 py-1 text-xs rounded transition ${
            mode === 'preview'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500'
          }`}
        >
          预览
        </button>
      </div>

      {/* Editor + Preview area */}
      <div className="border border-gray-200 dark:border-gray-600 border-t-0 rounded-b-lg overflow-hidden">
        <div className={`flex ${mode === 'split' ? 'divide-x divide-gray-200 dark:divide-gray-600' : ''}`}>
          {/* Editor */}
          {(mode === 'edit' || mode === 'split') && (
            <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'}`}>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none font-mono text-sm"
                style={{ minHeight: `${minHeight}px` }}
              />
            </div>
          )}

          {/* Preview */}
          {(mode === 'preview' || mode === 'split') && (
            <div 
              className={`${mode === 'split' ? 'w-1/2' : 'w-full'} p-3 bg-gray-50 dark:bg-gray-800 overflow-auto`}
              style={{ minHeight: `${minHeight}px` }}
            >
              {value.trim() ? (
                <div className="preview-content text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={previewComponents}
                  >
                    {value}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-gray-400 dark:text-gray-500 text-sm italic">
                  预览区域 - 输入内容后显示渲染效果
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Help text */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        支持 Markdown 格式：**粗体** *斜体* ~~删除线~~ `代码` ```代码块``` [链接](url)
        | 快捷键：Ctrl+B 粗体, Ctrl+I 斜体, Ctrl+K 链接
      </div>
    </div>
  )
}