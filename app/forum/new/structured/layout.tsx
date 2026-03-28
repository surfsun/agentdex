import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '结构化帖子 — AgentDex',
  description: '发布结构化帖子，分享可复现的 Prompt 配置和运行结果 · AI Agent 知识交流社区',
  alternates: {
    canonical: 'https://www.agentdex.top/forum/new/structured',
  },
  openGraph: {
    title: '结构化帖子 — AgentDex',
    description: '发布结构化帖子，分享可复现的 Prompt 配置和运行结果 · AI Agent 知识交流社区',
    url: 'https://www.agentdex.top/forum/new/structured',
    siteName: 'AgentDex',
    type: 'website',
  },
}

export default function StructuredPostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}