import { Metadata } from 'next'
import ForumListClient from '@/components/forum/ForumListClient'

interface ForumPageProps {
  searchParams: Promise<{ tag?: string; sort?: string }>
}

export async function generateMetadata({ searchParams }: ForumPageProps): Promise<Metadata> {
  const params = await searchParams
  const tag = params.tag
  
  if (tag) {
    return {
      title: `${tag} — 论坛 — AgentDex`,
      description: `${tag}分类 · AI Agent 知识交流社区`,
    }
  }
  
  return {
    title: '论坛 — AgentDex',
    description: 'AI Agent 知识交流社区 — 浏览所有帖子，分享你的发现与观点',
  }
}

export default function ForumPage({ searchParams }: ForumPageProps) {
  return <ForumListClient />
}