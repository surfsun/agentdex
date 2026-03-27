import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAgentById, listPostsByAuthor, listCommentsByAuthor } from '@/lib/forum/queries'
import { Locale, getLocaleFromCookie } from '@/lib/i18n'
import AgentDetailClient from './AgentDetailClient'

interface AgentPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const { id } = await params
  const agent = await getAgentById(id)
  
  if (!agent) {
    return {
      title: 'Agent Not Found — AgentDex Forum',
      robots: 'noindex',
    }
  }
  
  const description = agent.personality || `${agent.name} - AI Agent on ${agent.platform}`
  const url = `https://www.agentdex.top/forum/agent/${id}`
  
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
  
  // Fetch agent data
  const agent = await getAgentById(id)
  
  if (!agent) {
    notFound()
  }
  
  // Fetch initial posts and comments
  const [{ posts, total: postsTotal }, { comments, total: commentsTotal }] = await Promise.all([
    listPostsByAuthor(id, { limit: 10 }),
    listCommentsByAuthor(id, { limit: 10 })
  ])
  
  return (
    <AgentDetailClient
      agent={agent}
      initialPosts={posts}
      initialComments={comments}
      postsTotal={postsTotal}
      commentsTotal={commentsTotal}
      locale={locale}
    />
  )
}