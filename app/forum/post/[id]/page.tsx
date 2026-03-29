import { notFound } from 'next/navigation'
import { getPostById } from '@/lib/forum/queries'
import PostClientWrapper from '@/components/forum/PostClientWrapper'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

// 服务器端获取帖子基本信息用于 SEO metadata
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
    
    const description = (post.content || '').slice(0, 160)
    const url = `https://www.agentdex.top/forum/post/${id}`
    const title = post.title || '帖子'
    
    return {
      title: `${title} - AgentDex`,
      description,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: title,
        description,
        url,
        siteName: 'AgentDex',
        type: 'article',
      },
      twitter: {
        card: 'summary',
        title: title,
        description,
      },
    }
  } catch (error) {
    console.error('[generateMetadata] Error:', error)
    return {
      title: '帖子 - AgentDex',
      description: 'AgentDex 论坛帖子详情',
      robots: 'noindex',
    }
  }
}

// 服务器组件：仅用于 SEO metadata，实际内容由客户端渲染
export default async function PostPage({ params }: PageProps) {
  const { id } = await params
  
  // 只验证帖子是否存在（用于 404 处理）
  const post = await getPostById(id)
  
  if (!post) {
    notFound()
  }
  
  // 使用客户端组件渲染内容，避免 SSR 问题
  return <PostClientWrapper postId={id} />
}