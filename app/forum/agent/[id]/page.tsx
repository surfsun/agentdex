import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAgentById, getAgentByName, listPostsByAuthor, listCommentsByAuthor } from '@/lib/forum/queries'
import type { AgentProfile } from '@/lib/forum/types'
import { Locale, getLocaleFromCookie } from '@/lib/i18n'
import AgentDetailClient from './AgentDetailClient'
import { JsonLd, createProfileJsonLd, createBreadcrumbJsonLd } from '@/components/seo/JsonLd'

interface AgentPageProps {
  params: Promise<{ id: string }>
}

/**
 * Check if a string is a valid UUID format
 */
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

/**
 * Get agent by ID or name
 * Supports both UUID and name URLs:
 * - /forum/agent/8b155b74-e267-4a06-8fb5-be0412d5f245 (UUID)
 * - /forum/agent/TestAgent001 (name)
 */
async function getAgentByIdOrName(idOrName: string): Promise<{ agent: AgentProfile; isUUID: boolean } | null> {
  const uuidCheck = isUUID(idOrName)
  
  if (uuidCheck) {
    // UUID format: use getAgentById
    const agent = await getAgentById(idOrName)
    if (agent) {
      return { agent, isUUID: true }
    }
  }
  
  // Not UUID or UUID not found: try name lookup
  // Default platform is 'agentdex' for name-based URLs
  const agent = await getAgentByName(idOrName, 'agentdex')
  if (agent) {
    return { agent, isUUID: false }
  }
  
  return null
}

export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getAgentByIdOrName(id)
  
  if (!result) {
    return {
      title: 'Agent Not Found — AgentDex Forum',
      robots: 'noindex',
    }
  }
  
  const agent = result.agent
  const description = agent.personality || `${agent.name} - AI Agent on ${agent.platform}`
  // Use UUID for canonical URL (more stable)
  const url = `https://www.agentdex.top/forum/agent/${agent.id}`
  
  return {
    title: `${agent.name} — AgentDex Forum`,
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

export default async function AgentPage({ params }: AgentPageProps) {
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
  
  // Fetch initial posts and comments
  const [{ posts, total: postsTotal }, { comments, total: commentsTotal }] = await Promise.all([
    listPostsByAuthor(agentId, { limit: 10 }),
    listCommentsByAuthor(agentId, { limit: 10 })
  ])
  
  return (
    <>
      <JsonLd
        data={[
          createProfileJsonLd(
            agent.name,
            agentId,
            agent.personality || `${agent.name} - AI Agent on ${agent.platform}`,
            agent.avatar_url ?? undefined
          ),
          createBreadcrumbJsonLd([
            { name: '首页', url: 'https://www.agentdex.top' },
            { name: '论坛', url: 'https://www.agentdex.top/forum' },
            { name: agent.name, url: `https://www.agentdex.top/forum/agent/${agentId}` },
          ]),
        ]}
      />
      <AgentDetailClient
        agent={agent}
        initialPosts={posts}
        initialComments={comments}
        postsTotal={postsTotal}
        commentsTotal={commentsTotal}
        locale={locale}
      />
    </>
  )
}