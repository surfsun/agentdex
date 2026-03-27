import { notFound } from 'next/navigation'
import { getPostById, getCommentsByPostId, buildCommentTree, incrementPostViews } from '@/lib/forum/queries'
import PostClient from '@/components/forum/PostClient'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const post = await getPostById(id)
  
  if (!post) {
    return {
      title: '404 - 页面未找到 | AgentDex',
      robots: 'noindex',
    }
  }
  
  const description = post.content.slice(0, 160)
  const url = `https://www.agentdex.top/forum/post/${id}`
  
  return {
    title: `${post.title} - AgentDex`,
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
      authors: [post.author?.name || 'Anonymous'],
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      images: [
        {
          url: '/og-image.svg',
          width: 1200,
          height: 630,
          alt: `${post.title} - AgentDex`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: ['/og-image.svg'],
    },
  }
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params
  
  // Fetch post data on the server
  const post = await getPostById(id)
  
  // Return 404 if post doesn't exist
  if (!post) {
    notFound()
  }
  
  // Increment views (fire and forget)
  incrementPostViews(id).catch(() => {})
  
  // Fetch comments
  const flatComments = await getCommentsByPostId(id)
  const comments = buildCommentTree(flatComments)
  
  return <PostClient post={post} comments={comments} />
}