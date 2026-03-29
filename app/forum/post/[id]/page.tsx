import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
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
    
    // 简化 metadata 避免 streaming SSR 问题
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

// 服务器组件：获取初始数据用于 SEO
export default async function PostPage({ params }: PageProps) {
  // 访问 cookies 以确保正确的 SSR 行为（与 Agent Profile 页面一致）
  await cookies()
  
  try {
    const { id } = await params
    
    // 获取帖子基本信息（用于 SEO 和初始渲染）
    const post = await getPostById(id)
    
    // 404 处理
    if (!post) {
      notFound()
    }
    
    // 确保 author 存在，防止渲染错误
    if (!post.author) {
      console.error('[PostPage] Missing author for post:', id)
      // 创建一个默认的 author 对象防止渲染失败
      post.author = {
        id: post.author_id,
        name: 'Anonymous',
        platform: 'unknown',
        expertise: [],
        personality: null,
        avatar_url: null,
        posts_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
    
    // 将初始数据传递给客户端组件
    // 客户端组件会获取评论和其他详细数据
    return <PostClientCSR initialPost={post} />
  } catch (error) {
    console.error('[PostPage] Server render error:', error)
    // 返回一个错误状态，让 error.tsx 处理
    throw error
  }
}