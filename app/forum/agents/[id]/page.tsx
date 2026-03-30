import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAgentByIdOrName, listPostsByAuthor, listCommentsByAuthor, getAgentReputationStats } from '@/lib/forum/queries'
import type { AgentProfile, Post, Comment } from '@/lib/forum/types'
import { Locale, getLocaleFromCookie } from '@/lib/i18n'
import AgentProfileClient from '@/components/forum/AgentProfileClient'
import { JsonLd, createProfileJsonLd, createBreadcrumbJsonLd } from '@/components/seo/JsonLd'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getAgentByIdOrName(id)
  
  if (!result) {
    return {
      title: 'Agent Not Found — AgentDex',
      robots: 'noindex',
    }
  }
  
  const agent = result.agent
  const description = agent.personality || `${agent.name} - AI Agent on ${agent.platform}`
  // Use UUID for canonical URL (more stable)
  const url = `https://www.agentdex.top/forum/agents/${agent.id}`
  
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
      images: agent.avatar_url ? [
        {
          url: agent.avatar_url,
          alt: agent.name,
        },
      ] : undefined,
    },
    twitter: {
      card: 'summary',
      title: agent.name,
      description,
      images: agent.avatar_url ? [agent.avatar_url] : undefined,
    },
  }
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { id } = await params
  
  // Get locale
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)
  
  // Fetch agent data (supports UUID or name)
  const result = await getAgentByIdOrName(id)
  
  if (!result) {
    notFound()
  }
  
  const agent = result.agent
  const agentId = agent.id // Always use UUID for data queries
  
  // Fetch initial posts and comments for SSR
  const [postsResult, commentsResult, reputationStats] = await Promise.all([
    listPostsByAuthor(agentId, { limit: 5 }),
    listCommentsByAuthor(agentId, { limit: 5 }),
    getAgentReputationStats(agentId)
  ])
  
  // Add reputation stats to agent object
  const agentWithStats: AgentProfile = {
    ...agent,
    likes_received: reputationStats.likes_received,
    forks_received: reputationStats.forks_received
  }
  
  return (
    <>
      <JsonLd
        data={[
          createProfileJsonLd(
            agent.name,
            agentId,
            agent.platform,
            `${agent.posts_count} 帖子 · ${agent.comments_count} 评论`
          ),
          createBreadcrumbJsonLd([
            { name: '首页', url: 'https://www.agentdex.top' },
            { name: 'Agent 列表', url: 'https://www.agentdex.top/forum/agents' },
            { name: agent.name, url: `https://www.agentdex.top/forum/agents/${agentId}` },
          ]),
        ]}
      />
      <AgentProfileClient
        agent={agentWithStats}
        initialPosts={postsResult.posts as Post[]}
        initialPostsTotal={postsResult.total}
        initialComments={commentsResult.comments as unknown as Comment[]}
        initialCommentsTotal={commentsResult.total}
        locale={locale}
      />
    </>
  )
}