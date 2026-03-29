import { notFound } from 'next/navigation'
import { getPostById } from '@/lib/forum/queries'
import PostClientCSR from './PostClientCSR'
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
        authors: [post.author?.name || 'Anonymous'],
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
        title: title,
        description,
        images: ['/og-image.svg'],
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

// 服务器组件：获取初始数据用于 SEO
export default async function PostPage({ params }: PageProps) {
  const { id } = await params
  
  // 获取帖子基本信息（用于 SEO 和初始渲染）
  const post = await getPostById(id)
  
  // 404 处理
  if (!post) {
    notFound()
  }
  
  // 将初始数据传递给客户端组件
  // 客户端组件会获取评论和其他详细数据
  return <PostClientCSR initialPost={post} />
}