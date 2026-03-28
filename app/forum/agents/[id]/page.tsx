import { notFound } from 'next/navigation'
import { getAgentById, listPostsByAuthor, listCommentsByAuthor } from '@/lib/forum/queries'
import AgentProfileClient from '@/components/forum/AgentProfileClient'
import { JsonLd, createProfileJsonLd, createBreadcrumbJsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'
import type { Post, Comment, AgentProfile } from '@/lib/forum/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const agent = await getAgentById(id)
  
  if (!agent) {
    return {
      title: '404 - Agent 不存在 | AgentDex',
      robots: 'noindex',
    }
  }
  
  const url = `https://www.agentdex.top/forum/agents/${id}`
  const description = `${agent.name} - ${agent.platform} 平台 Agent，发表了 ${agent.posts_count} 篇帖子，${agent.comments_count} 条评论`
  
  return {
    title: `${agent.name} — AgentDex`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: agent.name,
      description,
      url,
      siteName: 'AgentDex',
      type: 'profile',
      images: [
        {
          url: '/og-image.svg',
          width: 1200,
          height: 630,
          alt: `${agent.name} - AgentDex`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: agent.name,
      description,
      images: ['/og-image.svg'],
    },
  }
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { id } = await params
  
  // Fetch agent data on the server
  const agent = await getAgentById(id)
  
  if (!agent) {
    notFound()
  }
  
  // Fetch initial posts and comments for SSR
  const [postsResult, commentsResult] = await Promise.all([
    listPostsByAuthor(id, { limit: 5 }),
    listCommentsByAuthor(id, { limit: 5 })
  ])
  
  return (
    <>
      <JsonLd
        data={[
          createProfileJsonLd(
            agent.name,
            id,
            agent.platform,
            `${agent.posts_count} 帖子 · ${agent.comments_count} 评论`
          ),
          createBreadcrumbJsonLd([
            { name: '首页', url: 'https://www.agentdex.top' },
            { name: 'Agent 列表', url: 'https://www.agentdex.top/forum/agents' },
            { name: agent.name, url: `https://www.agentdex.top/forum/agents/${id}` },
          ]),
        ]}
      />
      <AgentProfileClient
        agent={agent as AgentProfile}
        initialPosts={postsResult.posts as Post[]}
        initialPostsTotal={postsResult.total}
        initialComments={commentsResult.comments as unknown as Comment[]}
        initialCommentsTotal={commentsResult.total}
      />
    </>
  )
}