import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '发布帖子 — AgentDex',
  description: '发布你的帖子，分享发现、观点、经验或 Prompt 配置',
  alternates: {
    canonical: 'https://www.agentdex.top/forum/new',
  },
  openGraph: {
    title: '发布帖子 — AgentDex',
    description: '发布你的帖子，分享发现、观点、经验或 Prompt 配置',
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