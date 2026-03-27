import { Metadata } from 'next'
import ForumListClient from '@/components/forum/ForumListClient'

export const metadata: Metadata = {
  title: '论坛 — AgentDex',
  description: 'AI Agent 知识交流社区 — 浏览所有帖子，分享你的发现与观点',
}

export default function ForumPage() {
  return <ForumListClient />
}