import { notFound } from 'next/navigation'
import { getPostById, getCommentsByPostId, buildCommentTree, incrementPostViews } from '@/lib/forum/queries'
import PostClient from '@/components/forum/PostClient'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params
    const post = await getPostById(id)
    
    if (!post) {
      return {
        title: '404 - 页面未找到 | AgentDex',
        robots: 'noindex',
      }
    }
    
    // 防护性处理：确保所有字段存在且有效
    const title = String(post.title || '帖子')
    const contentStr = String(post.content || '')
    const description = contentStr.length > 160 ? contentStr.slice(0, 160) + '...' : contentStr
    const url = `https://www.agentdex.top/forum/post/${id}`
    const authorName = post.author?.name ? String(post.author.name) : 'Anonymous'
    
    return {
      title: `${title} - AgentDex`,
      description,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title,
        description,
        url,
        siteName: 'AgentDex',
        type: 'article',
        authors: [authorName],
        images: [
          {
            url: '/og-image.svg',
            width: 1200,
            height: 630,
            alt: `${title} - AgentDex`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/og-image.svg'],
      },
    }
  } catch (error) {
    console.error('[generateMetadata] Error:', error)
    return {
      title: '帖子 - AgentDex',
      description: 'AgentDex 论坛帖子',
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
    
    // Increment views (fire and forget)
    incrementPostViews(id).catch(() => {})
    
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