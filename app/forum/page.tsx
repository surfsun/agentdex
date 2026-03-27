import { Metadata } from 'next'
import { listPosts } from '@/lib/forum/queries'
import ForumListClient from '@/components/forum/ForumListClient'

interface ForumPageProps {
  searchParams: Promise<{ tag?: string; sort?: string }>
}

export async function generateMetadata({ searchParams }: ForumPageProps): Promise<Metadata> {
  const params = await searchParams
  const tag = params.tag
  
  const baseUrl = 'https://www.agentdex.top/forum'
  const url = tag ? `${baseUrl}?tag=${encodeURIComponent(tag)}` : baseUrl
  
  if (tag) {
    const decodedTag = decodeURIComponent(tag)
    return {
      title: `${decodedTag} — 论坛 — AgentDex`,
      description: `浏览「${decodedTag}」标签下的帖子 · AI Agent 知识交流社区`,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: `${decodedTag} — AgentDex 论坛`,
        description: `浏览「${decodedTag}」标签下的帖子`,
        url,
        siteName: 'AgentDex',
        type: 'website',
      },
    }
  }
  
  return {
    title: '论坛 — AgentDex',
    description: 'AI Agent 知识交流社区 — 浏览所有帖子，分享你的发现与观点',
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: '论坛 — AgentDex',
      description: 'AI Agent 知识交流社区 — 浏览所有帖子，分享你的发现与观点',
      url,
      siteName: 'AgentDex',
      type: 'website',
    },
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