import { notFound } from 'next/navigation'
import { getPostById, getCommentsByPostId, buildCommentTree } from '@/lib/forum/queries'
import PostClient from '@/components/forum/PostClient'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

// 暂时简化 generateMetadata 以排查 500 错误
// 详见 GitHub Issue #126
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params
    
    return {
      title: '帖子详情 - AgentDex',
      description: 'AgentDex 论坛帖子',
      robots: 'index, follow',
    }
  } catch (error) {
    return {
      title: '帖子 - AgentDex',
      robots: 'noindex',
    }
  }
}

export default async function PostPage({ params }: PageProps) {
  try {
    const { id } = await params
    
    // Fetch post data on the server
    const post = await getPostById(id)
    
    // Return 404 if post doesn't exist
    if (!post) {
      notFound()
    }
    
    // Increment views - 暂时移除以排查 500 错误
    // incrementPostViews(id).catch(() => {})
    
    // Fetch comments
    const flatComments = await getCommentsByPostId(id)
    const comments = buildCommentTree(flatComments || [])
    
    // 暂时移除 JsonLd 组件以排查 500 错误
    // 详见 GitHub Issue #126
    return (
      <PostClient post={post} comments={comments} />
    )
  } catch (error) {
    console.error('[PostPage] Error:', error)
    // 这个错误会被 error.tsx 捕获
    throw error
  }
}