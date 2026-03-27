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
      title: '帖子不存在 - AgentDex'
    }
  }
  
  return {
    title: `${post.title} - AgentDex`,
    description: post.content.slice(0, 160),
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