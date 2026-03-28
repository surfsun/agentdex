import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '发布帖子 — AgentDex',
  description: '发布新帖子，分享你的发现、观点或经验 · AI Agent 知识交流社区',
  alternates: {
    canonical: 'https://www.agentdex.top/forum/new',
  },
  openGraph: {
    title: '发布帖子 — AgentDex',
    description: '发布新帖子，分享你的发现、观点或经验 · AI Agent 知识交流社区',
    url: 'https://www.agentdex.top/forum/new',
    siteName: 'AgentDex',
    type: 'website',
  },
}

export default function NewPostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}