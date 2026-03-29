'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import Link from 'next/link'

interface MarkdownContentProps {
  content: string
  className?: string
}

/**
 * Markdown 渲染组件
 * 
 * 支持：
 * - GitHub Flavored Markdown (GFM)
 * - 代码块语法高亮
 * - 表格、任务列表、删除线等
 * - 自动链接转换（内部链接）
 */
export default function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={`markdown-content ${className}`}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 代码块：添加复制按钮和语言标识
          pre: ({ children }: any) => {
            // Check if this is a code block (has hljs class from rehype-highlight)
            const childElement = children as React.ReactElement<any>
            const isCodeBlock = childElement?.props?.className?.includes('hljs')
            
            if (isCodeBlock) {
              const codeContent = childElement?.props?.children?.[0] || ''
              const langClass = childElement?.props?.className || ''
              const langMatch = langClass.match(/language-(\w+)/)
              const lang = langMatch ? langMatch[1] : ''
              
              return (
                <div className="relative group">
                  {/* Language tag */}
                  {lang && (
                    <span className="absolute top-2 right-12 text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {lang}
                    </span>
                  )}
                  {/* Copy button */}
                  <button
                    onClick={() => navigator.clipboard.writeText(String(codeContent))}
                    className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 dark:bg-gray-600 text-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600 dark:hover:bg-gray-500"
                    title="复制代码"
                  >
                    复制
                  </button>
                  <pre className="!bg-gray-900 dark:!bg-gray-800 !p-4 rounded-lg overflow-x-auto !my-4">
                    {children}
                  </pre>
                </div>
              )
            }
            
            return <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded">{children}</pre>
          },
          // 代码块内容
          code: ({ className, children }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            
            if (isInline) {
              return (
                <code
                  className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400"
                >
                  {children}
                </code>
              )
            }
            
            return (
              <code className={className}>
                {children}
              </code>
            )
          },
          // 链接：区分内部链接和外部链接
          a: ({ href, children }: any) => {
            // 内部链接（AgentDex 内）
            if (href?.startsWith('/') || href?.includes?.('agentdex.top')) {
              return (
                <Link
                  href={href || '#'}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {children}
                </Link>
              )
            }
            
            // 外部链接
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                {children}
                <span className="text-xs opacity-60">↗</span>
              </a>
            )
          },
          // 标题
          h1: ({ children }: any) => (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-6">{children}</h1>
          ),
          h2: ({ children }: any) => (
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 mt-5">{children}</h2>
          ),
          h3: ({ children }: any) => (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">{children}</h3>
          ),
          h4: ({ children }: any) => (
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 mt-3">{children}</h4>
          ),
          // 段落
          p: ({ children }: any) => (
            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{children}</p>
          ),
          // 列表
          ul: ({ children }: any) => (
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">{children}</ul>
          ),
          ol: ({ children }: any) => (
            <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">{children}</ol>
          ),
          li: ({ children }: any) => (
            <li className="text-gray-700 dark:text-gray-300">{children}</li>
          ),
          // 引用
          blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-4 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 italic">
              {children}
            </blockquote>
          ),
          // 表格
          table: ({ children }: any) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-gray-200 dark:border-gray-700">{children}</table>
            </div>
          ),
          th: ({ children }: any) => (
            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white text-left">
              {children}
            </th>
          ),
          td: ({ children }: any) => (
            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-300">
              {children}
            </td>
          ),
          // 水平线
          hr: () => (
            <hr className="my-6 border-gray-200 dark:border-gray-700" />
          ),
          // 图片
          img: ({ src, alt }: any) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg my-4"
              loading="lazy"
            />
          ),
          // 删除线
          del: ({ children }: any) => (
            <del className="text-gray-500 dark:text-gray-400 line-through">{children}</del>
          ),
          // 强调
          strong: ({ children }: any) => (
            <strong className="font-bold text-gray-900 dark:text-white">{children}</strong>
          ),
          em: ({ children }: any) => (
            <em className="italic text-gray-700 dark:text-gray-300">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}