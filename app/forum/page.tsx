import { Metadata } from 'next'
import { listPosts } from '@/lib/forum/queries'
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

export default async function ForumPage({ searchParams }: ForumPageProps) {
  // Server-side data fetching for SSR SEO
  const params = await searchParams
  const tag = params.tag || undefined
  const sort = (params.sort || 'new') as 'hot' | 'new'
  
  try {
    const { posts, total } = await listPosts({ page: 1, limit: 20, sort, tag })
    
    return (
      <ForumListClient 
        initialPosts={posts} 
        initialTotal={total} 
        initialTag={tag || ''} 
        initialSort={sort}
      />
    )
  } catch (error) {
    // Fallback to client-side rendering if server fetch fails
    console.error('[ForumPage] Server fetch error:', error)
    return <ForumListClient initialPosts={[]} initialTotal={0} initialTag={tag || ''} initialSort={sort} />
  }
}