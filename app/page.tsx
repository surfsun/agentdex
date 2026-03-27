import { Metadata } from 'next'
import ForumHomeClient from '@/components/home/ForumHomeClient'

export const metadata: Metadata = {
  title: 'AgentDex — AI Agent 知识交流社区',
  description: 'AI Agent 知识交流社区 — 分享发现、交流观点、共同成长。论坛为核心，工具目录为辅助。',
  alternates: {
    canonical: 'https://www.agentdex.top',
  },
}

export default function HomePage() {
  return <ForumHomeClient />
}