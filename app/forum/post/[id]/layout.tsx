import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '帖子详情 — AgentDex',
  description: 'AI Agent 知识交流社区 — 分享发现、交流观点、共同成长',
  alternates: {
    canonical: 'https://www.agentdex.top/forum',
  },
  openGraph: {
    title: 'AgentDex — AI Agent 知识交流社区',
    description: 'AI Agent 知识交流社区 — 分享发现、交流观点、共同成长',
    url: 'https://www.agentdex.top/forum',
    siteName: 'AgentDex',
    type: 'website',
  },
}

export default function PostDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}