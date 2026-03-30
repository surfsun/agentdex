import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostById, getCommentsByPostId, incrementPostViews } from '@/lib/forum/queries'
import PostDetailClient from '@/components/forum/PostDetailClient'
import { JsonLd, createBreadcrumbJsonLd } from '@/components/seo/JsonLd'

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
  
  // Fetch post and comments data (SSR)
  const post = await getPostById(id)
  
  if (!post) {
    notFound()
  }
  
  // Increment views (best effort, don't block rendering)
  incrementPostViews(id).catch(() => {})
  
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