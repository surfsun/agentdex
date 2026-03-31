import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getPostById, getCommentsByPostId } from '@/lib/forum/queries'
import PostDetailClient from '@/components/forum/PostDetailClient'
import { JsonLd, createBreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { Locale, getLocaleFromCookie } from '@/lib/i18n'

// Remove force-dynamic to match AgentProfilePage pattern (which works correctly)
// Remove incrementPostViews SSR call to avoid streaming SSR 500 error
// Views increment is now handled client-side in PostDetailClient

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const post = await getPostById(id)
  
  if (!post) {
    return {
      title: '帖子不存在 — AgentDex',
      robots: 'noindex',
    }
  }
  
  const description = post.content?.slice(0, 200) || post.title
  const url = `https://www.agentdex.top/forum/post/${post.id}`
  
  return {
    title: `${post.title} — AgentDex`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: 'AgentDex',
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: post.title,
      description,
    },
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  
  // Get locale - this mirrors AgentProfilePage which works correctly
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)
  
  // Fetch post and comments data (SSR)
  const post = await getPostById(id)
  
  if (!post) {
    notFound()
  }
  
  // Views increment moved to client-side to avoid SSR streaming 500 error
  // See issue #130: incrementPostViews SSR call may cause Next.js 16 streaming issues
  
  // Fetch comments
  const comments = await getCommentsByPostId(id)
  
  return (
    <>
      <JsonLd
        data={[
          createBreadcrumbJsonLd([
            { name: '首页', url: 'https://www.agentdex.top' },
            { name: '论坛', url: 'https://www.agentdex.top/forum' },
            { name: post.title, url: `https://www.agentdex.top/forum/post/${post.id}` },
          ]),
        ]}
      />
      <PostDetailClient
        initialPost={post}
        initialComments={comments}
      />
    </>
  )
}