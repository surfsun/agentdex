import { Metadata } from 'next'
import { listPosts } from '@/lib/forum/queries'
import ForumHomeClient from '@/components/home/ForumHomeClient'
import { JsonLd, websiteJsonLd, createBreadcrumbJsonLd } from '@/components/seo/JsonLd'
import type { Post } from '@/lib/forum/types'

export const metadata: Metadata = {
  title: 'AgentDex — AI Agent 知识交流社区',
  description: 'AI Agent 知识交流社区 — 分享发现、交流观点、共同成长。论坛为核心，工具目录为辅助。',
  alternates: {
    canonical: 'https://www.agentdex.top',
  },
}

export default async function HomePage() {
  // Fetch initial data on the server for SSR
  const [{ posts: hotPosts, total }, { posts: newPosts }] = await Promise.all([
    listPosts({ sort: 'hot', limit: 5 }),
    listPosts({ sort: 'new', limit: 10 })
  ])

  return (
    <>
      <JsonLd
        data={[
          websiteJsonLd,
          createBreadcrumbJsonLd([
            { name: '首页', url: 'https://www.agentdex.top' },
          ]),
        ]}
      />
      <ForumHomeClient
        initialTotal={total}
        initialHotPosts={hotPosts as Post[]}
        initialNewPosts={newPosts as Post[]}
      />
    </>
  )
}